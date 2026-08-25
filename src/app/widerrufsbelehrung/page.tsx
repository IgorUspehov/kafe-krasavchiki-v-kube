export default function WiderrufsbelehrungPage() {
  return (
    <main className="min-h-svh bg-white text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Widerrufsbelehrung</h1>
        <p className="mt-4 leading-relaxed text-slate-700">
          Web Studio Ihor Kriazhev München
          <br />
          webstudio-muenchen.com
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Widerrufsrecht</h2>
          <p className="leading-relaxed text-slate-700">
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
            widerrufen.
          </p>
          <p className="leading-relaxed text-slate-700">
            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
          </p>
          <p className="leading-relaxed text-slate-700">
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Web Studio Ihor Kriazhev München,
            Lotte-Branz-Straße 2, 80939 München, E-Mail:{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
            ) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine
            E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können
            dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben
            ist.
          </p>
          <p className="leading-relaxed text-slate-700">
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung
            des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Folgen des Widerrufs</h2>
          <p className="leading-relaxed text-slate-700">
            Wenn Sie diesen Vertrag widerrufen, erfolgt die Rückerstattung über den jeweiligen
            Zahlungsabwickler (Merchant of Record). Für die Rückzahlung wird dasselbe Zahlungsmittel
            verwendet, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit
            Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen
            dieser Rückzahlung Entgelte berechnet.
          </p>
          <p className="leading-relaxed text-slate-700">
            Wurde die Leistung auf ausdrücklichen Wunsch des Kunden vor Ablauf der Widerrufsfrist
            begonnen, gelten die gesetzlichen Regelungen zum Wertersatz.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">MUSTER-WIDERRUFSFORMULAR</h2>
          <p className="leading-relaxed text-slate-700">
            (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden
            Sie es zurück.)
          </p>
          <p className="leading-relaxed text-slate-700">
            An:
            <br />
            Web Studio Ihor Kriazhev München
            <br />
            Lotte-Branz-Straße 2
            <br />
            80939 München
            <br />
            E-Mail:{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
          </p>
          <p className="leading-relaxed text-slate-700">
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die
            Erbringung der folgenden Dienstleistung:
          </p>
          <p className="leading-relaxed text-slate-700">
            Bestellt am (*): ___________________
            <br />
            Name des/der Verbraucher(s): ___________________
            <br />
            Anschrift: ___________________
            <br />
            Unterschrift des/der Verbraucher(s) (nur bei Papierversion): ___________________
            <br />
            Datum: ___________________
          </p>
          <p className="leading-relaxed text-slate-700">(*) Unzutreffendes streichen</p>
        </section>
      </article>
    </main>
  );
}
