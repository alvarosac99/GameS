import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Diario() {
  const [usuario, setUsuario] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/usuarios/session", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUsuario(data.username);
        } else {
          navigate("/"); // si no está autenticado, lo manda al login
        }
      });
  }, []);

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
      <h1 className="text-3xl font-bold text-center">DIARIO</h1>
    </div>
  );
}
