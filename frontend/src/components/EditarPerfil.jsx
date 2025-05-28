import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, X } from "lucide-react"
// <-- ¡NO IMPORTES SWITCH!

function getCookie(name) {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null
}

export default function Perfil({ cerrar }) {
  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    bio: "",
    password: "",
    confirmPassword: "",
    foto: null,
    fotoUrl: null,
    filtro_adulto: true,
  })

  useEffect(() => {
    fetch("/api/usuarios/session/", { credentials: "include" })

    fetch("/api/usuarios/me/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setPerfil((prev) => ({
          ...prev,
          nombre: data.nombre || "",
          email: data.email || "",
          bio: data.bio || "",
          fotoUrl: data.foto || null,
          filtro_adulto: data.filtro_adulto !== undefined ? data.filtro_adulto : true,
        }))
      })
  }, [])

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPerfil({ ...perfil, foto: file, fotoUrl: URL.createObjectURL(file) })
    }
  }

  // Usamos checked, no value
  const handleFiltroAdultoChange = (e) => {
    setPerfil((prev) => ({ ...prev, filtro_adulto: e.target.checked }))
    fetch("/api/usuarios/me/filtro_adulto/", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
      body: JSON.stringify({ filtro_adulto: e.target.checked }),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (perfil.password && perfil.password !== perfil.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    const formData = new FormData()
    formData.append("nombre", perfil.nombre)
    formData.append("email", perfil.email)
    formData.append("bio", perfil.bio)
    if (perfil.foto) {
      formData.append("foto", perfil.foto)
    }

    fetch("/api/usuarios/me/", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: formData,
    })
      .then((res) => res.json())
      .then(() => alert("Perfil actualizado correctamente"))
      .catch((err) => {
        console.error("Error al guardar:", err)
        alert("Error al guardar los cambios")
      })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 overflow-y-auto flex items-start justify-center px-4 py-24">
      <div className="relative w-full max-w-xl">
        <button
          onClick={cerrar}
          className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="w-full bg-fondo text-claro p-6 rounded-xl shadow-xl space-y-8 border border-borde">

          {/* AVATAR + INFO */}
          <Card className="bg-metal border border-borde rounded-lg shadow-md">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-28 h-28 ring-2 ring-naranja">
                  <AvatarImage
                    src={
                      perfil.foto
                        ? URL.createObjectURL(perfil.foto)
                        : perfil.fotoUrl || "/default-user.jpg"
                    }
                  />
                  <AvatarFallback>{perfil.nombre.slice(0, 2) || "?"}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 bg-metal p-2 rounded-full cursor-pointer hover:bg-borde transition">
                  <Pencil className="w-4 h-4 text-naranja" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="w-full space-y-4">
                <div>
                  <Label className="text-claro" htmlFor="nombre">Nombre</Label>
                  <Input
                    name="nombre"
                    value={perfil.nombre}
                    onChange={handleChange}
                    className="bg-fondo border border-borde text-claro"
                  />
                </div>

                <div>
                  <Label className="text-claro" htmlFor="email">Correo</Label>
                  <Input
                    name="email"
                    type="email"
                    value={perfil.email}
                    onChange={handleChange}
                    className="bg-fondo border border-borde text-claro"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIO */}
          <Card className="bg-metal border border-borde rounded-lg">
            <CardContent className="p-6 space-y-2">
              <Label className="text-claro" htmlFor="bio">Biografía</Label>
              <Textarea
                name="bio"
                value={perfil.bio}
                onChange={handleChange}
                className="bg-fondo border border-borde text-claro resize-none"
              />
            </CardContent>
          </Card>

          {/* CONTRASEÑAS */}
          <Card className="bg-metal border border-borde rounded-lg">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-claro" htmlFor="password">Nueva contraseña</Label>
                <Input
                  name="password"
                  type="password"
                  value={perfil.password}
                  onChange={handleChange}
                  className="bg-fondo border border-borde text-claro"
                />
              </div>
              <div>
                <Label className="text-claro" htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={perfil.confirmPassword}
                  onChange={handleChange}
                  className="bg-fondo border border-borde text-claro"
                />
              </div>
            </CardContent>
          </Card>

          {/* CHECKBOX ADULTO */}
          <CardContent className="p-6 flex items-center gap-4">
            <input
              type="checkbox"
              id="filtro-adulto"
              checked={perfil.filtro_adulto}
              onChange={handleFiltroAdultoChange}
              className="w-5 h-5 accent-naranja cursor-pointer border-borde"
            />
            <Label className="text-claro" htmlFor="filtro-adulto">
              Ocultar juegos eróticos
            </Label>
          </CardContent>

          <div className="text-right">
            <Button
              type="submit"
              className="bg-naranja hover:bg-naranjaHover text-claro px-6"
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
