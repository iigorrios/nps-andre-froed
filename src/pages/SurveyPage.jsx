import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProgressBar from "../components/ProgressBar.jsx";
import ProfessionalSelector from "../components/ProfessionalSelector.jsx";
import NPSScale from "../components/NPSScale.jsx";
import ExtraQuestions, {
  EXTRA_QUESTION_KEYS,
} from "../components/ExtraQuestions.jsx";
import CommentBox from "../components/CommentBox.jsx";

import { fetchProfessionals, submitResponse } from "../lib/api.js";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";

const TOTAL_STEPS = 4;

/**
 * SurveyPage — orquestra o wizard de 4 etapas.
 *
 * Mantém todo o estado da resposta em um único objeto (`form`) e, ao final,
 * insere a resposta na tabela `nps_responses` do Supabase.
 */
export default function SurveyPage() {
  const navigate = useNavigate();

  // Lista de profissionais (carregada do Supabase).
  const [professionals, setProfessionals] = useState([]);
  const [loadingPros, setLoadingPros] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Estado do envio.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Etapa atual (1..4)
  const [step, setStep] = useState(1);

  // Carrega os profissionais uma vez, ao montar.
  useEffect(() => {
    let ativo = true;
    fetchProfessionals()
      .then((data) => ativo && setProfessionals(data))
      .catch(
        (e) =>
          ativo &&
          setLoadError(
            e?.message || "Não foi possível carregar os profissionais."
          )
      )
      .finally(() => ativo && setLoadingPros(false));
    return () => {
      ativo = false;
    };
  }, []);

  // Estado consolidado da resposta.
  const [form, setForm] = useState({
    professional_id: null,
    nps_score: null,
    ratings: {
      pontualidade: 0,
      clareza: 0,
      simpatia: 0,
      conhecimento_tecnico: 0,
    },
    comentario: "",
  });

  // Profissional selecionado (objeto completo), derivado do id.
  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === form.professional_id) ?? null,
    [professionals, form.professional_id]
  );

  // ---- Helpers de atualização de estado -------------------------------------
  const setProfessional = (id) =>
    setForm((f) => ({ ...f, professional_id: id }));

  const setNpsScore = (score) => setForm((f) => ({ ...f, nps_score: score }));

  const setRating = (key, value) =>
    setForm((f) => ({ ...f, ratings: { ...f.ratings, [key]: value } }));

  const setComentario = (text) => setForm((f) => ({ ...f, comentario: text }));

  // ---- Validação por etapa (controla o botão "Continuar") -------------------
  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return form.professional_id !== null;
      case 2:
        return form.nps_score !== null;
      case 3:
        // Todas as 4 perguntas de estrela precisam de nota (1..5).
        return EXTRA_QUESTION_KEYS.every((k) => form.ratings[k] > 0);
      case 4:
        return true; // comentário é opcional
      default:
        return false;
    }
  }, [step, form]);

  // ---- Navegação ------------------------------------------------------------
  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  /** Monta o payload e insere a resposta no Supabase. */
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);

    const payload = {
      professional_id: form.professional_id,
      nps_score: form.nps_score,
      pontualidade: form.ratings.pontualidade,
      clareza: form.ratings.clareza,
      simpatia: form.ratings.simpatia,
      conhecimento_tecnico: form.ratings.conhecimento_tecnico,
      comentario: form.comentario.trim(),
      // `created_at` é preenchido pelo banco (default now()).
    };

    try {
      await submitResponse(payload);
      // Redireciona para a tela de agradecimento (replace: evita reenvio).
      navigate("/obrigado", { replace: true });
    } catch (e) {
      setSubmitError(
        e?.message || "Não foi possível enviar. Tente novamente em instantes."
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 py-6 sm:py-10">
      {/* Cabeçalho da consultoria */}
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Consultoria André Froed
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-800">
          Sua avaliação
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Leva menos de 1 minuto e é totalmente anônima.
        </p>
      </header>

      {/* Aviso caso o .env ainda não esteja configurado */}
      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase não configurado. Copie <code>.env.example</code> para{" "}
          <code>.env</code> e preencha as chaves do projeto.
        </div>
      )}

      <ProgressBar current={step} total={TOTAL_STEPS} />

      {/* Cartão do wizard */}
      <section className="flex-1 rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        {step === 1 &&
          (loadingPros ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Carregando profissionais…
            </p>
          ) : loadError ? (
            <p className="py-10 text-center text-sm text-red-500">{loadError}</p>
          ) : (
            <ProfessionalSelector
              professionals={professionals}
              selectedId={form.professional_id}
              onSelect={setProfessional}
            />
          ))}

        {step === 2 && (
          <NPSScale
            professionalName={selectedProfessional?.name ?? "o profissional"}
            value={form.nps_score}
            onChange={setNpsScore}
          />
        )}

        {step === 3 && (
          <ExtraQuestions ratings={form.ratings} onChange={setRating} />
        )}

        {step === 4 && (
          <CommentBox value={form.comentario} onChange={setComentario} />
        )}
      </section>

      {/* Rodapé de navegação */}
      <footer className="mt-6 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-2xl px-5 py-3.5 font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Voltar
          </button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            className="rounded-2xl bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-2xl bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? "Enviando…" : "Enviar avaliação"}
          </button>
        )}
      </footer>

      {/* Erro de envio */}
      {submitError && (
        <p className="mt-3 text-center text-sm font-medium text-red-500">
          {submitError}
        </p>
      )}

      {/* Selo de anonimato */}
      <p className="mt-4 text-center text-xs text-slate-400">
        🔒 Pesquisa anônima — não coletamos nome, telefone ou e-mail.
      </p>
    </main>
  );
}
