// =============================================================================
// Edge Function: nps-admin
//
// Concentra TODAS as operações privilegiadas do painel:
//   - login          → valida a senha (secret ADMIN_PASSWORD) e emite um token
//   - listResponses  → lista as respostas (cruze por `professional_id`)
//   - deleteResponse → apaga uma resposta dada por engano
//   - addProfessional / deleteProfessional → gestão da base de profissionais
//
// Autenticação: a senha nunca chega ao navegador. No login, a função devolve um
// token assinado (HMAC-SHA256, chave = ADMIN_PASSWORD) com validade de 12h. As
// demais ações exigem esse token no header `x-admin-token`.
//
// Fotos: nunca são gravadas em base64 na tabela. O painel envia uma data-URL,
// a função sobe o binário para o bucket público `nps-photos` e guarda só a URL
// na coluna `photo` (ver PHOTO_BUCKET abaixo).
//
// Segredos necessários (Dashboard → Edge Functions → Secrets):
//   - ADMIN_PASSWORD               (você define — a senha do painel)
//   - SUPABASE_URL                 (injetado automaticamente pelo Supabase)
//   - SUPABASE_SERVICE_ROLE_KEY    (injetado automaticamente pelo Supabase)
//
// Deploy: a função está publicada COM verify_jwt ligado — o painel manda a anon
// key no Authorization só para passar pelo gateway, e o token de admin vai no
// header próprio `x-admin-token`, que é o que de fato autoriza as ações.
//   supabase functions deploy nps-admin
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

/** Bucket público onde ficam as fotos dos profissionais. */
const PHOTO_BUCKET = "nps-photos";
const PHOTO_EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};
/** Teto de segurança do binário decodificado (o bucket também limita em 5 MB). */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Token (HMAC-SHA256 assinado com a própria ADMIN_PASSWORD) --------------

const encoder = new TextEncoder();

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/** Comparação em tempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function makeToken(): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const sig = await hmac(String(expiresAt));
  return { token: `${expiresAt}.${sig}`, expiresAt };
}

async function verifyToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(expStr);
  return safeEqual(sig, expected);
}

// ---- Fotos (bucket em vez de base64 na tabela) ------------------------------

/**
 * Sobe uma data-URL para o bucket e devolve a URL pública.
 * Devolve a própria string quando já é uma URL http(s) — ou seja, o painel pode
 * mandar tanto o arquivo novo quanto uma foto já hospedada.
 */
// deno-lint-ignore no-explicit-any
async function uploadPhoto(supabase: any, id: number, photo: string) {
  if (/^https?:\/\//i.test(photo)) return photo;

  const m = /^data:([^;,]+);base64,/.exec(photo);
  if (!m) throw new Error("Formato de imagem não reconhecido.");

  const mime = m[1].toLowerCase();
  const ext = PHOTO_EXT[mime];
  if (!ext) throw new Error(`Tipo de imagem não suportado: ${mime}.`);

  const raw = atob(photo.slice(m[0].length));
  if (raw.length > MAX_PHOTO_BYTES) throw new Error("Imagem muito grande.");
  const bin = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);

  const path = `professionals/${id}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bin, { contentType: mime, upsert: true });
  if (error) throw new Error(error.message);

  // limpa versões antigas em outras extensões, para não deixar órfãos
  await supabase.storage
    .from(PHOTO_BUCKET)
    .remove(
      Object.values(PHOTO_EXT)
        .filter((e) => e !== ext)
        .map((e) => `professionals/${id}.${e}`),
    );

  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    .data.publicUrl as string;
}

/** Remove do bucket qualquer foto do profissional (todas as extensões). */
// deno-lint-ignore no-explicit-any
async function removePhoto(supabase: any, id: number) {
  await supabase.storage
    .from(PHOTO_BUCKET)
    .remove(
      [...new Set(Object.values(PHOTO_EXT))].map(
        (e) => `professionals/${id}.${e}`,
      ),
    );
}

// ---- Handler ----------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (!ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD não configurado no servidor." }, 500);
  }

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // corpo vazio/ inválido — tratado abaixo
  }
  const action = String(body.action ?? "");

  // ---- login: valida a senha e emite o token --------------------------------
  if (action === "login") {
    const password = String(body.password ?? "");
    if (password.length === 0 || !safeEqual(password, ADMIN_PASSWORD)) {
      return json({ error: "Senha incorreta." }, 401);
    }
    const { token, expiresAt } = await makeToken();
    return json({ token, expiresAt });
  }

  // ---- demais ações: exigem token válido ------------------------------------
  const token =
    req.headers.get("x-admin-token") ??
    (req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || null);

  if (!(await verifyToken(token))) {
    return json({ error: "Não autorizado. Faça login novamente." }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  switch (action) {
    case "listResponses": {
      const { data, error } = await supabase
        .from("nps_responses")
        // Sem embutir o profissional: o painel já carrega a lista de
        // profissionais à parte e cruza por `professional_id`. Embutir a foto em
        // cada resposta multiplicava o payload (dezenas de MB) e estourava o
        // limite de memória do worker (WORKER_RESOURCE_LIMIT / 546).
        .select(
          "id, professional_id, nps_score, pontualidade, clareza, simpatia, conhecimento_tecnico, comentario, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ responses: data ?? [] });
    }

    case "deleteResponse": {
      if (body.id == null) return json({ error: "id obrigatório." }, 400);
      const { error } = await supabase
        .from("nps_responses")
        .delete()
        .eq("id", body.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    case "addProfessional": {
      const name = String(body.name ?? "").trim();
      const role = String(body.role ?? "");
      const photo = body.photo ?? null;
      if (!name || !["nutricionista", "personal"].includes(role)) {
        return json({ error: "Nome e especialidade são obrigatórios." }, 400);
      }
      // Grava primeiro sem foto: o id da linha é o nome do arquivo no bucket.
      const { data, error } = await supabase
        .from("nps_professionals")
        .insert({ name, role, photo: null })
        .select("id, name, role, photo")
        .single();
      if (error) return json({ error: error.message }, 400);

      if (!photo) return json({ professional: data });

      try {
        const url = await uploadPhoto(supabase, data.id, String(photo));
        const { data: updated, error: upErr } = await supabase
          .from("nps_professionals")
          .update({ photo: url })
          .eq("id", data.id)
          .select("id, name, role, photo")
          .single();
        if (upErr) throw new Error(upErr.message);
        return json({ professional: updated });
      } catch (e) {
        // Foto falhou → desfaz o cadastro para não deixar registro pela metade.
        await supabase.from("nps_professionals").delete().eq("id", data.id);
        await removePhoto(supabase, data.id);
        return json(
          { error: (e as Error).message || "Falha ao salvar a foto." },
          400,
        );
      }
    }

    case "deleteProfessional": {
      if (body.id == null) return json({ error: "id obrigatório." }, 400);
      const { error } = await supabase
        .from("nps_professionals")
        .delete()
        .eq("id", body.id);
      if (error) return json({ error: error.message }, 400);
      // A linha já saiu; a foto no bucket é lixo a partir daqui.
      await removePhoto(supabase, Number(body.id));
      return json({ ok: true });
    }

    default:
      return json({ error: `Ação desconhecida: "${action}".` }, 400);
  }
});
