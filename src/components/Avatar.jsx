/**
 * Avatar reutilizável: mostra a foto do profissional quando existe,
 * senão cai para um círculo com as iniciais.
 *
 * Props:
 *  - name: nome (para iniciais e alt)
 *  - photo: URL/data-URL da foto (ou null)
 *  - size: "sm" | "md" | "lg"
 *  - selected: destaca com as cores da marca (usado na seleção)
 */
const SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
};

export default function Avatar({ name, photo, size = "md", selected = false }) {
  const sizeClasses = SIZES[size] ?? SIZES.md;

  if (photo) {
    return (
      <img
        src={photo}
        alt={`Foto de ${name}`}
        className={`${sizeClasses} flex-none rounded-full object-cover ring-2 ${
          selected ? "ring-brand-500" : "ring-slate-200"
        }`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} flex flex-none items-center justify-center rounded-full font-bold ${
        selected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"
      }`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

/** Até 2 iniciais do nome, ignorando títulos "Dr." / "Dra.". */
export function getInitials(fullName = "") {
  const parts = fullName
    .replace(/(Dra?\.?)\s+/i, "")
    .trim()
    .split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
