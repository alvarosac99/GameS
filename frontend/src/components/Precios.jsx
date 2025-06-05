import { useEffect, useState, useCallback, useRef } from "react";
import { Tab } from "@headlessui/react";
import LoaderCirculo from "@/components/LoaderCirculo";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Precios({ nombre }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const limpiarPrecio = (p) =>
    p ? p.replace(/no hidden fees/gi, "").trim() : "";

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


  const plataformas = datos ? Object.keys(datos) : [];

  if (cargando) return <LoaderCirculo texto="Buscando precios..." />;

  if (error)
    return (
      <div className="space-y-2">
        <p>Error: {error}</p>
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
    <Tab.Group>
      <Tab.List className="flex gap-2 mb-4">
        {plataformas.map((p) => (
          <Tab
            key={p}
            className={({ selected }) =>
              classNames(
                "px-3 py-1 rounded-md text-sm font-semibold",
                selected ? "bg-naranja text-black" : "bg-metal hover:bg-borde"
              )
            }
          >
            {p}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        {plataformas.map((p) => (
          <Tab.Panel key={p} className="space-y-2">
            {Object.values(datos[p] || {}).filter((o) => o.price).length > 0 ? (
              Object.values(datos[p])
                .filter((o) => o.price)
                .map((o, i) => (
                  <a
                    key={i}
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
                            navigator.clipboard.writeText(o.coupon);
                          }}
                          className="ml-2 px-2 py-0.5 bg-naranja text-black rounded text-xs"
                        >
                          Copiar {o.coupon}
                        </button>
                      )}
                    </div>
                  </a>
                ))
            ) : (
              <p>No se encontraron ofertas.</p>
            )}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
