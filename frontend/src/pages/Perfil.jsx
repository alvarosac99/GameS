import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import EditarPerfil from "@/components/EditarPerfil"

export default function PerfilPublico() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    avatar: null,
    horas: 0,
    juegos: 0,
    amigos: 0,
    seguidores: 0,
    favoritos: []
  })

  const [modoEdicion, setModoEdicion] = useState(false)

  useEffect(() => {
    fetch("/api/usuarios/me/", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPerfil({
          nombre: data.nombre || "",
          avatar: data.foto || "/media/avatares/default.jpg",
          horas: 238,
          juegos: 67,
          amigos: 34,
          seguidores: 89,
          favoritos: ["/portadas/game1.jpg", "/portadas/game2.jpg"]
        })
      })
  }, [])

  return (
    <div className="min-h-screen bg-fondo text-claro p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar y nombre */}
          <div className="flex items-center gap-6 relative">
            <img
              src={perfil.avatar}
              alt="Avatar"
              className="w-32 h-32 rounded-full ring-4 ring-naranja object-cover"
            />
            <button
              onClick={() => setModoEdicion(true)}
              className="absolute bottom-0 left-24 bg-metal p-2 rounded-full hover:bg-borde transition"
            >
              <Pencil className="w-4 h-4 text-naranja" />
            </button>
            <motion.h1
              className="text-3xl font-bold"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              {perfil.nombre}
            </motion.h1>
          </div>

          {/* Estadísticas */}
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

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button className="bg-naranja hover:bg-naranjaHover text-black">Seguir</Button>
            <Button className="bg-metal hover:bg-borde text-claro">Bloquear</Button>
            <Button className="bg-red-700 hover:bg-red-600 text-claro">Reportar</Button>
          </div>
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
