// src/pages/ListaUsuarios.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { apiFetch } from "../lib/api";

export default function ListaUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLang();

    // Si la búsqueda viene de la ruta, úsala (ej: /perfiles?q=juan)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("q") || "";
        setBusqueda(query);
        buscarUsuarios(query);
    }, [location.search]);

    function buscarUsuarios(q) {
        if (!q || q.length < 2) {
            setUsuarios([]);
            return;
        }
        setCargando(true);
        apiFetch(`/usuarios/buscar/?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((data) => {
                setUsuarios(data.resultados || []);
                setError("");
            })
            .catch(() => setError("Error al cargar usuarios"))
            .finally(() => setCargando(false));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (busqueda.trim().length >= 2) {
            navigate(`/perfiles?q=${encodeURIComponent(busqueda)}`);
            buscarUsuarios(busqueda.trim());
        }
    }

    return (
        <div className="flex flex-col w-full max-w-xl mx-auto bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold mb-4 text-primary">Buscar personas</h2>
            <form onSubmit={handleSubmit} className="flex mb-6">
                <label htmlFor="lista-usuarios-busqueda" className="sr-only">
                    {t("searchUsersPlaceholder")}
                </label>
                <input
                    id="lista-usuarios-busqueda"
                    type="text"
                    placeholder={t("searchUsersPlaceholder")}
                    className="flex-1 px-3 py-2 rounded-l border border-border bg-background text-foreground focus:outline-none"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-r"
                >
                    Buscar
                </button>
            </form>

            {cargando && <div className="text-muted-foreground text-center py-6">Cargando...</div>}

            {!cargando && error && <div className="text-destructive text-center">{error}</div>}

            {!cargando && !error && usuarios.length === 0 && busqueda.length >= 2 && (
                <div className="text-muted-foreground text-center">No se encontraron usuarios.</div>
            )}

            <ul className="divide-y divide-border">
                {usuarios.map((usuario, i) => (
                    <li
                        key={usuario.username}
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-4 py-4 hover:bg-primary/10 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigate(`/perfil/${usuario.username}`)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/perfil/${usuario.username}`);
                            }
                        }}
                    >
                        <img
                            src={usuario.foto || "/media/avatares/default.png"}
                            alt=""
                            className="w-14 h-14 rounded-full border-2 border-primary object-cover"
                        />
                        <div>
                            <div className="font-bold text-foreground">{usuario.nombre}</div>
                            <div className="text-muted-foreground text-sm">@{usuario.username}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
