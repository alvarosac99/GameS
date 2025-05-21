import './index.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Bienvenida from "./pages/Bienvenida";


// dentro del componente App()



export default function App() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        {/* HEADER */}
        <header className="bg-gray-800 py-4 px-4 flex items-center justify-between shadow-md">
          <h1 className="text-xl font-bold">Gestor de Videojuegos</h1>
          <button
            className="text-white focus:outline-none"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            ☰
          </button>
        </header>

        {/* Drawer lateral */}
        {/* Fondo oscuro en móviles */}
        {menuAbierto && (
          <div
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
          />
        )}

        {/* Drawer lateral */}
        <div
          className={`
            fixed inset-y-0 right-0 w-64 bg-gray-900 shadow-lg z-50 p-4
            transform transition-transform duration-300 ease-in-out
            ${menuAbierto ? "translate-x-0" : "translate-x-full"}
          `}
          style={{ pointerEvents: menuAbierto ? "auto" : "none" }}
        >
          {/* Botón de cerrar solo visible en móviles */}
          <button
            className="text-white mb-4"
            onClick={() => setMenuAbierto(false)}
          >
            ✖ Cerrar
          </button>

          <nav className="space-y-4">
            <Link to="/bienvenida" className="block text-white hover:text-blue-400">Panel</Link>
            <Link to="/biblioteca" className="block text-white hover:text-blue-400">Biblioteca</Link>
            <Link to="/diario" className="block text-white hover:text-blue-400">Diario</Link>
            <Link to="/perfil" className="block text-white hover:text-blue-400">Perfil</Link>
            <button className="mt-4 text-red-400 hover:text-red-300" onClick=
              {
                () => {
                  fetch("http://10.42.0.1:8000/api/usuarios/logout/", {
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
                }}>
              Cerrar sesión
            </button>
          </nav>
        </div>

        <div className="flex-1 flex items-center justify-center w-full px-4">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/bienvenida" element={<Bienvenida />} />
            </Routes>
          </div>
        </div>
        <footer className="bg-gray-800 py-2 text-center text-sm text-gray-400">
          GameS © 2025
        </footer>
      </div>
    </Router>
  );
}
