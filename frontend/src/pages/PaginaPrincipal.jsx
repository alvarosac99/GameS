import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carrusel from "@/components/Carrusel";
import { FaUsers, FaGamepad, FaBook } from "react-icons/fa";

export default function Bienvenida() {
  const [usuario, setUsuario] = useState("");
  const [stats, setStats] = useState({
    totalJuegos: 0,
    totalUsuarios: 0,
    totalBibliotecas: 0,
    juegosPopulares: [],
    juegosRandom: [],
  });
  const navigate = useNavigate();

  // Solo consulta la API de stats y la sesión de usuario
  useEffect(() => {
    fetch("/api/usuarios/session", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUsuario(data.username);
        else navigate("/"); // Redirige si no está autenticado
      });

    fetch("/api/juegos/stats_bienvenida/", { credentials: "include" })
      .then(res => res.json())
      .then(data => setStats(data));
  }, [navigate]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-8 px-4">
      {/* Título animado */}
      <h1 className="text-4xl md:text-5xl font-black text-center mb-3 text-naranja drop-shadow-xl animate-bounce">
        ¡Bienvenido!
      </h1>

      {/* Stats con iconos */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-6 w-full">
        <StatBox
          icon={<FaGamepad className="text-3xl" />}
          label="Juegos en la base"
          value={stats.totalJuegos}
        />
        <StatBox
          icon={<FaUsers className="text-3xl" />}
          label="Usuarios registrados"
          value={stats.totalUsuarios}
        />
        <StatBox
          icon={<FaBook className="text-3xl" />}
          label="Juegos en bibliotecas"
          value={stats.totalBibliotecas}
        />
      </div>

      {/* Descripción del proyecto */}
      <div className="bg-[#23272f] rounded-2xl shadow-xl p-6 text-claro max-w-2xl text-center mb-6">
        <p className="text-lg md:text-xl mb-2 font-semibold">
          ¡Gestiona tu colección de videojuegos como nunca antes!
        </p>
        <p className="mb-2">
          Organiza tu biblioteca, lleva un diario de partidas, comparte experiencias con la comunidad y descubre nuevos títulos. Todo, en una plataforma social y visual.
        </p>
        <p>
          Nuestra plataforma integra datos de <span className="text-naranja font-bold">IGDB</span> y otras fuentes para ofrecerte <span className="font-bold">recomendaciones personalizadas</span>, <span className="font-bold">comparador de precios</span> y un <span className="font-bold">entorno social</span> donde los jugadores como tú sois los protagonistas.
        </p>
      </div>

      {/* Carrusel de juegos populares */}
      {stats.juegosPopulares.length > 0 && (
        <div className="w-full mb-10">
          <h2 className="text-2xl font-bold text-center mb-2 text-naranja">
            🎮 Los juegos más populares ahora mismo
          </h2>
          <Carrusel
            juegos={stats.juegosPopulares}
            onSelect={juego => navigate(`/juego/${juego.id}`)}
          />
        </div>
      )}

      {/* Carrusel de juegos aleatorios */}
      {stats.juegosRandom.length > 0 && (
        <div className="w-full mb-6">
          <h2 className="text-2xl font-bold text-center mb-2 text-claro">
            ¿No sabes a qué jugar? ¡Prueba algo diferente!
          </h2>
          <Carrusel
            juegos={stats.juegosRandom}
            onSelect={juego => navigate(`/juego/${juego.id}`)}
          />
        </div>
      )}

      {/* Pie de página o CTA */}
      <div className="text-center mt-8">
        <p className="text-base text-claro/80 mb-3">
            Este proyecto evoluciona con cada feedback. Si tienes ideas o detectas algún fallo, ¡participa!
        </p>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#181b20] rounded-xl shadow-md px-8 py-4">
      <div className="mb-2">{icon}</div>
      <span className="text-2xl font-bold text-naranja">{value}</span>
      <span className="text-claro/80">{label}</span>
    </div>
  );
}
