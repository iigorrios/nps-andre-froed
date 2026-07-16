/**
 * Constantes de profissionais.
 *
 * Na Fase 2 os dados passaram a vir do Supabase (ver `src/lib/api.js` e
 * `src/lib/adminApi.js`). Este arquivo guarda apenas o que ainda é estático:
 *
 *  - ROLE_LABELS: rótulos amigáveis das especialidades (usados na UI).
 *  - professionals: lista-semente, só para referência / testes locais. O seed
 *    de verdade vive na migration `supabase/migrations/0001_nps_init.sql`.
 *
 * role: "nutricionista" | "personal"
 */
export const professionals = [
  { id: 1, name: "Dra. Marina Alves", role: "nutricionista", photo: null },
  { id: 2, name: "Rafael Costa", role: "personal", photo: null },
  { id: 3, name: "Dra. Beatriz Lima", role: "nutricionista", photo: null },
  { id: 4, name: "Lucas Ferreira", role: "personal", photo: null },
];

/** Rótulos de exibição das especialidades (separados do valor bruto `role`). */
export const ROLE_LABELS = {
  nutricionista: "Nutricionista",
  personal: "Personal Trainer",
};
