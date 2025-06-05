import { useLang } from "../context/LangContext";

export default function Ajustes() {
  const { lang, changeLang, t } = useLang();

  return (
    <div className="p-6 max-w-md mx-auto text-claro">
      <h1 className="text-3xl font-bold mb-4">{t("settingsTitle")}</h1>
      <label className="block mb-2" htmlFor="lang-select">
        {t("chooseLanguage")}
      </label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => changeLang(e.target.value)}
        className="bg-metal border border-borde rounded px-3 py-2"
      >
        <option value="es">🇪🇸 {t("languageSpanish")}</option>
        <option value="en">🇬🇧 {t("languageEnglish")}</option>
      </select>
    </div>
  );
}
