"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Política de Privacidad</p>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Protegemos tus datos con transparencia.</h1>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="panel p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Responsable del tratamiento</h2>
            <p className="text-slate-300 leading-7">
              Capital Fourge (en adelante, &ldquo;la Plataforma&rdquo;), con domicilio en Buenos Aires, Argentina,
              correo de contacto: <a href="mailto:hola@capitalfourge.com" className="text-emerald-200 hover:underline">hola@capitalfourge.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Datos que recopilamos</h2>
            <ul className="space-y-3 text-slate-300 leading-7 list-disc list-inside">
              <li><strong>Datos de cuenta:</strong> email, nombre de usuario, contraseña hasheada.</li>
              <li><strong>Datos de uso:</strong> actividad en la plataforma, estrategias creadas, operaciones simuladas.</li>
              <li><strong>Datos técnicos:</strong> IP, user-agent, logs de seguridad (para prevención de fraude).</li>
              <li><strong>No recopilamos:</strong> datos bancarios reales, claves de API de brokers, documentos de identidad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Finalidad y base legal</h2>
            <ul className="space-y-3 text-slate-300 leading-7 list-disc list-inside">
              <li>Prestación del servicio educativo y de simulación (ejecución de contrato).</li>
              <li>Seguridad y prevención de abuso (interés legítimo).</li>
              <li>Comunicaciones operativas (confirmaciones, alertas de cuenta).</li>
              <li>Analítica agregada para mejorar la plataforma (consentimiento vía banner).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Compartición y transferencias</h2>
            <p className="text-slate-300 leading-7 mb-3">
              No vendemos tus datos. Solo se comparten con:
            </p>
            <ul className="space-y-2 text-slate-300 leading-7 list-disc list-inside">
              <li>Proveedores de infraestructura (Vercel, Railway, Supabase) bajo DPA/SCC.</li>
              <li>Autoridades competentes si lo exige la ley.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Retención</h2>
            <p className="text-slate-300 leading-7">
              Datos de cuenta: mientras la cuenta esté activa + 2 años de inactividad.<br />
              Logs de seguridad: 12 meses.<br />
              Analítica agregada: anonimizada a los 24 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Tus derechos (GDPR / Ley 25.326)</h2>
            <ul className="space-y-2 text-slate-300 leading-7 list-disc list-inside">
              <li>Acceso, rectificación, supresión, limitación, portabilidad.</li>
              <li>Oposición al tratamiento basado en interés legítimo.</li>
              <li>Retirar consentimiento (analítica) en cualquier momento.</li>
              <li>Reclamación ante autoridad de control (AAIP en Argentina, AEPD en España).</li>
            </ul>
            <p className="mt-3 text-slate-300">Ejercicio: escribe a <a href="mailto:hola@capitalfourge.com" className="text-emerald-200 hover:underline">hola@capitalfourge.com</a> con asunto &ldquo;Derechos ARCO / GDPR&rdquo;.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Seguridad</h2>
            <p className="text-slate-300 leading-7">
              HTTPS obligatorio, contraseñas con bcrypt (costo 12), JWT con rotación de refresh tokens,
              rate-limiting en autenticación, headers de seguridad (CSP, HSTS, X-Frame-Options).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Cookies y analítica</h2>
            <p className="text-slate-300 leading-7 mb-3">
              Usamos cookies estrictamente necesarias (sesión, CSRF) y, con tu consentimiento,
              <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" className="text-emerald-200 hover:underline">Vercel Analytics</a>
              (sin cookies, privacy-first) para métricas agregadas de visita. Puedes rechazar la analítica en el banner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Cambios en esta política</h2>
            <p className="text-slate-300 leading-7">
              Notificaremos cambios materiales por email y/o banner en la plataforma con 30 días de antelación.
              Última actualización: <time dateTime="2025-07-29">29 de julio de 2025</time>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Contacto</h2>
            <p className="text-slate-300 leading-7">
              Dudas o ejercicios de derechos: <a href="mailto:hola@capitalfourge.com" className="text-emerald-200 hover:underline">hola@capitalfourge.com</a>.
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