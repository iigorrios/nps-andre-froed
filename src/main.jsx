import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { entrarPeloAcessos } from "./lib/entrarPeloAcessos.js";
import "./index.css";

// login vindo do Acessos (?acesso=...) é resolvido antes de desenhar a tela
entrarPeloAcessos().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
