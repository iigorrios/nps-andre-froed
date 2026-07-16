import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (chave anônima — pode ir para o navegador).
 *
 * As variáveis vêm do `.env` (ver `.env.example`). Enquanto não estiverem
 * configuradas, `isSupabaseConfigured` é false e a UI mostra um aviso amigável
 * em vez de quebrar.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidas. " +
      "Copie .env.example para .env e preencha os valores do seu projeto."
  );
}

// Placeholders válidos (formato de URL) para o createClient não estourar quando
// o .env ainda não foi preenchido. Com credenciais falsas as chamadas apenas
// falham na rede — a UI já avisa via `isSupabaseConfigured`.
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key"
);

/** URL da Edge Function que concentra as ações administrativas. */
export const ADMIN_FN_URL = `${SUPABASE_URL}/functions/v1/nps-admin`;
