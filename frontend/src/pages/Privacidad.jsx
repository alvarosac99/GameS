export default function Privacidad() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-foreground space-y-6">
      <h1 className="text-3xl font-bold">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground">Última actualización: 24 de junio de 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">1. Datos que recopilamos</h2>
        <p>
          Al registrarte recopilamos tu nombre de usuario, dirección de correo electrónico y
          contraseña (almacenada de forma cifrada). Durante el uso de la plataforma también
          almacenamos tu biblioteca de juegos, valoraciones, comentarios, entradas de diario,
          sesiones de juego y preferencias de perfil.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">2. Uso de los datos</h2>
        <p>Utilizamos tus datos para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Gestionar tu cuenta y autenticación.</li>
          <li>Mostrar tu perfil público a otros usuarios.</li>
          <li>Proporcionar funcionalidades de la plataforma (biblioteca, diario, planificaciones).</li>
          <li>Enviar notificaciones dentro de la aplicación.</li>
          <li>Mejorar la seguridad y prevenir abusos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">3. Protección contra bots y abuso</h2>
        <p>
          Utilizamos <strong>Cloudflare Turnstile</strong> para proteger la plataforma contra
          bots y tráfico malicioso. Turnstile puede recopilar datos de interacción del navegador
          para verificar que eres una persona real, sin necesidad de resolver CAPTCHAs.
        </p>
        <p>
          Este servicio está sujeto a la{" "}
          <a
            href="https://www.cloudflare.com/turnstile-privacy-notice/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Política de Privacidad de Cloudflare Turnstile
          </a>
          {" "}y los{" "}
          <a
            href="https://www.cloudflare.com/website-terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Términos de Servicio de Cloudflare
          </a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">4. Cookies</h2>
        <p>
          Utilizamos cookies esenciales para mantener tu sesión iniciada y para la protección
          CSRF. No utilizamos cookies de seguimiento ni publicidad.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">5. Compartir datos con terceros</h2>
        <p>
          No vendemos ni compartimos tus datos personales con terceros, salvo los servicios
          técnicos necesarios para el funcionamiento de la plataforma:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cloudflare</strong> — CDN, seguridad y Turnstile.</li>
          <li><strong>IGDB (Twitch/Amazon)</strong> — datos de catálogo de videojuegos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">6. Tus derechos</h2>
        <p>
          Puedes acceder, modificar o eliminar tus datos personales en cualquier momento desde
          la sección de ajustes de tu perfil. Para solicitar la eliminación completa de tu cuenta,
          contacta con nosotros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-primary">7. Contacto</h2>
        <p>
          Para cualquier consulta sobre privacidad, escríbenos a{" "}
          <a href="mailto:sebas@zenithseed.dev" className="text-primary hover:underline">
            sebas@zenithseed.dev
          </a>.
        </p>
      </section>
    </div>
  );
}
