import { useRef, useState } from "react";
import Avatar from "../Avatar.jsx";
import { ROLE_LABELS } from "../../data/professionals.mock.js";
import { addProfessional, deleteProfessional } from "../../lib/adminApi.js";

/**
 * Cadastro e gestão de profissionais (nutricionistas e personais).
 *
 * A foto é lida do arquivo local, convertida em data-URL (base64) e gravada na
 * coluna `photo` da tabela `nps_professionals` via Edge Function.
 *
 * Props:
 *  - professionals: lista atual (vem do painel)
 *  - onChanged: async () => void  — recarrega os dados após cadastrar/remover
 */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

export default function ProfessionalManager({ professionals, onChanged }) {
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("nutricionista");
  const [photo, setPhoto] = useState(null); // data-URL ou null
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  /** Lê o arquivo selecionado e gera a data-URL de preview. */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Imagem muito grande (máx. 2 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setName("");
    setRole("nutricionista");
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError("Informe o nome do profissional.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addProfessional({ name: name.trim(), role, photo });
      resetForm();
      await onChanged?.();
    } catch (err) {
      setError(err?.message || "Não foi possível cadastrar.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (pro) => {
    if (
      !window.confirm(
        `Remover ${pro.name} da base? As respostas dele também serão apagadas.`
      )
    ) {
      return;
    }
    setError("");
    setRemovingId(pro.id);
    try {
      await deleteProfessional(pro.id);
      await onChanged?.();
    } catch (err) {
      setError(err?.message || "Não foi possível remover.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Formulário de cadastro */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h3 className="text-lg font-bold text-slate-800">Cadastrar profissional</h3>
        <p className="mt-1 text-sm text-slate-500">
          Adicione nutricionistas e personais à base.
        </p>

        {/* Foto */}
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={name || "Novo"} photo={photo} size="lg" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              {photo ? "Trocar foto" : "Enviar foto"}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="ml-2 text-sm font-medium text-slate-400 hover:text-red-500"
              >
                Remover
              </button>
            )}
            <p className="mt-1 text-xs text-slate-400">JPG ou PNG, até 2 MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Nome */}
        <div className="mt-4">
          <label htmlFor="pro-name" className="block text-sm font-medium text-slate-600">
            Nome
          </label>
          <input
            id="pro-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Dra. Marina Alves"
            className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus:border-brand-400"
          />
        </div>

        {/* Especialidade */}
        <div className="mt-4">
          <span className="block text-sm font-medium text-slate-600">
            Especialidade
          </span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {["nutricionista", "personal"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                  role === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-500 hover:border-brand-300"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "Salvando…" : "Adicionar à base"}
        </button>
      </form>

      {/* Lista de profissionais cadastrados */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-800">
          Na base{" "}
          <span className="text-sm font-normal text-slate-400">
            ({professionals.length})
          </span>
        </h3>

        <ul className="mt-4 space-y-2">
          {professionals.map((pro) => (
            <li
              key={pro.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5"
            >
              <Avatar name={pro.name} photo={pro.photo} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{pro.name}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[pro.role] ?? pro.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(pro)}
                disabled={removingId === pro.id}
                aria-label={`Remover ${pro.name}`}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.5 12a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1L7 7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
          {professionals.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-400">
              Nenhum profissional cadastrado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
