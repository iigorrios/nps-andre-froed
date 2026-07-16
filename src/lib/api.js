import { supabase } from "./supabaseClient.js";

/**
 * API PÚBLICA (usa a anon key) — o que a pesquisa precisa.
 *
 * - Ler a lista de profissionais (SELECT liberado por RLS).
 * - Inserir uma resposta anônima (INSERT liberado por RLS; SELECT/DELETE não).
 */

/** Busca os profissionais ativos, ordenados por nome. */
export async function fetchProfessionals() {
  const { data, error } = await supabase
    .from("nps_professionals")
    .select("id, name, role, photo")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/**
 * Envia uma resposta da pesquisa.
 * @param {{
 *   professional_id: number,
 *   nps_score: number,
 *   pontualidade: number,
 *   clareza: number,
 *   simpatia: number,
 *   conhecimento_tecnico: number,
 *   comentario: string
 * }} payload  — `created_at` é preenchido pelo banco (default now()).
 */
export async function submitResponse(payload) {
  const { error } = await supabase.from("nps_responses").insert(payload);
  if (error) throw error;
}
