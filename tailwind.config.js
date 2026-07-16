/** @type {import('tailwindcss').Config} */

/**
 * Paleta da marca.
 *
 * As cores são definidas via variáveis CSS (ver `src/index.css`, seletor :root)
 * e apenas referenciadas aqui. Assim, quando a identidade visual oficial do
 * André Froed estiver pronta, basta trocar os valores das variáveis CSS —
 * sem precisar mexer nos componentes.
 *
 * Tons atuais: verde (saúde / nutrição) + azul (bem-estar / confiança).
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Verde principal (identidade "saúde")
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        accent: {
          // Azul de apoio (confiança / bem-estar)
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
