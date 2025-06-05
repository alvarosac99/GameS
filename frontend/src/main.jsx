import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/AuthContext";
import LangProvider from "./context/LangContext";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";


ReactDOM.createRoot(document.getElementById("root")).render(


  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <Theme>
          <App />
        </Theme>
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>
);
