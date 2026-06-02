# Aktivitetskartan — Sveriges hälsodatainfrastruktur

Interaktiv kartläggning av 189 svenska hälsodatainitiativ (varav 91 nationella kvalitetsregister). Byggd med React + Vite, deployad på Vercel.

---

## Användare (läsläge)

| Funktion | Beskrivning |
|----------|-------------|
| **Sök** | Fritextsök i headern — filtrera initiativ på namn, nummer eller nyckelord |
| **Filter (vänsterpanel)** | Filtrera på Del (A–E), Underkategori, Finansieringskälla, Mognadsgrad och Taggar. Klicka "Filter" för att visa/dölja panelen |
| **Kort-vy** | Standardvy — varje initiativ som ett kort med typ, status, finansiering och AI/KCHD-poäng |
| **Matris-vy** | Korsreferens mellan Finansieringskälla och Typ — klicka på en cell för att se initiativen |
| **Nätverks-vy** | Interaktiv d3-graf som visar beroenden mellan initiativ. Sök och fokusera på specifika noder, ändra djup (1–3 hopp). Dra, zooma och hovra för detaljer |
| **Karta-vy** | Geografisk vy med Leaflet — se var initiativ är baserade i Sverige |
| **Kandidater-vy** | Hantera och granska kandidatinitiativ som ännu inte ingår i kartläggningen |
| **Sortering** | Sortera på Rapportordning, Namn, AI-relevans, KCHD-relevans eller Finansiering |
| **Detaljmodal** | Klicka på ett kort för fullständig information: nyckelkaraktäristik, EHDS-relevans, AI/KCHD-poäng, nyttodimensioner, taggar, beroenden och jurisdiktioner |
| **Datafördjupning** | Klicka "Datafördjupning" i detaljmodalen för att se förmågor, datadomän, frekvens, format, datamängd, källsystem, standarder och kvalitet |
| **Jämför** | Välj 2–5 initiativ (klicka på kortens checkbox) och klicka "Jämför" för en sida-vid-sida-jämförelse |
| **Skriv ut** | Välj initiativ och klicka "Skriv ut" — öppnar en formaterad HTML-vy redo för utskrift/PDF |

---

## Redaktör (redigeringsläge)

| Funktion | Beskrivning |
|----------|-------------|
| **Redigera fält** | I detaljmodalen — klicka pennikonen bredvid fält som Nyckelkaraktäristik, EHDS-relevans, Arbetsgruppens beskrivning m.fl. för att redigera. Ändringar sparas lokalt |
| **Arbeta vidare / Prioritera** | Klicka stjärnknappen i detaljmodalens header för att markera ett initiativ som prioriterat (gul markering på kortet) |
| **Mognadsgrad** | Sätt mognadsgrad (Idé, Pilot, Operativt, Skalat) per initiativ i redigeringsläge |
| **QA-workflow** | Fält har historik: AI-forskning, Manuell redigering, AI-omgranskning, Godkänd. Spåra vem som ändrat vad |
| **Föreslå ändringar** | Längst ner i detaljmodalen — skriv fritextförslag som sparas lokalt |
| **Datafördjupning (redigera)** | I Datafördjupning-panelen: kryssa i förmågor, ange datadomän, frekvens, format, datamängd, källsystem, IoT/sensor, standarder och kvalitet. Klicka "Spara" |
| **Kandidater** | I Kandidater-vyn: lägg till nya initiativ med namn, beskrivning, typ, källor och relevanspoäng |
| **Lokal lagring** | Alla redigeringar sparas i webbläsarens localStorage (prefix `hdi_`). Data är per webbläsare — rensa med webbläsarens verktyg vid behov |

---

## Kom igång lokalt

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173` i webbläsaren.
