import React from "react";
import { DATA, GRANSKNING } from "../model.js";
import { Link } from "../router.jsx";
import { GranskningBadge } from "./Badge.jsx";

export default function About() {
  return (
    <div className="container aboutpage">
      <h1>Om Hälsodatakartan</h1>
      <p>
        Hälsodatakartan är en kartläggning av svenska hälsodatainitiativ —
        digital infrastruktur för datadelning, nationella kvalitetsregister,
        samverkans- och forskningsinitiativ, superdatorcentra för känslig data
        samt lagstiftning, strategi och policy. Kartan omfattar just nu{" "}
        {DATA.length} initiativ och växer löpande.
      </p>
      <p>
        Kartan tillhandahålls av den regiongemensamma samarbetsplattformen
        inom AI, som samordnas av Sveriges Kommuner och Regioner (SKR).
        Innehållet utvecklas och kureras kontinuerligt.
      </p>

      <h2>Märkningen: Kurerad och AI-sammanställd</h2>
      <p>
        Uppgifterna på kartan har tagits fram med hjälp av AI och därefter
        gåtts igenom i olika grad. Varje initiativ bär en av två märkningar, så
        att du alltid vet vilken nivå av genomgång innehållet har:
      </p>
      <div className="nivakort">
        <div>
          <GranskningBadge nivå="kurerad" />
          <p>{GRANSKNING.kurerad.desc}</p>
        </div>
        <div>
          <GranskningBadge nivå="ai" />
          <p>{GRANSKNING.ai.desc}</p>
        </div>
      </div>
      <p>
        Ingen av nivåerna är en garanti för att allt stämmer. Betrakta kartan
        som ett kvalificerat underlag — inte som en fastställd källa. Hittar du
        fel: använd knappen <em>Föreslå en ändring</em> på initiativets sida.
      </p>

      <h2>Hjälp till</h2>
      <ul>
        <li>
          <Link to="/foresla">Föreslå ett nytt initiativ</Link> som saknas på
          kartan.
        </li>
        <li>
          Föreslå ändringar direkt på ett initiativs sida — alla förslag
          granskas manuellt innan något uppdateras.
        </li>
        <li>
          <Link to="/kvalitetssakrare">Anmäl dig som kvalitetssäkrare</Link> och
          hjälp till att lyfta fler initiativ till nivån Kurerad.
        </li>
      </ul>

      <h2>Kategorierna</h2>
      <p>
        Initiativen delas in i fem kategorier — digital infrastruktur,
        kvalitetsregister, samverkan &amp; forskning, superdatorcentra samt
        lagstiftning &amp; policy — och därutöver i den ursprungliga
        kartläggningens delar A–D. Båda indelningarna går att filtrera på i{" "}
        <Link to="/">kartvyn</Link>, och <Link to="/matris">matrisen</Link>{" "}
        korsar kategori med finansieringskälla.
      </p>

      <h2>Källor och uppdatering</h2>
      <p>
        Underlaget bygger på öppna källor: initiativens egna webbplatser,
        myndighetsrapporter, registerbeskrivningar och EU-dokumentation.
        Grunddatat uppdateras löpande och sidan hämtar alltid den senaste
        publicerade versionen.
      </p>
    </div>
  );
}
