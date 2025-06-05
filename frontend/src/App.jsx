import React, { useState, useRef, useLayoutEffect } from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LangContext";

import {
  Menu,
  X,
  Gamepad,
  BookOpenText,
  NotebookPen,
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
} from "lucide-react";

import Jugar from "./pages/Jugar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bienvenida from "./pages/Bienvenida";
import Juegos from "./pages/Juegos";
import Biblioteca from "./pages/Biblioteca";
import Diario from "./pages/Diario";
import Perfil from "./pages/Perfil";
import PaginaPrincipal from "./pages/PaginaPrincipal";
import JuegoUnico from "./pages/JuegoUnico";
import BuscadorGlobal from "./components/BuscadorGlobal";
import ListaUsuarios from "./pages/ListaUsuarios";
import Planificar from "./pages/Planificar";
import Planificaciones from "./pages/Planificaciones";
import PlanificacionDetalle from "./pages/PlanificacionDetalle";
import Ajustes from "./pages/Ajustes";

function AppContent() {
  const { autenticado, usuario } = useAuth();
  const { t } = useLang();
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  const esDetalle = /^\/juego\/\d+/.test(pathname);
  const esPerfil = /^\/perfil(\/|$)/.test(pathname);

  const headerRef = useRef(null);
  const [botonTop, setBotonTop] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(80);

  useLayoutEffect(() => {
    const calcularPosiciones = () => {
      if (headerRef.current) {
        const hHeight = headerRef.current.offsetHeight;
        setHeaderHeight(hHeight);
        setBotonTop(hHeight / 2 - 24 - 6);
      }
    };
    calcularPosiciones();
    window.addEventListener("resize", calcularPosiciones);
    return () => window.removeEventListener("resize", calcularPosiciones);
  }, []);

  return (
    <div
      className="flex flex-col min-h-screen text-claro"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Botón flotante del menú */}
      {autenticado && (
        <button
          className={` 
      fixed left-4 z-[100] transition-transform duration-300 rounded-full p-3
      bg-metal/70 hover:bg-metal
      ${menuAbierto ? "rotate-90 text-red-400" : "text-naranja"}
    `}
          style={{ top: `${botonTop}px` }}
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          {menuAbierto ? <X size={32} /> : <Menu size={32} />}
        </button>
      )}


      {/* HEADER */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 bg-metal/90 backdrop-blur-sm px-4 py-3 shadow-md border-b border-borde grid grid-cols-3 items-center"
      >
        <div />
        <div className="flex justify-center items-center">
          <Link to="/">
            <img
              src="/logo.png"
              alt="GameS"
              className="h-16 drop-shadow-xl transition-transform hover:scale-105"
            />
          </Link>
        </div>
        <div className="flex justify-end gap-2">
          {!autenticado ? (
            <>
              <Link to="/login" className="text-naranja underline">
                {t("loginLink")}
              </Link>
              <Link to="/register" className="text-naranja underline">
                {t("registerLink")}
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                className={`xl:hidden text-xl p-3 rounded-full transition-transform duration-300 bg-metal/70 hover:bg-metal ${mostrarBuscador ? "rotate-90 text-red-400" : "text-naranja"}`}
                aria-label={mostrarBuscador ? "Cerrar buscador" : "Mostrar buscador"}
              >
                {mostrarBuscador ? <X /> : <Search />}
              </button>
              <BuscadorGlobal className="hidden xl:flex" />
            </>
          )}
        </div>
      </header>

      {/* Buscador móvil debajo del header */}
      <div
        className={` 
          fixed left-0 w-full px-4 py-2 bg-metal/95 border-b border-borde z-40 shadow-md
          transition-all duration-300 backdrop-blur-sm origin-top
          ${mostrarBuscador ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"}
        `}
        style={{ top: `${headerHeight}px` }}
      >
        <BuscadorGlobal />
      </div>

      {/* Overlay del menú */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Menú lateral */}
      <aside
        className={`fixed top-0 left-0 w-64 bg-metal shadow-lg border-r border-borde z-50 pt-24 transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <nav className="flex flex-col p-6 space-y-4">
          <Link to="/jugar" className="flex items-center gap-2 hover:text-naranja">
            <LayoutDashboard /> {t("menuPlay")}
          </Link>
          <Link to="/juegos" className="flex items-center gap-2 hover:text-naranja">
            <Gamepad /> {t("menuJuegos")}
          </Link>
          <Link to="/bienvenida" className="flex items-center gap-2 hover:text-naranja">
            <LayoutDashboard /> {t("menuPanel")}
          </Link>
          <Link to="/biblioteca" className="flex items-center gap-2 hover:text-naranja">
            <BookOpenText /> {t("menuBiblioteca")}
          </Link>
          <Link to="/diario" className="flex items-center gap-2 hover:text-naranja">
            <NotebookPen /> {t("menuDiario")}
          </Link>
          <Link to="/planificar" className="flex items-center gap-2 hover:text-naranja">
            <LayoutDashboard /> {t("menuPlanificar")}
          </Link>
          <Link to="/planificaciones" className="flex items-center gap-2 hover:text-naranja">
            <LayoutDashboard /> {t("menuMisPlanes")}
          </Link>
          <Link to="/ajustes" className="flex items-center gap-2 hover:text-naranja">
            <Settings /> {t("menuAjustes")}
          </Link>
          <Link to={`/perfil/${usuario?.username}`} className="flex items-center gap-2 hover:text-naranja">
            <User /> {t("menuPerfil")}
          </Link>
          <button
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
            onClick={() =>
              fetch("/api/usuarios/logout/", { method: "POST" }).then(() => (window.location.href = "/"))
            }
          >
            <LogOut /> {t("menuLogout")}
          </button>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main className={`flex-1 ${esDetalle ? "p-0" : "p-4"}`}>
        <Routes>
          <Route path="/" element={<PaginaPrincipal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/juegos" element={<Juegos />} />
          <Route path="/juego/:id" element={<JuegoUnico />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/planificar" element={<Planificar />} />
          <Route path="/planificaciones" element={<Planificaciones />} />
          <Route path="/planificacion/:id" element={<PlanificacionDetalle />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:nombre" element={<Perfil />} />
          <Route path="/perfiles" element={<ListaUsuarios />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/jugar" element={<Jugar />} />
          <Route path="*" element={<h2 className="text-center">{t("pageNotFound")}</h2>} />
        </Routes>
      </main>

      <footer className="bg-metal py-2 text-center text-sm text-gray-400 border-t border-borde">
        GameS © 2025
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
