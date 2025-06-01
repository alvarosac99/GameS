import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import EditarPerfil from "@/components/EditarPerfil"
import EditarFavoritos from "@/components/EditarFavoritos";
import { useAuth } from "@/context/AuthContext"
import GameCard from "@/components/GameCard"

export default function Perfil() {
  const { nombre } = useParams()
  const navigate = useNavigate()
  const { usuario, cargando, fetchAuth } = useAuth()  // <--- fetchAuth aquí

  const [perfil, setPerfil] = useState(null)
  const [favoritosDatos, setFavoritosDatos] = useState([]) // objetos de juegos favoritos
  const [modoEdicion, setModoEdicion] = useState(false)
  const [modoFavoritos, setModoFavoritos] = useState(false)
  const [animacion, setAnimacion] = useState("onda")

  const esMiPerfil = perfil?.es_mi_perfil

  const cambiarAnimacion = () => {
    const animaciones = ["onda", "rebote", "giro", "temblor"]
    const siguiente = animaciones[(animaciones.indexOf(animacion) + 1) % animaciones.length]
    setAnimacion(siguiente)
  }

  const getAnimacion = (tipo, i) => {
    switch (tipo) {
      case "onda": return { y: [0, -8, 0] }
      case "rebote": return { scale: [1, 1.4, 1] }
      case "giro": return { rotate: [0, 360, 0] }
      case "temblor": return { x: [0, -3, 3, 0] }
      default: return { y: [0, -8, 0] }
    }
  }

  const renderNombreAnimado = (nombre) =>
    nombre.split("").map((letra, i) => (
      <motion.span
        key={i}
        className="inline-block"
        animate={getAnimacion(animacion, i)}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
      >
        {letra}
      </motion.span>
    ))

  // Carga el perfil y favoritos (IDs)
  useEffect(() => {
    if (cargando) return;

    if (!nombre && usuario?.username) {
      navigate(`/perfil/${usuario.username}`, { replace: true })
      return
    }

    if (nombre) {
      fetch(`/api/usuarios/${nombre}/`, { credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error("Perfil no encontrado");
          return res.json();
        })
        .then(data => {
          setPerfil({
            id: data.id,
            nombre: data.nombre,
            avatar: data.foto || "/media/avatares/default.jpg",
            horas: data.horas || 0,
            juegos: data.juegos || 0,
            amigos: data.amigos || 0,
            seguidores: data.seguidores || 0,
            favoritos: data.favoritos || [],
            es_mi_perfil: data.es_mi_perfil || false,
          });
        })
        .catch(() => {
          navigate("/404", { replace: true });
        });
    }
  }, [nombre, usuario, cargando, navigate])

  // Cuando cambian los favoritos (IDs), busca los datos de los juegos (solo si hay alguno)
  useEffect(() => {
    const ids = perfil?.favoritos?.filter(Boolean) || [];
    if (ids.length === 0) {
      setFavoritosDatos([]);
      return;
    }
    // Llama solo si hay IDs válidos
    fetch(`/api/juegos/populares/?por_pagina=5&ids=${ids.join(",")}`)
      .then(res => res.json())
      .then(data => setFavoritosDatos(
        // Ordena igual que los IDs guardados
        ids.map(id => data.juegos.find(j => j.id === id)).filter(Boolean)
      ))
      .catch(() => setFavoritosDatos([]));
  }, [perfil?.favoritos]);

  if (cargando || !perfil) return <p className="text-center text-claro mt-10">Cargando perfil...</p>

  return (
    <div className="min-h-screen bg-fondo text-claro p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-6 relative">
            <img
              src={perfil.avatar}
              alt="Avatar"
              className="w-32 h-32 rounded-full ring-4 ring-naranja object-cover"
            />
            {esMiPerfil && (
              <button
                onClick={() => setModoEdicion(true)}
                className="absolute bottom-0 left-24 bg-metal p-2 rounded-full hover:bg-borde transition"
              >
                <Pencil className="w-4 h-4 text-naranja" />
              </button>
            )}
            <h1
              className="text-3xl font-bold cursor-pointer select-none"
              onClick={cambiarAnimacion}
              title="Haz clic para cambiar el baile"
            >
              {renderNombreAnimado(perfil.nombre)}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-metal rounded p-4 text-center">
              <p className="text-2xl font-bold">{perfil.horas}h</p>
              <p className="text-sm">Jugadas</p>
            </div>
            <div className="bg-metal rounded p-4 text-center">
              <p className="text-2xl font-bold">{perfil.juegos}</p>
              <p className="text-sm">Juegos</p>
            </div>
            <div className="bg-metal rounded p-4 text-center">
              <p className="text-2xl font-bold">{perfil.amigos}</p>
              <p className="text-sm">Amigos</p>
            </div>
            <div className="bg-metal rounded p-4 text-center">
              <p className="text-2xl font-bold">{perfil.seguidores}</p>
              <p className="text-sm">Seguidores</p>
            </div>
          </div>

          {!esMiPerfil && (
            <div className="flex gap-4">
              <Button className="bg-naranja hover:bg-naranjaHover text-black">Seguir</Button>
              <Button className="bg-metal hover:bg-borde text-claro">Bloquear</Button>
              <Button className="bg-red-700 hover:bg-red-600 text-claro">Reportar</Button>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="space-y-6">
          <div className="bg-metal p-4 rounded shadow border border-borde min-h-[120px]">
            <h2 className="text-lg font-semibold">📌 Panel superior</h2>
            <p className="text-sm text-gray-400">(contenido aún por definir)</p>
          </div>

          <div className="bg-metal p-4 rounded shadow border border-borde">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-naranja">🎮 Juegos favoritos</h2>
              {esMiPerfil && (
                <button
                  onClick={() => setModoFavoritos(true)}
                  className="ml-2 text-xs bg-naranja text-black px-2 py-1 rounded font-bold"
                >Editar</button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {favoritosDatos.length === 0
                ? <div className="text-claro/50 italic">No tienes juegos favoritos</div>
                : favoritosDatos.map((juego, i) => (
                  <div key={juego.id || i} className="w-24">
                    <GameCard juego={juego} onClick={() => navigate(`/juego/${juego.id}`)} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {modoEdicion && <EditarPerfil cerrar={() => setModoEdicion(false)} />}

      {/* Modal para editar favoritos */}
      {modoFavoritos && (
        <EditarFavoritos
          favoritos={favoritosDatos}
          onGuardar={async (nuevos) => {
            await fetchAuth('/api/usuarios/favoritos/', {
              method: 'POST',
              body: JSON.stringify({ favoritos: nuevos.map(j => j.id) }),
            });
            setPerfil(prev => ({ ...prev, favoritos: nuevos.map(j => j.id) }));
            setModoFavoritos(false);
          }}
          onCerrar={() => setModoFavoritos(false)}
        />
      )}
    </div>
  )
}
