import { useState } from "react";
import { isAdminAuthed } from "../lib/adminAuth.js";
import LoginGate from "../components/admin/LoginGate.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";

/**
 * /admin — painel protegido por senha.
 *
 * Mostra a tela de login enquanto não houver sessão válida; depois, o painel.
 */
export default function AdminPage() {
  const [authed, setAuthed] = useState(isAdminAuthed());

  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
