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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 text-xl text-foreground hover:text-primary
        border-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
        aria-label="Retroceder carrusel"
      >
        <FaChevronLeft />
      </button>

      {/* Carrusel */}
      <div
        className="flex justify-center items-center gap-2 sm:gap-4 transition-all duration-300 px-10 sm:px-14 md:px-16"
        style={{ minHeight: "300px" }}
      >
        {visible.map((juego, i) => {
          const distancia = Math.abs(i - Math.floor(visible.length / 2));
          const isCenter = distancia === 0;
          // En mobile solo se ve la tarjeta central; en sm los vecinos inmediatos; el resto solo desde md.
          const visibilidad =
            distancia === 0 ? "" : distancia === 1 ? "hidden sm:block" : "hidden md:block";
          const anchoTarjeta = "w-[150px] sm:w-[180px] md:w-[220px]";
          if (!juego?.id) return <div key={i} className={`${anchoTarjeta} ${visibilidad} shrink-0`} />;
          return (
            <div
              key={juego.id}
              className={`${anchoTarjeta} ${visibilidad} shrink-0 transition-transform duration-300 ease-in-out ${
                isCenter
                  ? "scale-110 z-10 drop-shadow-2xl"
                  : "scale-90 opacity-60 z-0"
              }`}
            >
              <GameCard juego={juego} onClick={() => onSelect(juego)} />
            </div>
          );
        })}
      </div>

      {/* Flecha Derecha */}
      <button
        onClick={avanzar}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 text-xl text-foreground hover:text-primary
        border-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
        aria-label="Avanzar carrusel"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
