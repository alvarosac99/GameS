// src/components/Biblioteca.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";
import TarjetaSkeleton from "../components/TarjetaSkeleton";

export default function Biblioteca() {
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setCargando(true);
    fetch("/api/juegos/biblioteca/", {    // ← ruta corregida
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setJuegos(data.juegos || []);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-fondo text-claro p-6">
      <h1 className="text-3xl font-bold mb-6">Mi biblioteca</h1>

      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {Array(porPagina).fill().map((_, i) => (
            <TarjetaSkeleton key={i} />
          ))}
        </div>
      ) : juegos.length === 0 ? (
        <p>No tienes juegos en tu biblioteca.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {juegos.map((juego) => (
            <GameCard
              key={juego.id}
              juego={juego}
              onClick={() => navigate(`/juego/${juego.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
