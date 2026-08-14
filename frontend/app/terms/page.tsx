"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-[-4rem] top-24 h-64 w-64 rounded-full bg-emerald-400/16 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-400/14 blur-[140px]" />

      <div className="relative mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Términos y Condiciones</p>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Reglas claras para una comunidad seria.</h1>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="panel p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Aceptación de los términos</h2>
            <p className="text-slate-300 leading-7">
              Al crear una cuenta o usar Capital Fourge (&ldquo;la Plataforma&rdquo;), aceptas estos Términos y la
              <Link href="/privacy" className="text-emerald-200 hover:underline">Política de Privacidad</Link>.
              Si no estás de acuerdo, no uses el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Naturaleza del servicio</h2>
            <ul className="space-y-3 text-slate-300 leading-7 list-disc list-inside">
              <li>Capital Fourge es una plataforma <strong>educativa y de simulación</strong>. No es un bróker, asesor financiero ni gestor de fondos.</li>
              <li>Todas las operaciones son <strong>simuladas</strong> (paper trading). No hay dinero real en riesgo ni ganancias reales.</li>
              <li>Los datos de mercado son informativos; pueden tener latencia o discrepancias respecto a mercados reales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Cuentas y acceso</h2>
            <ul className="space-y-3 text-slate-300 leading-7 list-disc list-inside">
              <li>Una cuenta por persona. No compartas credenciales.</li>
              <li>Eres responsable de la seguridad de tu contraseña y de toda actividad en tu cuenta.</li>
              <li>Nos reservamos el derecho a suspender o eliminar cuentas por abuso, fraude, automatización no autorizada o violación de estos términos.</li>
              <li>Edad mínima: 18 años (o mayoría de edad en tu jurisdicción).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Propiedad intelectual</h2>
            <p className="text-slate-300 leading-7 mb-3">
              La Plataforma, su código, diseño, contenidos educativos, estrategias de ejemplo y marca &ldquo;Capital Fourge&rdquo; son propiedad nuestra o licenciada.
            </p>
            <ul className="space-y-2 text-slate-300 leading-7 list-disc list-inside">
              <li>Puedes usar la plataforma para tu aprendizaje personal.</li>
              <li>No puedes copiar, redistribuir, ingeniería inversa, ni crear obras derivadas del software o contenido protegido.</li>
              <li>Tus estrategias y notas personales son tuyas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Uso aceptable</h2>
            <p className="text-slate-300 leading-7 mb-3">No está permitido:</p>
            <ul className="space-y-2 text-slate-300 leading-7 list-disc list-inside">
              <li>Accesos automatizados (bots, scrapers) sin autorización escrita.</li>
              <li>Intentos de vulnerar seguridad, inyectar código, o probar vulnerabilidades.</li>
              <li>Uso para fines ilegales, lavado de dinero, o suplantación de identidad.</li>
              <li>Compartir credenciales de API de brokers reales dentro de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Descargo de responsabilidad</h2>
            <p className="text-slate-300 leading-7 mb-3">
              <strong>LA PLATAFORMA SE PROPORCIONA &ldquo;TAL CUAL&rdquo; SIN GARANTÍAS DE NINGÚN TIPO.</strong>
            </p>
            <ul className="space-y-2 text-slate-300 leading-7 list-disc list-inside">
              <li>No garantizamos disponibilidad ininterrumpida, ausencia de errores, ni exactitud de datos de mercado.</li>
              <li>Los resultados simulados <strong>no predicen</strong> rendimiento real. El trading con dinero real conlleva riesgo de pérdida total.</li>
              <li>No somos responsables por decisiones tomadas basadas en la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Limitación de responsabilidad</h2>
            <p className="text-slate-300 leading-7">
              En la medida máxima permitida por ley, Capital Fourge no será responsable por daños indirectos, incidentales, consecuentes, pérdida de beneficios, datos u oportunidades, aun si fuimos advertidos de la posibilidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Suspensión y terminación</h2>
            <p className="text-slate-300 leading-7 mb-3">
              Podemos suspender o terminar el acceso inmediatamente por incumplimiento material. Tú puedes cerrar tu cuenta en cualquier momento desde Configuración.
            </p>
            <p className="text-slate-300 leading-7">
              Al terminar: se anonimizan datos personales según nuestra Política de Privacidad; las estrategias y notas se eliminan tras 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Ley aplicable y jurisdicción</h2>
            <p className="text-slate-300 leading-7">
              Estos términos se rigen por la ley de la República Argentina. Controversias se someten a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, sin perjuicio de los derechos del consumidor en su domicilio (UE, Argentina, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Cambios en los términos</h2>
            <p className="text-slate-300 leading-7 mb-3">
              Podemos modificar estos términos. Notificaremos cambios materiales con 30 días de antelación por email y banner en la plataforma. El uso continuado implica aceptación.
            </p>
            <p className="text-slate-300 leading-7">
              Última actualización: <time dateTime="2025-07-29">29 de julio de 2025</time>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Contacto</h2>
            <p className="text-slate-300 leading-7">
              Preguntas legales: <a href="mailto:hola@capitalfourge.com" className="text-emerald-200 hover:underline">hola@capitalfourge.com</a>
            </p>
          </section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-medium text-white transition hover:text-emerald-200">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    </main>
  );
}