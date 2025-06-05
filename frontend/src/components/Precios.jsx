import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import LoaderCirculo from "@/components/LoaderCirculo";

export default function Precios({ nombre }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [abiertas, setAbiertas] = useState({});
  const [cargas, setCargas] = useState({});
  const sentinelRefs = useRef({});
  const abortRef = useRef(null);
  const CHUNK = 10;

  const limpiarPrecio = (p) =>
    p ? p.replace(/no hidden fees/gi, "").trim() : "";

  const obtenerOfertas = useCallback(
    (plat) =>
      Object.values(datos?.[plat]?.offers || {}).filter((o) => o.price),
    [datos]
  );

  const obtener = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({ game: nombre });
      const res = await fetch(`/api/precios/consultar/?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDatos(data.grouped_offers || {});
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setError(e.message);
      }
    } finally {
      setCargando(false);
    }
  }, [nombre]);

  useEffect(() => {
    setDatos(null);
    obtener();
    return () => abortRef.current?.abort();
  }, [nombre, obtener]);


  const plataformas = useMemo(() => (datos ? Object.keys(datos) : []), [datos]);

  useEffect(() => {
    const abiertasIni = {};
    const cargasIni = {};
    plataformas.forEach((p) => {
      abiertasIni[p] = false;
      cargasIni[p] = CHUNK;
    });
    setAbiertas(abiertasIni);
    setCargas(cargasIni);
  }, [datos]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const plat = entry.target.dataset.platform;
          setCargas((prev) => {
            const total = obtenerOfertas(plat).length;
            const nuevo = Math.min(prev[plat] + CHUNK, total);
            if (nuevo === prev[plat]) return prev;
            return { ...prev, [plat]: nuevo };
          });
        }
      });
    });
    Object.values(sentinelRefs.current).forEach((node) => {
      if (node && node.isConnected) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [abiertas, datos, obtenerOfertas]);

  if (cargando) return <LoaderCirculo texto="Buscando precios..." />;

  if (error)
    return (
      <div className="space-y-2">
        <p>
          {error === "Error 404"
            ? "No se han encontrado ofertas."
            : `Error: ${error}`}
        </p>
        <button
          onClick={obtener}
          className="px-4 py-2 bg-naranja text-black rounded"
        >
          Reintentar
        </button>
      </div>
    );

  if (!datos || plataformas.length === 0)
    return (
      <div>
        <p>No se encontraron plataformas con ofertas.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {plataformas.map((p) => {
        const ofertas = obtenerOfertas(p);
        const visibles = ofertas.slice(0, cargas[p] || CHUNK);
        return (
          <div key={p}>
            <button
              onClick={() =>
                setAbiertas((prev) => ({ ...prev, [p]: !prev[p] }))
              }
              className="w-full text-left px-3 py-2 rounded-md bg-naranja text-black font-semibold"
            >
              {p}
            </button>
            {abiertas[p] && (
              <div className="mt-2 space-y-2">
                {visibles.length > 0 ? (
                  visibles.map((o) => (
                    <a
                      key={o.link}
                      href={o.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-metal/40 hover:bg-metal p-3 rounded border border-borde"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{o.merchant}</span>
                        <span>{limpiarPrecio(o.price)}</span>
                      </div>
                      <div className="text-sm text-gray-300 flex justify-between items-center mt-1">
                        <span>
                          {o.region} - {o.edition}
                        </span>
                        {o.coupon && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const text = typeof o.coupon === "string" ? o.coupon : o.coupon.code;
                              navigator.clipboard.writeText(text);
                            }}
                            className="ml-2 px-2 py-0.5 bg-naranja text-black rounded text-xs"
                          >
                            Copiar {typeof o.coupon === "string" ? o.coupon : o.coupon.code}
                          </button>
                        )}
                      </div>
                    </a>
                  ))
                ) : (
                  <p>No hay ofertas para {p}.</p>
                )}
                {cargas[p] < ofertas.length && (
                  <div
                    ref={(el) => {
                      if (el) sentinelRefs.current[p] = el;
                    }}
                    data-platform={p}
                    className="h-1"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
