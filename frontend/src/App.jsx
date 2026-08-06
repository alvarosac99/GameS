import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
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
  Bell,
} from "lucide-react";

import Jugar from "./pages/Jugar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Juegos from "./pages/Juegos";
import Biblioteca from "./pages/Biblioteca";
import Diario from "./pages/Diario";
import Perfil from "./pages/Perfil";
import PaginaPrincipal from "./pages/PaginaPrincipal";
import JuegoUnico from "./pages/JuegoUnico";
import BuscadorGlobal from "./components/BuscadorGlobal";
import NotificacionesLista from "./components/NotificacionesLista";
import ListaUsuarios from "./pages/ListaUsuarios";
import Planificaciones from "./pages/Planificaciones";
import PlanificacionDetalle from "./pages/PlanificacionDetalle";
import Ajustes from "./pages/Ajustes";
import NuestrosJuegos from "./pages/NuestrosJuegos";
import NuevoJuego from "./pages/NuevoJuego";
import Privacidad from "./pages/Privacidad";

import LoadingScreen from "./components/LoadingScreen";

function AppContent() {
  const { autenticado, usuario, logout } = useAuth();
  const { t } = useLang();
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarNotis, setMostrarNotis] = useState(false);
  const { pathname } = useLocation();

  const esDetalle = /^\/juego\/\d+/.test(pathname);

  const headerRef = useRef(null);
  const menuFirstLinkRef = useRef(null);
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

  useEffect(() => {
    if (menuAbierto) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      if (menuFirstLinkRef.current) {
        menuFirstLinkRef.current.focus();
      }
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    document.body.style.overflow = "";
    return undefined;
  }, [menuAbierto]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && menuAbierto) {
        setMenuAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuAbierto]);

  return (
    <div className="app-shell flex flex-col min-h-screen text-foreground">
      {/* Botón flotante del menú */}
      {autenticado && (
        <button
          className={` 
      fixed left-4 z-max transition-transform duration-300 rounded-full p-3
      bg-card/70 hover:bg-card
      ${menuAbierto ? "rotate-90 text-destructive" : "text-primary"}
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
        className="sticky top-0 z-sticky bg-card/60 dark:bg-card/90 backdrop-blur-sm px-4 py-3 shadow-md border-b border-border grid grid-cols-3 items-center"
      >
        <div className="flex items-center">
          {autenticado && (
            <Link
              to={`/perfil/${usuario?.username}`}
              className="hidden xl:block ml-20"
            >
              <img
                src={usuario?.foto || "/media/avatares/default.png"}
                alt="Mi perfil"
                className="w-10 h-10 rounded-full object-cover hover:opacity-80"
              />
            </Link>
          )}
        </div>
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
              <Link to="/login" className="text-primary underline">
                {t("loginLink")}
              </Link>
              <Link to="/register" className="text-primary underline">
                {t("registerLink")}
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                className={`xl:hidden text-xl p-3 rounded-full transition-transform duration-300 bg-card/70 hover:bg-card ${mostrarBuscador ? "rotate-90 text-destructive" : "text-primary"}`}
                aria-label={mostrarBuscador ? "Cerrar buscador" : "Mostrar buscador"}
              >
                {mostrarBuscador ? <X /> : <Search />}
              </button>
              <button
                onClick={() => setMostrarNotis(!mostrarNotis)}
                className="text-xl p-3 rounded-full bg-card/70 hover:bg-card text-primary relative"
                aria-label="Notificaciones"
              >
                <Bell />
              </button>
              <BuscadorGlobal className="hidden xl:flex" />
            </>
          )}
        </div>
      </header>

      {/* Buscador móvil debajo del header */}
      <div
        className={` 
          fixed left-0 w-full px-4 py-2 bg-card/70 dark:bg-card/95 border-b border-border z-dropdown shadow-md
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
          className="fixed inset-0 bg-black bg-opacity-40 z-modal-backdrop"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {mostrarNotis && <NotificacionesLista onCerrar={() => setMostrarNotis(false)} />}

      {/* Menú lateral */}
      <aside
        className={`fixed top-0 left-0 w-64 bg-card shadow-lg border-r border-border z-modal pt-24 transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <nav className="flex flex-col p-6 space-y-4">
          <Link
            to="/jugar"
            ref={menuFirstLinkRef}
            className="flex items-center gap-2 hover:text-primary"
          >
            <LayoutDashboard /> {t("menuPlay")}
          </Link>
          <Link to="/juegos" className="flex items-center gap-2 hover:text-primary">
            <Gamepad /> {t("menuJuegos")}
          </Link>
          <Link to="/nuestros-juegos" className="flex items-center gap-2 hover:text-primary">
            <Gamepad /> {t("menuNuestrosJuegos")}
          </Link>
          {(usuario?.rol === "DEV" || usuario?.rol === "ADMIN") && (
            <Link to="/nuevo-juego" className="flex items-center gap-2 hover:text-primary">
              <Gamepad /> {t("menuAnadeJuego")}
            </Link>
          )}
          <Link to="/bienvenida" className="flex items-center gap-2 hover:text-primary">
            <LayoutDashboard /> {t("menuPanel")}
          </Link>
          <Link to="/biblioteca" className="flex items-center gap-2 hover:text-primary">
            <BookOpenText /> {t("menuBiblioteca")}
          </Link>
          <Link to="/diario" className="flex items-center gap-2 hover:text-primary">
            <NotebookPen /> {t("menuDiario")}
          </Link>
          <Link to="/planificaciones" className="flex items-center gap-2 hover:text-primary">
            <LayoutDashboard /> Planificaciones
          </Link>
          <Link to="/ajustes" className="flex items-center gap-2 hover:text-primary">
            <Settings /> {t("menuAjustes")}
          </Link>
          <Link to={`/perfil/${usuario?.username}`} className="flex items-center gap-2 hover:text-primary">
            <User /> {t("menuPerfil")}
          </Link>
          <button
            className="flex items-center gap-2 text-destructive hover:text-destructive"
            onClick={() => logout().then(() => (window.location.href = "/"))}
          >
            <LogOut /> {t("menuLogout")}
          </button>
          {/* Enlaces adicionales en texto pequeño */}
          <div className="mt-6 text-xs text-muted-foreground space-y-1">
            <Link to="/sobre-mi" className="hover:text-primary">
              Sobre mí
            </Link>
            <Link to="/manual" className="hover:text-primary">
              Manual de uso
            </Link>
            <Link to="/privacidad" className="hover:text-primary">
              Privacidad
            </Link>
          </div>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main className={`flex-1 ${esDetalle ? "p-0" : "p-4"}`}>
        <Routes>
          <Route path="/" element={<PaginaPrincipal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bienvenida" element={<PaginaPrincipal />} />
          <Route path="/juegos" element={<Juegos />} />
          <Route path="/juego/:id" element={<JuegoUnico />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/planificaciones" element={<Planificaciones />} />
          <Route path="/planificacion/:id" element={<PlanificacionDetalle />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:nombre" element={<Perfil />} />
          <Route path="/perfiles" element={<ListaUsuarios />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/nuestros-juegos" element={<NuestrosJuegos />} />
          <Route path="/nuevo-juego" element={<NuevoJuego />} />
          <Route path="/jugar" element={<Jugar />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="*" element={<h2 className="text-center">{t("pageNotFound")}</h2>} />
        </Routes>
      </main>

      <footer className="relative z-20 bg-card py-2 text-center text-sm text-muted-foreground dark:text-muted-foreground border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.25)]">
        GameS © 2025 · <Link to="/privacidad" className="hover:text-primary">Privacidad</Link>
      </footer>
    </div>
  );
}

function AppWithLoading() {
  const { cargando } = useAuth();

  if (cargando) {
    return <LoadingScreen />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <Router>
      <AppWithLoading />
    </Router>
  );
}
