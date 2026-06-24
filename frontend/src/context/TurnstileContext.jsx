import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { setTurnstileToken, setTurnstileRefresh } from "../lib/api";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const REFRESH_INTERVAL = 280_000;

const TurnstileContext = createContext();

export function useTurnstile() {
  return useContext(TurnstileContext);
}

export default function TurnstileProvider({ children }) {
  const widgetIdRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !SITE_KEY) return;

    if (widgetIdRef.current != null) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      size: "invisible",
      callback: (token) => setTurnstileToken(token),
      "error-callback": () => setTurnstileToken(null),
      "expired-callback": () => {
        setTurnstileToken(null);
        refreshToken();
      },
    });
  }, []);

  const refreshToken = useCallback(() => {
    if (widgetIdRef.current != null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => renderWidget();
    document.head.appendChild(script);

    setTurnstileRefresh(refreshToken);
    intervalRef.current = setInterval(refreshToken, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      script.remove();
    };
  }, [renderWidget, refreshToken]);

  return (
    <TurnstileContext.Provider value={{ refreshToken }}>
      <div ref={containerRef} style={{ position: "fixed", left: -9999 }} />
      {children}
    </TurnstileContext.Provider>
  );
}
