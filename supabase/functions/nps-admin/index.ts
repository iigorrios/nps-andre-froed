// =============================================================================
// Edge Function: nps-admin
//
// Concentra TODAS as operações privilegiadas do painel:
//   - login          → valida a senha (secret ADMIN_PASSWORD) e emite um token
//   - listResponses  → lista as respostas (com o profissional embutido)
//   - deleteResponse → apaga uma resposta dada por engano
//   - addProfessional / deleteProfessional → gestão da base de profissionais
//
// Autenticação: a senha nunca chega ao navegador. No login, a função devolve um
// token assinado (HMAC-SHA256, chave = ADMIN_PASSWORD) com validade de 12h. As
// demais ações exigem esse token no header `x-admin-token`.
//
// Segredos necessários (Dashboard → Edge Functions → Secrets):
//   - ADMIN_PASSWORD               (você define — a senha do painel)
//   - SUPABASE_URL                 (injetado automaticamente pelo Supabase)
//   - SUPABASE_SERVICE_ROLE_KEY    (injetado automaticamente pelo Supabase)
//
// IMPORTANTE: faça o deploy SEM verificação de JWT, pois usamos nosso próprio
// token:  supabase functions deploy nps-admin --no-verify-jwt
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

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
        .select(
          "id, professional_id, nps_score, pontualidade, clareza, simpatia, conhecimento_tecnico, comentario, created_at, professional:nps_professionals(id, name, role, photo)",
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
      const { data, error } = await supabase
        .from("nps_professionals")
        .insert({ name, role, photo })
        .select("id, name, role, photo")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ professional: data });
    }

    case "deleteProfessional": {
      if (body.id == null) return json({ error: "id obrigatório." }, 400);
      const { error } = await supabase
        .from("nps_professionals")
        .delete()
        .eq("id", body.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: `Ação desconhecida: "${action}".` }, 400);
  }
});
