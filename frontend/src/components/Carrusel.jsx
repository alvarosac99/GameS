import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import GameCard from "./GameCard";

export default function Carrusel({ juegos = [], onSelect = () => {} }) {
  const [index, setIndex] = useState(0);
  const visible = juegos.slice(index, index + 5);
  const puedeRetroceder = index > 0;
  const puedeAvanzar = index + 5 < juegos.length;

  function retroceder() {
    if (puedeRetroceder) setIndex((prev) => prev - 1);
  }

  function avanzar() {
    if (puedeAvanzar) setIndex((prev) => prev + 1);
  }

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Flecha Izquierda */}
      <button
        onClick={retroceder}
        disabled={!puedeRetroceder}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 text-xl text-claro hover:text-naranja disabled:opacity-30"
      >
        <FaChevronLeft />
      </button>

      {/* Carrusel */}
      <div
        className="flex justify-center items-center gap-4 transition-all duration-300 px-16"
        style={{ minHeight: "300px" }}
      >
        {visible.map((juego, i) => {
          const isCenter = i === Math.floor(visible.length / 2);
          return (
            <div
              key={juego.id}
              className={`transition-transform duration-300 ease-in-out ${
                isCenter
                  ? "scale-110 z-10 drop-shadow-2xl"
                  : "scale-90 opacity-60 z-0"
              } cursor-pointer`}
              style={{ flexShrink: 0 }}
              onClick={() => onSelect(juego)}
            >
              <GameCard juego={juego} />
            </div>
          );
        })}
      </div>

      {/* Flecha Derecha */}
      <button
        onClick={avanzar}
        disabled={!puedeAvanzar}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 text-xl text-claro hover:text-naranja disabled:opacity-30"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
