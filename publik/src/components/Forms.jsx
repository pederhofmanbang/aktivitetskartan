import React, { useState } from "react";
import { submitForslag } from "../api.js";

function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  return { values, set, status, setStatus, busy, setBusy };
}

export function CandidateForm() {
  const f = useForm({
    namn: "", organisation: "", beskrivning: "", varfor: "", kalla: "",
    foreslagenAv: "", epost: "", webbplats: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true);
    f.setStatus(null);
    try {
      await submitForslag("kandidat", f.values);
      f.setStatus({ ok: true, msg: "Tack! Förslaget är inskickat och prövas manuellt innan det kan bli ett kort på kartan." });
    } catch (err) {
      f.setStatus({ ok: false, msg: err.message });
    } finally {
      f.setBusy(false);
    }
  };

  return (
    <div className="container formpage">
      <div className="formpage__intro">
        <div>
          <h1>Föreslå ett nytt initiativ</h1>
          <p>
            Saknas ett hälsodatainitiativ på kartan? Beskriv det här. Alla
            förslag prövas manuellt innan de läggs till.
          </p>
        </div>
        <img src="/figurer/berattaren.png" alt="" loading="lazy" />
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          Initiativets namn
          <input required value={f.values.namn} onChange={f.set("namn")} maxLength={300} />
        </label>
        <label>
          Ansvarig organisation
          <input value={f.values.organisation} onChange={f.set("organisation")} maxLength={300} />
        </label>
        <label>
          Vad är initiativet?
          <textarea
            required
            value={f.values.beskrivning}
            onChange={f.set("beskrivning")}
            maxLength={4000}
            placeholder="Beskriv kort vad initiativet gör och vilka hälsodata det rör."
          />
        </label>
        <label>
          Varför hör det hemma på kartan? <span className="opt">(frivilligt)</span>
          <textarea value={f.values.varfor} onChange={f.set("varfor")} maxLength={2000} />
        </label>
        <label>
          Källa eller länk <span className="opt">(frivilligt men värdefullt)</span>
          <input value={f.values.kalla} onChange={f.set("kalla")} maxLength={500} />
        </label>
        <div className="row2">
          <label>
            Ditt namn <span className="opt">(frivilligt)</span>
            <input value={f.values.foreslagenAv} onChange={f.set("foreslagenAv")} maxLength={200} />
          </label>
          <label>
            E-post <span className="opt">(frivilligt — om du vill ha återkoppling)</span>
            <input type="email" value={f.values.epost} onChange={f.set("epost")} maxLength={200} />
          </label>
        </div>
        <label className="hp" aria-hidden="true">
          Lämna fältet tomt
          <input tabIndex={-1} autoComplete="off" value={f.values.webbplats} onChange={f.set("webbplats")} />
        </label>
        <div>
          <button className="btn btn--primary" disabled={f.busy}>
            {f.busy ? "Skickar …" : "Skicka förslaget"}
          </button>
        </div>
        {f.status && (
          <p className={"form__status " + (f.status.ok ? "form__status--ok" : "form__status--err")} role="status">
            {f.status.msg}
          </p>
        )}
      </form>
    </div>
  );
}

export function ReviewerForm() {
  const f = useForm({
    namn: "", epost: "", organisation: "", roll: "", omraden: "", meddelande: "", webbplats: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true);
    f.setStatus(null);
    try {
      await submitForslag("granskare", f.values);
      f.setStatus({ ok: true, msg: "Tack för din anmälan! Vi hör av oss när det finns initiativ inom ditt område att gå igenom." });
    } catch (err) {
      f.setStatus({ ok: false, msg: err.message });
    } finally {
      f.setBusy(false);
    }
  };

  return (
    <div className="container formpage">
      <div className="formpage__intro">
        <div>
          <h1>Bli kvalitetssäkrare</h1>
          <p>
            En stor del av kartan är AI-sammanställd och behöver mänskliga ögon.
            Kan ditt område? Anmäl dig så matchar vi dig mot initiativ att gå
            igenom — dina genomgångar lyfter dem till nivån{" "}
            <strong>Kurerad</strong>.
          </p>
        </div>
        <img src="/figurer/granskaren.png" alt="" loading="lazy" />
      </div>
      <form className="form" onSubmit={submit}>
        <div className="row2">
          <label>
            Namn
            <input required value={f.values.namn} onChange={f.set("namn")} maxLength={200} />
          </label>
          <label>
            E-post
            <input type="email" required value={f.values.epost} onChange={f.set("epost")} maxLength={200} />
          </label>
        </div>
        <div className="row2">
          <label>
            Organisation
            <input value={f.values.organisation} onChange={f.set("organisation")} maxLength={300} />
          </label>
          <label>
            Roll <span className="opt">(frivilligt)</span>
            <input value={f.values.roll} onChange={f.set("roll")} maxLength={200} />
          </label>
        </div>
        <label>
          Vilka initiativ eller områden kan du?
          <textarea
            required
            value={f.values.omraden}
            onChange={f.set("omraden")}
            maxLength={2000}
            placeholder="T.ex. kvalitetsregister inom onkologi, genomikinfrastruktur, hälsodatajuridik …"
          />
        </label>
        <label>
          Meddelande <span className="opt">(frivilligt)</span>
          <textarea value={f.values.meddelande} onChange={f.set("meddelande")} maxLength={2000} />
        </label>
        <label className="hp" aria-hidden="true">
          Lämna fältet tomt
          <input tabIndex={-1} autoComplete="off" value={f.values.webbplats} onChange={f.set("webbplats")} />
        </label>
        <div>
          <button className="btn btn--primary" disabled={f.busy}>
            {f.busy ? "Skickar …" : "Anmäl mig"}
          </button>
        </div>
        {f.status && (
          <p className={"form__status " + (f.status.ok ? "form__status--ok" : "form__status--err")} role="status">
            {f.status.msg}
          </p>
        )}
      </form>
    </div>
  );
}
