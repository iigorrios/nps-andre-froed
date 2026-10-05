import { supabase } from "./supabaseClient.js";

/**
 * Autenticação do painel com o LOGIN DO TIME (Supabase Auth).
 *
 * Quem pode entrar é definido no sistema central de Acessos (acessos-af),
 * sistema "nps". A senha única antiga foi aposentada.
 */

/** Papel no sistema "nps" ("admin" ou "time", que vê tudo mas não apaga) ou null. */
async function meuPapel() {
  const { data, error } = await supabase.rpc("acesso_meu", { p_sistema: "nps" });
  if (error) return null;
  return data?.papel ?? null;
}

/** Faz login com e-mail e senha do time e confere a permissão no NPS. */
export async function adminLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
  }
  if (!(await meuPapel())) {
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

/** Papel da sessão atual no NPS, ou null se não houver sessão com acesso. */
export async function papelNoPainel() {
  const token = await getAdminToken();
  if (!token) return null;
  return meuPapel();
}
