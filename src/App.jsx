import { Routes, Route, Navigate } from "react-router-dom";
import SurveyPage from "./pages/SurveyPage.jsx";
import ThankYouPage from "./pages/ThankYouPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

/**
 * Roteamento do app.
 *
 * Usamos React Router apenas para separar a pesquisa (/) da tela de
 * agradecimento (/obrigado). Qualquer rota desconhecida volta para a pesquisa.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SurveyPage />} />
      <Route path="/obrigado" element={<ThankYouPage />} />
      {/* Painel administrativo protegido por senha (secret no Supabase). */}
      <Route path="/admin" element={<AdminPage />} />
      {/* Compatibilidade: /painel antigo → /admin */}
      <Route path="/painel" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
