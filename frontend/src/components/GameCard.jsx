export default function GameCard({ juego, onClick }) {
    const coverUrl = juego.cover?.url
        ? `https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`
        : null;

    return (
        <div
            className="relative group rounded-lg overflow-hidden shadow-lg transition-transform duration-50 transform-gpu cursor-pointer"
            onClick={onClick}
            onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = -(y - centerY) / 10;
                const rotateY = (x - centerX) / 10;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
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
        </div>
    );
}
