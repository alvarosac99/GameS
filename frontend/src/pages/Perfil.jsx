import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import EditarPerfil from "@/components/EditarPerfil";
import EditarFavoritos from "@/components/EditarFavoritos";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";
import { Pencil } from "lucide-react";
import ActividadReciente from "@/components/ActividadReciente";
import Reportar from "@/components/Reportar";

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
  const [actividad, setActividad] = useState([]);
  const [logros, setLogros] = useState([]);
  const [sigo, setSigo] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoPorMi, setBloqueadoPorMi] = useState(false);
  const [bloqueadoPorEl, setBloqueadoPorEl] = useState(false);

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

  const cargarPerfil = () => {
    setBloqueadoPorEl(false);
    setBloqueadoPorMi(false);
    setPerfil(null);
    fetch(`/api/usuarios/perfil-publico/${nombre}/`, { credentials: "include" })
      .then(res => {
        if (res.status === 403) {
          setBloqueadoPorEl(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.tu_lo_bloqueaste) {
          setBloqueadoPorMi(true);
          return;
        }
        setPerfil({
          ...data,
          avatar: data.foto || "/media/avatares/default.png",
          favoritos: Array.isArray(data.favoritos) && data.favoritos.length === 5
            ? data.favoritos
            : [...(data.favoritos || []), ...Array(5 - (data.favoritos || []).length).fill(null)],
          bio: data.bio || "",
        });
        setSigo(data.yo_sigo || false);
        setBloqueado(data.yo_lo_bloquee || false);
      })
      .catch(() => navigate("/404", { replace: true }));
  };

  useEffect(() => {
    if (cargando) return;
    if (!nombre && usuario?.username) {
      navigate(`/perfil/${usuario.username}`, { replace: true });
      return;
    }
    if (nombre) cargarPerfil();
  }, [nombre, usuario, cargando, navigate]);

  useEffect(() => {
    if (!perfil) return;
    const ids = perfil.favoritos || [];
    if (ids.every(id => !id)) {
      setFavoritosDatos([null, null, null, null, null]);
      setCargandoFavoritos(false);
      return;
    }
    setCargandoFavoritos(true);

    fetch(`/api/juegos/populares/?ids=${ids.join(",")}`)
      .then(res => res.json())
      .then(async data => {
        let juegos = ids.map(id => data.juegos.find(j => j.id === id) || null);
        for (let i = 0; i < ids.length; i++) {
          if (!juegos[i] && ids[i]) {
            try {
              const res = await fetch(`/api/juegos/buscar_id/?id=${ids[i]}`);
              if (res.ok) {
                const juego = await res.json();
                juegos[i] = juego;
              }
            } catch {}
          }
        }
        setFavoritosDatos(juegos);
      })
      .catch(() => setFavoritosDatos([null, null, null, null, null]))
      .finally(() => setCargandoFavoritos(false));
  }, [perfil]);

  useEffect(() => {
    if (!perfil?.username) return;
    fetch(`/api/actividad/${perfil.username}/`)
      .then(res => res.json())
      .then(data => setActividad(data))
      .catch(() => setActividad([]));

    fetch(`/api/actividad/logros/${perfil.username}/`)
      .then(res => res.json())
      .then(data => setLogros(data))
      .catch(() => setLogros([]));
  }, [perfil]);

  const manejarSeguir = async () => {
    const url = `/api/usuarios/${sigo ? "dejar_seguir" : "seguir"}/${nombre}/`;
    try {
      const res = await fetchAuth(url, { method: "POST" });
      if (res.ok) setSigo(!sigo);
    } catch (err) {
      console.error("Error al seguir/dejar de seguir:", err);
    }
  };

  const manejarBloqueo = async () => {
    const url = `/api/usuarios/${bloqueado ? "desbloquear" : "bloquear"}/${nombre}/`;
    try {
      const res = await fetchAuth(url, { method: "POST" });
      if (res.ok) {
        setBloqueado(!bloqueado);
        setSigo(false);
        setPerfil(null);
        if (!bloqueado) {
          setBloqueadoPorMi(true);
        } else {
          cargarPerfil();
        }
      }
    } catch (err) {
      console.error("Error al bloquear/desbloquear:", err);
    }
  };

  if (cargando || (!perfil && !bloqueadoPorMi && !bloqueadoPorEl)) {
    return <LoaderCirculo texto="Cargando perfil..." />;
  }

  if (bloqueadoPorMi) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="bg-black/40 border border-borde p-6 rounded-2xl w-full max-w-md shadow-xl mx-auto">
          <h2 className="text-2xl font-bold text-naranja mb-2">Has bloqueado a este perfil</h2>
          <p className="text-claro mb-4">Desbloquéalo si deseas volver a ver su contenido.</p>
          <button onClick={manejarBloqueo} className="px-4 py-2 bg-naranja text-black font-bold rounded-full">Desbloquear</button>
        </div>
      </div>
    );
  }

  if (bloqueadoPorEl) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="bg-black/40 border border-borde p-6 rounded-2xl w-full max-w-md shadow-xl mx-auto">
          <h2 className="text-2xl font-bold text-naranja mb-2">Este usuario te ha bloqueado</h2>
          <p className="text-claro">No puedes ver su perfil ni interactuar con él.</p>
        </div>
      </div>
    );
  }

  const esMiPerfil = perfil?.es_mi_perfil;
  const tags = perfil?.tags || ["Competitivo", "Explorador", "Cooperativo"];

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
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
          <div className="bg-black/30 backdrop-blur-sm border border-borde rounded-xl px-3 py-2 min-h-[40px] mb-2">
            <p className="text-claro text-sm">{perfil.bio || <span className="text-borde">¡No ha escrito su biografía aún!</span>}</p>
          </div>
        </div>
        {!esMiPerfil && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={manejarSeguir}
              className={`px-4 py-1 rounded ${sigo ? "bg-borde text-naranja" : "bg-naranja text-black"}`}
            >
              {sigo ? "Dejar de seguir" : "Seguir"}
            </button>
            <button
              onClick={manejarBloqueo}
              className="px-4 py-1 rounded bg-red-600 text-white"
            >
              {bloqueado ? "Desbloquear" : "Bloquear"}
            </button>
            <Reportar modelo="usuario" objectId={perfil.id} />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-8 justify-start">
        <div className="bg-black/30 backdrop-blur-md border border-borde rounded-2xl shadow flex flex-col gap-2 px-6 py-5">
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
                  <GameCard key={i} />
                )
              )}
            </div>
          )}
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-borde rounded-2xl shadow flex flex-col gap-2 px-6 py-5">
          <h2 className="font-bold text-naranja text-lg mb-2">Recompensas / Logros</h2>
          <div className="flex flex-wrap gap-2">
            {logros.length === 0 ? (
              <p className="text-borde text-sm">Aún no tiene logros.</p>
            ) : (
              logros.map((logro, i) => (
                <span
                  key={i}
                  className="bg-naranja/20 text-naranja font-semibold px-3 py-1 rounded-xl border border-naranja"
                  title={logro.descripcion || ""}
                >
                  {logro.nombre}
                </span>
              ))
            )}
          </div>
        </div>

        <ActividadReciente actividades={actividad} />
      </div>

      {modoEdicion && <EditarPerfil cerrar={() => setModoEdicion(false)} />}
      {modoFavoritos && (
        <EditarFavoritos
          favoritos={favoritosDatos}
          onGuardar={async (nuevos) => {
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
  );
}
