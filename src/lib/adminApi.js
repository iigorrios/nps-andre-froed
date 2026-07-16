import { ADMIN_FN_URL, SUPABASE_ANON_KEY } from "./supabaseClient.js";
import { getAdminToken, adminLogout } from "./adminAuth.js";

/**
 * API ADMINISTRATIVA — todas as chamadas passam pela Edge Function `nps-admin`,
 * autenticadas pelo token (header `x-admin-token`). É por aqui que o painel lê e
 * apaga respostas e gere a base de profissionais.
 */
async function call(action, payload = {}) {
  const token = getAdminToken();
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await fetch(ADMIN_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      // Bearer com a anon key satisfaz o gateway (Verify JWT); nosso token de
      // admin vai no header próprio x-admin-token, que a função lê primeiro.
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-admin-token": token,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    adminLogout();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (!res.ok) throw new Error(data.error || "Erro na requisição.");
  return data;
}

/** Lista todas as respostas (com o profissional embutido), mais recentes primeiro. */
export const listResponses = () =>
  call("listResponses").then((d) => d.responses ?? []);

/** Apaga uma resposta dada por engano. */
export const deleteResponse = (id) => call("deleteResponse", { id });

/** Cadastra um profissional. */
export const addProfessional = (professional) =>
  call("addProfessional", professional).then((d) => d.professional);

/** Remove um profissional (apaga em cascata as respostas dele). */
export const deleteProfessional = (id) => call("deleteProfessional", { id });
