import React from "react";

export default function PerPageSelector({
  opciones,
  valor,
  onCambiarPreset,
  onCambiarPersonalizado,
  etiquetaOtro = "Otro…",
  etiquetaMostrar = "Mostrar",
  etiquetaSufijo = "/página",
  tituloPersonalizado = "Cantidad personalizada",
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={opciones.includes(valor) ? valor : ""}
        onChange={onCambiarPreset}
        className="bg-card text-foreground border border-border rounded px-3 py-1"
      >
        <option value="">{etiquetaOtro}</option>
        {opciones.map((n) => (
          <option key={n} value={n}>
            {etiquetaMostrar} {n}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={500}
        value={valor}
        onChange={onCambiarPersonalizado}
        className="w-20 bg-card text-foreground border border-border rounded px-2 py-1 text-center"
        title={tituloPersonalizado}
      />
      <span className="text-xs text-muted-foreground">{etiquetaSufijo}</span>
    </div>
  );
}
