export default function TarjetaSkeleton() {
    return (
        <div className="relative group rounded-lg overflow-hidden shadow-lg bg-metal bg-opacity-50 h-[340px] flex flex-col justify-between animate-shimmer">
            {/* Imagen shimmer */}
            <div className="h-full w-full bg-gradient-to-r from-[#ffffff80] via-[#e0e0e090] to-[#ffffff80] animate-shimmer" />
        </div>
    );
}