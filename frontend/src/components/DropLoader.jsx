export default function DropLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* 
        Contenedor relativo para posicionar 
        la gota y el ripple uno encima de otro 
      */}
      <div className="relative w-0 h-0">
        <div className="ripple" />
      </div>
    </div>
  );
}
