export default function DatenschutzPage() {
  return (
    <main className="min-h-svh bg-white text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Datenschutzerklärung</h1>
        <p className="mt-4 leading-relaxed text-slate-700">
          Web Studio Ihor Kriazhev München
          <br />
          webstudio-muenchen.com
          <br />
          Stand: August 2026
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">1. Verantwortlicher</h2>
          <p className="leading-relaxed text-slate-700">
            Verantwortlicher für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung
            (DSGVO):
          </p>
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
            <br />
            E-Mail:{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p className="leading-relaxed text-slate-700">
            Wir erheben und verarbeiten personenbezogene Daten unserer Kunden (Geschäftsinhaber)
            sowie der Endkunden unserer Kunden, soweit dies für die Erbringung unserer
            Dienstleistungen erforderlich ist.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2.1 Daten beim Besuch der Website</h2>
          <p className="leading-relaxed text-slate-700">
            Beim Aufrufen unserer Website webstudio-muenchen.com werden durch den Hosting-Provider
            automatisch technische Daten erfasst und in Server-Logfiles gespeichert:
          </p>
          <ul className="list-disc space-y-1 pl-6 leading-relaxed text-slate-700">
            <li>IP-Adresse,</li>
            <li>Datum und Uhrzeit der Anfrage,</li>
            <li>aufgerufene Seite/URL,</li>
            <li>verwendeter Browser und Betriebssystem,</li>
            <li>Referrer-URL.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2.2 Daten im Fragebogen (Kundendaten)</h2>
          <p className="leading-relaxed text-slate-700">Wenn Sie unseren Fragebogen ausfüllen, erheben wir:</p>
          <ul className="list-disc space-y-1 pl-6 leading-relaxed text-slate-700">
            <li>Name und Firmenbezeichnung,</li>
            <li>E-Mail-Adresse,</li>
            <li>Telefonnummer und WhatsApp-Nummer,</li>
            <li>Postleitzahl, Stadt, Straße,</li>
            <li>Branche und Unternehmensbeschreibung,</li>
            <li>ausgewählte Sprache.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2.3 Daten im CRM und Buchungssystem (Endkundendaten)</h2>
          <p className="leading-relaxed text-slate-700">
            Unsere Kunden geben Daten ihrer eigenen Kunden in das CRM- und Buchungssystem ein, z. B.:
          </p>
          <ul className="list-disc space-y-1 pl-6 leading-relaxed text-slate-700">
            <li>Name,</li>
            <li>Telefonnummer,</li>
            <li>E-Mail-Adresse,</li>
            <li>Termindaten,</li>
            <li>Leistungswünsche.</li>
          </ul>
          <p className="leading-relaxed text-slate-700">
            Diese Daten werden ausschließlich im Auftrag unseres Kunden verarbeitet (siehe § 8
            Auftragsverarbeitung).
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2.4 Zahlungsdaten</h2>
          <p className="leading-relaxed text-slate-700">
            Zahlungsdaten werden nicht von uns, sondern von unserem Zahlungsdienstleister Polar
            Software, Inc. erhoben und verarbeitet. Wir haben keinen Zugriff auf vollständige
            Zahlungsdaten.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">3. Zwecke und Rechtsgrundlagen</h2>
          <p className="leading-relaxed text-slate-700">
            Die Verarbeitung erfolgt auf folgenden Rechtsgrundlagen gemäß Art. 6 DSGVO:
          </p>
          <ul className="list-disc space-y-2 pl-6 leading-relaxed text-slate-700">
            <li>
              Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung): Zur Erstellung der Website,
              Bereitstellung des CRM-Systems und Abwicklung des Abonnements.
            </li>
            <li>
              Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung): Erfüllung steuerlicher und
              handelsrechtlicher Aufbewahrungspflichten.
            </li>
            <li>
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse): Sicherstellung der IT-Sicherheit,
              Fehleranalyse, Schutz vor Missbrauch.
            </li>
            <li>
              Art. 6 Abs. 1 lit. a DSGVO (Einwilligung): Bei Verwendung von Analyse-Cookies oder
              Marketingmaßnahmen.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">4. Weitergabe von Daten / Empfänger</h2>
          <ul className="list-disc space-y-1 pl-6 leading-relaxed text-slate-700">
            <li>Polar Software, Inc. (Merchant of Record): Zahlungsabwicklung.</li>
            <li>Railway / Netlify: Hosting.</li>
            <li>Cloudflare: CDN und Sicherheit.</li>
            <li>Google Ireland Limited: Google Maps, reCAPTCHA (sofern eingebunden).</li>
            <li>Twilio / Meta Platforms Ireland Ltd.: SMS und WhatsApp (sofern aktiviert).</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">5. Datenübermittlung in Drittländer (USA)</h2>
          <p className="leading-relaxed text-slate-700">
            Einige Dienstleister haben ihren Sitz in den USA (Polar, Railway, Netlify, Cloudflare,
            Google). Die Übermittlung erfolgt auf Grundlage der Standardvertragsklauseln (SCC) gemäß
            Art. 46 Abs. 2 lit. c DSGVO oder des EU-US Data Privacy Framework.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">6. Speicherdauer</h2>
          <ul className="list-disc space-y-1 pl-6 leading-relaxed text-slate-700">
            <li>
              Demo-Daten: 48 Stunden, wenn kein Abonnement abgeschlossen wird.
            </li>
            <li>
              Kundendaten: Dauer des Vertrags + gesetzliche Aufbewahrungsfristen (10 Jahre).
            </li>
            <li>Endkundendaten: Nach Anweisung des Kunden, nach Vertragsende Löschung.</li>
            <li>Server-Logfiles: 30 Tage.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">7. Ihre Rechte</h2>
          <p className="leading-relaxed text-slate-700">
            Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
            Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21).
          </p>
          <p className="leading-relaxed text-slate-700">
            Kontakt:{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">8. Auftragsverarbeitung</h2>
          <p className="leading-relaxed text-slate-700">
            Für Endkundendaten im CRM handelt es sich um Auftragsverarbeitung gemäß Art. 28 DSGVO.
            Unser Kunde ist Verantwortlicher, wir sind Auftragsverarbeiter. Ein AVV wird mit jedem
            Kunden geschlossen.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">9. Cookies</h2>
          <p className="leading-relaxed text-slate-700">
            Technisch notwendige Cookies werden auf Grundlage von § 25 Abs. 2 TTDSG gesetzt.
            Analyse-Cookies nur mit Einwilligung gemäß § 25 Abs. 1 TTDSG.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">10. Widerspruchsrecht</h2>
          <p className="leading-relaxed text-slate-700">
            Per E-Mail an{" "}
            <a href="mailto:list.uspeh2022@gmail.com" className="text-blue-600 underline">
              list.uspeh2022@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">11. Änderungen</h2>
          <p className="leading-relaxed text-slate-700">
            Aktuelle Version unter webstudio-muenchen.com/datenschutz.
          </p>
        </section>
      </article>
    </main>
  );
}
