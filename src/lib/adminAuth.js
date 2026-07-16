import { ADMIN_FN_URL, SUPABASE_ANON_KEY } from "./supabaseClient.js";

/**
 * Autenticação do painel por SENHA ÚNICA (guardada como secret no Supabase).
 *
 * O login troca a senha por um token assinado (validade de 12h), guardado no
 * sessionStorage. A senha em si nunca fica salva no navegador.
 */
const TOKEN_KEY = "af_nps_admin_token";
const EXP_KEY = "af_nps_admin_exp";

/** Faz login; em caso de sucesso, guarda o token e devolve os dados. */
export async function adminLogin(password) {
  const res = await fetch(ADMIN_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "login", password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha ao entrar.");

  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(EXP_KEY, String(data.expiresAt));
  return data;
}

/** Devolve o token válido (ou null se ausente/expirado). */
export function getAdminToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp = Number(sessionStorage.getItem(EXP_KEY));
  if (!token || !Number.isFinite(exp) || exp < Date.now()) return null;
  return token;
}

/** Encerra a sessão do painel. */
export function adminLogout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXP_KEY);
}

/** Há uma sessão de admin válida? */
export function isAdminAuthed() {
  return getAdminToken() !== null;
}
