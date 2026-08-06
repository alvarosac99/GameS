export default function LoaderCirculo({ texto = "Estamos recopilando todos los datos de IGDB. Espera unos segundos." }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 w-full">
      <div className="relative flex items-center justify-center mb-4">
        <span className="sr-only">Cargando...</span>
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        {/* Círculo interior decorativo */}
        <div className="absolute w-7 h-7 rounded-full bg-background border-2 border-primary opacity-80"></div>
      </div>
      <div className="text-primary text-lg font-bold text-center animate-pulse">
        {texto}
      </div>
    </div>
  );
}
