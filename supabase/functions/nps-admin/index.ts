// =============================================================================
// Edge Function: nps-admin
//
// Concentra TODAS as operações privilegiadas do painel:
//   - login          → aposentado (o painel usa o login do time)
//   - listResponses  → lista as respostas (cruze por `professional_id`)
//   - deleteResponse → apaga uma resposta dada por engano
//   - addProfessional / deleteProfessional → gestão da base de profissionais
//
// Autenticação: login do time (Supabase Auth) + permissão no sistema "nps" do
// Acessos central (acessos-af). O painel manda o access_token do usuário no
// Authorization; a função confere quem é e se public.acesso_meu('nps') devolve
// um papel. A antiga senha única (ADMIN_PASSWORD) não é mais aceita.
//
// Fotos: nunca são gravadas em base64 na tabela. O painel envia uma data-URL,
// a função sobe o binário para o bucket público `nps-photos` e guarda só a URL
// na coluna `photo` (ver PHOTO_BUCKET abaixo).
//
// Segredos: SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY
// (injetados automaticamente pelo Supabase).
//   supabase functions deploy nps-admin
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Acesso: usuário logado com papel no sistema "nps" do Acessos central ----

async function temAcesso(authorization: string | null): Promise<boolean> {
  if (!authorization) return false;
  const comoUsuario = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await comoUsuario.auth.getUser();
  if (!user) return false;
  const { data } = await comoUsuario.rpc("acesso_meu", { p_sistema: "nps" });
  return !!(data as { papel?: string } | null)?.papel;
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

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // corpo vazio/ inválido — tratado abaixo
  }
  const action = String(body.action ?? "");

  // ---- a senha única foi aposentada: o login é o do time ---------------------
  if (action === "login") {
    return json({ error: "Entre com o seu e-mail e senha do time." }, 410);
  }

  // ---- todas as ações: login do time com permissão em "nps" ------------------
  if (!(await temAcesso(req.headers.get("Authorization")))) {
    return json({ error: "Não autorizado. Faça login novamente." }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  switch (action) {
    case "listResponses": {
      const { data, error } = await supabase
        .schema("nps").from("nps_responses")
        // Sem embutir o profissional: o painel já carrega a lista de
        // profissionais à parte e cruza por `professional_id`. Embutir a foto em
        // cada resposta multiplicava o payload (dezenas de MB) e estourava o
        // limite de memória do worker (WORKER_RESOURCE_LIMIT / 546).
        .select(
          "id, professional_id, tipo_consulta, nps_score, pontualidade, clareza, simpatia, conhecimento_tecnico, comentario, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ responses: data ?? [] });
    }

    case "deleteResponse": {
      if (body.id == null) return json({ error: "id obrigatório." }, 400);
      const { error } = await supabase
        .schema("nps").from("nps_responses")
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
        .schema("nps").from("nps_professionals")
        .insert({ name, role, photo: null })
        .select("id, name, role, photo")
        .single();
      if (error) return json({ error: error.message }, 400);

      if (!photo) return json({ professional: data });

      try {
        const url = await uploadPhoto(supabase, data.id, String(photo));
        const { data: updated, error: upErr } = await supabase
          .schema("nps").from("nps_professionals")
          .update({ photo: url })
          .eq("id", data.id)
          .select("id, name, role, photo")
          .single();
        if (upErr) throw new Error(upErr.message);
        return json({ professional: updated });
      } catch (e) {
        // Foto falhou → desfaz o cadastro para não deixar registro pela metade.
        await supabase.schema("nps").from("nps_professionals").delete().eq("id", data.id);
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
        .schema("nps").from("nps_professionals")
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
