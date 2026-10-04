import { supabase } from "./supabaseClient.js";

/**
 * Entrada já logada vinda do sistema central de Acessos
 * (https://acessos.andrefroed.com.br).
 *
 * O Acessos abre este sistema com "?acesso=<passe>": um token de uso único,
 * emitido só para quem tem permissão aqui. Ele é trocado por uma sessão própria
 * deste sistema antes de a tela ser desenhada, e sai da barra de endereço.
 * Sem o parâmetro, nada acontece.
 */
export async function entrarPeloAcessos() {
  const url = new URL(window.location.href);
  const passe = url.searchParams.get("acesso");
  if (!passe) return;
  url.searchParams.delete("acesso");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  const { error } = await supabase.auth.verifyOtp({ token_hash: passe, type: "magiclink" });
  if (error) console.error("Entrada pelo Acessos falhou:", error.message);
}
