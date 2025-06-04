import { useEffect, useState, useCallback } from "react";
import { Tab } from "@headlessui/react";
import LoaderCirculo from "@/components/LoaderCirculo";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Precios({ nombre, plataformas }) {
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(false);

  const limpiarPrecio = (p) =>
    p ? p.replace(/no hidden fees/gi, "").trim() : "";

  const obtener = useCallback(async (plataforma) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ game: nombre, platform: plataforma });
      const res = await fetch(`/api/precios/consultar/?${params.toString()}`);
      const data = await res.json();
      setDatos((prev) => ({ ...prev, [plataforma]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [nombre]);

  useEffect(() => {
    if (plataformas.length > 0) obtener(plataformas[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, plataformas.join(":")]);

  return (
    <Tab.Group>
      <Tab.List className="flex gap-2 mb-4">
        {plataformas.map((p) => (
          <Tab
            key={p}
            className={({ selected }) =>
              classNames(
                "px-3 py-1 rounded-md text-sm font-semibold",
                selected
                  ? "bg-naranja text-black"
                  : "bg-metal hover:bg-borde"
              )
            }
            onClick={() => {
              if (!datos[p]) obtener(p);
            }}
          >
            {p}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        {plataformas.map((p) => (
          <Tab.Panel key={p} className="space-y-2">
            {datos[p] ? (
              Object.values(datos[p].offers || {}).filter((o) => o.price).length > 0 ? (
                Object.values(datos[p].offers)
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
              )
            ) : cargando ? (
              <LoaderCirculo texto="Buscando precios..." />
            ) : (
              <button
                onClick={() => obtener(p)}
                className="px-4 py-2 bg-naranja text-black rounded"
              >
                Consultar
              </button>
            )}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}