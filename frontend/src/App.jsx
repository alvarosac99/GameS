// src/App.jsx
import React, { useState } from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

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

function AppContent() {
  const { autenticado, usuario } = useAuth();
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  const esDetalle = /^\/juego\/\d+/.test(pathname);
  const esPerfil = /^\/perfil(\/|$)/.test(pathname);

  return (
    <div className="flex flex-col min-h-screen bg-fondo text-claro">
      {/* HEADER centrado con grid */}
      <header className="sticky top-0 z-50 bg-metal px-6 py-3 shadow-md border-b border-borde min-h-[100px] grid grid-cols-3 items-center">
        {/* Menú o botón Juegos */}
        <div className="flex items-center">
          {autenticado ? (
            <button
              className="text-claro focus:outline-none text-2xl"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              ☰
            </button>
          ) : (
            <Link
              to="/juegos"
              className="text-naranja hover:text-naranjaHover font-medium underline"
            >
              Juegos
            </Link>
          )}
        </div>

        {/* Logo centrado */}
        <div className="flex justify-center items-center">
          <Link to="/" className="pointer-events-auto">
            <img
              src="/logo.png"
              alt="GameS"
              className="h-24 sm:h-28 drop-shadow-xl transition-transform hover:scale-105"
            />
          </Link>
        </div>

        {/* Login/Buscador */}
        <div className="flex justify-end items-center gap-2">
          {!autenticado ? (
            <>
              <Link
                to="/login"
                className="text-naranja hover:text-naranjaHover font-medium underline"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-naranja hover:text-naranjaHover font-medium underline"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                className="sm:hidden text-naranja text-xl"
                title="Buscar"
              >
                🔍
              </button>
              <BuscadorGlobal className="hidden sm:flex" />
            </>
          )}
        </div>
      </header>

      {/* Buscador móvil justo debajo del header */}
      {mostrarBuscador && (
        <div className="sm:hidden fixed top-[100px] left-0 w-full px-4 py-2 bg-metal border-b border-borde z-40 shadow-md">
          <BuscadorGlobal />
        </div>
      )}

      {/* Overlay oscuro del menú lateral */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-metal text-claro z-50 p-6
          shadow-2xl border-r border-borde
          transform transition-transform duration-300 ease-in-out
          ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ pointerEvents: menuAbierto ? "auto" : "none" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Menú</h2>
          <button
            className="text-gray-400 hover:text-red-400 text-xl"
            onClick={() => setMenuAbierto(false)}
          >
            ✖
          </button>
        </div>
        <nav className="flex flex-col space-y-4">
          <Link to="/juegos" className="hover:text-naranja transition-colors">
            🎮 Juegos
          </Link>
          <Link to="/bienvenida" className="hover:text-naranja transition-colors">
            📊 Panel
          </Link>
          <Link to="/biblioteca" className="hover:text-naranja transition-colors">
            📚 Biblioteca
          </Link>
          <Link to="/diario" className="hover:text-naranja transition-colors">
            📓 Diario
          </Link>
          <Link
            to={`/perfil/${usuario?.username}`}
            className="hover:text-naranja transition-colors"
          >
            👤 Perfil
          </Link>
          <button
            className="mt-6 text-red-400 hover:text-red-300 text-left"
            onClick={() => {
              fetch("/api/usuarios/logout/", {
                method: "POST",
                credentials: "include",
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) window.location.href = "/";
                  else console.error("Error al cerrar sesión");
                });
            }}
          >
            🚪 Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* CONTENIDO CENTRAL */}
      <main
        className={`flex-1 flex items-center justify-center w-full ${esDetalle ? "px-0 py-0" : "px-4 py-6"
          }`}
      >
        {esPerfil || esDetalle ? (
          <Routes>
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/:nombre" element={<Perfil />} />
            <Route path="/juego/:id" element={<JuegoUnico />} />
          </Routes>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            <Routes>
              <Route path="/" element={<PaginaPrincipal />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/bienvenida" element={<Bienvenida />} />
              <Route path="/juegos" element={<Juegos />} />
              <Route path="/juego/:id" element={<JuegoUnico />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/diario" element={<Diario />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/perfil/:nombre" element={<Perfil />} />
              <Route path="/perfiles" element={<ListaUsuarios />} />
              <Route
                path="*"
                element={<h2 className="text-2xl text-center">Página no encontrada</h2>}
              />
            </Routes>
          </div>
        )}
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
