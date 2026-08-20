export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">ZILA CALZADOS</p>
        <h1>Catálogo digital</h1>
        <p className="intro">
          Base inicial del catálogo. La estructura ya está lista para sumar
          productos, categorías, filtros y el flujo comercial de ZILA.
        </p>
      </section>

      <section className="status" aria-label="Estado del proyecto">
        <span className="statusDot" aria-hidden="true" />
        <div>
          <strong>Proyecto inicializado</strong>
          <p>Next.js + TypeScript sobre App Router.</p>
        </div>
      </section>
    </main>
  );
}
