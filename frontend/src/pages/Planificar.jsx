import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import GameCard from "@/components/GameCard";

export default function Planificar() {
    const { fetchAuth } = useAuth();
    const [lista, setLista] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const resBib = await fetchAuth(
                    "/api/juegos/biblioteca/?por_pagina=1000"
                );
                const dataBib = await resBib.json();
                const juegos = dataBib.juegos || [];
                const resTimes = await fetchAuth("/api/sesiones/tiempos/");
                const tiempos = await resTimes.json();

                const detallados = await Promise.all(
                    juegos.map(async (j) => {
                        const t = await fetch(
                            `/api/juegos/tiempo/?nombre=${encodeURIComponent(j.name)}`
                        )
                            .then((r) => (r.ok ? r.json() : null))
                            .catch(() => null);
                        const jugado = tiempos[j.id] || 0;
                        const total = t?.main ? t.main * 3600 : null;
                        const restante = total != null ? Math.max(0, total - jugado) : null;
                        return { ...j, jugado, total, restante };
                    })
                );

                detallados.sort(
                    (a, b) => (a.restante ?? Infinity) - (b.restante ?? Infinity)
                );
                setLista(detallados);
            } catch (e) {
                setLista([]);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold">Planificar juegos</h1>
            {cargando ? (
                <p>Cargando...</p>
            ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {lista.map((j) => (
                        <div key={j.id} className="bg-metal/30 p-2 rounded">
                            <Link to={`/juego/${j.id}`}>
                                <GameCard juego={j} />
                            </Link>
                            <div className="text-xs mt-1 space-y-1">
                                <p>Total: {j.total ? (j.total / 3600).toFixed(1) + "h" : "N/A"}</p>
                                <p>Jugado: {(j.jugado / 3600).toFixed(1)}h</p>
                                {j.restante != null && (
                                    <p>Restante: {(j.restante / 3600).toFixed(1)}h</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}