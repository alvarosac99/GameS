import './index.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

import { FiSearch } from "react-icons/fi";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Bienvenida from "./pages/Bienvenida";
import Juegos from "./pages/Juegos";
import Biblioteca from "./pages/Biblioteca";
import Diario from "./pages/Diario";
import Perfil from "./pages/Perfil";
import PaginaPrincipal from "./pages/PaginaPrincipal";
import JuegoUnico from "./pages/JuegoUnico";

export default function App() {
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const { autenticado, usuario, logout, cargando } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-fondo text-claro">
        {/* HEADER */}
        <header className="bg-metal py-4 px-6 flex items-center justify-between shadow-md border-b border-borde">
          {/* Izquierda: botón o link a juegos */}
          <div className="flex items-center gap-4">
            {autenticado ? (
              <button
                className="text-claro focus:outline-none"
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

          {/* Centro: logo */}
          <div className="flex-grow text-center">
            <Link to="/" className="text-claro text-2xl font-bold tracking-wide">
              GameS
            </Link>
          </div>

          {/* Derecha: login / register */}
          {!autenticado && (
            <div className="flex items-center gap-4">
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
            </div>
          )}

          {/* busqueda global y perfiles si está autenticado */}
          {autenticado && (
            <div className="ml-auto flex items-center gap-2">
              {/* Modo escritorio: input siempre visible */}
              <form
                action="/juegos"
                method="GET"
                className="hidden sm:flex gap-2 items-center"
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Buscar juego..."
                  className="px-3 py-1 rounded bg-metal text-claro border border-borde placeholder:text-gray-400 w-48 sm:w-64"
                />
                <button
                  type="submit"
                  className="bg-naranja hover:bg-naranjaHover text-black font-semibold px-3 py-1 rounded"
                >
                  Buscar
                </button>
              </form>

              {/* Modo móvil: icono de lupa */}
              <button
                onClick={() => setMostrarBuscador(!mostrarBuscador)}
                className="sm:hidden text-claro text-xl"
                title="Buscar"
              >
                <FiSearch />
              </button>
            </div>
          )}

        </header>
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 bg-metal border-b border-borde ${mostrarBuscador ? "max-h-32 py-2 px-4" : "max-h-0 py-0 px-4"
            }`}
        >
          <form
            action="/juegos"
            method="GET"
            className="flex gap-2 items-center"
          >
            <input
              type="text"
              name="q"
              placeholder="Buscar juego..."
              autoFocus={mostrarBuscador}
              className="flex-1 px-3 py-1 rounded bg-metal text-claro border border-borde placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="bg-naranja hover:bg-naranjaHover text-black font-semibold px-3 py-1 rounded"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Overlay */}
        {menuAbierto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setMenuAbierto(false)}
          ></div>
        )}

        {/* MENÚ LATERAL */}
        <div
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
            <Link to="/juegos" className="hover:text-naranja transition-colors duration-200">
              🎮 Juegos
            </Link>
            <Link to="/bienvenida" className="hover:text-naranja transition-colors duration-200">
              📊 Panel
            </Link>
            <Link to="/biblioteca" className="hover:text-naranja transition-colors duration-200">
              📚 Biblioteca
            </Link>
            <Link to="/diario" className="hover:text-naranja transition-colors duration-200">
              📓 Diario
            </Link>
            <Link
              to={`/perfil/${usuario?.username}`}
              className="hover:text-naranja transition-colors duration-200"
            >
              👤 Perfil
            </Link>
            <button
              className="mt-6 text-red-400 hover:text-red-300 transition-colors duration-200 text-left"
              onClick={() => {
                fetch("/api/usuarios/logout/", {
                  method: "POST",
                  credentials: "include",
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      window.location.href = "/";
                    } else {
                      console.error("Error al cerrar sesión");
                    }
                  });
              }}
            >
              🚪 Cerrar sesión
            </button>
          </nav>
        </div>

        {/* CONTENIDO CENTRAL */}
        <div className="flex-1 flex items-center justify-center w-full px-4 py-6">
          <div className="w-full max-w-4xl">
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
              <Route path="*" element={<h2 className="text-2xl text-center">Página no encontrada</h2>} />
            </Routes>
          </div>
        </div>

        <footer className="bg-metal py-2 text-center text-sm text-gray-400 border-t border-borde">
          GameS © 2025
        </footer>
      </div>
    </Router>
  );
}
