import { createContext, useContext, useEffect, useState } from "react";

const TemaContext = createContext();

export function useTema() {
  return useContext(TemaContext);
}

export default function TemaProvider({ children }) {
  const [tema, setTema] = useState("oscuro");

  useEffect(() => {
    const guardado = localStorage.getItem("tema");
    const prefOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const inicial = guardado || (prefOscuro ? "oscuro" : "claro");
    setTema(inicial);
    document.documentElement.classList.toggle("dark", inicial === "oscuro");
  }, []);

  const cambiarTema = (nuevo) => {
    setTema(nuevo);
    document.documentElement.classList.toggle("dark", nuevo === "oscuro");
    localStorage.setItem("tema", nuevo);
  };

  const alternarTema = () => {
    cambiarTema(tema === "oscuro" ? "claro" : "oscuro");
  };

  return (
    <TemaContext.Provider value={{ tema, cambiarTema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}
