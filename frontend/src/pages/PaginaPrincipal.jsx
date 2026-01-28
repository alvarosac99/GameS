import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carrusel from "@/components/Carrusel";
import {
  FaUsers,
  FaGamepad,
  FaBook,
  FaCompass,
  FaStar,
  FaBolt,
  FaArrowRight,
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
  const navigate = useNavigate();

  // Solo consulta la API de stats y la sesión de usuario
  useEffect(() => {
    apiFetch("/usuarios/session/", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUsuario(data.username);
        else navigate("/"); // Redirige si no está autenticado
      });

    apiFetch("/juegos/stats_bienvenida/", { credentials: "include" })
      .then(res => res.json())
      .then(data => setStats(data));

    apiFetch("/juegos/recomendados/", { credentials: "include" })
      .then(res => (res.ok ? res.json() : { recomendaciones: [] }))
      .then(data => setRecomendados(data.recomendaciones || []));
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

      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 lg:pt-14">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-stretch">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-fondo/80 p-6 md:p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-claro/60">
              Panel de bienvenida
            </div>
            <h1 className="mt-3 text-4xl md:text-5xl font-black text-naranja drop-shadow-sm">
              ¡Bienvenido{usuario ? `, ${usuario}` : ""}!
            </h1>
            <p className="mt-4 text-lg text-claro/80">
              Gestiona tu colección, comparte experiencias y descubre títulos que
              encajen contigo. Todo en una plataforma social y visual, pensada
              para jugar más y mejor.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<FaCompass />}
                title="Explora catálogos vivos"
                text="Accede a tendencias, fichas completas y lanzamientos destacados."
              />
              <FeatureCard
                icon={<FaStar />}
                title="Recomendaciones a medida"
                text="Sugerencias personalizadas basadas en tu biblioteca y hábitos."
              />
              <FeatureCard
                icon={<FaBolt />}
                title="Comparador en segundos"
                text="Precios actualizados y alertas rápidas para cazar ofertas."
              />
              <FeatureCard
                icon={<FaBook />}
                title="Diario y comunidad"
                text="Registra sesiones, comparte reseñas y conecta con otros jugadores."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-naranja px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,120,40,0.35)] transition hover:-translate-y-0.5 hover:bg-naranjaHover"
                onClick={() => navigate("/juegos")}
              >
                Explorar catálogo <FaArrowRight className="text-xs" />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-metal/80 px-5 py-2 text-sm font-semibold text-claro transition hover:-translate-y-0.5 hover:border-naranja/60"
                onClick={() => navigate("/biblioteca")}
              >
                Ir a mi biblioteca
              </button>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-2xl border border-black/10 bg-metal/80 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-claro">
                  Estado de la comunidad
                </h3>
                <span className="text-xs text-claro/60">Actualizado hoy</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <StatBox
                  icon={<FaGamepad className="text-xl" />}
                  label="Juegos en la base"
                  value={stats.totalJuegos}
                />
                <StatBox
                  icon={<FaUsers className="text-xl" />}
                  label="Usuarios registrados"
                  value={stats.totalUsuarios}
                />
                <StatBox
                  icon={<FaBook className="text-xl" />}
                  label="Juegos en bibliotecas"
                  value={stats.totalBibliotecas}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-fondo/75 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
              <h3 className="text-lg font-semibold text-claro">Atajos rápidos</h3>
              <div className="mt-3 grid gap-3">
                <QuickLink
                  title="Inicia una sesión"
                  subtitle="Jugar en directo"
                  onClick={() => navigate("/jugar")}
                />
                <QuickLink
                  title="Escribe en tu diario"
                  subtitle="Reseñas y notas"
                  onClick={() => navigate("/diario")}
                />
                <QuickLink
                  title="Planifica partidas"
                  subtitle="Objetivos de la semana"
                  onClick={() => navigate("/planificaciones")}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-metal/70 p-5">
              <h3 className="text-lg font-semibold text-claro">
                Qué hacer hoy
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-claro/70">
                <li>• Completa tu perfil y actualiza tu estilo de juego.</li>
                <li>• Añade un título nuevo a tu biblioteca y compártelo.</li>
                <li>• Guarda una recomendación para verla más tarde.</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-8">
            {stats.juegosPopulares.length > 0 && (
              <SectionCard
                title="Los juegos más populares ahora mismo"
                subtitle="Pulso en tiempo real de la comunidad"
                accent="text-naranja"
              >
                <Carrusel
                  juegos={stats.juegosPopulares}
                  onSelect={juego => navigate(`/juego/${juego.id}`)}
                />
              </SectionCard>
            )}

            {stats.juegosRandom.length > 0 && (
              <SectionCard
                title="¿No sabes a qué jugar?"
                subtitle="Descubre algo fuera de tu radar"
              >
                <Carrusel
                  juegos={stats.juegosRandom}
                  onSelect={juego => navigate(`/juego/${juego.id}`)}
                />
              </SectionCard>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4">
            {recomendados.length > 0 && (
              <SectionCard
                title="Recomendados para ti"
                subtitle="Seleccionados por tu historial"
              >
                <Carrusel
                  juegos={recomendados}
                  onSelect={juego => navigate(`/juego/${juego.id}`)}
                />
              </SectionCard>
            )}

            <div className="rounded-2xl border border-black/10 bg-fondo/80 p-6 text-center shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
              <p className="text-base text-claro/80">
                Este proyecto evoluciona con cada feedback. Si tienes ideas o
                detectas algún fallo, ¡participa!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-fondo/70 px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-naranja/10 text-naranja">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-claro">{value}</div>
        <div className="text-xs uppercase tracking-[0.2em] text-claro/60">
          {label}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-metal/70 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-naranja/10 text-naranja">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-claro">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-claro/70">{text}</p>
    </div>
  );
}

function QuickLink({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl border border-black/10 bg-metal/70 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-naranja/60"
      type="button"
    >
      <div>
        <div className="text-sm font-semibold text-claro">{title}</div>
        <div className="text-xs uppercase tracking-[0.2em] text-claro/60">
          {subtitle}
        </div>
      </div>
      <span className="text-xs text-naranja transition group-hover:translate-x-1">
        Ir
      </span>
    </button>
  );
}

function SectionCard({ title, subtitle, accent = "text-claro", children }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-fondo/80 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className={`text-xl font-bold ${accent}`}>{title}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-claro/60">
          {subtitle}
        </span>
      </div>
      {children}
    </div>
  );
}
