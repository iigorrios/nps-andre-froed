import { supabase } from "./supabaseClient.js";

/**
 * Autenticação do painel com o LOGIN DO TIME (Supabase Auth).
 *
 * Quem pode entrar é definido no sistema central de Acessos (acessos-af),
 * sistema "nps". A senha única antiga foi aposentada.
 */

async function temAcesso() {
  const { data, error } = await supabase.rpc("acesso_meu", { p_sistema: "nps" });
  if (error) return false;
  return Boolean(data?.papel);
}

/** Faz login com e-mail e senha do time e confere a permissão no NPS. */
export async function adminLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
  }
  if (!(await temAcesso())) {
    await supabase.auth.signOut();
    throw new Error("Seu login não tem acesso ao painel de NPS. Peça ao administrador do time.");
  }
}

/** Token da sessão atual (access_token) ou null. */
export async function getAdminToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Encerra a sessão do painel. */
export async function adminLogout() {
  await supabase.auth.signOut();
}

/** Há uma sessão do time com acesso ao NPS? */
export async function isAdminAuthed() {
  const token = await getAdminToken();
  if (!token) return false;
  return temAcesso();
}
