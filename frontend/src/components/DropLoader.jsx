export default function DropLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-modal">
      <div className="relative w-0 h-0">
        <div className="ripple" />
      </div>
    </div>
  );
}
