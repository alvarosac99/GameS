import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import EditarPerfil from "@/components/EditarPerfil";
import EditarFavoritos from "@/components/EditarFavoritos";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";
import { Pencil } from "lucide-react";

export default function Perfil() {
  const { nombre } = useParams();
  const navigate = useNavigate();
  const { usuario, cargando, fetchAuth } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [favoritosDatos, setFavoritosDatos] = useState([null, null, null, null, null]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoFavoritos, setModoFavoritos] = useState(false);
  const [animacion, setAnimacion] = useState("onda");
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);

  // Animación letras del nombre
  const cambiarAnimacion = () => {
    const animaciones = ["onda", "rebote", "giro", "temblor"];
    setAnimacion(animaciones[(animaciones.indexOf(animacion) + 1) % animaciones.length]);
  };
  const getAnimacion = (tipo, i) => {
    switch (tipo) {
      case "onda": return { y: [0, -8, 0] };
      case "rebote": return { scale: [1, 1.25, 1] };
      case "giro": return { rotate: [0, 360, 0] };
      case "temblor": return { x: [0, -2, 2, 0] };
      default: return { y: [0, -8, 0] };
    }
  };
  const renderNombreAnimado = (nombre) =>
    nombre.split("").map((letra, i) => (
      <motion.span
        key={i}
        className="inline-block"
        animate={getAnimacion(animacion, i)}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.04 }}
      >
        {letra}
      </motion.span>
    ));

  // Cargar datos de perfil
  useEffect(() => {
    if (cargando) return;
    if (!nombre && usuario?.username) {
      navigate(`/perfil/${usuario.username}`, { replace: true });
      return;
    }
    if (nombre) {
      fetch(`/api/usuarios/${nombre}/`, { credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error("Perfil no encontrado");
          return res.json();
        })
        .then(data => {
          setPerfil({
            ...data,
            avatar: data.foto || "/media/avatares/default.png",
            favoritos: Array.isArray(data.favoritos) && data.favoritos.length === 5
              ? data.favoritos
              : [...(data.favoritos || []), ...Array(5 - (data.favoritos || []).length).fill(null)],
            bio: data.bio || "",
          });
        })
        .catch(() => navigate("/404", { replace: true }));
    }
  }, [nombre, usuario, cargando, navigate]);

  // Cargar juegos favoritos, primero intenta de la caché, luego recupera los que falten por ID
  useEffect(() => {
    if (!perfil) return;
    const ids = perfil.favoritos || [];
    if (ids.every(id => !id)) {
      setFavoritosDatos([null, null, null, null, null]);
      setCargandoFavoritos(false);
      return;
    }
    setCargandoFavoritos(true);

    // 1. Intentar traer todos juntos (caché/local)
    fetch(`/api/juegos/populares/?ids=${ids.join(",")}`)
      .then(res => res.json())
      .then(async data => {
        // Para cada id, busca el juego correspondiente (o null si no lo devuelve)
        let juegos = ids.map(id => data.juegos.find(j => j.id === id) || null);

        // 2. Si alguno viene null, buscarlo individualmente (por ID, usando IGDB)
        for (let i = 0; i < ids.length; i++) {
          if (!juegos[i] && ids[i]) {
            // Busca individualmente ese id
            try {
              const res = await fetch(`/api/juegos/buscar_id/?id=${ids[i]}`);
              if (res.ok) {
                const juego = await res.json();
                juegos[i] = juego;
              }
            } catch { /* Ignorar si falla */ }
          }
        }
        setFavoritosDatos(juegos);
      })
      .catch(() => setFavoritosDatos([null, null, null, null, null]))
      .finally(() => setCargandoFavoritos(false));
  }, [perfil]);

  if (cargando || !perfil) {
    return <LoaderCirculo texto="Cargando perfil..." />;
  }

  const esMiPerfil = perfil?.es_mi_perfil;
  const tags = perfil?.tags || ["Competitivo", "Explorador", "Cooperativo"];

  return (
    <div className="min-h-screen flex flex-col items-center bg-fondo py-10 px-2">
      {/* Margen superior amplio */}
      <div className="h-12" />
      <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto bg-metal border border-borde rounded-3xl shadow-2xl px-8 py-10 flex flex-col lg:flex-row gap-12">
        {/* Columna IZQUIERDA: Avatar + datos */}
        <div className="w-full lg:w-[340px] flex flex-col items-center lg:items-start">
          <div className="relative mb-6">
            <img
              src={perfil.avatar || "/media/avatares/default.png"}
              alt="Avatar"
              className="w-40 h-40 rounded-full object-cover ring-4 ring-naranja border-4 border-metal shadow-xl bg-black"
            />
            {esMiPerfil && (
              <button
                onClick={() => setModoEdicion(true)}
                className="absolute bottom-3 right-3 bg-naranja p-2 rounded-full hover:bg-naranjaHover text-black shadow"
                title="Editar perfil"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
          <h1
            className="text-3xl font-bold text-claro text-left cursor-pointer select-none"
            onClick={cambiarAnimacion}
            title="Haz clic para animar tu nombre"
          >
            {renderNombreAnimado(perfil.nombre)}
          </h1>
          <p className="text-naranja text-lg font-semibold mb-2">@{perfil.username}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((t, i) => (
              <span key={i} className="text-xs rounded-xl px-3 py-1 font-bold border border-naranja bg-naranja/10 text-naranja">{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-lg font-semibold text-naranja mb-1">
            <span>{perfil.horas || 0}h jugadas</span>
            <span>·</span>
            <span>{perfil.juegos || 0} juegos</span>
          </div>
          <div className="flex flex-wrap gap-4 text-base text-claro mb-3">
            <span>{perfil.amigos || 0} amigos</span>
            <span>·</span>
            <span>{perfil.seguidores || 0} seguidores</span>
          </div>
          <div className="w-full">
            <h2 className="font-bold text-naranja mb-1 text-left">Biografía</h2>
            <div className="bg-metal border border-borde rounded-xl px-3 py-2 min-h-[40px] mb-2">
              <p className="text-claro text-sm">{perfil.bio || <span className="text-borde">¡No ha escrito su biografía aún!</span>}</p>
            </div>
          </div>
          {!esMiPerfil && (
            <div className="flex gap-2 mt-2">
              <button className="bg-naranja text-black font-bold px-4 py-1 rounded-full hover:bg-naranjaHover transition">Seguir</button>
              <button className="bg-borde text-claro px-4 py-1 rounded-full hover:bg-metal">Bloquear</button>
              <button className="bg-red-600 text-claro px-4 py-1 rounded-full hover:bg-red-700">Reportar</button>
            </div>
          )}
        </div>

        {/* Columna DERECHA: Favoritos y logros */}
        <div className="flex-1 flex flex-col gap-8 justify-start">
          {/* Favoritos */}
          <div className="bg-metal border border-borde rounded-2xl shadow flex flex-col gap-2 px-6 py-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-naranja text-lg">Favoritos</h2>
              {esMiPerfil && (
                <button
                  onClick={() => setModoFavoritos(true)}
                  className="ml-2 text-xs bg-naranja text-black px-2 py-1 rounded font-bold"
                >Editar</button>
              )}
            </div>
            {cargandoFavoritos ? (
              <LoaderCirculo texto="Cargando juegos favoritos..." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {favoritosDatos.map((juego, i) =>
                  juego ? (
                    <GameCard key={juego.id || i} juego={juego} onClick={() => navigate(`/juego/${juego.id}`)} />
                  ) : (
                    <GameCard />)
                )}
              </div>
            )}
          </div>
          {/* Logros */}
          <div className="bg-metal border border-borde rounded-2xl shadow flex flex-col gap-2 px-6 py-5">
            <h2 className="font-bold text-naranja text-lg mb-2">Recompensas / Logros</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-naranja/20 text-naranja font-semibold px-3 py-1 rounded-xl border border-naranja">Primer juego añadido</span>
              <span className="bg-naranja/20 text-naranja font-semibold px-3 py-1 rounded-xl border border-naranja">Amistad lograda</span>
              <span className="bg-naranja/20 text-naranja font-semibold px-3 py-1 rounded-xl border border-naranja">Maratón 100h</span>
              {/* Esto deberia de ir relleno de logros reales */}
            </div>
          </div>
        </div>

        {/* Modales */}
        {modoEdicion && <EditarPerfil cerrar={() => setModoEdicion(false)} />}
        {modoFavoritos && (
          <EditarFavoritos
            favoritos={favoritosDatos}
            onGuardar={async (nuevos) => {
              // Asegúrate de que siempre mandas 5 slots
              const nuevosIds = [...nuevos].map(j => (j && j.id) || null);
              while (nuevosIds.length < 5) nuevosIds.push(null);
              await fetchAuth('/api/usuarios/favoritos/', {
                method: 'POST',
                body: JSON.stringify({ favoritos: nuevosIds }),
              });
              setPerfil(prev => ({ ...prev, favoritos: nuevosIds }));
              setModoFavoritos(false);
            }}
            onCerrar={() => setModoFavoritos(false)}
          />
        )}
      </div>
    </div>
  );
}
