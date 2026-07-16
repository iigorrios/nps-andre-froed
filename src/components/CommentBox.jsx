/**
 * Etapa 4 — Comentário aberto (opcional).
 *
 * Props:
 *  - value: texto atual
 *  - onChange: (text) => void
 */
const MAX_LENGTH = 500;

export default function CommentBox({ value, onChange }) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">
        Quer deixar alguma sugestão ou comentário?
      </h2>
      <p className="mt-1 text-sm text-slate-500">Opcional — fique à vontade.</p>

      <label htmlFor="comentario" className="sr-only">
        Comentário
      </label>
      <textarea
        id="comentario"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        rows={5}
        maxLength={MAX_LENGTH}
        placeholder="Escreva aqui o que achou do atendimento..."
        className="mt-4 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white p-4 text-slate-800 placeholder:text-slate-400 focus:border-brand-400"
      />

      <div className="mt-1 text-right text-xs text-slate-400">
        {value.length}/{MAX_LENGTH}
      </div>
    </div>
  );
}
