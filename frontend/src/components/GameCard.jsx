import { useRef } from "react";

import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function GameCard({ juego, onClick, tiempo = 0, valoracion = null }) {
    const rectRef = useRef(null);
    const rafRef = useRef(null);
    const cardRef = useRef(null);

    if (!juego) {
        // Tarjeta vacía si no hay juego
        return (
            <div
                className="relative rounded-lg overflow-hidden shadow-lg bg-borde flex flex-col items-center justify-center h-[200px] min-h-[200px] transition-transform duration-50 border-2 border-dashed border-borde text-gray-400 cursor-default select-none"
                style={{
                    minHeight: 200,
                    height: 200,
                    width: "100%",
                }}
            >
                <span className="text-2xl font-bold mb-2 opacity-60">Vacío</span>
            </div>
        );
    }

    const coverUrl = juego.cover?.url
        ? `https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`
        : null;

    return (
        <div
            ref={cardRef}
            className="relative group rounded-lg overflow-hidden shadow-lg transition-transform duration-50 transform-gpu cursor-pointer"
            style={{ willChange: "transform" }}
            onClick={onClick}
            onMouseEnter={(e) => {
                rectRef.current = e.currentTarget.getBoundingClientRect();
            }}
            onMouseMove={(e) => {
                const card = cardRef.current;
                if (!card) return;
                if (!rectRef.current) rectRef.current = card.getBoundingClientRect();
                const { left, top, width, height } = rectRef.current;
                const x = e.clientX - left;
                const y = e.clientY - top;
                const centerX = width / 2;
                const centerY = height / 2;
                const factorX = width / 6;
                const factorY = height / 6;
                const rotateX = Math.max(Math.min(-(y - centerY) / factorY, 15), -15);
                const rotateY = Math.max(Math.min((x - centerX) / factorX, 15), -15);
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(() => {
                    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                });
            }}
            onMouseLeave={() => {
                rectRef.current = null;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                if (cardRef.current) {
                    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
                }
            }}
        >
            {coverUrl ? (
                <img
                    src={coverUrl}
                    alt={juego.name}
                    className="block w-full max-h-[340px] object-contain transition-transform duration-50 group-hover:scale-[1.03]"
                />
            ) : (
                <div className="w-full h-[200px] flex items-center justify-center bg-metal text-gray-300 text-sm px-2">
                    Sin portada
                </div>
            )}

            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-50 z-10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-50 z-20">
                <h2 className="text-white text-lg font-semibold drop-shadow-md px-4 text-center">
                    {juego.name}
                </h2>
            </div>

            {tiempo > 0 && (
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded z-30">
                    {(tiempo / 3600).toFixed(1)}h
                </div>
            )}

            {valoracion != null && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 flex justify-center gap-0.5 py-1 translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-20">
                    {Array.from({ length: 5 }, (_, i) => {
                        const val = i + 1;
                        return valoracion >= val ? (
                            <FaStar key={i} className="text-naranja" />
                        ) : valoracion >= val - 0.5 ? (
                            <FaStarHalfAlt key={i} className="text-naranja" />
                        ) : (
                            <FaRegStar key={i} className="text-borde" />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
