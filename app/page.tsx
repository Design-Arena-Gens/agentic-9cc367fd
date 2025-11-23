import { Presenter } from "@/components/Presenter";

export default function Page() {
  return (
    <div>
      <header className="container header">
        <div className="brand">
          <span className="brand-badge">SW</span>
          SmartWelcome
          <span className="tag">Video Generator</span>
        </div>
      </header>

      <main className="container">
        <section className="hero section">
          <div>
            <div className="tag">smartwelcome.de</div>
            <h1 className="h1">Erstellen Sie ein Pr?sentationsvideo mit virtueller Moderatorin</h1>
            <p className="lead">Nutzen Sie Mikrofon oder Ger?te?TTS, zeichnen Sie den Tab auf und laden Sie Ihr WebM?Video herunter ? ideal f?r Landingpages, Demos und Onboarding.</p>
            <div className="cta-row">
              <a href="#builder" className="button">Video erstellen</a>
              <a href="https://smartwelcome.de" className="button secondary" target="_blank" rel="noreferrer">Website ?ffnen</a>
            </div>
          </div>
          <div className="card">
            <div style={{ display: "grid", gap: 12 }}>
              <div className="label">So funktioniert?s</div>
              <ol style={{ margin: 0, paddingLeft: 20, color: "#334155" }}>
                <li>Geben Sie den deutschen Text ein oder ?bernehmen Sie die Vorlage.</li>
                <li>W?hlen Sie Mikrofon oder TTS (falls verf?gbar).</li>
                <li>W?hlen Sie ?Tab aufnehmen? und im Dialog ?Dieser Tab?.</li>
                <li>Klicken Sie auf ?Start? ? danach ?Stop? ? und laden Sie das Video.</li>
              </ol>
              <div className="small">Hinweis: Die Canvas?Aufnahme speichert das Bild ohne Ton.</div>
            </div>
          </div>
        </section>

        <section id="builder" className="section">
          <Presenter />
        </section>
      </main>

      <footer className="footer">
        ? {new Date().getFullYear()} SmartWelcome ? Demo?Generator
      </footer>
    </div>
  );
}
