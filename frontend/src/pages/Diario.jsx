// src/pages/Diario.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CalendarioDiario from "@/components/CalendarioDiario";
import ListaEntradasDiario from "@/components/ListaEntradasDiario";
import AñadirEntrada from "@/components/AñadirEntrada";
import { Link } from "react-router-dom";

export default function Diario() {
  const { fetchAuth } = useAuth();
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarEntradas = () => {
    setCargando(true);
    fetchAuth("/api/diario/")
      .then((res) => {
        if (Array.isArray(res)) setEntradas(res);
        else setEntradas([]);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarEntradas();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎮 Mi Diario de Juegos</h1>
        <Link
          to="/jugar"
          className="px-4 py-2 rounded bg-naranja text-white hover:bg-opacity-80"
        >
          ¡JUGAR!
        </Link>
      </div>

      <AñadirEntrada onEntradaCreada={cargarEntradas} />

      <section>
        <h2 className="text-xl font-semibold mb-2">Últimas entradas</h2>
        <ListaEntradasDiario entradas={entradas} cargando={cargando} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Calendario de sesiones</h2>
        <CalendarioDiario entradas={entradas} />
      </section>
    </div>
  );
}
