export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-roca-gold">Rocatrol AI</h1>
        <p className="text-xl text-white/80">
          Cotizaciones bilingües en 60 segundos
        </p>
        <p className="text-sm text-white/50">
          Sube tu plano. Recibe tu cotización profesional. Sin Excel.
        </p>
        <div className="pt-8">
          <span className="inline-block px-4 py-2 rounded-full bg-roca-gold/10 text-roca-gold text-sm border border-roca-gold/30">
            🚧 En construcción — MVP en desarrollo
          </span>
        </div>
      </div>
    </main>
  );
}
