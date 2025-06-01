import { useRef } from "react";

export default function GameCard({ juego, onClick }) {
    const cardRef = useRef(null);
    const hovering = useRef(false);
    const target = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });
    const animationId = useRef(null);

    const coverUrl = juego.cover?.url
        ? `https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`
        : null;

    function animate() {
        // Interpolamos suavemente hacia el target
        current.current.x += (target.current.x - current.current.x) * 0.18;
        current.current.y += (target.current.y - current.current.y) * 0.18;

        if (cardRef.current) {
            const { width, height } = cardRef.current.getBoundingClientRect();
            const centerX = width / 2;
            const centerY = height / 2;
            const rotateX = -(current.current.y - centerY) / 10;
            const rotateY = (current.current.x - centerX) / 10;
            cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        }

        if (hovering.current) {
            animationId.current = requestAnimationFrame(animate);
        }
    }

    function handleMouseMove(e) {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        target.current.x = e.clientX - rect.left;
        target.current.y = e.clientY - rect.top;

        // Si la animación no está en marcha, la lanzamos
        if (!hovering.current) {
            hovering.current = true;
            animationId.current = requestAnimationFrame(animate);
        }
    }

    function handleMouseLeave() {
        hovering.current = false;
        if (animationId.current) {
            cancelAnimationFrame(animationId.current);
            animationId.current = null;
        }
        // Suaviza el regreso a posición original
        if (cardRef.current) {
            cardRef.current.style.transition = "transform 0.3s cubic-bezier(.25,.75,.45,1)";
            cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
            setTimeout(() => {
                if (cardRef.current) cardRef.current.style.transition = "";
            }, 300);
        }
        // Reset pos para próxima vez
        current.current = { x: 0, y: 0 };
        target.current = { x: 0, y: 0 };
    }

    function handleMouseEnter(e) {
        if (cardRef.current) cardRef.current.style.transition = "";
    }

    return (
        <div
            ref={cardRef}
            className="relative group rounded-lg overflow-hidden shadow-lg transition-transform duration-100 transform-gpu cursor-pointer"
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {coverUrl ? (
                <img
                    src={coverUrl}
                    alt={juego.name}
                    className="block w-full max-h-[340px] object-contain transition-transform duration-100 group-hover:scale-[1.03]"
                />
            ) : (
                <div className="w-full h-[200px] flex items-center justify-center bg-metal text-gray-300 text-sm px-2">
                    Sin portada
                </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-20">
                <h2 className="text-white text-lg font-semibold drop-shadow-md px-4 text-center">
                    {juego.name}
                </h2>
            </div>
        </div>
    );
}
