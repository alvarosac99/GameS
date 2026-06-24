import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/AuthContext";
import LangProvider from "./context/LangContext";
import TemaProvider from "./context/TemaContext";
import NotificacionesProvider from "./context/NotificacionesContext";
import TurnstileProvider from "./context/TurnstileContext";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TurnstileProvider>
      <LangProvider>
        <AuthProvider>
          <NotificacionesProvider>
            <TemaProvider>
              <Theme>
                <App />
              </Theme>
            </TemaProvider>
          </NotificacionesProvider>
        </AuthProvider>
      </LangProvider>
    </TurnstileProvider>
  </React.StrictMode>
);
