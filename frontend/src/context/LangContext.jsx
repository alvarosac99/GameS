import { createContext, useContext, useEffect, useState } from "react";
import en from "../locales/en.json";
import es from "../locales/es.json";

const LangContext = createContext();
const DICTS = { en, es };

export function useLang() {
  return useContext(LangContext);
}

export default function LangProvider({ children }) {
  const [lang, setLang] = useState("es");
  const [dict, setDict] = useState(es);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("lang="))
      ?.split("=")[1];
    const system = navigator.language?.slice(0, 2) || "es";
    const initial = cookie || (system === "en" ? "en" : "es");
    setLang(initial);
    setDict(DICTS[initial]);
    document.cookie = `lang=${initial};path=/;max-age=31536000`;
  }, []);

  const changeLang = (l) => {
    if (!DICTS[l]) return;
    setLang(l);
    setDict(DICTS[l]);
    document.cookie = `lang=${l};path=/;max-age=31536000`;
  };

  const t = (key) => dict[key] || key;

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
