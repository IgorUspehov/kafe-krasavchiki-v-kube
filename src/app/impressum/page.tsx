export default function ImpressumPage() {
  return (
    <main className="min-h-svh bg-white text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Impressum</h1>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Angaben gemäß § 5 TMG:</h2>
          <p className="leading-relaxed text-slate-700">
            Web Studio Ihor Kriazhev München
            <br />
            Inhaber: Ihor Kriazhev
            <br />
            Lotte-Branz-Straße 2
            <br />
            80939 München
            <br />
            Deutschland
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Kontakt:</h2>
          <p className="leading-relaxed text-slate-700">
            E-Mail:{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
            <br />
            Web:{" "}
            <a
              href="https://webstudio-muenchen.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              webstudio-muenchen.com
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
          </h2>
          <p className="leading-relaxed text-slate-700">
            Ihor Kriazhev
            <br />
            Lotte-Branz-Straße 2
            <br />
            80939 München
          </p>
        </section>
      </article>
    </main>
  );
}
