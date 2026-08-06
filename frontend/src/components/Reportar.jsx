import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLang } from "@/context/LangContext";

export default function Reportar({ modelo, objectId }) {
  const { fetchAuth } = useAuth();
  const { t } = useLang();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");
    try {
      const res = await fetchAuth(`/reportes/${modelo}/${objectId}/`, {
        method: "POST",
        body: JSON.stringify({ titulo, motivo }),
      });
      if (!res.ok) throw new Error("Error al enviar el reporte");
      setMensaje("Reporte enviado");
      setTitulo("");
      setMotivo("");
      setTimeout(() => setAbierto(false), 1500);
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="text-xs text-destructive hover:underline"
      >
        Reportar
      </button>
      {abierto && (
        <div className="fixed inset-0 z-modal bg-black/70 flex items-center justify-center px-4 py-8">
          <form
            onSubmit={enviar}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-bold text-primary">Enviar reporte</h2>
            {mensaje && <div className="text-destructive">{mensaje}</div>}
            <Input
              placeholder={t("reportTitlePlaceholder")}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-background border-border text-foreground"
              required
            />
            <Textarea
              placeholder={t("reportDescriptionPlaceholder")}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="bg-background border-border text-foreground"
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
