import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carrusel from "@/components/Carrusel";
import {
  FaBook,
  FaCompass,
  FaStar,
  FaBolt,
  FaArrowRight,
  FaUsers,
} from "react-icons/fa";
import { apiFetch } from "../lib/api";

export default function PaginaPrincipal() {
  const [usuario, setUsuario] = useState("");
  const [stats, setStats] = useState({
    totalJuegos: 0,
    totalUsuarios: 0,
    totalBibliotecas: 0,
    juegosPopulares: [],
    juegosRandom: [],
  });
  const [recomendados, setRecomendados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiFetch("/usuarios/session/", { credentials: "include" }).then((r) => r.json()),
      apiFetch("/juegos/stats_bienvenida/", { credentials: "include" }).then((r) => r.json()),
      apiFetch("/juegos/recomendados/", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { recomendaciones: [] }
      ),
    ])
      .then(([sesion, statsData, recData]) => {
        if (sesion.authenticated) setUsuario(sesion.username);
        else {
          navigate("/");
          return;
        }
        setStats(statsData);
        setRecomendados(recData.recomendaciones || []);
      })
      .finally(() => setCargando(false));
  }, [navigate]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,132,60,0.25),rgba(255,132,60,0)_70%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(30,140,255,0.18),rgba(30,140,255,0)_70%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-10 lg:pt-16">
        {cargando ? (
          <HeroSkeleton />
        ) : (
          <>
            {/* Hero */}
            <section className="flex flex-col items-center gap-6 text-center pb-10 md:pb-14">
              <img
                src="/logo.png"
                alt="GameS"
                className="h-16 md:h-20 drop-shadow-xl hero-rise"
              />
              <div className="hero-rise" style={{ animationDelay: "80ms" }}>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                  Bienvenido{usuario ? `, ${usuario}` : ""}
                </p>
                <h1 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground text-balance">
                  Tu videoteca, tu diario, tu ritmo
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-foreground/70 text-pretty">
                  GameS junta tu biblioteca, tus sesiones de juego, tus reseñas y
                  tus planificaciones en un solo sitio, para que siempre sepas a
                  qué jugar y cuánto has avanzado.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 hero-rise" style={{ animationDelay: "140ms" }}>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_rgba(255,120,40,0.35)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                  onClick={() => navigate("/juegos")}
                >
                  Explorar catálogo <FaArrowRight className="text-xs" />
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/60"
                  onClick={() => navigate("/biblioteca")}
                >
                  Ir a mi biblioteca
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 mt-2 text-sm text-foreground/60 hero-rise" style={{ animationDelay: "200ms" }}>
                <span><strong className="text-foreground">{stats.totalJuegos.toLocaleString()}</strong> juegos</span>
                <span><strong className="text-foreground">{stats.totalUsuarios.toLocaleString()}</strong> jugadores</span>
                <span><strong className="text-foreground">{stats.totalBibliotecas.toLocaleString()}</strong> en bibliotecas</span>
              </div>
            </section>

            {/* Qué puedes hacer */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 border-y border-border py-8 mb-10">
              <Feature icon={<FaCompass />} title="Explora" text="Catálogo vivo con tendencias y fichas completas." />
              <Feature icon={<FaStar />} title="Descubre" text="Recomendaciones a medida según tu biblioteca." />
              <Feature icon={<FaBolt />} title="Compara" text="Precios actualizados para cazar ofertas." />
              <Feature icon={<FaBook />} title="Registra" text="Diario y planificación de tus partidas." />
            </section>

            {/* Atajos */}
            <section className="flex flex-wrap gap-3 mb-12">
              <QuickLink title="Inicia una sesión" onClick={() => navigate("/jugar")} />
              <QuickLink title="Escribe en tu diario" onClick={() => navigate("/diario")} />
              <QuickLink title="Planifica partidas" onClick={() => navigate("/planificaciones")} />
              <QuickLink title="Gente para seguir" icon={<FaUsers />} onClick={() => navigate("/perfiles")} />
            </section>

            {/* Carruseles */}
            <div className="flex flex-col gap-10">
              {stats.juegosPopulares.length > 0 && (
                <Seccion title="Los juegos más populares ahora mismo" subtitle="Pulso en tiempo real de la comunidad">
                  <Carrusel juegos={stats.juegosPopulares} onSelect={(j) => navigate(`/juego/${j.id}`)} />
                </Seccion>
              )}

              {stats.juegosRandom.length > 0 && (
                <Seccion title="¿No sabes a qué jugar?" subtitle="Descubre algo fuera de tu radar">
                  <Carrusel juegos={stats.juegosRandom} onSelect={(j) => navigate(`/juego/${j.id}`)} />
                </Seccion>
              )}

              {recomendados.length > 0 && (
                <Seccion title="Recomendados para ti" subtitle="Seleccionados por tu historial">
                  <Carrusel juegos={recomendados} onSelect={(j) => navigate(`/juego/${j.id}`)} />
                </Seccion>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 sm:items-start sm:text-left">
      <span className="text-primary text-lg">{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-foreground/60 leading-relaxed">{text}</p>
    </div>
  );
}

function QuickLink({ title, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
    >
      {icon}
      {title}
    </button>
  );
}

function Seccion({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 pb-14 animate-pulse" aria-hidden="true">
      <div className="h-16 md:h-20 w-16 md:w-20 rounded-2xl bg-muted" />
      <div className="flex flex-col items-center gap-3 w-full max-w-xl">
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="h-10 w-full max-w-md rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-40 rounded-full bg-muted" />
        <div className="h-10 w-40 rounded-full bg-muted" />
      </div>
    </div>
  );
}
