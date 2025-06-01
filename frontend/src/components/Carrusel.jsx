import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import GameCard from "./GameCard";

export default function Carrusel({ juegos = [], onSelect = () => {} }) {
  const [index, setIndex] = useState(0);

  // Repite los juegos hasta tener 5 si la lista es menor, siempre que haya al menos uno
  const juegosDisplay =
    juegos.length === 0
      ? []
      : juegos.length >= 5
      ? juegos
      : Array.from({ length: 5 }, (_, i) => juegos[i % juegos.length]);

  function retroceder() {
    setIndex((prev) =>
      (prev - 1 + juegosDisplay.length) % juegosDisplay.length
    );
  }

  function avanzar() {
    setIndex((prev) => (prev + 1) % juegosDisplay.length);
  }

  // Prepara el array visible de 5 juegos de manera circular
  const visible = [];
  for (let i = 0; i < 5; i++) {
    visible.push(juegosDisplay[(index + i) % juegosDisplay.length]);
  }

  // Si no hay juegos, no se muestra nada
  if (juegosDisplay.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Flecha Izquierda */}
      <button
        onClick={retroceder}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 text-xl text-claro hover:text-naranja
        outline-none focus:outline-none ring-0 border-none active:outline-none active:ring-0"
        tabIndex={0}
        aria-label="Retroceder carrusel"
        style={{ boxShadow: "none" }}
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
          if (!juego?.id) return <div key={i} style={{ width: 220 }} />;
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
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 text-xl text-claro hover:text-naranja
        outline-none focus:outline-none ring-0 border-none active:outline-none active:ring-0"
        tabIndex={0}
        aria-label="Avanzar carrusel"
        style={{ boxShadow: "none" }}
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
