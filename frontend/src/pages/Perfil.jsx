import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import EditarPerfil from "@/components/EditarPerfil"
import { useAuth } from "@/context/AuthContext"

export default function Perfil() {
  const { nombre } = useParams()
  const navigate = useNavigate()
  const { usuario, cargando } = useAuth()

  const [perfil, setPerfil] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
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
            <h2 className="text-lg font-semibold text-naranja mb-2">🎮 Juegos favoritos</h2>
            <div className="grid grid-cols-2 gap-2">
              {perfil.favoritos.map((juego, i) => (
                <img key={i} src={juego} className="w-full rounded" alt={`juego-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {modoEdicion && <EditarPerfil cerrar={() => setModoEdicion(false)} />}
    </div>
  )
}
