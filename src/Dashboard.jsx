import React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, ChevronDown, ChevronRight, Check, Square, CheckSquare, GitCompare, Filter, Banknote, Tag, ArrowUpDown, XCircle, Database, Edit3, Loader, Printer, MapPin, Globe, Download, Upload } from "lucide-react";
import * as d3 from "d3";
import { getOverride, saveOverride, getDeepDive, saveDeepDive, getSuggestion, saveSuggestion, getCandidates, saveCandidates, getAnalysisObjects, saveAnalysisObjects, getAllOverrides, subscribeToTable } from "./storage";
/* ─────────── EMBEDDED DATA ─────────── */
const DATA = [{"nr": 1, "n": "Nationella Genomikplattformen (NGP) / Genomic Medicine Sweden (GMS)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Västra Götalandsregionen (värdregion); alla 7 universitetssjukvårdsregioner + SciLifeLab", "tid": "2018–pågående (avtal omförhandlas under 2026)", "st": "Operativt", "fin": "Ca 120 MSEK (regionavtal); tillkommande projektmedel från Vinnova och EU", "fok": "Primäranvändning (klinisk genomik) + Sekundäranvändning (forskningsdatabaser)", "mg": "Klinisk genetik, onkologi, sällsynta sjukdomar; forskare inom precisionsmedcin", "del": "A", "sub": "A1", "nk": "Nationell samordning av genomisk diagnostik inom hälso- och sjukvården. Sju regionala genomikcentra kopplade till universitetssjukhusen. Klinisk WGS (helgenomsekvensering) implementeras successivt. Central datainfrastruktur under utveckling. Koppling till EU-projekten B1MGplus, Genome of Europe och GDI.", "ehds": "hög — genomikdata är en av de datakategorier som specificeras i EHDS-förordningen.", "korr": "", "dep": "25, 42, 54, 67, 77", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Genomikdata"}, {"name": "Teknik/IT", "score": 2, "comment": "WGS-infrastruktur"}, {"name": "Strategi", "score": 3, "comment": "GMS nationell"}, {"name": "Juridik", "score": 2, "comment": "Biobankslagen"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Precisionsmed."}, {"name": "Kompetens", "score": 2, "comment": "Bioinformatik"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GMS-data via FHIR"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Genomikdata för forskning"}, {"name": "Data management & governance", "score": 2, "comment": "Biobanksgovernance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Genomikvariabler"}, {"name": "Juridik", "score": 1, "comment": "Biobankslagen"}], "nytta": [{"level": "Strategisk", "text": "Stärker Sveriges position inom precisionsmedicin och genomik"}, {"level": "Taktisk", "text": "Möjliggör klinisk implementering av WGS i alla regioner"}, {"level": "Operativ", "text": "Förbättrad diagnostik för cancer och sällsynta sjukdomar"}, {"level": "Teknisk", "text": "Standardiserad genomikinfrastruktur nationellt"}, {"level": "Datamässig", "text": "Genomikdata tillgänglig för forskning och AI"}], "ds": "Genomikdata (WGS, WES), VCF-format, HL7 FHIR Genomics, GA4GH-standarder", "tek": "WGS-sekvensering, bioinformatikpipelines, SciLifeLab-infrastruktur, GMS-portalen", "akt": "VGR (värd), 7 universitetssjukvårdsregioner, SciLifeLab, Vinnova, Socialstyrelsen", "tags": [{"category": "Aktörstyp", "values": "region, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, forskning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik, kompetens"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning, ursprunglig"}], "wg_beskr": "Delning, lagring och analys av genomikdata och tillhörande klinisk data. Utveckling pågår, ej i drift ännu.", "wg_tek": "Microsoft Azure. Hostas av Västra Götalandsregionen.", "datafordj": {"Förmågor": "Data management (sammanhållen data, semantik), Data governance (styrning, säkerhet, integritet), Tillgängliggöra data (integration, uppdateringsfrekvens), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "GMS samordnar genomisk diagnostik nationellt. Central datainfrastruktur under utveckling med BDC beräkningskluster. Stark governance via avtal mellan 7 universitetssjukvårdsregioner. EHDS-genomik är prioriterad datakategori.", "Datadomän": "Klinisk genomik: helgenomsekvensering (WGS), helexomsekvensering (WES), genpaneler, somatisk tumörgenomik. Sjukdomsdomäner: sällsynta sjukdomar, cancer (solida och hematologiska), farmakogenomik. Tillhörande klinisk data: diagnoskoder, behandlingsdata, familjehistorik.", "Frekvens": "Near real-time (minuter/timmar)", "Datatyp/format": "FASTQ (råsekvens), BAM/CRAM (alignment), VCF/gVCF (varianter), BED (regioner). Kliniska rapporter i PDF + strukturerat format. Phenopackets (GA4GH) för fenotypdata. Scout-systemet (Clinical Genomics, SciLifeLab) för variantanalys.", "Datamängd": "~120 MSEK regionavtal. 7 regionala genomikcentra. BDC: 6 beräkningsnoder + 1,3 PB lagring. Ca 5 000-10 000 kliniska WGS-analyser/år (uppskattning 2025). Mål: all klinisk genetik via WGS inom 5 år.", "Källsystem": "Illumina NovaSeq 6000/X Plus (sekvensering), Scout/Chanjo (variantanalys SciLifeLab Clinical Genomics), LIMS-system per centrum, Cytogenomics/CytoSure (strukturella varianter), regionala journalsystem för klinisk data.", "IoT/sensor": "Sekvensinstrument: Illumina NovaSeq X Plus, NovaSeq 6000, MiSeq. Arraychip: Infinium Global Screening Array. Under utvärdering: Oxford Nanopore för snabb diagnostik.", "Standarder": "GA4GH: Beacon v2, Phenopackets v2, htsget, DUO (Data Use Ontology). HGNC gennomenklatur. ACMG/AMP variantklassificering. VCF v4.3. FHIR Genomics IG (under pilotering). ICD-10-SE + Orphanet-koder för sällsynta sjukdomar.", "Kvalitet": "Clinical Genomics pipeline (nf-core MIP) med inbyggd QC per steg. Sanger-verifiering av patogena varianter. Coverage-krav: >30× mediandjup för WGS, >99% av gener >20×. Internt kalibreringsprogram med NA12878-referens. Swedac-ackreditering eftersträvas."}, "jurisdiktioner": "GDPR (EU 2016/679), Biobankslagen (2023:38), Etikprövningslagen (2003:460), EHDS — EU 2025/327"}, {"nr": 2, "n": "Nationella kvalitetsregister", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Regioner / SKR / Socialstyrelsen (trepartssamverkan)", "tid": "1975–pågående (modern form sedan 1990-talet)", "st": "Operativt", "fin": "Ca 178 MSEK per år (statlig finansiering via SKR-överenskommelse). OBS: Siffran 480 MSEK i ursprungsbilden inkluderar regionernas eg", "fok": "Sekundäranvändning (kvalitetsuppföljning, forskning)", "mg": "Verksamhetschefer, kliniker, forskare, myndigheter", "del": "A", "sub": "A1", "nk": "Över 100 nationella kvalitetsregister som täcker de flesta sjukdomsområden. Opt-out-baserad registrering enligt Patientdatalagen kap. 7. Driftas på 17 IT-plattformar (konsolidering till 7 pågår under NAG kvalitetsregister). Centrala registercentrum: QRC Stockholm, Registercentrum VGR, UCR Uppsala, RCC. NKRR/IUTKR hanterar datautlämning för forskning.", "ehds": "kvalitetsregisterdata är en potentiell källa för sekundäranvändning under EHDS art. 33.", "korr": "", "dep": "38, 64, 76, 77, 80", "ai": [{"name": "Datatillgång", "score": 3, "comment": "100+ register"}, {"name": "Teknik/IT", "score": 2, "comment": "Äldre plattformar"}, {"name": "Strategi", "score": 2, "comment": "Kvalitetsförbättring"}, {"name": "Juridik", "score": 2, "comment": "PDL kap 7"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Direkt vårdkvalitet"}, {"name": "Kompetens", "score": 2, "comment": "Registeranalys"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Registerplattformar"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Kärndata sekundär"}, {"name": "Data management & governance", "score": 3, "comment": "Kvalitetsregistergovernance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Registervariabelbibliotek"}, {"name": "Juridik", "score": 2, "comment": "PDL kap 7"}], "nytta": [{"level": "Strategisk", "text": "Nationell kvalitetsuppföljning och benchmarking"}, {"level": "Taktisk", "text": "Stödjer kunskapsstyrningen med evidensbaserade underlag"}, {"level": "Operativ", "text": "Direkt påverkan på vårdkvalitet genom öppna jämförelser"}, {"level": "Teknisk", "text": "Registerplattformskonsolidering (17→7)"}, {"level": "Datamässig", "text": "Rik datakälla för sekundäranvändning"}], "ds": "Registervariabellistor, ICD-10-SE, KVÅ, Snomed CT (varierande), proprietära format per register", "tek": "17 registerplattformar (konsolidering till 7 pågår), webbaserade inmatningssystem, UCR, QRC, RCC", "akt": "SKR, Socialstyrelsen, 21 regioner, QRC Stockholm, Registercentrum VGR, UCR Uppsala, RCC", "tags": [{"category": "Aktörstyp", "values": "region, stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, nytta"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "wg_beskr": "Data för forskning och vårdutveckling. Ofta kritiserat pga. mycket manuell överföring vilket kostar stora resurser vårdpersonal.", "wg_tek": "Data lagras i separata databaser hos personuppgiftsansvarig region. Ej enhetliga informationsmodeller och standarder.", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet), Data management (sammanhållen data, semantik), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "100+ register med varierande datamodeller. Stark governance via PDL kap 7 (opt-out). Registercentrum (QRC, UCR, RCC) förvaltar data. NKRR hanterar forskarutlämning. Konsolidering 17→7 plattformar pågår under NAG kvalitetsregister.", "Datadomän": "Alla kliniska domäner: hjärt-kärl (SWEDEHEART, RiksSvikt), cancer (alla cancerformer via RCC), ortopedi (Svenska Höftprotesregistret, Knäprotesregistret), diabetes (NDR), stroke (Riksstroke), psykiatri (PsykiatrIN), demens (SveDem), reumatologi (SRQ), m.fl. >100 register.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Strukturerade variabler per register (variabellistor publicerade). Formats: proprietära per plattform (INCA, RC-plattformen, LifeReg, Stratum m.fl.), CSV/XML vid utlämning. ICD-10-SE, KVÅ, ATC-koder integrerade. Registervariabelbiblioteket (RUT/Dataguiden) dokumenterar tillgängliga variabler.", "Datamängd": "100+ register, uppskattningsvis 50-80 miljoner registreringar totalt. SWEDEHEART: >750 000 patienter. NDR: >600 000 patienter. Cancerregistret: ~80 000 nya fall/år. 178 MSEK statlig årlig finansiering + regionernas egenfinansiering.", "Källsystem": "Journalsystem (COSMIC, Millennium, TakeCare) → manuell + halvautomatisk registrering → registerplattformar (INCA, RC-plattformen, LifeReg, Stratum, UCR-plattformen m.fl.). NKRR/IUTKR för forskarutlämning.", "IoT/sensor": "Inget direkt IoT. Data härrör från manuell klinisk registrering. Pågående arbete med automatiserad överföring från journalsystem (\"registrera en gång, återanvänd\").", "Standarder": "ICD-10-SE, KVÅ, ATC, Snomed CT (varierande per register). Registerspecifika variabellistor. PDL kap 7 (juridisk grund). Registerförordningar (2001:707 m.fl.). NKRR:s utlämningsprocess.", "Kvalitet": "Validering vid inmatning (plattformsspecifik). Täckningsgrad varierar (50-99% beroende på register). Bortfallsanalyser i årsrapporter. Registercentrum utför datakvalitetsgranskningar. Extern revision av Vård- och omsorgsanalys."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), Registerförfattningar (SoS), GDPR (EU 2016/679), EHDS — EU 2025/327"}, {"nr": 3, "n": "Regionernas egna IT-investeringar", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "21 regioner var för sig", "tid": "Löpande", "st": "Operativt", "fin": "Ej specificerat — varierar kraftigt per region", "fok": "Primäranvändning (journalsystem, beslutstöd, vårdlogistik)", "mg": "Vårdpersonal, IT-avdelningar, regionledning", "del": "A", "sub": "A1", "nk": "Regionernas egna investeringar i hårdvara, mjukvara och datacentrisk kompetens. Inkluderar journalsystem (Cosmic, Millennium, TakeCare), datalager, AI-satsningar och infrastruktur. Stora skillnader mellan regioner i digitaliseringsgrad. SUSSA-samverkan (9 regioner) och CGM/Millennium-regioner utgör de två stora blocken.", "ehds": "regionernas källsystem genererar den data som ska delas via EHDS.", "korr": "", "dep": "4, 7, 39, 41", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Journaldata"}, {"name": "Teknik/IT", "score": 3, "comment": "Heterogena system"}, {"name": "Strategi", "score": 2, "comment": "Regional variation"}, {"name": "Juridik", "score": 2, "comment": "PDL/GDPR"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Svårt att mäta"}, {"name": "Kompetens", "score": 2, "comment": "Lokal IT-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Källsystem att docka"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Journaldata sekundärt"}, {"name": "Data management & governance", "score": 2, "comment": "Regional IT-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Heterogena modeller"}, {"name": "Juridik", "score": 2, "comment": "PDL"}], "nytta": [{"level": "Strategisk", "text": "Regional digital suveränitet"}, {"level": "Taktisk", "text": "Anpassning till lokala behov"}, {"level": "Operativ", "text": "Daglig vårdproduktion"}, {"level": "Teknisk", "text": "Heterogena men rika källsystem"}, {"level": "Datamässig", "text": "Genererar den data som alla andra initiativ bygger på"}], "ds": "Journaldata (EHR), labbdata, bilddiagnostik — varierande format per journalsystem (COSMIC, Millennium, TakeCare)", "tek": "Cambio COSMIC, Cerner Millennium, CompuGroup TakeCare, regionala datalager, Azure/on-prem hybrid", "akt": "21 regioner, Cambio, Cerner, CompuGroup, regionala IT-avdelningar", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Data management (sammanhållen data, semantik), Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "Regionernas egna system genererar den primärdata som alla andra initiativ bygger på. Stor heterogenitet: 3 huvudjournalsystem, olika datalager, olika AI-mognad. SUSSA (9 COSMIC-regioner) och Millennium-blocket (VGR, Skåne) är de två stora grupperna.", "Datadomän": "All klinisk verksamhet: primärvård, specialistvård (somatisk + psykiatrisk), akut, operation, intensivvård, kommunal hälso- och sjukvård. Lab, röntgen, patologi. Administrativa system: väntetider, ekonomi, personal.", "Frekvens": "Real-time (kontinuerligt)", "Datatyp/format": "Journaldata (fritext + strukturerad), labbresultat (numeriska + kodade), bilddiagnostik (DICOM), operationsdata, läkemedelsordinationer (ATC), diagnoskoder (ICD-10-SE), åtgärdskoder (KVÅ). Varierande proprietära format per journalsystem.", "Datamängd": "~10,5 miljoner invånare. 21 regioner. COSMIC: 17 regioner (~6M invånare). Millennium: 2 regioner (VGR + Skåne, ~3M). TakeCare: Stockholm (~2,4M). Hundratals terabyte klinisk data totalt.", "Källsystem": "Cambio COSMIC (17 reg.), Oracle Health Millennium (VGR, Skåne), CompuGroup TakeCare (Stockholm). Lab: Flexlab, SoftLab, Klinisk kemi-system. Bild: Sectra PACS, GE PACS. Operation: Orbit, MetaVision. Intensivvård: PDMS (Clinisoft, MetaVision).", "IoT/sensor": "Patientövervakning: monitorering (SpO2, EKG, blodtryck). Infusionspumpar. Ventilatorer (data sällan strukturerat extraherad). Hemmonitorering (pilot i vissa regioner). CGM (kontinuerlig blodsockermätning) i diabetesvård.", "Standarder": "ICD-10-SE (diagnoser), KVÅ (åtgärder), ATC (läkemedel), Snomed CT (varierande), DICOM (bild), HL7 v2 (lab), RIV-TA (NTjP-integration). Varje region har egen informationsarkitektur.", "Kvalitet": "Varierande per region. Kodningskvalitet (ICD-10) granskad av Socialstyrelsen. Datalager med ETL-processer (varierande kvalitet). Ingen nationell standard för datakvalitetsmätning. SUSSA har viss gemensam modell."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679), NIS2 — Cybersäkerhetsdirektivet, SVOD — Socialstyrelsens föreskrifter om öppenvårdsdokumentation"}, {"nr": 4, "n": "1177 / Inera", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB (ägt av SKR, regioner och kommuner)", "tid": "2013–pågående (nya 1177 under utveckling)", "st": "Operativt", "fin": "Ej specificerat (x mkr). Intresseanmälan för nya 1177 pågår t.o.m. sept 2025.", "fok": "Primäranvändning (invånartjänster, journalåtkomst, e-tjänster)", "mg": "Invånare/patienter, vårdpersonal", "del": "A", "sub": "A1", "nk": "Sveriges nationella e-hälsoportal. Journalen (via NPÖ), tidbokning, förnyelse av recept, rådgivning. Ny version under utveckling med moderniserad arkitektur. Inera levererar även NTjP, HSA, SITHS, Sjunet m.fl. infrastrukturtjänster.", "ehds": "1177 kan bli den nationella patientportalen (MyHealth@EU primary use access point).", "korr": "", "dep": "5, 39, 41, 48, 49, 57", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Invånartjänster"}, {"name": "Teknik/IT", "score": 3, "comment": "Modern webb"}, {"name": "Strategi", "score": 2, "comment": "MyHealth@EU"}, {"name": "Juridik", "score": 2, "comment": "PDL kap 6"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Patientnytta"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "1177-API"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Begränsad sekundär"}, {"name": "Data management & governance", "score": 1, "comment": "Inera-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Invånartjänstdata"}, {"name": "Juridik", "score": 1, "comment": "PDL"}], "nytta": [{"level": "Strategisk", "text": "Nationell e-hälsoportal — potentiell MyHealth@EU"}, {"level": "Taktisk", "text": "Invånarens tillgång till sin hälsodata"}, {"level": "Operativ", "text": "1177 rådgivning, tidbokning, journalåtkomst"}, {"level": "Teknisk", "text": "Modern webbarkitektur under utveckling"}, {"level": "Datamässig", "text": "Invånardata och interaktionsdata"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB (ägt av SKR, regioner och kommuner)", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, nytta"}, {"category": "Användning", "values": "primäranvändning, ursprunglig"}], "wg_beskr": "1177.se är den nationella patientportalen/e-tjänsteportalen för hälso- och sjukvård i Sverige, som ger invånare hälsoråd och information, möjlighet att logga in och använda e-tjänster, samt digital kommunikation med vårdgivare.", "wg_tek": "", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "1177 är invånarens primära digitala ingång till vården. Ny version under utveckling med moderniserad arkitektur. Kan bli MyHealth@EU primary use access point. Integrerar med NPÖ för journalåtkomst.", "Datadomän": "Invånartjänster: hälsoråd/triagering (1177 Vårdguiden), journalåtkomst (via NPÖ), tidbokning, receptförnyelse, e-tjänster per region, säkra meddelanden till vårdgivare, vaccinationsbokningar, provsvarsvisning.", "Frekvens": "Real-time (kontinuerligt)", "Datatyp/format": "Webbinnehåll (HTML/JSON), invånarinteraktionsdata, ärendedata (meddelanden, bokningar), journalvisning (hämtas via NPÖ/NTjP i SOAP/XML). Ny arkitektur: REST/JSON, mikrotjänster.", "Datamängd": "~10,5 miljoner potentiella användare (alla invånare). Hundratals miljoner sidvisningar/år. E-tjänster: varierar per region (40-200 per region). 1177 Vårdguiden: ~200 miljoner besök/år.", "Källsystem": "NPÖ (via NTjP, journaldata), regionala tidbokningstjänster, regionala e-tjänsteplattformar, 1177 Vårdguiden (innehållsplattform Episerver/Optimizely). SITHS/BankID för autentisering.", "IoT/sensor": "Inget direkt IoT. Potentiellt i framtiden: hemmonitoreringsdata visad via 1177, egenmätta hälsovärden (blodtryck, vikt, blodsockernivåer) — pilotprojekt i vissa regioner.", "Standarder": "RIV-TA (NTjP-integration), SAML/OIDC (autentisering), SITHS, BankID, HSA (organisationskatalog). WCAG 2.1 AA (tillgänglighet). Ny arkitektur: FHIR R4 planeras.", "Kvalitet": "Tillgänglighetsgranskningar (WCAG). SLA för uppetid (99,9%). Innehållsgranskningsprocess för medicinsk information (1177 Vårdguiden). Användartester och nöjdhetsmätningar."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679), EHDS — EU 2025/327"}, {"nr": 5, "n": "Nationell Patientöversikt (NPÖ)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "2008–pågående", "st": "Operativt", "fin": "Ca 500 MSEK (totala investeringar sedan start, ej verifierat)", "fok": "Primäranvändning (sammanhållen journalföring)", "mg": "Vårdpersonal i alla regioner och kommuner", "del": "A", "sub": "A1", "nk": "Nationellt system för sammanhållen journalföring enligt Patientdatalagen kap. 6. Möjliggör åtkomst till patientinformation över vårdgivargränser via NTjP. Begränsningar: kräver pågående vårdrelation och patient har rätt att spärra. Tekniskt baserat på äldre SOAP/XML-tjänstekontrakt. EHDS-relevans: NPÖ-funktionaliteten kan behöva anpassas till EHDS primary use-krav.", "ehds": "NPÖ-funktionaliteten kan behöva anpassas till EHDS primary use-krav.", "korr": "", "dep": "4, 39, 41, 83", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Journalåtkomst"}, {"name": "Teknik/IT", "score": 2, "comment": "SOAP/XML äldre"}, {"name": "Strategi", "score": 2, "comment": "Sammanhållen journal"}, {"name": "Juridik", "score": 3, "comment": "PDL kap 6 central"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Vårdkontinuitet"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "NPÖ-tjänstekontrakt"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Journaldata sammanhållen"}, {"name": "Data management & governance", "score": 2, "comment": "NPÖ-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NPÖ-informationsmodell"}, {"name": "Juridik", "score": 2, "comment": "PDL kap 6"}], "nytta": [{"level": "Strategisk", "text": "Sammanhållen journalföring nationellt"}, {"level": "Taktisk", "text": "Möjliggör vårdövergångar mellan regioner"}, {"level": "Operativ", "text": "Direktåtkomst till patientinformation"}, {"level": "Teknisk", "text": "NTjP/RIV-TA-baserad nationell transport"}, {"level": "Datamässig", "text": "Journaldata tillgänglig över vårdgivargränser"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "primäranvändning, ursprunglig"}], "wg_beskr": "Har utvecklats gemensamt sedan 2007. Tjänst där journaldata görs synlig mellan offentligt finansierade vårdgivare, via nationell tjänsteplattform. Ej delning av data, öppnas enbart som ett “titthål” mellan vårdgivarna.", "wg_tek": "De system som gör information synlig i Nationell patientöversikt (NPÖ) ansluts till Nationella tjänsteplattformen (NTP)."}, {"nr": 6, "n": "INCA / IPÖ (Individuell Patientöversikt)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Regionala Cancercentrum (RCC) i samverkan", "tid": "INCA sedan 2006; IPÖ sedan ~2016", "st": "Operativt", "fin": "Ej specificerat (x mkr)", "fok": "Primäranvändning (IPÖ: kliniskt beslutsstöd) + Sekundäranvändning (INCA: cancerregistrering)", "mg": "Onkologer, cancerpatienter, registerpersonal, forskare", "del": "A", "sub": "A1", "nk": "INCA är den IT-plattform som driftar nationella cancerkvalitetsregister. IPÖ är en klinisk applikation som ger realtidsöversikt över patientens cancerförlopp. Integrerat med regionala journalsystem.", "ehds": "cancerdata är prioriterad i EHDS; INCA/IPÖ-data kan bli viktig för sekundäranvändning.", "korr": "", "dep": "2, 3, 7", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Cancerdata rik"}, {"name": "Teknik/IT", "score": 2, "comment": "INCA-plattform"}, {"name": "Strategi", "score": 2, "comment": "RCC-samverkan"}, {"name": "Juridik", "score": 2, "comment": "Registerjuridik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Cancervård direkt"}, {"name": "Kompetens", "score": 2, "comment": "Registerkunskap"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "INCA-plattform"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Cancerdata"}, {"name": "Data management & governance", "score": 2, "comment": "RCC-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "IPÖ-variabler"}, {"name": "Juridik", "score": 1, "comment": "Registerjuridik"}], "nytta": [{"level": "Strategisk", "text": "Nationell cancerstrategi — standardiserad registrering"}, {"level": "Taktisk", "text": "RCC-samverkan för jämlik cancervård"}, {"level": "Operativ", "text": "Realtidsöversikt över cancerförlopp (IPÖ)"}, {"level": "Teknisk", "text": "INCA-plattform med registerkoppling"}, {"level": "Datamässig", "text": "Cancerdata för forskning och uppföljning"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regionala Cancercentrum (RCC) i samverkan", "tags": [{"category": "Aktörstyp", "values": "region, sjukhus"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik, nytta"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning, ursprunglig"}], "wg_beskr": "IT-plattform för hantering av register kring cancerpatienter avseende vård och forskning. Har varit i drift sedan 2007. På RCC används INCA-plattformen för att skapa registerlösningar som till exempel Individuell patientöversikt (IPÖ), cancerregistret, diagnosregister och nationella kvalitetsregister. IPÖ är en registerlösning för registrering och visualisering av information om patienters vård och behandling. IPÖ används som komplement tillsammans med patientjournal i patientmötet.", "wg_tek": "Servrarna för INCA finns i Sverige. Webbaserad plattform som driftas av Sogeti. Lagringen av informationen sker på den regionala lagringsytan i INCA-plattformen.", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data management (sammanhållen data, semantik), Data governance (styrning, säkerhet, integritet)", "Förmåga (fritext)": "INCA är den centrala IT-plattformen för cancerregistrering i Sverige. IPÖ ger realtidsöversikt i patientmötet. Stark governance via RCC i samverkan. Cancerdata prioriterad under EHDS.", "Datadomän": "Alla cancerformer: diagnos, stadieindelning (TNM), behandling (kirurgi, cytostatika, strålning, immunterapi), uppföljning, överlevnad. IPÖ: PROM/PREM-data (patientrapporterade utfall). ~25 cancerspecifika kvalitetsregister.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Strukturerade registervariablar per cancerform. ICD-10-SE (diagnos), ICD-O-3 (tumörmorfologi/-topografi), TNM-klassifikation, KVÅ (åtgärder), ATC (läkemedel). IPÖ: patientrapporterade PROM-formulär. Webbaserade inmatningsformulär.", "Datamängd": "Cancerregistret: ~80 000 nya maligna tumörer/år. Sedan 1958. ~25 diagnosspecifika register. IPÖ: implementerat för 15+ diagnoser, >100 000 registreringar/år. Driftas av Sogeti. Regional lagring i INCA-plattformen.", "Källsystem": "Manuell inmatning via INCA-webbformulär. Journalsystem (COSMIC, Millennium, TakeCare) som källa — men begränsad automatisk överföring. Patologisystem (för morfologikoder). Strålbehandlingssystem.", "IoT/sensor": "Inget direkt IoT. Cancerbehandlingsapparater (linjäracceleratorer, PET-CT) genererar data men den överförs manuellt till registren.", "Standarder": "ICD-10-SE, ICD-O-3 (topografi+morfologi), TNM 8th edition, KVÅ, ATC. INCA eget API för datautlämning. RCC:s variabellistor. Snomed CT (begränsat). ENCR (European Network of Cancer Registries) jämförelsestandard.", "Kvalitet": "Täckningsgrad >96% (Cancerregistret, Socialstyrelsen granskar). Valideringsregler vid inmatning. Årliga datakvalitetsrapporter per register. Regionala onkologicentra granskar lokalt. Eftersläpning i registrering (6-12 mån) problematiskt."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), Registerförfattningar (SoS), GDPR (EU 2016/679), EHDS — EU 2025/327"}, {"nr": 7, "n": "COSMIC datalager / SUSSA-samverkan", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "SUSSA-samverkan (9 regioner: Dalarna, Gävleborg, Uppsala, Sörmland, Västmanland, Värmland, Norrbotten, Västerbotten, Jämtland-Hä", "tid": "SUSSA sedan ~2006; datalager löpande", "st": "Operativt", "fin": "Ej specificerat (x mkr)", "fok": "Primäranvändning (klinisk data) + Sekundäranvändning (datalager för analys)", "mg": "Vårdpersonal, verksamhetschefer, analytiker i SUSSA-regioner", "del": "A", "sub": "A1", "nk": "SUSSA är ett samarbete mellan 9 Cambio COSMIC-regioner kring gemensam systemförvaltning och datalager. Delar erfarenheter kring datauttag, analyser och rapportering.", "ehds": "COSMIC-data från 9 regioner potentiell källa, men juridiska frågor kring datadelning kvarstår.", "korr": "", "dep": "3, 14, 56", "ai": [{"name": "Datatillgång", "score": 3, "comment": "9 regioners data"}, {"name": "Teknik/IT", "score": 3, "comment": "Cambio COSMIC DW"}, {"name": "Strategi", "score": 2, "comment": "SUSSA-samverkan"}, {"name": "Juridik", "score": 2, "comment": "Regionspecifik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Verksamhetsstyrning"}, {"name": "Kompetens", "score": 2, "comment": "Dataanalys"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "COSMIC DW direkt"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "SUSSA-data"}, {"name": "Data management & governance", "score": 2, "comment": "SUSSA-samverkan"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "COSMIC-datamodell"}, {"name": "Juridik", "score": 2, "comment": "Regionavtal"}], "nytta": [{"level": "Strategisk", "text": "SUSSA-samverkan stärker 9 regioners datakraft"}, {"level": "Taktisk", "text": "Gemensam systemförvaltning och erfarenhetsutbyte"}, {"level": "Operativ", "text": "Verksamhetsstyrning baserad på COSMIC-data"}, {"level": "Teknisk", "text": "Cambio COSMIC datalager med standardiserad extraktion"}, {"level": "Datamässig", "text": "9 regioners kliniska data i gemensam modell"}], "ds": "COSMIC-datamodell, SQL-baserade datalager, ICD-10-SE, KVÅ, ATC", "tek": "Cambio COSMIC datalager, SQL Server/Oracle, ETL-processer, SUSSA gemensam datamodell", "akt": "SUSSA-samverkan (9 regioner: Dalarna, Gävleborg, Uppsala, Sörmland, Västmanland, Värmland, Norrbotten, Västerbotten, Jämtland-Hä", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Data management (sammanhållen data, semantik), Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "SUSSA-samverkan ger 9 COSMIC-regioner gemensam datamodell för datalager. Stark källa för sekundäranvändning. Direktåtkomst till klinisk data utan manuell registrering. Viktig partner för vårddatahubb.", "Datadomän": "All klinisk data i COSMIC: vårdkontakter (öppen/sluten), diagnoser, åtgärder, läkemedel, lab, remisser, vårddokumentation. Administrativa data: väntetider, resursutnyttjande, beläggning.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "SQL-baserat datalager med COSMIC-datamodell. ICD-10-SE, KVÅ, ATC standardkodning. Cambio COSMIC XML-exportformat. CSV/Excel vid manuella uttag. COSMIC Intelligence (BI-verktyg) för rapporter.", "Datamängd": "9 regioner: Dalarna, Gävleborg, Uppsala, Sörmland, Västmanland, Värmland, Norrbotten, Västerbotten, Jämtland-Härjedalen. Ca 2,2 miljoner invånare. Flera terabyte datalager per region.", "Källsystem": "Cambio COSMIC (kärnsystem). COSMIC datalager (DW). COSMIC Intelligence (BI). Labsystem integrerade via HL7. Röntgensvar via RIS/PACS-koppling.", "IoT/sensor": "Inget direkt IoT kopplat till SUSSA-datalager. Monitoreringsdata från intensivvård kan finnas i COSMIC men extraheras sällan systematiskt.", "Standarder": "COSMIC-datamodell (proprietär men dokumenterad). ICD-10-SE, KVÅ, ATC, NPU (labbkoder). SQL-baserade extrakt. Gemensam SUSSA-datamodell under utveckling.", "Kvalitet": "ETL-processer per region (varierande kvalitet). Gemensam variabeldefinition inom SUSSA. Kodningsgranskning i regionala kodningsgrupper. Cambio levererar DW-schema med dokumentation."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679)"}, {"nr": 8, "n": "Kompetenscentrum Hälsodata (KCHD) / NSG Hälsodata / Digitaliseringsnätverk", "fk": "Regionerna", "typ": "Samverkan / demonstrator / forskning", "ans": "SKR (kunskapsstyrningssystemet)", "tid": "NSG Hälsodata sedan ~2020; Digitaliseringsnätverk (fd SLIT) sedan 2019", "st": "Operativt", "fin": "Ej specificerat — del av SKR:s verksamhet", "fok": "Sekundäranvändning (styrning, uppföljning, datadelning)", "mg": "Regionledning, IT-direktörer, dataansvariga, NSG/NAG-deltagare", "del": "A", "sub": "A1", "nk": "KCHD är det organisatoriska hemvistet för vårddatahubb-arbetet inom kunskapsstyrningssystemet under SKR. NSG Hälsodata leder det nationella arbetet för regiongemensam hantering av vårddata. Digitaliseringsnätverket (DiN) samordnar IT-direktörernas strategiska frågor och är beslutsorgan för KCHD:s inriktning. NAG regiongemensam hantering av vårddata och NAG kvalitetsregister arbetar operativt. Fem subprojekt 2026: Datamodell, Mappningsmotor, Beräkning Väntetider/PAR, FHIR API, och Demo-miljö.", "ehds": "hög — kan bli koordinerande funktion för regionernas EHDS-förberedelser. Beroende till nr 76 (Vårddatahubb).", "korr": "", "dep": "2, 9, 76, 88, 91", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Koordinerande"}, {"name": "Teknik/IT", "score": 2, "comment": "Plattformstänk"}, {"name": "Strategi", "score": 3, "comment": "DiN beslutsorgan"}, {"name": "Juridik", "score": 2, "comment": "EHDS-förberedelse"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Regiongemensam nytta"}, {"name": "Kompetens", "score": 3, "comment": "Kompetenscenter"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "KCHD = hubben"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Kärnverksamhet"}, {"name": "Data management & governance", "score": 3, "comment": "NSG/DiN"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "KCHD definierar"}, {"name": "Juridik", "score": 3, "comment": "EHDS-förberedelse"}], "nytta": [{"level": "Strategisk", "text": "KCHD koordinerar nationell vårddatastrategi"}, {"level": "Taktisk", "text": "DiN-beslut styr IT-direktörernas prioriteringar"}, {"level": "Operativ", "text": "5 subprojekt 2026 med konkreta leverabler"}, {"level": "Teknisk", "text": "Modulära kodpaket (ETL, mappning, FHIR API)"}, {"level": "Datamässig", "text": "Hub som returnerar regionernas egna data för analys"}], "ds": "FHIR R4, openEHR, OMOP CDM, Socialstyrelsens flatfiler — mappning mellan alla", "tek": "React (visualisering), MinIO (datalake), GitOps/monorepo, Docker-containers, GitHub pederhb/regional + pederhb/hub", "akt": "SKR/KCHD, NSG Hälsodata, DiN, NAG regiongemensam hantering, NAG kvalitetsregister, DG REFORM", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "samverkan, infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "strategi, kompetens"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "wg_beskr": "Nationell samverkansgrupp inom kunskapsstyrningen. Har beslutat och gett uppdrag till NAG Regiongemensam vårddatastrategi att ta fram en regiongemensam vårddatastrategi (föreslagen vårddatahubb + Kompetenscentrum hälsodata).", "wg_tek": "", "datafordj": {"Förmågor": "Data governance (styrning, säkerhet, integritet), Data management (sammanhållen data, semantik), Tillgängliggöra data (integration, uppdateringsfrekvens), Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "KCHD är navet för regiongemensam hälsodatastrategi. NSG Hälsodata fattar strategiska beslut, DiN (Digitaliseringsnätverket) styr IT-direktörernas prioriteringar. 5 subprojekt 2026: Datamodell, Mappningsmotor, Beräkning Väntetider/PAR, FHIR API, Demo-miljö.", "Datadomän": "Sekundäranvändning av all regional hälsodata: väntetidsdata (0-3-90-90 vårdgarantin), PAR-SV/PAR-OV (patientregistret), kvalitetsregisterdata, standardiserade variabler. Metanivå: datastyrning, kompetens, regelverk.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Mappningsspecifikationer (JSON/YAML), FHIR R4-resurser, openEHR-arketyper, OMOP CDM-mappningar, Socialstyrelsens flatfiler (PAR-format). Docker-containers med transformationslogik. Git-baserad versionshantering.", "Datamängd": "Potentiellt alla 21 regioners data. POC-fas med 5 pilotdataflöden. DG REFORM-finansierat konsultuppdrag (1 år). Målbild: nationell hub som processar alla regioners rapporteringsflöden.", "Källsystem": "Regionala journalsystem (COSMIC, Millennium, TakeCare) → regionala datalager → KCHD hub-relay. Socialstyrelsens specifikationer (PAR-SV, PAR-OV). Pilot med Region 22 demomiljö (FastAPI, MinIO, EHRbase).", "IoT/sensor": "Inget direkt IoT. Hub-konceptet hanterar strukturerad data, inte realtidssensordata.", "Standarder": "FHIR R4 (HL7 Sweden basprofiler), openEHR (arketyper via CKM), OMOP CDM v5.4 (via OMOP4Sweden), Socialstyrelsens variabelspecifikationer, RIV-TA (bakåtkompatibilitet). GitOps-baserad distribution.", "Kvalitet": "DQ0-DQ6 kvalitetskontroller i POC-pipelinen (Tier 1-9 transformationer). Ifyllnadsgrad (fill rate) som primärt kvalitetsmått. Automatiserad validering mot Socialstyrelsens specifikationer. CHECKLIST.md och SPRINT_LOG.md för utvecklingskontroll."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679), EHDS — EU 2025/327, OSL — Offentlighetsoch sekretesslagen"}, {"nr": 9, "n": "NDI (Nationell Digital Infrastruktur för hälsodata)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "E-hälsomyndigheten (utredare Mats Nilsson, S 2024:A)", "tid": "Utredning 2024–2026 (slutrapport 1 april 2026)", "st": "Under utredning", "fin": "Ej specificerat (x mkr). Beslutad plattform för datadelning inom EHDS.", "fok": "Primäranvändning + Sekundäranvändning (nationell infrastruktur)", "mg": "Alla aktörer i hälsodataekosystemet", "del": "A", "sub": "A2", "nk": "Regeringsuppdrag att möjliggöra en nationell digital infrastruktur för hälsodata. Fyra delrapporter levererade (april 2024, juni 2024, juni 2025, september 2025). Slutrapport 1 april 2026. Ska föreslå konkreta lösningar för primär- och sekundäranvändning enligt EHDS.", "ehds": "direkt — NDI är Sveriges huvudsakliga EHDS-implementeringsinitiativ.", "korr": "", "dep": "10, 39, 57, 77, 88, 91", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Nationell infra"}, {"name": "Teknik/IT", "score": 3, "comment": "EHDS-plattform"}, {"name": "Strategi", "score": 3, "comment": "Regeringsprio"}, {"name": "Juridik", "score": 3, "comment": "Ny lagstiftning"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Samhällsnytta bred"}, {"name": "Kompetens", "score": 2, "comment": "Under uppbyggnad"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "NDI-plattform"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Nationell sekundär"}, {"name": "Data management & governance", "score": 3, "comment": "E-hälsomynd. governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "NDI-standarder"}, {"name": "Juridik", "score": 3, "comment": "EHDS-implementering"}], "nytta": [{"level": "Strategisk", "text": "EHDS-implementering — Sveriges huvudspår"}, {"level": "Taktisk", "text": "NDI-plattform för primär- och sekundäranvändning"}, {"level": "Operativ", "text": "Nationell datadelning för vård och forskning"}, {"level": "Teknisk", "text": "EHDS-anpassad teknisk infrastruktur"}, {"level": "Datamässig", "text": "All hälsodata tillgänglig via nationell infrastruktur"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "E-hälsomyndigheten (utredare Mats Nilsson, S 2024:A)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik, strategi"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "NDI är Sveriges huvudsakliga EHDS-implementeringsinitiativ. E-hälsomyndigheten bygger teknisk infrastruktur medan samordnare Mats Nilsson utreder policy. Fyra delrapporter levererade, slutrapport april 2026.", "Datadomän": "All hälsodata för primär- och sekundäranvändning: EHR, läkemedel, labb, bilddiagnostik, utskrivning, genomik (i linje med EHDS 14 datakategorier). Målbild: nationell plattform som knyter samman alla datakällor.", "Frekvens": "Real-time (kontinuerligt) planerat", "Datatyp/format": "Under specifikation. Förväntat: FHIR R4 (EEHRxF-format), HL7 CDA (MyHealth@EU-kompatibilitet), OMOP CDM (sekundäranvändning). API-baserad arkitektur.", "Datamängd": "Nationell skala: 10,5 miljoner invånare, alla vårdgivare. Slutrapport 1 april 2026 ska specificera scope och dimensionering.", "Källsystem": "Alla befintliga system: journalsystem, NTjP, NPÖ, 1177, NLL, Socialstyrelsen, SCB. Målbild: nationell orkestreringsplattform.", "IoT/sensor": "Inte i initialfas. Framtida: hemmonitorering, wearables, medicinteknisk utrustning kan inkluderas.", "Standarder": "EHDS (EU 2025/327), EEHRxF (European EHR Exchange Format), FHIR R4, HL7 CDA, SNOMED CT, ICD-10-SE (→ICD-11), LOINC (labb). EIRA (European Interoperability Reference Architecture).", "Kvalitet": "Under specifikation. Förväntas inkludera: datakvalitetskrav per datakategori, certifieringsprocess för anslutna system, kontinuerlig kvalitetsmonitorering."}, "jurisdiktioner": "EHDS — EU 2025/327, PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679), NIS2 — Cybersäkerhetsdirektivet"}, {"nr": 10, "n": "Ena (Sveriges digitala infrastruktur)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Myndigheten för digital förvaltning (DIGG)", "tid": "2024–pågående", "st": "Operativt", "fin": "Ca 55 MSEK (2024)", "fok": "Begränsat — Ena är sektorsövergripande; hälsodata är en av flera domäner", "mg": "Myndigheter, regioner, kommuner (all offentlig sektor)", "del": "A", "sub": "A2", "nk": "Nationell digital infrastruktur för hela den offentliga sektorn. Byggblock inkluderar digital post, SDK (Säker digital kommunikation), auktorisering och API-hantering. Hälsodata är en tillämpningsdomän men inte huvudfokus.", "ehds": "Ena:s byggblock kan stödja EHDS-implementering men är inte hälsodataspecifika.", "korr": "", "dep": "9, 85", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Sektorsövergrip."}, {"name": "Teknik/IT", "score": 2, "comment": "API-byggblock"}, {"name": "Strategi", "score": 2, "comment": "Bred digitaliser."}, {"name": "Juridik", "score": 2, "comment": "Generell"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Begränsad hälso"}, {"name": "Kompetens", "score": 1, "comment": "Generell IT"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Ena-byggblock"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Begränsad"}, {"name": "Data management & governance", "score": 1, "comment": "DIGG-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Generell"}], "nytta": [{"level": "Strategisk", "text": "Sektorsövergripande digital infrastruktur"}, {"level": "Taktisk", "text": "API-hantering och auktorisering för offentlig sektor"}, {"level": "Operativ", "text": "SDK, digital post — byggblock för alla"}, {"level": "Teknisk", "text": "Ena-byggblock kan stödja NDI"}, {"level": "Datamässig", "text": "Begränsad direkt hälsodatarelevans"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Myndigheten för digital förvaltning (DIGG)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "EJ VÅRDRELATERAT, ursprunglig"}], "wg_beskr": "Istället för att varje offentlig aktör utvecklar sina egna lösningar, på sitt eget sätt, vinner alla på att det finns en digital infrastruktur som löser förvaltningsgemensamma grundläggande behov. För att data ska kunna hanteras och utbytas mellan aktörer på ett säkert och effektivt sätt behövs gemensamma överenskommelser och tekniska komponenter. De delarna finns i Ena – Sveriges digitala infrastruktur.", "wg_tek": "Ej lagring, snarare tillhandahåller den teknisk infrastruktur hur data från register som NLL, NPÖ, Socialstyrelsens hälsodataregister och även kvalitetsregister görs tillgängliga och utbyts.", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "Ena är sektorsövergripande digital infrastruktur. Hälsodata är en tillämpningsdomän men inte huvudfokus. Byggblock: SDK, digital post, auktorisering, API-hantering. Begränsad direkt hälsodatarelevans men viktiga grundkomponenter.", "Datadomän": "Förvaltningsgemensam: alla offentliga sektorer. Hälsodatarelevanta byggblock: SDK (Säker digital kommunikation), auktorisering (behörighetsstyrning), API-hantering, digital post (för invånarkommunikation).", "Frekvens": "Real-time (kontinuerligt)", "Datatyp/format": "API-standarder (REST/JSON), meddelandeformat (SDK), identitetsdata (Sweden Connect), adressdata, organisationsdata. Inte hälsodata per se utan infrastrukturkomponenter.", "Datamängd": "Hela offentlig sektor: ~500 myndigheter, 290 kommuner, 21 regioner. Ca 55 MSEK budget (2024). Ej hälsodataspecifikt.", "Källsystem": "DIGG:s egna byggblock. Sweden Connect (eIDAS). Skatteverkets folkbokföring. Bolagsverkets företagsregister. Lantmäteriets geodata.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "OASIS (SDK-protokoll), OAuth 2.0/OIDC (autentisering), REST/JSON (API-design), eIDAS 2.0, EIRA (arkitekturramverk). W3C Verifiable Credentials (under utvärdering).", "Kvalitet": "DIGG:s kvalitetskrav per byggblock. SLA-avtal. Certifieringsprocess för anslutna myndigheter."}, "jurisdiktioner": "GDPR (EU 2016/679), NIS2 — Cybersäkerhetsdirektivet"}, {"nr": 11, "n": "DDLS (Data-Driven Life Science)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "SciLifeLab (+sites vid alla MedFak utom Örebro)", "tid": "2021–2032", "st": "Operativt", "fin": "3 800 MSEK (Knut och Alice Wallenbergs Stiftelse)", "fok": "Sekundäranvändning (datadriven forskning inom life science)", "mg": "Forskare, doktorander, postdocs inom life science", "del": "A", "sub": "A2", "nk": "Wallenberg-finansierat program för att stärka datadrivna metoder inom life science. 39 rekryterade fellows (2022–2025). Fyra fokusområden: cell- och molekylärbiologi, evolution och biodiversitet, precision medicin och diagnostik, epidemiologi och infektionsbiologi. SciLifeLab som värdorganisation. EHDS-relevans: DDLS-fellows kan bli framtida användare av EHDS-data.", "ehds": "DDLS-fellows kan bli framtida användare av EHDS-data.", "korr": "", "dep": "14, 26, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Life science data"}, {"name": "Teknik/IT", "score": 2, "comment": "Datadriven forsk."}, {"name": "Strategi", "score": 3, "comment": "Wallenberg-prio"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarkapacitet"}, {"name": "Kompetens", "score": 3, "comment": "39 fellows"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "DDLS-forskning"}, {"name": "Data management & governance", "score": 1, "comment": "SciLifeLab"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Forskningsspecifik"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Svensk forskning i global framkant inom datadriven life science"}, {"level": "Taktisk", "text": "39 DDLS-fellows stärker forskarkapaciteten"}, {"level": "Operativ", "text": "Datadriven forskning inom precision medicin"}, {"level": "Teknisk", "text": "SciLifeLab-infrastruktur och NBIS"}, {"level": "Datamässig", "text": "Life science-data för AI och maskininlärning"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "SciLifeLab (+sites vid alla MedFak utom Örebro)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi, privat"}, {"category": "Verksamhetstyp", "values": "forskning, SPE/TRE"}, {"category": "Fokusområde", "values": "kompetens, teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "wg_beskr": "SciLifeLab och Wallenbergs nationella program för datadriven life science (DDLS) är en 12-årig satsning som ska stärka Sveriges förmåga att hantera, dela och analysera de snabbt växande datamängderna inom livsvetenskaperna genom kompetensuppbyggnad, infrastruktur och nationell samverkan mellan forskning, industri och hälso- och sjukvård.", "wg_tek": ""}, {"nr": 12, "n": "SENASH (Secondary use of National health data at Safe processing environments for Health data)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "HBAD-myndigheterna (Socialstyrelsen, SCB, Folkhälsomyndigheten, Läkemedelsverket)", "tid": "2024–2027 (EU4Health-finansiering)", "st": "Under uppbyggnad", "fin": "Ca 28 MSEK (varav 60% EU4Health, 40% nationell medfinansiering)", "fok": "Sekundäranvändning (säkra behandlingsmiljöer för hälsodata)", "mg": "Forskare, myndigheter, beslutsfattare", "del": "A", "sub": "A2", "nk": "Utvecklar nationell metadatakatalog och databeställningssystem kopplat till EHDS. VR-finansiering parallellt. Knyter samman RUT/Dataguiden med EHDS-krav.", "ehds": "direkt — SENASH förbereder HDAB-funktioner.", "korr": "", "dep": "16, 29, 32, 34, 38, 77", "ai": [{"name": "Datatillgång", "score": 3, "comment": "HBAD-register"}, {"name": "Teknik/IT", "score": 3, "comment": "TRE-miljöer"}, {"name": "Strategi", "score": 3, "comment": "EU4Health"}, {"name": "Juridik", "score": 3, "comment": "Sekundäranv."}, {"name": "Nyttokalkyler", "score": 3, "comment": "EHDS-förberedd"}, {"name": "Kompetens", "score": 2, "comment": "Myndighetskompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "SENASH-TRE"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Direkt sekundäranv."}, {"name": "Data management & governance", "score": 3, "comment": "HBAD-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "SENASH-metadata"}, {"name": "Juridik", "score": 3, "comment": "EHDS HDAB-koppling"}], "nytta": [{"level": "Strategisk", "text": "EHDS-förberedelse — TRE-miljöer för HDAB"}, {"level": "Taktisk", "text": "Nationell samordning av säkra forskningsmiljöer"}, {"level": "Operativ", "text": "Forskartillgång till registerdata i säker miljö"}, {"level": "Teknisk", "text": "TRE-infrastruktur hos HBAD-myndigheter"}, {"level": "Datamässig", "text": "Registerdata tillgänglig i TRE"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "HBAD-myndigheterna (Socialstyrelsen, SCB, Folkhälsomyndigheten, Läkemedelsverket)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "SENASH förbereder HDAB-funktioner: metadatakatalog och databeställningssystem kopplat till EHDS. EU4Health + VR-finansiering. Samverkan mellan 4 HBAD-myndigheter. Knyter samman RUT/Dataguiden med EHDS-krav.", "Datadomän": "Registerdata hos HBAD-myndigheter: Socialstyrelsens hälsodataregister, SCB:s registerdata, Folkhälsomyndighetens smittskyddsdata, Läkemedelsverkets data. Metadatanivå: variabelbeskrivningar, kvalitetsindikatorer, åtkomstregler.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Metadata (DCAT-AP, GSIM-modellen), databeställningsformulär, regelverksspecifikationer. Registerdata: flatfiler, SAS-format, CSV. Under utveckling: EHDS-kompatibla metadataformat.", "Datamängd": "Alla nationella hälsodataregister (Socialstyrelsen 6 register + kvalitetsregister). SCB:s 100+ statistikregister. Ca 28 MSEK total projektbudget (60% EU, 40% nationellt).", "Källsystem": "Socialstyrelsens register, SCB:s register, FoHM:s SmiNet/NVR, Läkemedelsverkets register. RUT/Dataguiden (metadata). MONA (SCB:s analysplattform).", "IoT/sensor": "Inte tillämpligt.", "Standarder": "DCAT-AP (metadatakatalog), GSIM (statistisk informationsmodell), EHDS-metadataformat (under utveckling), HealthData@EU-noden. ISO 11179 (metadata registry).", "Kvalitet": "Metadatakvalitetskrav enligt EHDS art. 55-56. Kvalitetsindikatorer per dataset. Harmonisering av variabelbeskrivningar mellan HBAD-myndigheter."}, "jurisdiktioner": "EHDS — EU 2025/327, Registerförfattningar (SoS), GDPR (EU 2016/679), OSL — Offentlighets- och sekretesslagen"}, {"nr": 13, "n": "WASP (Wallenberg AI, Autonomous Systems and Software Program)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Linköpings universitet (programvärd)", "tid": "2016–2030", "st": "Operativt", "fin": "6 500 MSEK (Knut och Alice Wallenbergs Stiftelse + universiteten)", "fok": "Begränsat — WASP är AI-generellt, inte hälsodataspecifikt", "mg": "AI-forskare, doktorander, industripartners", "del": "A", "sub": "A2", "nk": "Sveriges största enskilda forskningsprogram. Fokus på AI, autonoma system och mjukvara. Inkluderar WASP-HS (humaniora och samhällsvetenskap). Hälsodata är inte ett primärt fokusområde men WASP-kompetens kan tillämpas på hälsodata-AI.", "ehds": "begränsad — generellt AI-program utan specifikt hälsodatafokus.", "korr": "", "dep": "14, 24", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Bred AI-data"}, {"name": "Teknik/IT", "score": 3, "comment": "Stark teknik"}, {"name": "Strategi", "score": 3, "comment": "Nationell AI"}, {"name": "Juridik", "score": 1, "comment": "Begränsad hälso"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Spillover"}, {"name": "Kompetens", "score": 3, "comment": "6.5 mdr forskning"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad hälso"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Spillover"}, {"name": "Data management & governance", "score": 1, "comment": "WASP-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Ej hälso"}, {"name": "Juridik", "score": 1, "comment": "Generell"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet (programvärd)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi, privat"}, {"category": "Verksamhetstyp", "values": "forskning, AI"}, {"category": "Fokusområde", "values": "kompetens, teknik"}, {"category": "Användning", "values": "EJ VÅRDRELATERAT, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Förmåga (fritext)": "WASP är Sveriges största forskningsprogram (6,5 mdr SEK). Generellt AI-fokus, inte hälsodataspecifikt. WASP-HS adresserar samhällsaspekter. Spillover-effekt: AI-kompetens och metoder tillämpbara på hälsodata.", "Datadomän": "AI generellt: maskininlärning, djupinlärning, autonoma system, mjukvara, AI-etik (WASP-HS). Hälsodatatillämpningar förekommer men är inte primärt fokus. Forskningsdomäner: robotik, naturlig språkbehandling, datorseende, optimering.", "Frekvens": "Ej tillämpligt", "Datatyp/format": "Forskningsdata i alla format: bilddata, textdata, sensordata, simuleringsdata. Beräkningsresurser: GPU-kluster, molnresurser.", "Datamängd": "600+ forskare. 80+ doktorander. 5 universitet (LiU, KTH, Chalmers, Lund, Umeå). 6 500 MSEK totalbudget 2016-2030.", "Källsystem": "Universitetens egna beräkningsresurser. NAISS superdatorer (Berzelius, Alvis). Industripartners data (konfidentiellt).", "IoT/sensor": "Sensorer och robotar i forskningsprojekt. Inte hälso-IoT specifikt.", "Standarder": "Öppna forskningsstandarder. PyTorch, TensorFlow, JAX (ML-ramverk). FAIR-principer (forskning). Ej hälsodatastandarder.", "Kvalitet": "Vetenskaplig peer review. Reproducerbarhet genom öppen kod. Ej hälsodataspecifik kvalitetssäkring."}, "jurisdiktioner": "GDPR (EU 2016/679), AI Act — EU 2024/1689, Etikprövningslagen (2003:460)"}, {"nr": 14, "n": "NAISS (National Academic Infrastructure for Supercomputing in Sweden)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Linköpings universitet (värduniversitet)", "tid": "2023–pågående (efterföljare till SNIC)", "st": "Operativt", "fin": "150 MSEK (2023, VR-basanslag)", "fok": "Begränsat — generell beräkningsinfrastruktur, men inkluderar Bianca/UPPMAX för känslig data", "mg": "Alla svenska forskare vid lärosäten", "del": "A", "sub": "A2", "nk": "Nationell forskningsinfrastruktur för beräkning och datalagring. Sex centra: C3SE (Chalmers/GU), HPC2N (Umeå), LUNARC (Lund), NSC (Linköping), PDC (KTH), UPPMAX (Uppsala). Bianca vid UPPMAX hanterar specifikt känsliga data. Arrhenius vid KTH och Mimer vid Linköping är associerade.", "ehds": "beräkningsresurser kan stödja storskalig hälsodataanalys.", "korr": "", "dep": "23, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "HPC-tillgång"}, {"name": "Teknik/IT", "score": 3, "comment": "Superdatorer"}, {"name": "Strategi", "score": 2, "comment": "Forskningsinfra"}, {"name": "Juridik", "score": 2, "comment": "NAISS-avtal"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Beräkningskapacitet"}, {"name": "Kompetens", "score": 2, "comment": "HPC-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "HPC-resurser"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Beräkningsplattform"}, {"name": "Data management & governance", "score": 1, "comment": "NAISS-avtal"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Forskningsavtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet (värduniversitet)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "superdatorcentra, beräkning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "NAISS tillhandahåller nationell beräkningsinfrastruktur. Bianca vid UPPMAX specifikt för känslig data (inkl. hälsodata). Arrhenius (EuroHPC), Berzelius (AI), Dardel (KTH) — alla tillgängliga för hälsodataforskning med rätt avtal.", "Datadomän": "All beräkningsintensiv forskning: genomik/bioinformatik (största hälsodataanvändningen), proteinstruktur, epidemiologisk modellering, medicinsk bildanalys, NLP på klinisk text.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Alla beräkningsformat: FASTQ/BAM/VCF (genomik), DICOM (bild), HDF5 (maskininlärning), CSV/Parquet (tabulär), Singularity/Docker containers (pipelines).", "Datamängd": "6 centra: C3SE (Chalmers), HPC2N (Umeå), LUNARC (Lund), NSC (Linköping), PDC (KTH), UPPMAX (Uppsala). Totalt >50 PB lagringskapacitet. 150 MSEK (2023, VR-basanslag).", "Källsystem": "Forskarnas egna data (uppladdade). Registerdata (via etikgodkännande). Sekvenseringsdata (från SciLifeLab, GMS). Internationell data (EGA, ENA).", "IoT/sensor": "Ej direkt — beräknar data från IoT men tar inte emot realtidsströmmar.", "Standarder": "SLURM (resurshantering), Singularity/Apptainer (containers), SUNET/Swamid (autentisering), Wharf (säker filöverföring till Bianca). ISO 27001-inspirerad säkerhet.", "Kvalitet": "SLA per system (99,5%+ uppetid). NAISS kompetenscentrum för support. SNIC/NAISS användarenkäter. Bianca: isolerade noder, inga nätverksanslutningar."}, "jurisdiktioner": "GDPR (EU 2016/679), Etikprövningslagen (2003:460)"}, {"nr": 15, "n": "ASHA (Analys- och simuleringsmiljö för hälsodata)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Region Östergötland (i samverkan med Linköpings universitet)", "tid": "2023–2027", "st": "Under uppbyggnad", "fin": "30 MSEK (Vinnova)", "fok": "Sekundäranvändning (analysmiljö för hälsodata)", "mg": "Forskare, analytiker inom hälsodataområdet", "del": "A", "sub": "A2", "nk": "Säker analysmiljö för regionala hälsodata, kopplad till NSC:s beräkningsinfrastruktur. Utvecklar federerade analysmetoder. Samverkan med AIDA Data Hub.", "ehds": "direkt — kan bli en komponent i HDAB:s säkra behandlingsmiljöer.", "korr": "", "dep": "14, 38", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Hälsodata-TRE"}, {"name": "Teknik/IT", "score": 3, "comment": "Simulering/analys"}, {"name": "Strategi", "score": 2, "comment": "Östergötland"}, {"name": "Juridik", "score": 2, "comment": "GDPR-compliance"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Regional analys"}, {"name": "Kompetens", "score": 2, "comment": "Analyskapacitet"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "ASHA-miljö"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Hälsodata-analys"}, {"name": "Data management & governance", "score": 2, "comment": "RÖ-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Regionspecifik"}, {"name": "Juridik", "score": 2, "comment": "GDPR/PDL"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Region Östergötland (i samverkan med Linköpings universitet)", "tags": [{"category": "Aktörstyp", "values": "region, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "beräkning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "ASHA bygger säker analysmiljö för regionala hälsodata kopplad till NSC:s beräkningsinfrastruktur. Utvecklar federerade analysmetoder. Samverkan med AIDA Data Hub. Vinnova-finansierat.", "Datadomän": "Regional hälsodata från Region Östergötland: journaldata, labbdata, bilddiagnostik. Fokus på federerad analys — beräkning sker vid datakällan utan central lagring.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Klinisk data i regionalt format (COSMIC-extrakt). ML-modeller (Python/R). Federerade analysprotokoll. DICOM (bilddata via AIDA-koppling).", "Datamängd": "Region Östergötlands ~470 000 invånare. NSC:s beräkningsresurser. 30 MSEK Vinnova-finansiering (2023-2027).", "Källsystem": "COSMIC (Region Östergötland), CMIV (bilddata), SciLifeLab (genomikdata). NSC superdator för beräkning.", "IoT/sensor": "MR-skannrar och CT (bilddata via CMIV). Inte realtids-IoT.", "Standarder": "OMOP CDM (under pilotering), FHIR R4, DICOM. Federerat lärande: PySyft/Flower-ramverk (under utvärdering). GDPR-compliance by design.", "Kvalitet": "Vinnovas projektuppföljning. Etikprövning obligatorisk. Datakvalitetskontroller vid extraktion."}, "jurisdiktioner": "PDL — Patientdatalagen (2008:355), GDPR (EU 2016/679), Etikprövningslagen (2003:460)"}, {"nr": 16, "n": "MONA (Microdata Online Access)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Statistikmyndigheten SCB", "tid": "~2005–pågående", "st": "Operativt", "fin": "Ej specificerat (x mkr). Beslutad plattform för datadelning inom EHDS.", "fok": "Sekundäranvändning (forskningsåtkomst till registerdata)", "mg": "Forskare, analytiker vid myndigheter", "del": "A", "sub": "A2", "nk": "SCB:s befintliga fjärråtkomstsystem för avidentifierade mikrodata. Används av forskare via säker uppkoppling. SCB har fått uppdrag att utveckla säkra behandlingsmiljöer för EHDS (parallellt med Socialstyrelsens HDAB-uppdrag).", "ehds": "direkt — MONA/SCB:s miljö kan bli den nationella säkra behandlingsmiljön under EHDS.", "korr": "", "dep": "38, 17", "ai": [{"name": "Datatillgång", "score": 3, "comment": "SCB mikrodata"}, {"name": "Teknik/IT", "score": 2, "comment": "MONA-plattform"}, {"name": "Strategi", "score": 2, "comment": "Etablerad"}, {"name": "Juridik", "score": 3, "comment": "Stark sekretess"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Registerforsk."}, {"name": "Kompetens", "score": 2, "comment": "Statistikkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "MONA-plattform"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "SCB-registerdata"}, {"name": "Data management & governance", "score": 2, "comment": "SCB-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Mikrodatavariabler"}, {"name": "Juridik", "score": 3, "comment": "Stark sekretess"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Statistikmyndigheten SCB", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "wg_beskr": "Analys och beräkningar av data. MONA är SCB:s plattform för tillgängliggörande av känsligt data. I MONA kan användare göra bearbetningar via internet utan att data lämnar SCB. Utreds som en SPE (Secure Processing Environment) inom ramen för EHDS.", "wg_tek": "", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet)", "Förmåga (fritext)": "MONA är SCB:s befintliga SPE (Secure Processing Environment). Forskare analyserar mikrodata via säker fjärråtkomst utan att data lämnar SCB. Utreds som nationell SPE inom EHDS.", "Datadomän": "SCB:s registerdata: LISA (arbetsmarknad), folk- och bostadsräkningar, utbildningsregister. Kopplad till Socialstyrelsens hälsodataregister, Cancerregistret, Läkemedelsregistret via samkörning.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "SAS-dataset, STATA-format, R-kompatibla data. Avidentifierade mikrodata med SCB som länknyckelinnehavare. Tabelluttag måste sekretessprövas före export.", "Datamängd": "Hela Sveriges befolkning (~10,5M). 100+ statistikregister. Tusentals forskningsprojekt per år. Ca 2 000 aktiva MONA-användare.", "Källsystem": "SCB:s egna register (LISA, befolkningsregistret). Länkade register från Socialstyrelsen, Folkhälsomyndigheten, Läkemedelsverket, CSN, Försäkringskassan m.fl.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "GSIM (metadata), GSBPM (statistisk process), SCB:s egna sekretesspolicyer. EHDS-kompatibilitet utreds (SPE-krav art. 50).", "Kvalitet": "SCB:s kvalitetsramverk (European Statistics Code of Practice). Sekretesspröving av alla tabelluttag. Registervalidering och årlig kvalitetsdokumentation."}, "jurisdiktioner": "OSL — Offentlighets- och sekretesslagen, GDPR (EU 2016/679), Registerförfattningar (SoS), EHDS — EU 2025/327"}, {"nr": 17, "n": "SAFOS (Säker och flexibel offentlig samverkan) + virtuellt datacenter", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Försäkringskassan", "tid": "Pågående", "st": "Operativt", "fin": "Ej specificerat", "fok": "Begränsat — generell myndighetsintern infrastruktur; hälsodata är inte primärt fokus", "mg": "Myndigheter (Försäkringskassan och samverkande myndigheter)", "del": "A", "sub": "A2", "nk": "Försäkringskassans plattform för säker digital samverkan mellan myndigheter. Virtuellt datacenter för driftstjänster. Relevans för hälsodata begränsad till sjukskrivningsdata och rehabiliteringsuppföljning.", "ehds": "begränsad — inte hälsodataspecifik.", "korr": "", "dep": "16, 38", "ai": [{"name": "Datatillgång", "score": 2, "comment": "FK-data"}, {"name": "Teknik/IT", "score": 3, "comment": "Virtuellt DC"}, {"name": "Strategi", "score": 2, "comment": "Myndighetssamv."}, {"name": "Juridik", "score": 2, "comment": "SAFOS-avtal"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Myndighetseffektiv."}, {"name": "Kompetens", "score": 1, "comment": "IT-säkerhet"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "SAFOS VDC"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "FK-hälsodata"}, {"name": "Data management & governance", "score": 2, "comment": "FK-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "FK-variabler"}, {"name": "Juridik", "score": 2, "comment": "SAFOS-avtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Försäkringskassan", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "wg_beskr": "Tjänsten består av en samarbetstjänst och en mötestjänst. Båda är webbaserade och plattformsoberoende där all drift och förvaltning sker i Försäkringskassans eget datacenter av Försäkringskassans säkerhetsklassade personal. De passar myndigheter som arbetar med data som inte får lagras i utländska molntjänster på grund av rådande rättsläge eller informationsklass.", "wg_tek": "", "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Förmåga (fritext)": "SAFOS är Försäkringskassans plattform för säker myndighetssamverkan. Virtuellt datacenter. Hälsodatarelevans begränsad till sjukskrivnings- och rehabiliteringsdata.", "Datadomän": "Myndighetsintern samverkan: sjukskrivningsdata, rehabilitering, arbetsförmågebedömning. Koppling till Försäkringskassans handläggningsprocess. Samarbetsytor och mötestjänster.", "Frekvens": "Real-time (kontinuerligt)", "Datatyp/format": "Dokument (sjukintyg, utlåtanden), ärendedata, videokonferens, samarbetsdokument. Allt lagras i Försäkringskassans datacenter.", "Datamängd": "Försäkringskassan + samverkande myndigheter. Exakt volym ej offentlig.", "Källsystem": "Webcert/Intygstjänster (sjukintyg), Försäkringskassans handläggningssystem, Arbetsförmedlingens system.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "Försäkringskassans interna standarder. Webbaserat, plattformsoberoende. Svenska molntjänstkrav (ej utländska molntjänster).", "Kvalitet": "Försäkringskassans säkerhetsklassade personal. Informationsklassning. Ej hälsodataspecifik kvalitetssäkring."}, "jurisdiktioner": "OSL — Offentlighets- och sekretesslagen, GDPR (EU 2016/679)"}, {"nr": 18, "n": "WCMM (Wallenberg Centre for Molecular Medicine)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Linköpings universitet (+ noder vid Umeå, GU, Lund)", "tid": "2014–2028", "st": "Operativt", "fin": "1 000 MSEK (Knut och Alice Wallenbergs Stiftelse + universiteten)", "fok": "Begränsat — molekylärmedicinskt forskningsprogram, inte hälsodatainfrastruktur", "mg": "Molekylärbiologiska forskare, doktorander", "del": "A", "sub": "A2", "nk": "Nationellt program för att stärka molekylärmedicin vid svenska universitet. Rekryterar internationella forskare. Inte primärt en hälsodatainfrastruktur utan ett forskningsprogram.", "ehds": "begränsad.", "korr": "", "dep": "1, 11", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Molekylärdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Labb-infrastruktur"}, {"name": "Strategi", "score": 2, "comment": "Wallenberg"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Translationell"}, {"name": "Kompetens", "score": 3, "comment": "Molekylärbiol."}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Molekylärforskning"}, {"name": "Data management & governance", "score": 1, "comment": "Wallenberg"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Molekylärdata"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet (+ noder vid Umeå, GU, Lund)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi, privat"}, {"category": "Verksamhetstyp", "values": "forskning"}, {"category": "Fokusområde", "values": "kompetens"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Förmåga (fritext)": "WCMM stärker molekylärmedicin vid svenska universitet. Rekryterar internationella forskare. Inte primärt hälsodatainfrastruktur utan forskningsprogram. Begränsad EHDS-relevans.", "Datadomän": "Molekylärmedicin: single-cell-genomik, spatial transkriptomik, proteomik, metabolomik, kryo-EM. Translationell forskning: grundforskning → klinisk tillämpning.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Experimentell data: single-cell RNA-seq (H5AD), spatial data (Visium), proteomikdata (mzML), kryo-EM (MRC/MRCS), mikroskopi (TIFF/OME-TIFF).", "Datamängd": "1 000 MSEK Wallenberg-finansiering 2014-2028. 4 noder: LiU, Umeå, GU, Lund. 100+ rekryterade forskare.", "Källsystem": "SciLifeLab-plattformar (NGI, proteomikfaciliteter). Universitetens egna labbutrustning. BioImage Archive, EBI.", "IoT/sensor": "Laboratorieinstrument: sekvenserare, masspektrometrar, kryo-EM-mikroskop. Inte klinisk IoT.", "Standarder": "FAIR-principer, MINSEQE (sekvensering), MIAPE (proteomik). Bioinformatikstandarder (nf-core). Ej hälsodatastandarder.", "Kvalitet": "Vetenskaplig peer review. Standardiserade bioinformatikpipelines. Kvalitetskontroller per experiment."}, "jurisdiktioner": "GDPR (EU 2016/679), Etikprövningslagen (2003:460)"}, {"nr": 19, "n": "AI Sweden Informationsdriven Vård (IDV)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "AI Sweden / Lindholmen Science Park", "tid": "2019–2025", "st": "Avslutat/övergång", "fin": "30 MSEK", "fok": "Sekundäranvändning (AI-tillämpningar på hälsodata)", "mg": "Regioner, vårdgivare, AI-utvecklare", "del": "A", "sub": "A2", "nk": "AI Swedens satsning på AI inom hälso- och sjukvård. Fokus på federerat lärande, syntetisk data och kliniska AI-tillämpningar. Projekt avslutades 2025.", "ehds": "resultat och lärdomar kan informera AI-aspekter av EHDS.", "korr": "", "dep": "13, 3, 92", "ai": [{"name": "Datatillgång", "score": 2, "comment": "179 AI-initiativ"}, {"name": "Teknik/IT", "score": 2, "comment": "Kartläggning"}, {"name": "Strategi", "score": 3, "comment": "AI Sweden prio"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Informationsdriven"}, {"name": "Kompetens", "score": 2, "comment": "AI-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Kartläggning"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "AI-initiativdata"}, {"name": "Data management & governance", "score": 2, "comment": "AI Sweden"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "179 kartlagda"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "AI Sweden / Lindholmen Science Park", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "samverkan, AI"}, {"category": "Fokusområde", "values": "strategi, kompetens"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Data governance (styrning, säkerhet, integritet)", "Förmåga (fritext)": "AI Sweden IDV kartlade 179 AI-initiativ inom hälso- och sjukvård i 21 regioner. Fokus: federerat lärande, syntetisk data, AI-mognadsbedömning. Avslutat 2025 — lärdomar informerar vidare arbete.", "Datadomän": "AI-tillämpningar i vård: bilddiagnostik-AI, kliniskt beslutsstöd, prediktionsmodeller, NLP på journaltext, processautomation. Kartläggning av 179 initiativ i 21 regioner.", "Frekvens": "Ej tillämpligt (avslutat)", "Datatyp/format": "Kartläggningsdata (enkätresultat, intervjudata). Syntetiska dataset (prototyper). AI-modeller (Python/PyTorch/TensorFlow). Federerat lärande-prototyper.", "Datamängd": "179 kartlagda AI-initiativ. 30 MSEK total projektbudget. Pilotprojekt med 4-5 regioner.", "Källsystem": "Regionernas journalsystem (via anonymiserade extrakt). AI Swedens GPU-resurser (Berzelius). HDC Region Halland (samarbetspartner).", "IoT/sensor": "Inte direkt i kartläggningen. Kartlagda initiativ inkluderar medicinteknisk AI (t.ex. ECG-analys).", "Standarder": "OHDSI/OMOP (diskuterat men ej implementerat). Federerat lärande-ramverk (Flower, PySyft). AI Swedens referensarkitektur. Ej hälsodatastandarder formellt.", "Kvalitet": "Kartläggningsmetodik dokumenterad. AI-mognadsbedömningsverktyg. Projektets slutrapport publicerad."}, "jurisdiktioner": "GDPR (EU 2016/679), AI Act — EU 2024/1689, PDL — Patientdatalagen (2008:355)"}, {"nr": 20, "n": "AIDA Data Hub / DSP (Data Sharing Platform)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Linköpings universitet (CMIV)", "tid": "2023–2024 (etapp 1); fortsättning planerad", "st": "Operativt", "fin": "Ca 40 MSEK (2023–2024, Vinnova)", "fok": "Sekundäranvändning (delning av AI-träningsdata, främst medicinsk bilddata)", "mg": "AI-forskare, regioner med bilddata, medicintekniska företag", "del": "A", "sub": "A2", "nk": "Nationell datadelningsplattform för medicinsk bilddata och AI. Kopplad till CMIV vid Linköpings universitet. DOI-baserad datapublicering. Federerad åtkomst utan central lagring av patientdata. Koppling till EUCAIM. EHDS-relevans: direkt — bilddata är en kategori under EHDS.", "ehds": "direkt — bilddata är en kategori under EHDS.", "korr": "", "dep": "22, 14", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Bilddiagnostik"}, {"name": "Teknik/IT", "score": 3, "comment": "AIDA DSP"}, {"name": "Strategi", "score": 2, "comment": "CMIV"}, {"name": "Juridik", "score": 2, "comment": "Datadelningsavtal"}, {"name": "Nyttokalkyler", "score": 2, "comment": "AI-diagnostik"}, {"name": "Kompetens", "score": 2, "comment": "Medicinsk bild-AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "AIDA DSP"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Bilddiagnostikdata"}, {"name": "Data management & governance", "score": 2, "comment": "CMIV/LiU"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "AIDA-metadata"}, {"name": "Juridik", "score": 2, "comment": "Datadelningsavtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet (CMIV)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, AI, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}]}, {"nr": 21, "n": "Health Data Sweden", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "KTH (koordinator)", "tid": "2023–2026", "st": "Operativt", "fin": "6 MEuro (EU Digital Europe Programme)", "fok": "Sekundäranvändning (EHDS-förberedelse, pilotering)", "mg": "Myndigheter, forskare, hälsodata-aktörer", "del": "A", "sub": "A3", "nk": "EU-finansierat projekt för att förbereda Sverige för EHDS sekundäranvändning. KTH koordinerar. Partners inkluderar Socialstyrelsen, SCB, E-hälsomyndigheten, VR. Piloterar metadatahantering och datadelning.", "ehds": "direkt — explicit EHDS-förberedelseprojekt.", "korr": "", "dep": "12, 77, 92", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Metadata"}, {"name": "Teknik/IT", "score": 2, "comment": "Koordinerande"}, {"name": "Strategi", "score": 3, "comment": "KTH-lett EU"}, {"name": "Juridik", "score": 2, "comment": "EHDS-alignment"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Nätverksnytta"}, {"name": "Kompetens", "score": 2, "comment": "Projektledning"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "HDS-nätverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Metadata"}, {"name": "Data management & governance", "score": 2, "comment": "KTH-koordinering"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "EU-metadata"}, {"name": "Juridik", "score": 2, "comment": "EHDS-alignment"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "KTH (koordinator)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi, EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan"}, {"category": "Fokusområde", "values": "strategi, teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "EU-finansierat EHDS-förberedelseprojekt. KTH koordinerar. Piloterar metadatahantering och datadelning. Partners: Socialstyrelsen, SCB, E-hälsomyndigheten, VR.", "Datadomän": "Metadatahantering för EHDS: datasetkatalogisering, åtkomstregler, kvalitetsindikatorer. Pilotering av EHDS-kompatibel datadelning mellan svenska aktörer.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Metadata (DCAT-AP), piloteringsdata från svenska register. EHDS-kompatibla format under utveckling.", "Datamängd": "6 MEuro (EU Digital Europe Programme). Multinationellt konsortium. Svensk pilotering med begränsat dataset.", "Källsystem": "Socialstyrelsens register, SCB, E-hälsomyndigheten. HealthData@EU-testbädd.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "EHDS (EU 2025/327), HealthData@EU-noden, DCAT-AP, FHIR R4. EHDS datakategorier (art. 33). Implementerande akter (under utveckling).", "Kvalitet": "EU-projektrapportering. Piloteringsresultat utvärderas. EHDS-kravuppfyllnad mäts."}, "jurisdiktioner": "EHDS — EU 2025/327, GDPR (EU 2016/679)"}, {"nr": 22, "n": "EUCAIM (European Cancer Imaging)", "fk": "EU", "typ": "Digital infrastruktur för datadelning", "ans": "Linköping, Umeå, Västerbotten, KI m.fl. (svenska noder)", "tid": "2023–2026", "st": "Operativt", "fin": "17 MEuro (EU)", "fok": "Sekundäranvändning (cancerbilddata för AI-forskning)", "mg": "Cancerforskare, AI-utvecklare, radiologer", "del": "A", "sub": "A3", "nk": "Europeisk federerad plattform för delning av cancerbilddata. Bygger på DICOM-standard. Svenska noder bidrar med bilddata och kompetens. Koppling till AIDA Data Hub.", "ehds": "direkt — cancer imaging är prioriterad under EHDS.", "korr": "", "dep": "20, 14", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Cancerbilder EU"}, {"name": "Teknik/IT", "score": 3, "comment": "Federerad infra"}, {"name": "Strategi", "score": 2, "comment": "EU-prioritet"}, {"name": "Juridik", "score": 2, "comment": "GDPR cross-border"}, {"name": "Nyttokalkyler", "score": 2, "comment": "AI-diagnostik cancer"}, {"name": "Kompetens", "score": 2, "comment": "Medicinsk bild-AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "EUCAIM federerad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Cancerbilddata"}, {"name": "Data management & governance", "score": 2, "comment": "EU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "DICOM+FHIR"}, {"name": "Juridik", "score": 2, "comment": "GDPR cross-border"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköping, Umeå, Västerbotten, KI m.fl. (svenska noder)", "tags": [{"category": "Aktörstyp", "values": "EHDS, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, AI"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "Europeisk federerad plattform för cancerbilddata. DICOM-standard. Svenska noder (LiU, Umeå, VB, KI) bidrar. Kopplat till AIDA Data Hub. Cancer imaging prioriterad under EHDS.", "Datadomän": "Cancerbilddiagnostik: CT, MRI, mammografi, patologi (WSI), PET-CT. Alla cancerformer. Annoterade dataset för AI-träning.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "DICOM (radiologi), WSI-format (patologi: Hamamatsu NDP, Aperio SVS), NIfTI (hjärnbilder), segmenteringsmasker, annotationsdata. SNOMED CT-kodade lesioner.", "Datamängd": "17 MEuro EU-budget. 80+ partners. 200 000+ bilder planerat. Svenska bidrag via AIDA Data Hub (52 dataset, 57 TB).", "Källsystem": "Sjukhus-PACS (retrospektiva extrakt), AIDA Data Hub, nationella cancerbildarkiv. Federerad åtkomst utan central lagring.", "IoT/sensor": "CT-skannrar, MRI, PET-CT, patologiskannrar. Retrospektiv data — inte realtidsström.", "Standarder": "DICOM, DICOMweb, FHIR ImagingStudy, SNOMED CT (annotationer). Federerad infrastruktur: EUCAIM Central Hub + nationella noder. FAIR-principer.", "Kvalitet": "DICOM-anonymisering (ansiktssuddning, metadata-rensning). Annotationskvalitet: dubbelgranskad av radiologer. Dataset-DOI via DataCite."}, "jurisdiktioner": "EHDS — EU 2025/327, GDPR (EU 2016/679), AI Act — EU 2024/1689"}, {"nr": 23, "n": "Arrhenius (superdator)", "fk": "EU", "typ": "Superdatorcentra för känslig data", "ans": "Linköpings universitet (en del av NAISS/EuroHPC)", "tid": "Driftsättning 2024/2025–pågående", "st": "Under driftsättning", "fin": "68,5 MEuro (EuroHPC JU + nationell medfinansiering)", "fok": "Begränsat — generell beräkningsinfrastruktur, inte hälsodataspecifik", "mg": "Alla svenska och europeiska forskare", "del": "A", "sub": "A3", "nk": "EuroHPC petascale-superdator. Inte specifikt designad för hälsodata men kan användas för storskalig hälsodataanalys. Del av NAISS.", "ehds": "indirekt — beräkningsresurs.", "korr": "", "dep": "14, 24", "ai": [{"name": "Datatillgång", "score": 2, "comment": "EJ hälsodata"}, {"name": "Teknik/IT", "score": 3, "comment": "EuroHPC"}, {"name": "Strategi", "score": 1, "comment": "Beräkningskapac."}, {"name": "Juridik", "score": 1, "comment": "Öppen"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Indirekt"}, {"name": "Kompetens", "score": 1, "comment": "HPC-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Ej hälso"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Beräkning"}, {"name": "Data management & governance", "score": 1, "comment": "EuroHPC"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Öppen"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet (en del av NAISS/EuroHPC)", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "superdatorcentra, beräkning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "EJ VÅRDRELATERAT, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Förmåga (fritext)": "EuroHPC petascale-superdator vid NSC/Linköping. Generell beräkningsresurs — inte hälsodataspecifik. Kan användas för storskalig hälsodataanalys med rätt avtal.", "Datadomän": "All beräkningsintensiv forskning: klimatmodellering, materialvetenskap, genomik, AI-träning. Hälsodata möjligt men inte primärt.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Alla HPC-format. Parallella beräkningsjobb. GPU-acceleration tillgänglig.", "Datamängd": "68,5 MEuro (EuroHPC JU + nationellt). Topprestanda: ~30 PFLOPS. Del av NAISS.", "Källsystem": "Forskarnas egna data. EuroHPC-åtkomst via PRACE/EuroHPC JU.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "SLURM, MPI, OpenMP, CUDA. EuroHPC JU access policies.", "Kvalitet": "NSC driftstandard. EuroHPC JU uppföljning."}, "jurisdiktioner": "GDPR (EU 2016/679)"}, {"nr": 24, "n": "AI Factory Mimer", "fk": "EU", "typ": "Superdatorcentra för känslig data", "ans": "Linköpings universitet / RISE (en del av NAISS/EuroHPC)", "tid": "2024–2029", "st": "Under uppbyggnad", "fin": "60 MEuro (EuroHPC JU + nationell medfinansiering)", "fok": "Begränsat — generell AI-infrastruktur, inte hälsodataspecifik", "mg": "AI-forskare och företag i Sverige och Europa", "del": "A", "sub": "A3", "nk": "EuroHPC AI Factory för att stödja AI-utveckling med kraftfull beräkningskapacitet. Inte hälsodataspecifik men kan användas för hälso-AI.", "ehds": "indirekt.", "korr": "", "dep": "14, 23, 13", "ai": [{"name": "Datatillgång", "score": 3, "comment": "AI-träningsdata"}, {"name": "Teknik/IT", "score": 3, "comment": "GPU-kluster"}, {"name": "Strategi", "score": 3, "comment": "AI Factory EU"}, {"name": "Juridik", "score": 1, "comment": "Öppen"}, {"name": "Nyttokalkyler", "score": 2, "comment": "AI-innovation"}, {"name": "Kompetens", "score": 2, "comment": "AI/ML-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GPU-kapacitet"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "AI-träning"}, {"name": "Data management & governance", "score": 1, "comment": "LiU/EuroHPC"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Öppen"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Linköpings universitet / RISE (en del av NAISS/EuroHPC)", "tags": [{"category": "Aktörstyp", "values": "EHDS, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "superdatorcentra, AI, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Förmåga (fritext)": "EuroHPC AI Factory för storskalig AI-träning. GPU-rik infrastruktur. Inte hälsodataspecifik men kan användas. Koppling till Mimer-systemet vid NSC.", "Datadomän": "Storskalig AI: stora språkmodeller (LLM), datorseende, generativ AI. Hälso-AI möjligt med rätt avtal och datasäkerhet.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "AI-träningsdata: bilder, text, tabulär, multimodal. GPU-optimerade format (TFRecord, WebDataset).", "Datamängd": "60 MEuro (EuroHPC + nationellt). Tusentals GPU:er (NVIDIA H100-generation). 2024-2029.", "Källsystem": "Forskardata, öppna dataset, industripartners data.", "IoT/sensor": "Inte tillämpligt.", "Standarder": "PyTorch, JAX, DeepSpeed. NVIDIA CUDA/NCCL. EuroHPC JU regler. Ej hälsodatastandarder.", "Kvalitet": "RISE:s kvalitetsramverk. EuroHPC benchmarks."}, "jurisdiktioner": "GDPR (EU 2016/679), AI Act — EU 2024/1689"}, {"nr": 25, "n": "GDI (Genomic Data Infrastructure)", "fk": "EU", "typ": "Digital infrastruktur för datadelning", "ans": "NBIS/SciLifeLab (svensk nod); 32 MSEK till NBIS", "tid": "2022–2026", "st": "Operativt", "fin": "40 MEuro (EU Digital Europe Programme); 32 MSEK till svenska noden (NBIS)", "fok": "Sekundäranvändning (genomikdata för forskning)", "mg": "Genomikforskare, klinisk genetik, biobanker", "del": "A", "sub": "A3", "nk": "Europeisk infrastruktur för delning av genomikdata i linje med 1+ Million Genomes-deklarationen. Bygger på GA4GH-standarder (Beacon, htsget). Svensk nod vid NBIS. Koppling till GMS.", "ehds": "direkt — genomikdata specificerad i EHDS.", "korr": "", "dep": "1, 26, 54, 67", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Genomikdata EU"}, {"name": "Teknik/IT", "score": 3, "comment": "Beacon/Passports"}, {"name": "Strategi", "score": 3, "comment": "1+MG genomförande"}, {"name": "Juridik", "score": 3, "comment": "GDPR+EHDS"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Gränsöversk. forsk"}, {"name": "Kompetens", "score": 2, "comment": "Genomik-IT"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GDI-noder"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Genomikdata EU"}, {"name": "Data management & governance", "score": 2, "comment": "1+MG governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "GA4GH-standarder"}, {"name": "Juridik", "score": 3, "comment": "EHDS+GDPR"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "NBIS/SciLifeLab (svensk nod); 32 MSEK till NBIS", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Tillgängliggöra data (integration, uppdateringsfrekvens), Data governance (styrning, säkerhet, integritet), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "Europeisk infrastruktur för genomikdatadelning under 1+MG-deklarationen. GA4GH-standarder (Beacon, htsget). Svensk nod vid NBIS. Direkt EHDS-koppling: genomikdata specificerad.", "Datadomän": "Genomikdata: referensgenom, klinisk genomik, populationsgenetik. Fenotypdata kopplad till genom. 27 EU-länder.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "VCF/gVCF (varianter), BAM/CRAM (alignment), Phenopackets (fenotyp), Beacon v2-svar (discovery). DUO (Data Use Ontology) för åtkomstregler.", "Datamängd": "40 MEuro (EU Digital Europe). 32 MSEK till svensk nod (NBIS). Mål: 1+ miljoner genom tillgängliga via federerad infrastruktur.", "Källsystem": "Nationella genomikcentra (GMS i Sverige), biobanker, klinisk genetik. EGA (European Genome-phenome Archive). FEGA Sweden.", "IoT/sensor": "Sekvensinstrument (indirekt — genererar den data som delas).", "Standarder": "GA4GH: Beacon v2, htsget, Phenopackets v2, DUO, Passports. FHIR Genomics IG. DCAT-AP (metadata). ISO 27001 (säkerhet).", "Kvalitet": "GA4GH interoperabilitetstester. GDI conformance suite. ELIXIR datakvalitetsramverk."}, "jurisdiktioner": "EHDS — EU 2025/327, GDPR (EU 2016/679), Biobankslagen (2023:38)"}, {"nr": 26, "n": "NBIS (National Bioinformatics Infrastructure Sweden)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "SciLifeLab (+noder vid alla MedFak utom Örebro)", "tid": "Pågående", "st": "Operativt", "fin": "105 MSEK (2023, VR + SciLifeLab)", "fok": "Sekundäranvändning (bioinformatikstöd för forskare)", "mg": "Forskare inom life science som behöver bioinformatikexpertis", "del": "A", "sub": "A3", "nk": "Nationellt bioinformatikcentrum. Stödjer forskare med dataanalys, datapublicering och datahantering. Driftar svensk ELIXIR-nod. Ansvarar för GDI:s svenska implementation. Hanterar dataflöden för Genome of Europe.", "ehds": "indirekt men viktig infrastrukturkomponent.", "korr": "", "dep": "11, 14, 25, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Bioinformatikdata"}, {"name": "Teknik/IT", "score": 3, "comment": "NBIS pipelines"}, {"name": "Strategi", "score": 2, "comment": "SciLifeLab"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Analyskapacitet"}, {"name": "Kompetens", "score": 3, "comment": "Bioinformatik bred"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "NBIS-pipelines"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Bioinformatikdata"}, {"name": "Data management & governance", "score": 2, "comment": "SciLifeLab"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NBIS-metadata"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "SciLifeLab (+noder vid alla MedFak utom Örebro)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, forskning"}, {"category": "Fokusområde", "values": "teknik, kompetens"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Tillgängliggöra data (integration, uppdateringsfrekvens), Data management (sammanhållen data, semantik)", "Förmåga (fritext)": "NBIS är nationellt bioinformatikcentrum vid SciLifeLab. Stödjer forskare med dataanalys, datapublicering, datahantering. Driftar FEGA Sweden, svensk ELIXIR-nod, GDI-implementation.", "Datadomän": "Bioinformatik: genomik, transkriptomik, proteomik, metabolomik, strukturbiologi, bildanalys. Datahantering: DMP, datapublicering, FAIR-implementering.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "FASTQ/BAM/VCF (genomik), TIFF/OME-TIFF (mikroskopi), mzML (proteomik), HDF5/H5AD (single-cell). nf-core pipelines (144+). Nextflow+Docker/Singularity.", "Datamängd": "105 MSEK (2023, VR + SciLifeLab). Noder vid alla MedFak utom Örebro. 40+ bioinformatiker. DDS (Data Delivery System): end-to-end-krypterad dataöverföring.", "Källsystem": "SciLifeLab-plattformar (NGI, Clinical Genomics, Proteomics m.fl.). Internationella arkiv: EGA, ENA, PRIDE, UniProt, PDB. FEGA Sweden.", "IoT/sensor": "Sekvensinstrument (Illumina, PacBio, Nanopore) — NBIS tar emot data, inte realtidsström.", "Standarder": "FAIR-principer. GA4GH (Beacon, htsget, Phenopackets, DUO). ELIXIR RDMkit. nf-core (144+ pipelines). ISO 17025 (NGI ackreditering). Data Stewardship Wizard.", "Kvalitet": "FastQC, MultiQC, CheckQC, Cutadapt (bioinformatik-QC). DMP obligatoriska. NBIS erbjuder gratis datahanteringskonsultation. Data lagras minst 10 år."}, "jurisdiktioner": "GDPR (EU 2016/679), Etikprövningslagen (2003:460)"}, {"nr": 27, "n": "Bianca / UPPMAX", "fk": "EU", "typ": "Superdatorcentra för känslig data", "ans": "Uppsala universitet (en del av NAISS)", "tid": "2004–pågående", "st": "Operativt", "fin": "Ca 75 MSEK (löpande, del av NAISS)", "fok": "Sekundäranvändning (beräkningsmiljö för känsliga data, inklusive hälsodata)", "mg": "Forskare som behöver beräkna på känsliga persondata", "del": "A", "sub": "A3", "nk": "Bianca är NAISS-systemet för känslig data vid UPPMAX. Isolerade projektkluster utan internetåtkomst. Tvåfaktorsautentisering via SUNET. Wharf-system för säker dataöverföring.", "ehds": "indirekt men en av de mest använda miljöerna för hälsodataforskning i Sverige.", "korr": "", "dep": "14, 26", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Känslig forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "UPPMAX-säkerhet"}, {"name": "Strategi", "score": 2, "comment": "Uppsala univ"}, {"name": "Juridik", "score": 2, "comment": "NAISS-avtal"}, {"name": "Nyttokalkyler", "score": 2, "comment": "TRE-kapacitet"}, {"name": "Kompetens", "score": 2, "comment": "HPC-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Bianca-kluster"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Känslig forskn.data"}, {"name": "Data management & governance", "score": 2, "comment": "NAISS/UU"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "UPPMAX-specifik"}, {"name": "Juridik", "score": 2, "comment": "NAISS-avtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Uppsala universitet (en del av NAISS)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "superdatorcentra, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft), Data governance (styrning, säkerhet, integritet)", "Förmåga (fritext)": "Bianca är NAISS-systemet för känslig data vid UPPMAX/Uppsala. Isolerade projektkluster utan internet. Mest använda miljön för hälsodataforskning i Sverige. Wharf för säker filöverföring.", "Datadomän": "Känslig forskningsdata: klinisk data, genomikdata, registerdata, bilddata. Alla forskningsprojekt med etikgodkännande för känsliga personuppgifter.", "Frekvens": "Batch (dagligen/veckovis)", "Datatyp/format": "Alla forskningsformat: VCF, BAM, DICOM, CSV, SAS, STATA, R. Linux-miljö med fria programvaruinstallationer. Singularity-containers.", "Datamängd": "4 480 kärnor, 204 noder (128 GB RAM), 10 GPU-noder (NVIDIA A100). >7 PB lagringskapacitet (UPPMAX totalt). Ca 75 MSEK löpande (del av NAISS). Hundratals aktiva projekt.", "Källsystem": "Forskarnas egna data. SCB/Socialstyrelsen (registerdata via utlämning). SciLifeLab/GMS (genomikdata). Internationella arkiv.", "IoT/sensor": "Inte tillämpligt — beräkningsmiljö, inte datainsamling.", "Standarder": "NAISS säkerhetspolicy. Wharf (säker filöverföring). SFTP via SUNET. Tvåfaktorsautentisering. Isolerade projektkluster (ingen internetåtkomst inifrån). SLURM.", "Kvalitet": "Bianca-säkerhetsmodell: projektkluster utan nätverksåtkomst, inspelning av alla terminalsessioner (thinlinc), automatisk sessionstidsgräns. UPPMAX supportteam. NAISS SLA."}, "jurisdiktioner": "GDPR (EU 2016/679), Etikprövningslagen (2003:460)"}, {"nr": 28, "n": "TEHDAS2 (Towards the European Health Data Space 2)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "21 EU-medlemsstater (Finland koordinator); Sverige deltar", "tid": "2023–2025", "st": "Avslutat/övergång", "fin": "Ej specificerat (x MEuro, EU4Health Joint Action)", "fok": "Sekundäranvändning (EHDS-förberedelse på EU-nivå)", "mg": "Nationella myndigheter, policymakare", "del": "A", "sub": "A3", "nk": "Joint Action för att förbereda EHDS sekundäranvändning på EU-nivå. Utvecklade gemensamma principer för datakvalitet, metadata, säkra behandlingsmiljöer. Uppföljare till TEHDAS1. Resultat informerar EHDS implementerande akter.", "ehds": "direkt — föregångare till EHDS-reglering.", "korr": "", "dep": "12, 61, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "EU metadata"}, {"name": "Teknik/IT", "score": 2, "comment": "Standardisering"}, {"name": "Strategi", "score": 3, "comment": "EHDS-förberedd"}, {"name": "Juridik", "score": 3, "comment": "Juridik central"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Policy-nytta"}, {"name": "Kompetens", "score": 2, "comment": "EU-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "TEHDAS2-ramverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "EHDS-förberedelse"}, {"name": "Data management & governance", "score": 3, "comment": "EU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "EHDS-metadata"}, {"name": "Juridik", "score": 3, "comment": "EHDS-juridik central"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "21 EU-medlemsstater (Finland koordinator); Sverige deltar", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan"}, {"category": "Fokusområde", "values": "strategi, juridik"}, {"category": "Användning", "values": "sekundäranvändning, ursprunglig"}], "datafordj": {"Förmågor": "Data governance (styrning, säkerhet, integritet), Externa krav (EHDS, NDI)", "Förmåga (fritext)": "Joint Action som utvecklade gemensamma principer för EHDS sekundäranvändning: datakvalitet, metadata, SPE-krav. Resultat informerar EHDS implementerande akter. Sverige deltog aktivt.", "Datadomän": "EHDS-policynivå: datakvalitetsprinciper, metadatastandard, SPE-krav, datasetkategorisering, åtkomstregler, etiska principer för sekundäranvändning.", "Frekvens": "Ej tillämpligt (policyarbete)", "Datatyp/format": "Policydokument, rekommendationer, tekniska specifikationer. Piloteringsresultat (begränsad faktisk data).", "Datamängd": "21 EU-medlemsstater deltar. Finland koordinerar. Budget ej specificerat (EU4Health Joint Action).", "Källsystem": "Nationella hälsodatamyndigheter i 21 EU-länder. Europeiska kommissionen (DG SANTE, HaDEA).", "IoT/sensor": "Inte tillämpligt.", "Standarder": "EHDS-utkast (nu EU 2025/327), DCAT-AP (metadata), HL7 FHIR, OMOP CDM (diskuterat), ISO 27001 (SPE-krav), GDPR art. 89 (forskningsundantag).", "Kvalitet": "EU-projektrapportering. Joint Action-kvalitetssäkring. Peer review av leverabler."}, "jurisdiktioner": "EHDS — EU 2025/327, GDPR (EU 2016/679)"}, {"nr": 29, "n": "KI TRE / RIKI (Research Infrastructure KI)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Karolinska Institutet", "tid": "RIKI lanserat 1 januari 2026; TRE-kapacitet under uppbyggnad", "st": "Under uppbyggnad", "fin": "Ej specificerat. DSN-PMD förstudie 2024–2025 (SciLifeLab-finansierad). TRE4HealthAI (Vinnova-finansierat, Chalmers Industriteknik koordinerar).", "fok": "Sekundäranvändning (säker forskningsmiljö för hälsodata)", "mg": "KI-forskare, externa samarbetspartners", "del": "B", "sub": "B", "nk": "RIKI är KI:s nya samlade organisation för forskningsinfrastruktur (lanserad 1 jan 2026). TRE-kapacitet byggs upp inom RIKI. DSN-PMD-förstudie utvärderar TRE-lösningar. Deltar i TRE4HealthAI (Vinnova). Tillförordnad direktör: Karin Dahlman Wright. Full uppbyggnad planerad till sommaren 2027. EHDS-relevans: kan bli en nod för säker forskningsmiljö.", "ehds": "kan bli en nod för säker forskningsmiljö.", "korr": "", "dep": "14, 27, 38", "ai": [{"name": "Datatillgång", "score": 3, "comment": "KI forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "RIKI-plattform"}, {"name": "Strategi", "score": 2, "comment": "KI prioritet"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarproduktivitet"}, {"name": "Kompetens", "score": 2, "comment": "KI-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "KI TRE"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Forskningsdata KI"}, {"name": "Data management & governance", "score": 2, "comment": "KI-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "KI-metadata"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Karolinska Institutet", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 30, "n": "GU TRE (Göteborgs universitets forskningsdatamiljö)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Göteborgs universitet", "tid": "Operativt sedan tidigt 2024", "st": "Operativt", "fin": "Ej specificerat", "fok": "Sekundäranvändning (säker forskningsmiljö)", "mg": "GU-forskare och samarbetspartners", "del": "B", "sub": "B", "nk": "Vault-baserad arkitektur (70 vaults dokumenterade). BankID och Freja eID-autentisering. Hög säkerhetsnivå. Hemvist för SCIFI-PEARL och OMOP CDM-arbete. tre.gu.se som webbadress. EHDS-relevans: potentiell nod för säkra behandlingsmiljöer.", "ehds": "potentiell nod för säkra behandlingsmiljöer.", "korr": "", "dep": "14, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "GU forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "GU TRE-plattform"}, {"name": "Strategi", "score": 2, "comment": "GU prioritet"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarproduktivitet"}, {"name": "Kompetens", "score": 2, "comment": "GU-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GU TRE"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Forskningsdata GU"}, {"name": "Data management & governance", "score": 2, "comment": "GU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "GU-metadata"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Göteborgs universitet", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 31, "n": "Vesta (Uppsala universitets säkra forskningsmiljö)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Uppsala universitet, IT-avdelningen", "tid": "Operativt sedan ~2021–2022", "st": "Operativt", "fin": "Avgiftsfinansierad (användaravgifter)", "fok": "Sekundäranvändning (säker forskningsmiljö)", "mg": "Uppsala-forskare", "del": "B", "sub": "B", "nk": "Tilläggstjänst vid Uppsala universitet för säker lagring och bearbetning av känslig forskningsdata. Lokaliserad i universitetets egna serverhallar med KRT-värde 332. Erbjuder virtuell dator (VDI-miljö) med krypterad lagring och krypterad trafik. Snapshots skapas regelbundet. Frihet under ansvar-modell — inga hårda exportbegränsningar men tydliga användarvillkor. Avgift: ca 4 300 kr/år för VDI + ca 4 700 kr/TB/år lagring. EHDS-relevans: potentiell TRE-miljö för universitetsbaserad hälsodataforskning.", "ehds": "potentiell TRE-miljö för universitetsbaserad hälsodataforskning.", "korr": "", "dep": "14, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "UU forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "Vesta VDI"}, {"name": "Strategi", "score": 2, "comment": "UU prioritet"}, {"name": "Juridik", "score": 2, "comment": "KRT 332"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarproduktivitet"}, {"name": "Kompetens", "score": 1, "comment": "UU-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Vesta VDI"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Forskningsdata UU"}, {"name": "Data management & governance", "score": 2, "comment": "UU IT-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 2, "comment": "UU-avtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Uppsala universitet, IT-avdelningen", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 32, "n": "LUSEC (Lund University Secure Computing Environment)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Lunds universitet (Medicinska fakulteten)", "tid": "Operativt sedan september 2018", "st": "Operativt", "fin": "Ej specificerat (del av LU:s infrastrukturbudget)", "fok": "Sekundäranvändning (säker forskningsmiljö)", "mg": "LU-forskare, LUPOP-användare", "del": "B", "sub": "B", "nk": "IBM Spectrum Scale + Citrix StoreFront/ShareFile. Google Authenticator MFA. LUPOP (Lund University Population Research Platform) använder LUSEC som sin beräkningsmiljö. Partner i EU-projektet FLORENCE (federerat lärande för cancerdata). EHDS-relevans: potentiell nod via LUPOP:s registerdata.", "ehds": "potentiell nod via LUPOP:s registerdata.", "korr": "", "dep": "14, 27", "ai": [{"name": "Datatillgång", "score": 3, "comment": "LU forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "LUSEC-plattform"}, {"name": "Strategi", "score": 2, "comment": "LU prioritet"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarproduktivitet"}, {"name": "Kompetens", "score": 2, "comment": "LU-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "LUSEC"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Forskningsdata LU"}, {"name": "Data management & governance", "score": 2, "comment": "LU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "LU-metadata"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Lunds universitet (Medicinska fakulteten)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 33, "n": "SFM (Säker Forskningsmiljö, VGR)", "fk": "Regionerna", "typ": "Superdatorcentra för känslig data", "ans": "Västra Götalandsregionen, Koncernkontoret, Enheten för Forskning och Juridik", "tid": "Under uppbyggnad (enhetschef rekryterad feb 2026)", "st": "Under uppbyggnad", "fin": "VGR-finansierad (regionens egen budget)", "fok": "Sekundäranvändning (säker regional forskningsmiljö)", "mg": "Forskare med VGR-data, framtida HDAB-användare", "del": "B", "sub": "B", "nk": "VGR:s egenutvecklade system för säker hantering av forskningsdata. Driftas av en enhet med ca 15 medarbetare/konsulter med kompetens inom juridik, CPUA och systemutveckling. Enheten etablerar processer för handläggning och utlämnande av data för forskningsändamål. Koppling till Nationella Genomikplattformen som förvaltas inom samma enhet. EHDS-relevans: regional TRE-modell som kan bli mall för andra regioners forskningsmiljöer.", "ehds": "regional TRE-modell som kan bli mall för andra regioners forskningsmiljöer.", "korr": "", "dep": "1, 38, 42", "ai": [{"name": "Datatillgång", "score": 3, "comment": "VGR forskn.data"}, {"name": "Teknik/IT", "score": 3, "comment": "Egenutvecklat"}, {"name": "Strategi", "score": 2, "comment": "VGR prioritet"}, {"name": "Juridik", "score": 2, "comment": "GDPR/etik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskarproduktivitet"}, {"name": "Kompetens", "score": 2, "comment": "VGR FoU-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "VGR SFM"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "VGR forskningsdata"}, {"name": "Data management & governance", "score": 2, "comment": "VGR FoU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "VGR-metadata"}, {"name": "Juridik", "score": 2, "comment": "VGR-avtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Västra Götalandsregionen, Koncernkontoret, Enheten för Forskning och Juridik", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 34, "n": "SUNET Drive Secure", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "SUNET (Swedish University Computer Network)", "tid": "Operativt sedan ~2022; säkra zoner under utveckling", "st": "Operativt (grundplattform); Under utveckling (säkra zoner)", "fin": "Del av SUNET:s verksamhetsbudget", "fok": "Begränsat — generell fillagringstjänst; säkra zoner kan möjliggöra hälsodata", "mg": "Forskare och personal vid 110 anslutna organisationer", "del": "B", "sub": "B", "nk": "Nextcloud med Safespring S3-lagring. 54 federerade instanser. 750 000 användare totalt (hela SUNET-basen, inte enbart Drive). Säkra zoner under utveckling — utmaningar med Global Site Selector och MFA. EHDS-relevans: säkra zoner kan potentiellt stödja forskningsdatadelning.", "ehds": "säkra zoner kan potentiellt stödja forskningsdatadelning.", "korr": "", "dep": "14", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Fildelning säker"}, {"name": "Teknik/IT", "score": 3, "comment": "SUNET infrastruktur"}, {"name": "Strategi", "score": 2, "comment": "Nationell"}, {"name": "Juridik", "score": 2, "comment": "GDPR-grundläggande"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Samarbetsnytta"}, {"name": "Kompetens", "score": 1, "comment": "Generell IT"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Fildelning"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Begränsad"}, {"name": "Data management & governance", "score": 1, "comment": "SUNET"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Generell"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "SUNET (Swedish University Computer Network)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 35, "n": "ORU Data Factory (Örebro universitet)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Superdatorcentra för känslig data", "ans": "Örebro universitet", "tid": "Operativt sedan 2020", "st": "Operativt", "fin": "Ej specificerat (investering 2019–2020)", "fok": "Begränsat — generell AI-infrastruktur med viss hälsotillämpning", "mg": "ORU-forskare, AI Sweden regionala nod-användare", "del": "B", "sub": "B", "nk": "NVIDIA DGX-1 beräkningsresurs. AI Sweden regionala nod. Inte primärt inriktat på hälsodata. EHDS-relevans: begränsad.", "ehds": "begränsad.", "korr": "", "dep": "14", "ai": [{"name": "Datatillgång", "score": 3, "comment": "ORU forskn.data"}, {"name": "Teknik/IT", "score": 2, "comment": "Data Factory"}, {"name": "Strategi", "score": 2, "comment": "ORU lokal"}, {"name": "Juridik", "score": 2, "comment": "Etikprövning"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Lokal forskning"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "ORU lokal"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "ORU forskn.data"}, {"name": "Data management & governance", "score": 1, "comment": "ORU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Lokal"}, {"name": "Juridik", "score": 1, "comment": "Lokal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Örebro universitet", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 36, "n": "Alma journalsystem (Almasoft)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Almasoft AB", "tid": "Sedan 1988–pågående", "st": "Operativt", "fin": "Kommersiell produkt (licensbaserad)", "fok": "Primäranvändning (tandvårdsjournalsystem)", "mg": "Privata och offentliga tandvårdskliniker", "del": "B", "sub": "B", "nk": "CE-märkt journalsystem för tandvård. Hanterar patientjournaler, röntgenbilder, ekonomi och planering. Användning vid HKR (Högskolan Kristianstad) i utbildningskontext. EHDS-relevans: tandvårdsdata kan ingå under EHDS beroende på nationell implementation.", "ehds": "tandvårdsdata kan ingå under EHDS beroende på nationell implementation.", "korr": "", "dep": "3", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Journaldata tandvård"}, {"name": "Teknik/IT", "score": 2, "comment": "Proprietärt"}, {"name": "Strategi", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Leverantörsberoende"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Begränsad"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Proprietärt"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Tandvårdsdata"}, {"name": "Data management & governance", "score": 1, "comment": "Leverantör"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Leverantörsavtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Almasoft AB", "tags": [{"category": "Aktörstyp", "values": "privat"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 37, "n": "Unident Onepix", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Unident AB (Falkenberg)", "tid": "Pågående", "st": "Operativt", "fin": "Kommersiell produkt (licensbaserad)", "fok": "Primäranvändning (tandvårdsbilddiagnostik)", "mg": "Tandvårdskliniker i Skandinavien", "del": "B", "sub": "B", "nk": "DICOM-baserat bildhanteringssystem för tandvård. Över 7 000 behandlingsrum i Skandinavien. Integrerar med journalsystem som Alma. EHDS-relevans: DICOM-standard relevant för bilddelning under EHDS.", "ehds": "DICOM-standard relevant för bilddelning under EHDS.", "korr": "", "dep": "3", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Bilddata tandvård"}, {"name": "Teknik/IT", "score": 2, "comment": "Proprietärt"}, {"name": "Strategi", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Leverantörsberoende"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Begränsad"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Proprietärt"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Tandvårdsbilddata"}, {"name": "Data management & governance", "score": 1, "comment": "Leverantör"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Leverantörsavtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Unident AB (Falkenberg)", "tags": [{"category": "Aktörstyp", "values": "privat"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 39, "n": "NTjP (Nationella tjänsteplattformen)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "~2008–pågående", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud (finansieras via ägarskap från regioner/kommuner/SKR)", "fok": "Primäranvändning (integrationsplattform för alla nationella hälsotjänster)", "mg": "Alla vårdgivare, myndigheter och leverantörer anslutna till nationella hälso-IT-tjänster", "del": "C", "sub": "C1", "nk": "Federerad integrationshub som routar API-anrop mellan hälso-IT-system — lagrar ingen data själv. Volym: över 70 miljoner producentanrop/månad (TLV-rapport 2021 nämnde 200 miljoner totala anrop/månad). Tjänstedomäner: bokning, listning, sammanhållen journalföring, remisser, patientjournalåtkomst. Containerisering genomförd 2023–2024 (produktionsmigration med TLS 1.3 feb 2026). T2-arkitekturen (fastslagen juni 2023) möjliggör direkta REST/JSON-integrationer utanför NTjP, medvetet EIRA-anpassad för EHDS. EHDS-relevans: direkt — all nationell hälsodataväxling passerar genom eller koordineras med NTjP.", "ehds": "direkt — all nationell hälsodataväxling passerar genom eller koordineras med NTjP.", "korr": "", "dep": "4, 5, 41, 48, 60", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Transportlager"}, {"name": "Teknik/IT", "score": 3, "comment": "RIV-TA SOAP/XML"}, {"name": "Strategi", "score": 2, "comment": "Inera-förvaltat"}, {"name": "Juridik", "score": 2, "comment": "Ramavtal"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Interoperabilitet"}, {"name": "Kompetens", "score": 1, "comment": "Integration"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "NTjP transport"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Transportlager"}, {"name": "Data management & governance", "score": 2, "comment": "Inera-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "RIV-TA kontrakt"}, {"name": "Juridik", "score": 2, "comment": "Ramavtal"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "RIV-TA tjänstekontrakt, SOAP/XML, CDA-dokument", "tek": "NTjP — RIV-TA SOAP/XML-baserat, Inera-driftat, modernisering till FHIR diskuteras", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}], "wg_beskr": "NTP är navet mellan system som behöver kommunicera med varandra. Genom att ansluta sina verksamhetssystem till NTP kan regioner, kommuner och privata vårdgivare utbyta information med varandra utan att behöva upprätta direkta kopplingar mellan sina system.", "wg_tek": "Teknisk plattform för informationsutbyte mellan olika it-system inom vård och omsorg. Arkitekturen bygger på att system är löst kopplade genom plattformen (tjänstekonsument ↔ NTjP ↔ tjänsteproducent), vilket gör integration skalbar, flexibel och mindre beroende av enskilda systemimplementationer. Plattformen migrerades till en containerdriftmiljö 2024."}, {"nr": 41, "n": "SITHS (Secure IT for Health and Social care)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "~2003–pågående", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning (autentisering och behörighetsstyrning för all hälsodataåtkomst)", "mg": "All vårdpersonal, kommunal omsorgspersonal", "del": "C", "sub": "C1", "nk": "Nationell PKI-infrastruktur för hälso- och sjukvården. Mobilt SITHS för Android/iOS. IdP Plus lanserad 30 september 2025 (krävs för NLL-åtkomst från 1 december 2025). Nytt förenklat utfärdande för utländska medborgare utan svenskt personnummer (januari 2026). SITHS tillitsnivå 3 ≈ eIDAS substantial. EHDS-relevans: direkt — autentiseringslager för EHDS primary use.", "ehds": "direkt — autentiseringslager för EHDS primary use.", "korr": "", "dep": "39, 48", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Identitetsdata"}, {"name": "Teknik/IT", "score": 3, "comment": "PKI/smartkort"}, {"name": "Strategi", "score": 2, "comment": "Inera-förvaltat"}, {"name": "Juridik", "score": 2, "comment": "eIDAS-koppling"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Säkerhet"}, {"name": "Kompetens", "score": 1, "comment": "IT-säkerhet"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "SITHS autentisering"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Identitetsdata"}, {"name": "Data management & governance", "score": 1, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "SITHS-certifikat"}, {"name": "Juridik", "score": 1, "comment": "eIDAS"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 48, "n": "HSA (Katalogtjänst HSA)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "Pågående", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning (organisationskatalog och behörighetsstyring)", "mg": "Alla 21 regioner, 290 kommuner, vårdgivare", "del": "C", "sub": "C2", "nk": "Nationell organisationskatalog som kopplar personal till organisationsenheter och behörigheter. HSA Webb lanserat november 2024. HSA-schema version 5.2 infört november 2025. Primär auktoriseringskälla för PDL-baserade tjänster. EHDS-relevans: direkt — organisationsidentifiering krävs för EHDS.", "ehds": "direkt — organisationsidentifiering krävs för EHDS.", "korr": "", "dep": "39, 41, 49", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Kataloginformation"}, {"name": "Teknik/IT", "score": 2, "comment": "LDAP"}, {"name": "Strategi", "score": 2, "comment": "Inera"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Grundläggande"}, {"name": "Kompetens", "score": 1, "comment": "IT-katalog"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "HSA-katalog"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Katalogdata"}, {"name": "Data management & governance", "score": 1, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "HSA-attribut"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 49, "n": "Sjunet", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "Pågående (sedan ~2000-talet)", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning (dedikerat hälsodatanätverk)", "mg": "Vårdgivare, myndigheter, leverantörer med hälsodata-IT", "del": "C", "sub": "C2", "nk": "Dedikerat sjukvårdsnätverk separerat från publikt internet. Över 100 tjänster anslutna. Exakt antal anslutna organisationer ej offentligt tillgängligt. Transportlager för NTjP, NPÖ, 1177 med flera. EHDS-relevans: direkt — nätverksinfrastruktur för säker hälsodataöverföring.", "ehds": "direkt — nätverksinfrastruktur för säker hälsodataöverföring.", "korr": "", "dep": "39, 48", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Ingen data i sig"}, {"name": "Teknik/IT", "score": 3, "comment": "MPLS VPN"}, {"name": "Strategi", "score": 2, "comment": "Inera/SOU 2026:6"}, {"name": "Juridik", "score": 2, "comment": "Säkerhetsnätverk"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Grundläggande"}, {"name": "Kompetens", "score": 1, "comment": "Nätverkssäkerhet"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Sjunet-nätverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Transportinfrastruktur"}, {"name": "Data management & governance", "score": 1, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Ej tillämpligt"}, {"name": "Juridik", "score": 1, "comment": "SOU 2026:6"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 59, "n": "openEHR CDR-initiativ i Sverige", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "SFMI (arbetsgrupp openEHR Sverige); regioner individuellt", "tid": "Arbetsgrupp sedan ~2023; Karolinska-upphandling 2024", "st": "Under uppbyggnad", "fin": "Regionspecifik (Karolinska/Region Stockholm leder)", "fok": "Primäranvändning (kliniska datarepositorier)", "mg": "Regioner, journalsystemleverantörer, informatiker", "del": "C", "sub": "C2", "nk": "openEHR Sverige är arbetsgrupp under SFMI. 7-regions gemensam RFI publicerad april 2023 (koordinerad av Region Östergötland; deltagare: Stockholm, Uppsala, VGR, Skåne, Kalmar, Jönköping — >2/3 av Sveriges befolkning). Karolinska upphandlade Tietoevry Lifecare (openEHR-baserat) med implementeringsstart augusti 2024, startande med cytostatikaberedskapsbedömning. EHDS-relevans: openEHR kan underlätta EHDS-interoperabilitet.", "ehds": "openEHR kan underlätta EHDS-interoperabilitet.", "korr": "", "dep": "3, 7, 58, 60", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Arketyp-data"}, {"name": "Teknik/IT", "score": 3, "comment": "EHRbase/openEHR"}, {"name": "Strategi", "score": 2, "comment": "Cambio-koppling"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Semantisk interop."}, {"name": "Kompetens", "score": 2, "comment": "openEHR-kunskap"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "openEHR CDR"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Arketypdata"}, {"name": "Data management & governance", "score": 3, "comment": "Cambio/EHRbase"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "openEHR-arketyper"}, {"name": "Juridik", "score": 2, "comment": "Begränsad"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "openEHR-arketyper, EHRbase, ADL 2.0, AQL-frågor", "tek": "EHRbase (open source), Cambio openEHR-modul, Docker-deployment, AQL", "akt": "SFMI (arbetsgrupp openEHR Sverige); regioner individuellt", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 63, "n": "Terminologitjänsten (Inera)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB / Socialstyrelsen (innehållsansvar)", "tid": "Pågående", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning + Sekundäranvändning (tillgång till kodverk)", "mg": "Journalsystemleverantörer, informatiker, utvecklare", "del": "C", "sub": "C2", "nk": "Öppen åtkomst till Snomed CT, ICD-10 och KVÅ-kodverk via API. Nytt läs-API lanserat 2025. EHDS-relevans: stödjer terminologistandardisering.", "ehds": "stödjer terminologistandardisering.", "korr": "", "dep": "43, 45, 60", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Terminologidata"}, {"name": "Teknik/IT", "score": 2, "comment": "Webbaserat"}, {"name": "Strategi", "score": 2, "comment": "Inera"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Sökbarhet"}, {"name": "Kompetens", "score": 1, "comment": "Terminologi"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Terminologisök"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Terminologiresurs"}, {"name": "Data management & governance", "score": 2, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Terminologikoder"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB / Socialstyrelsen (innehållsansvar)", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 64, "n": "Registerplattformskonsolidering", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "NAG kvalitetsregister (inom SKR:s kunskapsstyrning)", "tid": "Pågående (NAG bildat 2024)", "st": "Under uppbyggnad", "fin": "Del av SKR:s kvalitetsregisterbudget", "fok": "Sekundäranvändning (konsolidering av kvalitetsregisters IT-plattformar)", "mg": "Kvalitetsregisterhållare, CPUA-organisationer", "del": "C", "sub": "C2", "nk": "Konsolidering från 17 till 7 målplattformar. Parallell reducering av CPUA-organisationer (centralt personuppgiftsansvar) från 12–13 till 6. EHDS-relevans: indirekt — effektivare registerinfrastruktur stödjer EHDS.", "ehds": "indirekt — effektivare registerinfrastruktur stödjer EHDS.", "korr": "", "dep": "2", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Registerplattformar"}, {"name": "Teknik/IT", "score": 2, "comment": "17→7 plattformar"}, {"name": "Strategi", "score": 2, "comment": "NAG kvalitetsreg."}, {"name": "Juridik", "score": 2, "comment": "Registerlag"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Konsolidering"}, {"name": "Kompetens", "score": 1, "comment": "Plattformskompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Plattformskonsolid."}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Registerdata"}, {"name": "Data management & governance", "score": 2, "comment": "NAG kvalitetsreg."}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Plattformsvariabler"}, {"name": "Juridik", "score": 2, "comment": "Registerlag"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "NAG kvalitetsregister (inom SKR:s kunskapsstyrning)", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 71, "n": "Pascal (dosordinationsverktyg)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "Pågående; Pascal 3.0 lanserad 25 maj 2024", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning (dosdispenserade läkemedel)", "mg": "Förskrivare, sjuksköterskor, farmaceuter i dosverksamhet", "del": "C", "sub": "C3", "nk": "Nationellt verktyg för dosdispenserade läkemedel. Pascal 3.0 var det första systemet med full NLL-anslutning (läs + skriv) den 25 maj 2024. EHDS-relevans: läkemedelsdata under EHDS.", "ehds": "läkemedelsdata under EHDS.", "korr": "", "dep": "40, 39", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Ordinations­data"}, {"name": "Teknik/IT", "score": 2, "comment": "Pascal-system"}, {"name": "Strategi", "score": 1, "comment": "Inera/NLL"}, {"name": "Juridik", "score": 1, "comment": "Läkemedelslagen"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Dossäkerhet"}, {"name": "Kompetens", "score": 1, "comment": "Apotekskompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Pascal system"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Ordinationsdata"}, {"name": "Data management & governance", "score": 1, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Läkemedelslagen"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 72, "n": "Webcert / Intygstjänster", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "Pågående", "st": "Operativt", "fin": "Delfinansiering via överenskommelse regering–SKR (förlängd t.o.m. 2027)", "fok": "Primäranvändning (digitala medicinska intyg)", "mg": "Läkare, Försäkringskassan, arbetsgivare", "del": "C", "sub": "C3", "nk": "96% av Försäkringskassans intyg hanteras digitalt. 100 000–200 000 sjukintyg per månad. Successiv utvidgning till fler intygstyper. EHDS-relevans: intygsdata kan vara relevant under EHDS.", "ehds": "intygsdata kan vara relevant under EHDS.", "korr": "", "dep": "39, 4", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Intygdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Webcert-plattform"}, {"name": "Strategi", "score": 1, "comment": "Inera"}, {"name": "Juridik", "score": 1, "comment": "Ej hälsodata"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Sjukskrivningsprocess"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Webcert system"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Intygsdata"}, {"name": "Data management & governance", "score": 1, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Begränsad"}, {"name": "Juridik", "score": 1, "comment": "Ej primärt hälsodata"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Inera AB", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 76, "n": "Regiongemensam Vårddatahubb (KCHD/SKR)", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "KCHD (Kompetenscentrum Hälsodata) vid SKR", "tid": "2025–pågående (proof-of-concept 2026)", "st": "Under uppbyggnad", "fin": "DG REFORM/EU-medfinansiering (ett-årigt konsultuppdrag). Regionfinansiering via SKR.", "fok": "Sekundäranvändning (regiongemensam datahantering, rapportering, EHDS-förberedelse)", "mg": "16 deltagande regioner, myndigheter (Socialstyrelsen), forskare", "del": "C", "sub": "C3", "nk": "Blueprint-koncept för regional datahantering. L-formad arkitektur: molndistribuerade paket (metadata, regler, datamodeller) + relay-funktioner (on-premises datahantering). Fyra kärnpaket piloteras 2026: Datamodell, Mappningsmotor, Beräkning Väntetider/PAR, FHIR API. Platform engineering-metodik med GitOps-distribution. Slutrapport presenterad juni 2025 (Vitalis). EHDS-relevans: direkt — förbereder regionernas EHDS-dataförmåga.", "ehds": "direkt — förbereder regionernas EHDS-dataförmåga.", "korr": "", "dep": "2, 7, 8, 38, 43, 56, 59, 60, 61, 77, 87, 88", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Regionernas data"}, {"name": "Teknik/IT", "score": 3, "comment": "L-formad arkitektur"}, {"name": "Strategi", "score": 3, "comment": "KCHD 5 subprojekt"}, {"name": "Juridik", "score": 3, "comment": "EHDS-anpassning"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Regionnytta direkt"}, {"name": "Kompetens", "score": 3, "comment": "Hub-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Hubben själv"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Kärnverksamhet"}, {"name": "Data management & governance", "score": 3, "comment": "KCHD/NSG HD"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Hub-datamodell"}, {"name": "Juridik", "score": 3, "comment": "EHDS-anpassning"}], "nytta": [{"level": "Strategisk", "text": "Regiongemensam dataplattform — regionernas eget verktyg"}, {"level": "Taktisk", "text": "Modulära kodpaket distribuerade via GitOps"}, {"level": "Operativ", "text": "Väntetidsberäkning, PAR-rapportering, datakvalitet"}, {"level": "Teknisk", "text": "L-formad arkitektur, MinIO datalake, FHIR API"}, {"level": "Datamässig", "text": "Regionernas data returnerad för egen analys och styrning"}], "ds": "FHIR R4, openEHR, OMOP CDM v5.4, Socialstyrelsens flatfiler, PAR-SV/PAR-OV", "tek": "L-formad arkitektur, deployerbara paket (vänster), relay/processing (under), MinIO, FHIR R4 API, mappningsmotor", "akt": "KCHD/SKR, NSG Hälsodata, DiN, piloterande regioner, DG REFORM (TSI-finansiering)", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, strategi"}, {"category": "Användning", "values": "sekundäranvändning"}], "wg_beskr": "Projekt beslutat av NSG Hälsodata. Innehåller 4 delprojekt: Arbetspaket A: Data governance och datakvalitet — planera och genomföra pilotprojekt för att förbättra datahantering och datakvalitet i regionerna. Arbetspaket B: Vårddatahubb — demonstration och kravställning, utredning av referensarkitekturen inklusive Proof of Concept (POC). Arbetspaket C: Realisering av vårddatahubb — etableringsplan inklusive kostnadsmässig baslinje och risk- och datakonsekvensbedömning. Arbetspaket D: Kompetenscentrumets uppdrag — samla erfarenheter och kompetens, omvärldsbevakning och dialog med myndigheter. Kompetenscentrum Hälsodata (KCHD) är beslutat och etablerat. Dess initiala uppdrag omfattar genomförande av A och D, medan B och C remitteras till Digitaliseringsnätverket.", "wg_tek": ""}, {"nr": 38, "n": "Socialstyrelsens hälsodataregister", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Socialstyrelsen", "tid": "1964–pågående (Patientregistret äldst i nuvarande form)", "st": "Operativt", "fin": "Del av Socialstyrelsens verksamhetsanslag (ej separat specificerat)", "fok": "Sekundäranvändning (statistik, uppföljning, forskning)", "mg": "Myndigheter, regioner, forskare, allmänhet", "del": "C", "sub": "C1", "nk": "Fem hälsodataregister reglerade av Lag (1998:543): Patientregistret (sedan 1964, rikstäckande slutenvård 1987, specialistvård 2001 — saknar primärvårdsdata), Läkemedelsregistret (sedan 1 juli 2005), Dödsorsaksregistret (data sedan 1751, nuvarande form sedan 1952), Cancerregistret (sedan 1958, ~80 000 maligna tumörfall/år), Medicinska födelseregistret (sedan 1973, >98% täckning, >5 miljoner graviditeter). SOU 2024:57 föreslår nytt regelverk: utökning till primärvård, ny registerförordning. Remissvar inkomna januari 2025. EHDS-relevans: direkt — dessa register är grunden för Sveriges hälsodatarapportering och EHDS sekundäranvändning.", "ehds": "direkt — dessa register är grunden för Sveriges hälsodatarapportering och EHDS sekundäranvändning.", "korr": "", "dep": "2, 43, 45, 46, 47, 61, 77, 80, 87", "ai": [{"name": "Datatillgång", "score": 3, "comment": "6 nationella reg."}, {"name": "Teknik/IT", "score": 2, "comment": "Äldre system"}, {"name": "Strategi", "score": 3, "comment": "Myndighetsprio"}, {"name": "Juridik", "score": 3, "comment": "Registerlag"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Nationell uppföljning"}, {"name": "Kompetens", "score": 2, "comment": "Registerkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Registerinfra"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "6 nationella register"}, {"name": "Data management & governance", "score": 3, "comment": "SoS-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Registervariabler"}, {"name": "Juridik", "score": 3, "comment": "Registerlagstiftning"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Patientregistret, Cancerregistret, Dödsorsaksregistret, Läkemedelsregistret, Tandhälsoregistret, Kommunal hälso- och sjukvård. ICD-10-SE, KVÅ, ATC, proprietära SoS-format", "tek": "Centraliseraderegister hos Socialstyrelsen, webbaserad inrapportering, flatfilformat", "akt": "Socialstyrelsen, 21 regioner, privata vårdgivare, kommuner", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning"}], "wg_beskr": "Nationell statistik och uppföljning.", "wg_tek": ""}, {"nr": 40, "n": "NLL (Nationella läkemedelslistan)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "E-hälsomyndigheten", "tid": "Lag (2018:1212); obligatorisk läsanslutning 1 december 2025", "st": "Operativt (obligatorisk anslutning pågår)", "fin": "Ej specificerat (del av E-hälsomyndighetens uppdrag)", "fok": "Primäranvändning (gemensam läkemedelslista för förskrivare, farmaceuter och patienter)", "mg": "Förskrivare, farmaceuter, patienter, regioner, apotek", "del": "C", "sub": "C1", "nk": "FHIR R4-baserade API:er (profiler publicerade på Simplifier). Ersätter Receptregistret och Läkemedelsförteckningen med en gemensam lista. Obligatorisk läsanslutning 1 december 2025 (senarelagd från maj 2023 via Prop. 2022/23:57). Skyldighet att rapportera ordinationsorsak senarelagd till september 2028 (SFS 2025:920/921). SOU 2025:71 föreslår omformning till nationell infrastruktur, inkludering av sjukhusadministrerade läkemedel och vaccinationer. Pascal 3.0 (Inera) först ansluten med full läs- och skrivåtkomst (25 maj 2024). EHDS-relevans: direkt — läkemedelsdata är en primäranvändningskategori under EHDS.", "ehds": "direkt — läkemedelsdata är en primäranvändningskategori under EHDS.", "korr": "", "dep": "39, 71", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Läkemedelsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "E-hälsomynd."}, {"name": "Strategi", "score": 2, "comment": "Lag 2018:1212"}, {"name": "Juridik", "score": 3, "comment": "Speciallag"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Patientsäkerhet"}, {"name": "Kompetens", "score": 1, "comment": "Apoteksfarmaci"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "NLL-API"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Läkemedelsdata"}, {"name": "Data management & governance", "score": 2, "comment": "E-hälsomynd."}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NLL-variabler"}, {"name": "Juridik", "score": 2, "comment": "Speciallagstiftning"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "E-hälsomyndigheten", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 42, "n": "Biobank Sverige / BBMRI-ERIC", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Biobank Sverige (nationell samordning); BBMRI-ERIC (europeisk infrastruktur)", "tid": "Biobank Sverige sedan ~2010; BBMRI-ERIC sedan 2013; Biobankslag (2023:38) sedan 1 juli 2023", "st": "Operativt", "fin": "VR-finansierat (nationellt); EU-medfinansiering via BBMRI-ERIC", "fok": "Sekundäranvändning (provsamlingar kopplade till hälsodata för forskning)", "mg": "Forskare, biobankskoordinatorer, etikprövningsnämnder", "del": "C", "sub": "C1", "nk": "Ca 150 miljoner sparade biobanksprov i Sverige (3–4 miljoner tillkommer/år). Ca 450 biobanker registrerade hos IVO. 6 Regionala Biobankscentra. SBR (Svenska Biobanksregistret) är nationellt IT-system för provspårning och samtyckeshantering. Biobankslag (2023:38) ersatte 2002 års lag den 1 juli 2023. EHDS-relevans: EHDS nämner biobanksdata som möjlig datakategori.", "ehds": "EHDS nämner biobanksdata som möjlig datakategori.", "korr": "", "dep": "1, 38, 73, 74", "ai": [{"name": "Datatillgång", "score": 3, "comment": "150M prover"}, {"name": "Teknik/IT", "score": 2, "comment": "BIMS"}, {"name": "Strategi", "score": 2, "comment": "Biobank Sverige"}, {"name": "Juridik", "score": 3, "comment": "Biobankslagen rev."}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskningsmaterial"}, {"name": "Kompetens", "score": 2, "comment": "Biobankskunskap"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "BIMS-system"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Biobanksprover"}, {"name": "Data management & governance", "score": 2, "comment": "Biobank Sverige"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Provvariabler"}, {"name": "Juridik", "score": 2, "comment": "Biobankslagen"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Biobank Sverige (nationell samordning); BBMRI-ERIC (europeisk infrastruktur)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet, region, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning, forskning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 43, "n": "Snomed CT NRC (Swedish National Release Center)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Socialstyrelsen (NRC); övergång till E-hälsomyndigheten planerad 1 juni 2026", "tid": "Pågående (Sverige medlem i SNOMED International sedan 2007)", "st": "Operativt", "fin": "EU-medfinansiering täcker 60% av licenskostnaden 2023–2027 (HaDEA). NAG-Snomed CT under SKR:s kunskapsstyrning.", "fok": "Primäranvändning + Sekundäranvändning (klinisk terminologi för strukturerad journalföring)", "mg": "Journalsystemleverantörer, kliniker, informatiker", "del": "C", "sub": "C1", "nk": "Svensk extension innehåller ca 375 000 aktiva koncept med svenska beteckningar (november 2025 release). Publiceras två gånger/år (maj och november). NAG-Snomed CT samordnar med varannan veckas möten. Regeringsbeslut 7 januari 2026: terminologi- och klassifikationsansvar överförs från Socialstyrelsen till E-hälsomyndigheten med måldatum 1 juni 2026. EHDS-relevans: direkt — Snomed CT är en av de obligatoriska kodverken under EHDS.", "ehds": "direkt — Snomed CT är en av de obligatoriska kodverken under EHDS.", "korr": "", "dep": "44, 45, 60, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Terminologi"}, {"name": "Teknik/IT", "score": 2, "comment": "NRC-verktyg"}, {"name": "Strategi", "score": 3, "comment": "EHDS-referens"}, {"name": "Juridik", "score": 2, "comment": "Licensiering"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Semantic interop."}, {"name": "Kompetens", "score": 2, "comment": "Terminologikompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Snomed CT terminologi"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Terminologiresurs"}, {"name": "Data management & governance", "score": 3, "comment": "SoS NRC"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Snomed-begrepp"}, {"name": "Juridik", "score": 2, "comment": "EHDS-referens"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Snomed CT International + svensk utgåva, Snomed-to-ICD-10/KVÅ-mappningar", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen (NRC); övergång till E-hälsomyndigheten planerad 1 juni 2026", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 44, "n": "NI/NIM (Nationell informationsstruktur / Nationella informationsmängder)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Socialstyrelsen (övergång till E-hälsomyndigheten planerad 1 juni 2026)", "tid": "NI sedan ~2007; NIM-utkast publicerade från juni 2024", "st": "Operativt (NI); Under utveckling (NIM)", "fin": "Del av Socialstyrelsens verksamhetsanslag", "fok": "Primäranvändning + Sekundäranvändning (semantisk referens för systemutveckling)", "mg": "Systemutvecklare, informatiker, journalsystemleverantörer", "del": "C", "sub": "C1", "nk": "NI (Nationell informationsstruktur) ger övergripande modell för hälso- och sjukvårdsinformation. NIM (Nationella informationsmängder) kopplar lagstiftning, terminologi och informationsstruktur — publicerade som utkast från juni 2024. Ingår i terminologiöverföringen till E-hälsomyndigheten. EHDS-relevans: direkt — NIM kan bli grunden för svenska EHDS-interoperabilitetskrav.", "ehds": "direkt — NIM kan bli grunden för svenska EHDS-interoperabilitetskrav.", "korr": "", "dep": "43, 45, 60", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Informationsmod."}, {"name": "Teknik/IT", "score": 1, "comment": "Begränsat genomslag"}, {"name": "Strategi", "score": 2, "comment": "Nationell standard"}, {"name": "Juridik", "score": 1, "comment": "Svag implementering"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Låg realiserad"}, {"name": "Kompetens", "score": 1, "comment": "Begränsad"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsat genomslag"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Modellresurs"}, {"name": "Data management & governance", "score": 2, "comment": "SoS"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NI/NIM-modeller"}, {"name": "Juridik", "score": 1, "comment": "Svag implementering"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen (övergång till E-hälsomyndigheten planerad 1 juni 2026)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 45, "n": "Socialstyrelsens klassifikationer (ICD-10-SE, KVÅ, ICF, ICD-11-transition)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Socialstyrelsen (övergång till E-hälsomyndigheten planerad 1 juni 2026)", "tid": "ICD-10-SE sedan 1997; ICD-11 planerad 2027–2028", "st": "Operativt (ICD-10-SE/KVÅ/ICF); Under utveckling (ICD-11)", "fin": "Del av Socialstyrelsens verksamhetsanslag", "fok": "Primäranvändning + Sekundäranvändning (obligatoriska klassifikationer för rapportering)", "mg": "All hälso- och sjukvårdspersonal, kodsättare, forskare", "del": "C", "sub": "C1", "nk": "ICD-10-SE är obligatoriskt för diagnosrapportering. KVÅ (Klassifikation av vårdåtgärder) för åtgärder. ICF för funktionstillstånd. ICD-11 transition: måldatum januari 2027 för dödsorsaker, januari 2028 för hälsodataregister (beskrivna som 'målsättning' med reservation för förskjutning). Första svenska ICD-11-versionen (2026-01) publicerad, alla kapitel utom kap. 6 (psykiatri). EHDS-relevans: direkt — ICD är en obligatorisk standard under EHDS.", "ehds": "direkt — ICD är en obligatorisk standard under EHDS.", "korr": "", "dep": "43, 44", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Klassifikationer"}, {"name": "Teknik/IT", "score": 1, "comment": "Kodverk"}, {"name": "Strategi", "score": 2, "comment": "Obligatoriska"}, {"name": "Juridik", "score": 2, "comment": "Socialstyrelsen"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Rapporteringsgrund"}, {"name": "Kompetens", "score": 1, "comment": "Medicinsk kodning"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Kodverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Klassifikationsresurs"}, {"name": "Data management & governance", "score": 2, "comment": "SoS obligatorisk"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "ICD/KVÅ-koder"}, {"name": "Juridik", "score": 2, "comment": "Rapporteringskrav"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen (övergång till E-hälsomyndigheten planerad 1 juni 2026)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 46, "n": "SmiNet", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Folkhälsomyndigheten", "tid": "Pågående", "st": "Operativt", "fin": "Del av Folkhälsomyndighetens verksamhetsanslag", "fok": "Sekundäranvändning (smittskyddsövervakning)", "mg": "Smittskyddsläkare, regionala smittskyddsenheter, Folkhälsomyndigheten", "del": "C", "sub": "C2", "nk": "Nationellt elektroniskt övervakningssystem för ca 60 anmälningspliktiga smittsamma sjukdomar. Samägt och medfinansierat av FHM och alla 21 regionala smittskyddsenheter. Riksrevisionen RiR 2023:9 granskade INTE SmiNet specifikt utan det nationella smittskyddets organisation. Ingen specifik moderniseringsplan eller finansiering identifierad. EHDS-relevans: smittskyddsdata kan ingå under EHDS sekundäranvändning.", "ehds": "smittskyddsdata kan ingå under EHDS sekundäranvändning.", "korr": "", "dep": "38, 47", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Smittskyddsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Webbaserat"}, {"name": "Strategi", "score": 2, "comment": "FoHM"}, {"name": "Juridik", "score": 2, "comment": "Smittskyddslagen"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Pandemiberedskap"}, {"name": "Kompetens", "score": 1, "comment": "Epidemiologi"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Smittskyddsdata"}, {"name": "Data management & governance", "score": 1, "comment": "FoHM"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "SmiNet-variabler"}, {"name": "Juridik", "score": 1, "comment": "Smittskyddslagen"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Folkhälsomyndigheten", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 47, "n": "Nationella vaccinationsregistret (NVR)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Folkhälsomyndigheten", "tid": "Sedan 1 januari 2013 (Lag 2012:453)", "st": "Operativt (NVR 2.0 lanserat 4 mars 2026)", "fin": "Del av Folkhälsomyndighetens verksamhetsanslag", "fok": "Sekundäranvändning (vaccinationsövervakning) + Primäranvändning (via API-åtkomst)", "mg": "Vaccinatörer, regioner, Folkhälsomyndigheten, forskare", "del": "C", "sub": "C2", "nk": "NVR 2.0 lanserat 4 mars 2026 med FHIR HL7-baserade API:er, OAuth2-autentisering. Manuell XML-uppladdning avvecklad. Successiv utvidgning: barnvaccinationer (2013), COVID-19 (2021), pneumokocker riskgrupper (dec 2022), tuberkulos riskgrupper (maj 2025). SOU 2025:71 föreslår att vaccinationsdata integreras i NLL. EHDS-relevans: direkt — vaccinationsdata är en primäranvändningskategori under EHDS.", "ehds": "direkt — vaccinationsdata är en primäranvändningskategori under EHDS.", "korr": "", "dep": "38, 46, 57", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Vaccinationsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "E-hälsomynd."}, {"name": "Strategi", "score": 2, "comment": "Nationellt reg."}, {"name": "Juridik", "score": 2, "comment": "Registerlag"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Vaccinuppföljning"}, {"name": "Kompetens", "score": 1, "comment": "Folkhälsa"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "NVR-system"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Vaccinationsdata"}, {"name": "Data management & governance", "score": 1, "comment": "E-hälsomynd."}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NVR-variabler"}, {"name": "Juridik", "score": 1, "comment": "Registerlag"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Folkhälsomyndigheten", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 50, "n": "Kliniska Studier Sverige", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Vetenskapsrådet (VR)", "tid": "VR-finansierat 2024–2026", "st": "Operativt", "fin": "VR-anslag (specifikt belopp ej specificerat)", "fok": "Sekundäranvändning (stöd till kliniska studier som använder hälsodata)", "mg": "Kliniska forskare, sponsorer, regioner", "del": "C", "sub": "C2", "nk": "6 regionala Forum-noder: Forum Norr, Forum Mellansverige, Forum Stockholm-Gotland, Gothia Forum, Forum Sydost, Forum Söder. Feasibility Sweden: ~80 studieförfrågningar/år, kostnadsfritt. Stödjer rekrytering, genomförbarhet och samordning av kliniska studier nationellt. EHDS-relevans: kliniska studier kan få nytta av EHDS sekundäranvändning för feasibility.", "ehds": "kliniska studier kan få nytta av EHDS sekundäranvändning för feasibility.", "korr": "", "dep": "42, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Studiedata"}, {"name": "Teknik/IT", "score": 2, "comment": "Single entry"}, {"name": "Strategi", "score": 2, "comment": "VR 6 noder"}, {"name": "Juridik", "score": 2, "comment": "EU CTR"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Klinisk forskning"}, {"name": "Kompetens", "score": 2, "comment": "Klinisk forskning"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Studiedata"}, {"name": "Data management & governance", "score": 1, "comment": "VR"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Studievariabler"}, {"name": "Juridik", "score": 1, "comment": "EU CTR"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Vetenskapsrådet (VR)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "samverkan, forskning"}, {"category": "Fokusområde", "values": "teknik, strategi"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 51, "n": "RUT / Dataguiden (registerforskning.se / dataguide.se)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Vetenskapsrådet (VR)", "tid": "Pågående", "st": "Operativt", "fin": "Del av VR:s infrastrukturanslag; SENASH-koppling (28 MSEK)", "fok": "Sekundäranvändning (metadata och vägledning för registerforskare)", "mg": "Forskare som vill använda svenska registerdata", "del": "C", "sub": "C2", "nk": "RUT (Register Utiliser Tool) är VR:s webbaserade metadataverktyg strukturerat enligt GSIM-modellen. Dataguiden (dataguide.se) ersätter registerforskning.se och ger vägledning till forskare. Kopplat till SENASH-projektet som utvecklar nationell metadatakatalog för EHDS. EHDS-relevans: direkt — metadatakatalog krävs under EHDS.", "ehds": "direkt — metadatakatalog krävs under EHDS.", "korr": "", "dep": "2, 12, 38", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Registervariabelbeskr."}, {"name": "Teknik/IT", "score": 2, "comment": "Webbaserat"}, {"name": "Strategi", "score": 2, "comment": "VR"}, {"name": "Juridik", "score": 2, "comment": "Öppen metadata"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskartillgänglighet"}, {"name": "Kompetens", "score": 1, "comment": "Registerforskning"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Dataguide-söktjänst"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Variabelöversikt"}, {"name": "Data management & governance", "score": 2, "comment": "VR"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Registervariabelbeskr."}, {"name": "Juridik", "score": 1, "comment": "Öppen metadata"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Vetenskapsrådet (VR)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 53, "n": "DIGIfor1healthSE", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "SciLifeLab (koordinator)", "tid": "2024–2027 (4 år)", "st": "Operativt", "fin": "12 MSEK (Vinnova)", "fok": "Sekundäranvändning (koordinering av hälsodataprojekt och EHDS-förberedelse)", "mg": "Hälsodata-aktörer i Sverige, EU-projektdeltagare", "del": "C", "sub": "C2", "nk": "Nationellt koordineringsprojekt som knyter samman fem EU-DIGITAL-projekt och GMS för EHDS-beredskap. SciLifeLab koordinerar. EHDS-relevans: direkt — explicit EHDS-koordineringsprojekt.", "ehds": "direkt — explicit EHDS-koordineringsprojekt.", "korr": "", "dep": "1, 25, 26", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Genomikdata 1+MG"}, {"name": "Teknik/IT", "score": 2, "comment": "GDI-förberedelse"}, {"name": "Strategi", "score": 2, "comment": "SciLifeLab"}, {"name": "Juridik", "score": 2, "comment": "EHDS genomik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "1+MG-deltagande"}, {"name": "Kompetens", "score": 2, "comment": "Genomik-IT"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GDI-förberedelse"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Genomikdata"}, {"name": "Data management & governance", "score": 2, "comment": "SciLifeLab"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "1+MG-variabler"}, {"name": "Juridik", "score": 2, "comment": "EHDS genomik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "SciLifeLab (koordinator)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "forskning, samverkan"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 56, "n": "OMOP 4 Sweden", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Swelife / Passion 2 Improve Sverige AB (koordinator)", "tid": "Augusti–december 2025", "st": "Avslutat", "fin": "500 000 SEK (Vinnova, ref 2025-01744)", "fok": "Sekundäranvändning (OMOP CDM-anpassning för svenska data)", "mg": "Svenska registerforskare, OMOP-intresserade aktörer", "del": "C", "sub": "C2", "nk": "Kort förberedelseprojekt inom Swelife för att kartlägga OMOP CDM-mognad i Sverige. Blygsam budget (500 000 SEK). Koppling till SCIFI-PEARL vid GU och DARWIN EU-arbete. EHDS-relevans: OMOP CDM nämns som en möjlig standard för EHDS sekundäranvändning.", "ehds": "OMOP CDM nämns som en möjlig standard för EHDS sekundäranvändning.", "korr": "", "dep": "38, 55, 77", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Svenska reg→OMOP"}, {"name": "Teknik/IT", "score": 3, "comment": "ETL-pipelines"}, {"name": "Strategi", "score": 3, "comment": "KI-drivet"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 3, "comment": "DARWIN EU-deltagande"}, {"name": "Kompetens", "score": 2, "comment": "OMOP/CDM-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "OMOP-pipeline"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Svenska reg→OMOP"}, {"name": "Data management & governance", "score": 3, "comment": "KI-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "OMOP CDM v5.4"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "OMOP CDM v5.4, ETL-pipelines från svenska register, Snomed CT, ICD-10-SE→Snomed-mappningar", "tek": "ETL-pipelines (Python/R), OHDSI Athena vokabulär, Atlas analysmiljö, PostgreSQL", "akt": "KI (lead), DARWIN EU/EMA, OHDSI, SciLifeLab", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "forskning, infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 60, "n": "HL7 FHIR Svenska Basprofiler", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "HL7 Sverige", "tid": "Pågående (senast uppdaterad januari 2026 på GitHub)", "st": "Operativt", "fin": "Ideell förening med frivilligt arbete + koppling till Ineras FHIR-vägledning", "fok": "Primäranvändning + Sekundäranvändning (interoperabilitetsstandard)", "mg": "Systemutvecklare, informatiker, leverantörer", "del": "C", "sub": "C2", "nk": "Svenska basprofiler för FHIR R4. Grund för all svensk FHIR-profilering per Ineras riktlinjer. GitHub-baserat öppet arbete. Europeiska HL7 Base/Core IG:er (STU 1.0) för EHDS-stöd publicerade hösten 2025. EHDS-relevans: direkt — FHIR är den primära standarden för EHDS.", "ehds": "direkt — FHIR är den primära standarden för EHDS.", "korr": "", "dep": "39, 43, 58, 59", "ai": [{"name": "Datatillgång", "score": 2, "comment": "FHIR-resurser"}, {"name": "Teknik/IT", "score": 3, "comment": "FHIR R4"}, {"name": "Strategi", "score": 3, "comment": "HL7 Sweden"}, {"name": "Juridik", "score": 2, "comment": "NDI-grund"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Interoperabilitet"}, {"name": "Kompetens", "score": 2, "comment": "FHIR-kunskap"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "FHIR-profiler"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "FHIR-resurser"}, {"name": "Data management & governance", "score": 3, "comment": "HL7 Sweden"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "FHIR-element"}, {"name": "Juridik", "score": 2, "comment": "NDI-grund"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "HL7 FHIR R4, svenska basprofiler (Patient, Practitioner, Organization, MedicationRequest m.fl.)", "tek": "HL7 FHIR R4-server, Simplifier.net profilregister, FHIR Shorthand (FSH)", "akt": "HL7 Sverige", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 61, "n": "Socialstyrelsen som HDAB (Health Data Access Body)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Socialstyrelsen (regeringsuppdrag)", "tid": "Uppdrag 20 maj 2025; förhandsrapport 5 feb 2026; slutrapport 15 juni 2026", "st": "Under utredning", "fin": "Ej specificerat (del av uppdrag)", "fok": "Sekundäranvändning (tillgångsorgan för hälsodata under EHDS)", "mg": "Forskare, myndigheter, hälsodataanvändare", "del": "C", "sub": "C2", "nk": "Regeringsuppdrag att förbereda Socialstyrelsens roll som HDAB enligt EHDS-förordningen. Parallella uppdrag: SCB (säkra behandlingsmiljöer), IVO (tillsyn), E-hälsomyndigheten (digital infrastruktur), Läkemedelsverket (marknadstillsyn). Föreslaget: Socialstyrelsen som koordinerande HDAB med datatillstånd och datasetkatalogisering. EHDS-relevans: direkt — HDAB-funktionen.", "ehds": "direkt — HDAB-funktionen.", "korr": "", "dep": "38, 77, 80, 87", "ai": [{"name": "Datatillgång", "score": 3, "comment": "HDAB-funktion"}, {"name": "Teknik/IT", "score": 2, "comment": "Under uppbyggnad"}, {"name": "Strategi", "score": 3, "comment": "Uppdrag maj 2025"}, {"name": "Juridik", "score": 3, "comment": "EHDS central"}, {"name": "Nyttokalkyler", "score": 3, "comment": "EHDS tillgängligg."}, {"name": "Kompetens", "score": 2, "comment": "Myndighetskompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "HDAB-infrastruktur"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "EHDS-tillgång"}, {"name": "Data management & governance", "score": 3, "comment": "SoS governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "EHDS datakategorier"}, {"name": "Juridik", "score": 3, "comment": "EHDS art. 33-46"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen (regeringsuppdrag)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet, EHDS"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "juridik, teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 62, "n": "NEAR (National E-Infrastructure for Aging Research)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Karolinska Institutet (koordinator: Laura Fratiglioni)", "tid": "2023–2027/2028 (diskrepans mellan källor)", "st": "Operativt", "fin": "140 680 000 SEK (VR infrastrukturanslag)", "fok": "Sekundäranvändning (äldreforskningsdata)", "mg": "Åldringsforskare vid 8 svenska universitet", "del": "C", "sub": "C2", "nk": "Konsortium med 15 databaser och 8 universitet. Harmoniserar och tillgängliggör data om åldrande. EHDS-relevans: indirekt — åldringsdata kan ingå i EHDS sekundäranvändning.", "ehds": "indirekt — åldringsdata kan ingå i EHDS sekundäranvändning.", "korr": "", "dep": "14, 38", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Åldringsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Longitudinella"}, {"name": "Strategi", "score": 2, "comment": "KI-drivet"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Åldringsforsk."}, {"name": "Kompetens", "score": 2, "comment": "Gerontologi"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Åldringsdata"}, {"name": "Data management & governance", "score": 1, "comment": "KI"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "NEAR-variabler"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Karolinska Institutet (koordinator: Laura Fratiglioni)", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "forskning"}, {"category": "Fokusområde", "values": "teknik, kompetens"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 66, "n": "Testbed Sweden Precision Health Cancer", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Vision Zero Cancer + GMS + SciLifeLab (medgrundare)", "tid": "2021–2026 (Vinnova/Swelife)", "st": "Operativt", "fin": "Vinnova via Swelife-programmet Sustainable Precision Health", "fok": "Sekundäranvändning (precisionsdiagnostik för cancer)", "mg": "Cancerpatienter, onkologer, forskare, medicintekniska företag", "del": "C", "sub": "C3", "nk": "Testbädd för precisionshälsa inom cancerområdet. FOCU·SE-studien aktivt rekryterande. Kopplat till EU-projekt PCM4EU och PRIME-ROSE. Gränsöverskridande samarbete via EU-nätverk. EHDS-relevans: cancerdata under EHDS.", "ehds": "cancerdata under EHDS.", "korr": "", "dep": "1, 42", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Genomik+klinisk"}, {"name": "Teknik/IT", "score": 2, "comment": "Testbädd"}, {"name": "Strategi", "score": 2, "comment": "Vinnova/GMS"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Cancerprecision"}, {"name": "Kompetens", "score": 2, "comment": "Cancergenomik"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Testbädd cancer"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Cancergenomik"}, {"name": "Data management & governance", "score": 2, "comment": "Vinnova/GMS"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Genomikvariabler"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Vision Zero Cancer + GMS + SciLifeLab (medgrundare)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet, region"}, {"category": "Verksamhetstyp", "values": "demonstrator, forskning, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 73, "n": "SIMPLER (Swedish Infrastructure for Medical Population-based Life-course and Environmental Research)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Uppsala universitet", "tid": "Pågående", "st": "Operativt", "fin": "VR-finansierat (specifikt belopp ej offentligt)", "fok": "Sekundäranvändning (befolkningsbaserad hälsoforskning)", "mg": "Epidemiologer, folkhälsoforskare", "del": "C", "sub": "C3", "nk": "Ca 110 000 personer (födda 1914–1952, från Uppsala, Västmanland och Örebro län). Swedish Mammography Cohort och Cohort of Swedish Men. EHDS-relevans: indirekt — forskningsdata.", "ehds": "indirekt — forskningsdata.", "korr": "", "dep": "14, 42", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Kost/livsstilsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Kohortinfrastruktur"}, {"name": "Strategi", "score": 2, "comment": "Uppsala/KI"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Folkhälsoforsk."}, {"name": "Kompetens", "score": 2, "comment": "Epidemiologi"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Kohortdata"}, {"name": "Data management & governance", "score": 1, "comment": "Uppsala/KI"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "SIMPLER-variabler"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Uppsala universitet", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "forskning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 74, "n": "Svenska Tvillingregistret", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Karolinska Institutet", "tid": "Sedan 1960-talet; pågående", "st": "Operativt", "fin": "27 580 000 SEK (VR 2023–2027)", "fok": "Sekundäranvändning (genetisk-epidemiologisk forskning)", "mg": "Tvillingforskare, epidemiologer, genetiker", "del": "C", "sub": "C3", "nk": "Ca 87 000 tvillingpar med känd zygositet (~194 000+ tvillingar totalt sedan 1886). Världens största tvillingregister. VR-finansiering 27,58 MSEK (2023–2027). EHDS-relevans: indirekt — forskningsdata.", "ehds": "indirekt — forskningsdata.", "korr": "", "dep": "14, 42", "ai": [{"name": "Datatillgång", "score": 3, "comment": "100K tvillingpar"}, {"name": "Teknik/IT", "score": 2, "comment": "Registerkoppling"}, {"name": "Strategi", "score": 2, "comment": "KI"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Genetik/miljö"}, {"name": "Kompetens", "score": 2, "comment": "Tvillingsforsk."}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Tvillingdata"}, {"name": "Data management & governance", "score": 1, "comment": "KI"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Tvillingvariabler"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Karolinska Institutet", "tags": [{"category": "Aktörstyp", "values": "universitet/akademi"}, {"category": "Verksamhetstyp", "values": "forskning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 75, "n": "RISE Digital Health", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "RISE Research Institutes of Sweden (statligt ägt)", "tid": "Pågående", "st": "Operativt", "fin": "Basanslag + uppdragsfinansiering", "fok": "Sekundäranvändning (tillämpad forskning och testning av hälso-AI)", "mg": "Medicintekniska företag, regioner, forskare", "del": "C", "sub": "C3", "nk": "Statligt ägt forskningsinstitut. Partner i TEF-Health Sweden (KI leder). Stödjer test och validering av AI-baserade medicinska produkter. EHDS-relevans: indirekt — testinfrastruktur.", "ehds": "indirekt — testinfrastruktur.", "korr": "", "dep": "65, 84", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Testdata"}, {"name": "Teknik/IT", "score": 3, "comment": "Testbäddar"}, {"name": "Strategi", "score": 2, "comment": "RISE"}, {"name": "Juridik", "score": 2, "comment": "MDR/AI Act"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Innovation"}, {"name": "Kompetens", "score": 2, "comment": "Testning/validering"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Testbädd extern"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Testdata"}, {"name": "Data management & governance", "score": 1, "comment": "RISE"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Testspecifik"}, {"name": "Juridik", "score": 1, "comment": "MDR/AI Act"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "RISE Research Institutes of Sweden (statligt ägt)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "innovation, demonstrator, AI"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 52, "n": "Nordic Commons", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "NordForsk (finansiär); styrgrupp med alla nordiska länder", "tid": "2021–2024 (avslutad; arv pågår)", "st": "Avslutat", "fin": "20 MDKK (Nordiska ministerrådet)", "fok": "Sekundäranvändning (nordisk hälsodatadelning)", "mg": "Nordiska myndigheter, forskare", "del": "C", "sub": "C2", "nk": "NordForsk-finansierat initiativ för gränsöverskridande datadelning i Norden. Svenska deltagare: E-hälsomyndigheten (Michel Silvestri, Policy Board), Socialstyrelsen (Anna Gref, Executive Team), VR (Per Bergstrand, lagstiftningsgrupp). Resultat informerar EHDS-implementation i Norden. EHDS-relevans: direkt — nordisk föregångare.", "ehds": "direkt — nordisk föregångare.", "korr": "", "dep": "77, 56", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Nordisk registerdata"}, {"name": "Teknik/IT", "score": 2, "comment": "Federerad"}, {"name": "Strategi", "score": 3, "comment": "NordForsk"}, {"name": "Juridik", "score": 3, "comment": "Gränsöverskridande"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Nordisk forskning"}, {"name": "Kompetens", "score": 2, "comment": "Nordisk samverkan"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Nordic Commons"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Nordisk registerdata"}, {"name": "Data management & governance", "score": 2, "comment": "NordForsk"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Nordisk harmonisering"}, {"name": "Juridik", "score": 3, "comment": "Gränsöverskridande"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "NordForsk (finansiär); styrgrupp med alla nordiska länder", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan, forskning"}, {"category": "Fokusområde", "values": "strategi, juridik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 54, "n": "Genome of Europe (GoE)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "SciLifeLab (datahantering); 49 partners i 27 länder", "tid": "Oktober 2024–2028 (42 månader)", "st": "Operativt", "fin": "45 MEuro (20M EU Digital Europe Programme + nationell medfinansiering)", "fok": "Sekundäranvändning (populationsgenomik för referensdatabaser)", "mg": "Genomikforskare, klinisk genetik, folkhälsa", "del": "C", "sub": "C2", "nk": "100 000+ genom från 27 EU-länder. SciLifeLab leder datahanteringsarbetet. Sverige bidrar med 2 600 SCAPIS-individer, varav minst 1 000 med långläsningssekvensering. EHDS-relevans: genomikdata specificerad i EHDS.", "ehds": "genomikdata specificerad i EHDS.", "korr": "", "dep": "1, 25, 67", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Referensgenom"}, {"name": "Teknik/IT", "score": 2, "comment": "Sekvensering"}, {"name": "Strategi", "score": 2, "comment": "EU-projekt"}, {"name": "Juridik", "score": 2, "comment": "EHDS genomik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Populationsreferens"}, {"name": "Kompetens", "score": 1, "comment": "Genomik"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Referensgenom"}, {"name": "Data management & governance", "score": 1, "comment": "EU-projekt"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Genomvariabler"}, {"name": "Juridik", "score": 1, "comment": "EHDS"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "SciLifeLab (datahantering); 49 partners i 27 länder", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "forskning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 55, "n": "DARWIN EU (Data Analysis and Real World Interrogation Network)", "fk": "EU", "typ": "Digital infrastruktur för datadelning", "ans": "EMA (Europeiska läkemedelsmyndigheten); Läkemedelsverket (svensk institutionell värd)", "tid": "2022–pågående", "st": "Operativt", "fin": "EMA-finansierat", "fok": "Sekundäranvändning (läkemedelssäkerhet och evidensgenerering med real-world data)", "mg": "Regulatoriska myndigheter, läkemedelsindustri, forskare", "del": "C", "sub": "C2", "nk": "EMA:s nätverk för real-world evidence baserat på OMOP CDM. Ca 40 datapartners (feb 2026). Svensk datapartner: 'Health Impact' via Läkemedelsverket (inte SCIFI-PEARL som tidigare angivet). EHDS-relevans: direkt — DARWIN EU bygger på samma standarder som EHDS sekundäranvändning.", "ehds": "direkt — DARWIN EU bygger på samma standarder som EHDS sekundäranvändning.", "korr": "", "dep": "56, 77", "ai": [{"name": "Datatillgång", "score": 3, "comment": "RWE EU"}, {"name": "Teknik/IT", "score": 3, "comment": "OMOP CDM"}, {"name": "Strategi", "score": 3, "comment": "EMA-drivet"}, {"name": "Juridik", "score": 2, "comment": "EMA-regulering"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Läkemedelssäkerhet"}, {"name": "Kompetens", "score": 2, "comment": "Farmakoepidemiologi"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "OMOP CDM-krav"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "RWE-data"}, {"name": "Data management & governance", "score": 2, "comment": "EMA"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "OMOP-variabler"}, {"name": "Juridik", "score": 2, "comment": "EMA-regulering"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "OMOP CDM v5.4, OHDSI-verktyg, Snomed CT, RxNorm", "tek": "Se nyckelkaraktäristik", "akt": "EMA (Europeiska läkemedelsmyndigheten); Läkemedelsverket (svensk institutionell värd)", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, nytta"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 57, "n": "MyHealth@EU (f.d. eHDSI)", "fk": "EU", "typ": "Digital infrastruktur för datadelning", "ans": "Europeiska kommissionen; E-hälsomyndigheten (svensk NCP)", "tid": "Pågående (prioriterat tjänster: ePrescription, Patient Summary)", "st": "Under anslutning (Sverige planerade anslutning 2025; ej bekräftat live)", "fin": "EU CEF/Digital-finansierat", "fok": "Primäranvändning (gränsöverskridande patientdata)", "mg": "Patienter och vårdpersonal vid gränsöverskridande vård", "del": "C", "sub": "C2", "nk": "EU:s gränsöverskridande infrastruktur för primäranvändning av hälsodata. E-hälsomyndigheten är Sveriges nationella kontaktpunkt (NCP). Planerad anslutning 2025, men ingen bekräftelse att Sverige gått live hittades. EHDS-förordningen bygger vidare på och utökar MyHealth@EU. EHDS-relevans: direkt — MyHealth@EU är EHDS primary use-infrastruktur.", "ehds": "direkt — MyHealth@EU är EHDS primary use-infrastruktur.", "korr": "", "dep": "4, 9, 39, 77", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Patient Summary"}, {"name": "Teknik/IT", "score": 3, "comment": "NCP-infrastruktur"}, {"name": "Strategi", "score": 3, "comment": "EU-krav"}, {"name": "Juridik", "score": 3, "comment": "EHDS primärdata"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Gränsöversk. vård"}, {"name": "Kompetens", "score": 1, "comment": "E-hälsomynd."}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "NCP-infrastruktur"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Patient Summary"}, {"name": "Data management & governance", "score": 2, "comment": "E-hälsomynd."}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "HL7 CDA/FHIR"}, {"name": "Juridik", "score": 3, "comment": "EHDS primärdata"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "HL7 CDA (Patient Summary), HL7 FHIR (framtida), NCPeH-protokoll", "tek": "Se nyckelkaraktäristik", "akt": "Europeiska kommissionen; E-hälsomyndigheten (svensk NCP)", "tags": [{"category": "Aktörstyp", "values": "EHDS, stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "primäranvändning"}]}, {"nr": 58, "n": "Xt-EHR (eXTended Electronic Health Records)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "EU4Health Joint Action; E-hälsomyndigheten deltar för Sverige", "tid": "1 november 2023 – 30 april 2026", "st": "Operativt", "fin": "EU4Health-finansierat", "fok": "Primäranvändning (EHR exchange format för EHDS)", "mg": "Nationella e-hälsomyndigheter, systemleverantörer", "del": "C", "sub": "C2", "nk": "Joint Action som utvecklar EEHRxF (European EHR Exchange Format) implementeringsguider för EHDS. E-hälsomyndigheten deltar aktivt, bl.a. via remissförfarande på samarbetsyta.ehalsomyndigheten.se. EHDS-relevans: direkt — definierar EHDS primary use-standarder.", "ehds": "direkt — definierar EHDS primary use-standarder.", "korr": "", "dep": "59, 60, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "EEHRxF-format"}, {"name": "Teknik/IT", "score": 3, "comment": "HL7/openEHR/OMOP"}, {"name": "Strategi", "score": 3, "comment": "EU Digital Europe"}, {"name": "Juridik", "score": 2, "comment": "EHDS-standard"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Standardisering"}, {"name": "Kompetens", "score": 2, "comment": "HL7 Sweden/RISE"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "EEHRxF-standard"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Formatstandard"}, {"name": "Data management & governance", "score": 2, "comment": "EU Digital Europe"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "EEHRxF-variabler"}, {"name": "Juridik", "score": 2, "comment": "EHDS-standard"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "EU4Health Joint Action; E-hälsomyndigheten deltar för Sverige", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan, infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 65, "n": "TEF-Health Sweden", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "KI (leder svensk nod); RISE och SciLifeLab som partners", "tid": "Januari 2023–pågående", "st": "Operativt", "fin": "Över 100 MSEK (EC) till svensk nod; totalt konsortium ~60 MEuro, 51+ partners från 9 länder", "fok": "Sekundäranvändning (testning och validering av hälso-AI)", "mg": "AI-utvecklare, medicintekniska företag, forskare", "del": "C", "sub": "C2", "nk": "Testing and Experimentation Facility for Health AI and Robotics. EU Digital Europe Programme. KI leder den svenska noden. Testar AI-produkter i realistiska hälso- och sjukvårdsmiljöer. EHDS-relevans: testinfrastruktur för AI som kan använda EHDS-data.", "ehds": "testinfrastruktur för AI som kan använda EHDS-data.", "korr": "", "dep": "75, 84", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Testdata"}, {"name": "Teknik/IT", "score": 3, "comment": "TEF-Health"}, {"name": "Strategi", "score": 2, "comment": "EU Digital Europe"}, {"name": "Juridik", "score": 2, "comment": "MDR/AI Act"}, {"name": "Nyttokalkyler", "score": 2, "comment": "AI-testning"}, {"name": "Kompetens", "score": 2, "comment": "AI-testning"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Testbädd extern"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Testdata"}, {"name": "Data management & governance", "score": 1, "comment": "RISE"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Testspecifik"}, {"name": "Juridik", "score": 1, "comment": "MDR/AI Act"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "KI (leder svensk nod); RISE och SciLifeLab som partners", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "innovation, demonstrator, AI"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 67, "n": "B1MGplus (Beyond 1 Million Genomes plus)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "EU-konsortium; GMS samledande i hälsoekonomiska arbetspaket", "tid": "2025–2027", "st": "Nystartat", "fin": "EU Digital Europe Programme", "fok": "Sekundäranvändning (genomik och precisionsmedicin)", "mg": "Genomikforskare, hälsoekonomer, beslutsfattare", "del": "C", "sub": "C3", "nk": "Uppföljare till B1MG. GMS samledande i hälsoekonomi-arbetspaketet (Oskar Frisell, Mikaela Friedman). Stödjer 1+ Million Genomes-deklarationen och EHDS genomik-ambitioner. EHDS-relevans: direkt — genomikdata under EHDS.", "ehds": "direkt — genomikdata under EHDS.", "korr": "", "dep": "1, 25, 54", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Avslutat projekt"}, {"name": "Teknik/IT", "score": 2, "comment": "Grund för GDI"}, {"name": "Strategi", "score": 2, "comment": "EU-projekt"}, {"name": "Juridik", "score": 2, "comment": "EHDS-historik"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Historisk"}, {"name": "Kompetens", "score": 1, "comment": "Genomik-EU"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Avslutat"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Historiskt"}, {"name": "Data management & governance", "score": 1, "comment": "EU-projekt"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "B1MG-metadata"}, {"name": "Juridik", "score": 1, "comment": "EHDS-historik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "EU-konsortium; GMS samledande i hälsoekonomiska arbetspaket", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "forskning, samverkan"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 68, "n": "ERDERA (European Rare Diseases Research Alliance)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "170+ partners i 37 länder; Vinnova och VR finansierar svenskt deltagande", "tid": "September 2024 – augusti 2031", "st": "Operativt", "fin": "~56,3 MEuro (EU Horizon Europe); totalt med nationell medfinansiering ~380 MEuro", "fok": "Sekundäranvändning (sällsynta sjukdomar — data, register, forskning)", "mg": "Forskare och kliniker inom sällsynta sjukdomar", "del": "C", "sub": "C3", "nk": "Europeiskt partnerskap under Horizon Europe. Samlar register, biobanker och forskningsnätverk för sällsynta sjukdomar. EHDS-relevans: sällsynta sjukdomsdata under EHDS.", "ehds": "sällsynta sjukdomsdata under EHDS.", "korr": "", "dep": "1, 43, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Sällsynta sjukd."}, {"name": "Teknik/IT", "score": 2, "comment": "Orphanet"}, {"name": "Strategi", "score": 2, "comment": "EU Horizon"}, {"name": "Juridik", "score": 2, "comment": "EHDS-sjukdomsreg."}, {"name": "Nyttokalkyler", "score": 2, "comment": "Sällsynta sjukd."}, {"name": "Kompetens", "score": 1, "comment": "Specialistkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Sällsynta sjukd."}, {"name": "Data management & governance", "score": 1, "comment": "EU Horizon"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Orphanet-koder"}, {"name": "Juridik", "score": 1, "comment": "EHDS"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "170+ partners i 37 länder; Vinnova och VR finansierar svenskt deltagande", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "forskning, samverkan"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 69, "n": "GA4GH (Global Alliance for Genomics and Health)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "Internationell allians; SciLifeLab/NBIS svensk representation", "tid": "Pågående (grundat 2013)", "st": "Operativt", "fin": "Internationellt finansierat (ej svensk specifik)", "fok": "Sekundäranvändning (standarder för genomikdatadelning)", "mg": "Genomikforskare, datainfrastrukturutvecklare globalt", "del": "C", "sub": "C3", "nk": "Globala standarder: Beacon, htsget, DRS, Passports. 13:e plenarsessionen hölls i Uppsala 6–10 oktober 2025 (samvärd SciLifeLab), ~300 fysiska deltagare från 43 länder, 300+ virtuella. Per Sikora (GMS) ordförande i programkommittén. EHDS-relevans: GA4GH-standarder används i GDI och påverkar EHDS genomik-specifikationer.", "ehds": "GA4GH-standarder används i GDI och påverkar EHDS genomik-specifikationer.", "korr": "", "dep": "1, 25, 26", "ai": [{"name": "Datatillgång", "score": 2, "comment": "GA4GH-standarder"}, {"name": "Teknik/IT", "score": 3, "comment": "Beacon/Phenopackets"}, {"name": "Strategi", "score": 3, "comment": "Internationellt"}, {"name": "Juridik", "score": 2, "comment": "Framework-nivå"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Genomikstandard"}, {"name": "Kompetens", "score": 2, "comment": "NBIS/SciLifeLab"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GA4GH-standarder"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Genomikstandarder"}, {"name": "Data management & governance", "score": 2, "comment": "Internationellt"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Beacon/Phenopackets"}, {"name": "Juridik", "score": 2, "comment": "Framework"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Internationell allians; SciLifeLab/NBIS svensk representation", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan, infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 70, "n": "NordMAN (Nordic Microdata Access Network)", "fk": "EU", "typ": "Samverkan / demonstrator / forskning", "ans": "NordForsk; SCB som svensk kärnpartner (projektledare: Claus-Göran Hjelm)", "tid": "Pågående", "st": "Operativt", "fin": "14 MNOK (NordForsk)", "fok": "Begränsat — primärt social/statistisk mikrodata, inte specifikt hälsodata", "mg": "Nordiska registerforskare", "del": "C", "sub": "C3", "nk": "Alla fem nordiska statistikbyråer deltar. Fokuserar på gränsöverskridande tillgång till registerdata. Primärt social/statistisk mikrodata men kan inkludera hälsorelevanta variabler. EHDS-relevans: begränsad — inte hälsodataspecifikt.", "ehds": "begränsad — inte hälsodataspecifikt.", "korr": "", "dep": "52, 55, 56, 77", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Nordisk RWE"}, {"name": "Teknik/IT", "score": 2, "comment": "Mikrodatatillgång"}, {"name": "Strategi", "score": 2, "comment": "NordForsk"}, {"name": "Juridik", "score": 3, "comment": "Gränsöverskridande"}, {"name": "Nyttokalkyler", "score": 2, "comment": "HTA nordisk"}, {"name": "Kompetens", "score": 2, "comment": "HTA-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "NordMAN-plattform"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Nordisk mikrodatatillgång"}, {"name": "Data management & governance", "score": 2, "comment": "NordForsk"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Nordisk harmonisering"}, {"name": "Juridik", "score": 2, "comment": "Gränsöverskridande"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "NordForsk; SCB som svensk kärnpartner (projektledare: Claus-Göran Hjelm)", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "samverkan, forskning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 77, "n": "EHDS-förordningen (EU 2025/327)", "fk": "EU", "typ": "Digital infrastruktur för datadelning", "ans": "Europeiska kommissionen; nationell implementation av medlemsstaterna", "tid": "Ikraftträdande 26 mars 2025; full tillämpning stegvis 2027–2031", "st": "Ikraftträdd — implementation pågår", "fin": "EU-finansiering av genomförande; nationella kostnader varierar (svensk uppskattning ej verifierad)", "fok": "Primäranvändning + Sekundäranvändning (EU-övergripande reglering)", "mg": "Alla EU-hälsodataaktörer", "del": "D", "sub": "D", "nk": "EU-förordning som reglerar gränsöverskridande hälsodatadelning. Tidsplan: 26 mars 2027 (förordningen tillämpas, genomförandeakter), 26 mars 2029 (första gruppen primäranvändning: Patient Summaries, ePrescription + de flesta sekundäranvändningsbestämmelser), 26 mars 2031 (andra gruppen primäranvändning: medicinska bilder, labbresultat, epikriser + kvarvarande sekundära kategorier). Kräver nationell HDAB, säkra behandlingsmiljöer, standardiserade format.", "ehds": "", "korr": "", "dep": "57, 58, 61, 80, 83, 87, 88, 91", "ai": [{"name": "Datatillgång", "score": 3, "comment": "14 datakategorier"}, {"name": "Teknik/IT", "score": 2, "comment": "EEHRxF-krav"}, {"name": "Strategi", "score": 3, "comment": "EU-lag"}, {"name": "Juridik", "score": 3, "comment": "Central"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Gränsöversk. data"}, {"name": "Kompetens", "score": 2, "comment": "EHDS-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "EHDS-ramverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "EHDS-definition"}, {"name": "Data management & governance", "score": 3, "comment": "EU-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "14 datakategorier"}, {"name": "Juridik", "score": 3, "comment": "EHDS-förordning"}], "nytta": [{"level": "Strategisk", "text": "EU-lagstiftning som driver nationell transformation"}, {"level": "Taktisk", "text": "14 prioriterade datakategorier sätter agenda"}, {"level": "Operativ", "text": "Gränsöverskridande vård och forskning"}, {"level": "Teknisk", "text": "EEHRxF, FHIR, EHDS-noder"}, {"level": "Datamässig", "text": "Standardiserade hälsodata i hela EU"}], "ds": "14 prioriterade datakategorier: EHR, labb, bilddiagnostik, utskrivning, genomik, läkemedel m.fl. EEHRxF-format", "tek": "Se nyckelkaraktäristik", "akt": "EU-kommissionen, Europaparlamentet, medlemsstater, Socialstyrelsen (HDAB), E-hälsomyndigheten", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik, strategi"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 78, "n": "SOU 2023:76 – Vidareanvändning av hälsodata för vård och klinisk forskning", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Regeringskansliet (utredning)", "tid": "Publicerad 2023", "st": "Remitterad", "fin": "N/A (lagstiftningsförslag)", "fok": "Sekundäranvändning (vidareanvändning av patientdata)", "mg": "Regioner, forskare, myndigheter", "del": "D", "sub": "D", "nk": "Föreslår ny lag om vidareanvändning av personuppgifter för klinisk forskning och ändringar i Patientdatalagen kap. 6. EHDS-relevans: direkt — anpassar svensk lagstiftning för EHDS sekundäranvändning.", "ehds": "direkt — anpassar svensk lagstiftning för EHDS sekundäranvändning.", "korr": "", "dep": "77, 80, 83", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Vidareanvändning"}, {"name": "Teknik/IT", "score": 1, "comment": "Lagförslag"}, {"name": "Strategi", "score": 3, "comment": "SOU"}, {"name": "Juridik", "score": 3, "comment": "PDL-anpassning"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Forskningstillgång"}, {"name": "Kompetens", "score": 1, "comment": "Juridisk"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Lagstiftningsgrund"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Vidareanvändning"}, {"name": "Data management & governance", "score": 2, "comment": "SOU"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "PDL/sekundär"}, {"name": "Juridik", "score": 3, "comment": "Sekundäranv.juridik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regeringskansliet (utredning)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 79, "n": "SOU 2024:33 – Delad hälsodata – dubbel nytta", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Regeringskansliet (utredning)", "tid": "Publicerad 2024", "st": "Remitterad", "fin": "N/A (lagstiftningsförslag)", "fok": "Primäranvändning + Sekundäranvändning (obligatorisk interoperabilitet)", "mg": "Vårdgivare, systemleverantörer, myndigheter", "del": "D", "sub": "D", "nk": "Föreslår obligatoriska interoperabilitetsstandarder genom bindande myndighetsföreskrifter och skyldighet för vårdgivare att dela data. EHDS-relevans: direkt — svensk implementering av EHDS interoperabilitetskrav.", "ehds": "direkt — svensk implementering av EHDS interoperabilitetskrav.", "korr": "", "dep": "77, 83", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Kommun-region"}, {"name": "Teknik/IT", "score": 1, "comment": "Lagförslag"}, {"name": "Strategi", "score": 3, "comment": "SOU"}, {"name": "Juridik", "score": 3, "comment": "PDL/SoL"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Sammanhållen dok."}, {"name": "Kompetens", "score": 1, "comment": "Juridisk"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Kommun-region"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Sammanhållen dok."}, {"name": "Data management & governance", "score": 2, "comment": "SOU"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Kommunal+regional"}, {"name": "Juridik", "score": 3, "comment": "PDL/SoL"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regeringskansliet (utredning)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 80, "n": "SOU 2024:57 – Ett nytt regelverk för hälsodataregister", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Digital infrastruktur för datadelning", "ans": "Regeringskansliet (utredning S 2023:02, utredare Ingela Alverfors)", "tid": "Publicerad september 2024; remissperiod avslutad 29 januari 2025", "st": "Remitterad", "fin": "N/A (lagstiftningsförslag)", "fok": "Sekundäranvändning (utökning av hälsodataregister)", "mg": "Socialstyrelsen, regioner, primärvård, forskare", "del": "D", "sub": "D", "nk": "Föreslår att ersätta sex registerförordningar med en samlad förordning. Utökar datainsamling till primärvård och somatisk specialistöppenvård. Nytt register för sjukhusadministrerade läkemedel. Ursprung i Dir 2023:48 (efter Coronakommissionen). EHDS-relevans: direkt — utvidgar svensk datainsamling som grund för EHDS.", "ehds": "direkt — utvidgar svensk datainsamling som grund för EHDS.", "korr": "", "dep": "38, 61, 77, 87", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Nytt regelverk"}, {"name": "Teknik/IT", "score": 2, "comment": "Register-IT"}, {"name": "Strategi", "score": 3, "comment": "SOU"}, {"name": "Juridik", "score": 3, "comment": "Registerlagstiftning"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Utökad insamling"}, {"name": "Kompetens", "score": 2, "comment": "Registerkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Registermodernisering"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Utökade register"}, {"name": "Data management & governance", "score": 3, "comment": "SOU/SoS"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Nya datakategorier"}, {"name": "Juridik", "score": 3, "comment": "Ny registerlag"}], "nytta": [{"level": "Strategisk", "text": "Moderniserat regelverk för Socialstyrelsens register"}, {"level": "Taktisk", "text": "Utökad insamling — primärvård, öppenvård, väntetider"}, {"level": "Operativ", "text": "Bättre nationell uppföljning och styrning"}, {"level": "Teknisk", "text": "Nya datainsamlingssystem"}, {"level": "Datamässig", "text": "Primärvårds- och öppenvårdsdata tillgänglig nationellt"}], "ds": "Registerdata: primärvård, specialiserad öppenvård, väntetider, administrerade läkemedel, kommunal hälso- och sjukvård", "tek": "Se nyckelkaraktäristik", "akt": "Regeringskansliet (utredning S 2023:02, utredare Ingela Alverfors)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik, teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 81, "n": "Life Science-strategin (uppdaterad november 2024)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Regeringen", "tid": "Uppdaterad 7 november 2024", "st": "Beslutad", "fin": "Budgetavsättning: 50 MSEK (2025), 100 MSEK/år från 2026 för precisionshälsa", "fok": "Primäranvändning + Sekundäranvändning (strategisk prioritering)", "mg": "Hela life science-sektorn i Sverige", "del": "D", "sub": "D", "nk": "31 mål inom 8 prioriteringsområden. Hälsodata och precisionshälsa är centrala komponenter. Budgetavsättning för precisionshälsa: 50 MSEK (2025), 100 MSEK/år från 2026. Koppling till GMS, SciLifeLab, FOCU·SE. EHDS-relevans: strategiskt styrande — hälsodata prioriteras.", "ehds": "strategiskt styrande — hälsodata prioriteras.", "korr": "", "dep": "1, 77, 82", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Life science bred"}, {"name": "Teknik/IT", "score": 1, "comment": "Policy"}, {"name": "Strategi", "score": 3, "comment": "Regeringsstrategi"}, {"name": "Juridik", "score": 2, "comment": "Ramverk"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Konkurrenskraft"}, {"name": "Kompetens", "score": 1, "comment": "Tvärvetenskaplig"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Policy"}, {"name": "Data management & governance", "score": 1, "comment": "Regeringen"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Ramverksnivå"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regeringen", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "strategi"}, {"category": "Fokusområde", "values": "strategi"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 82, "n": "Socialstyrelsens precisionshälsa-uppdrag", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Socialstyrelsen (regeringsuppdrag november 2025)", "tid": "November 2025 – 31 december 2030", "st": "Pågående", "fin": "80 MSEK till GMS (april 2025); 44 MSEK till FOCU·SE (september 2025)", "fok": "Primäranvändning + Sekundäranvändning (precisionshälsa)", "mg": "Regioner, GMS, SciLifeLab, patientorganisationer", "del": "D", "sub": "D", "nk": "Nationell koordineringsstruktur med styrgrupp. Socialstyrelsen koordinerar med regioner, GMS, SciLifeLab och patientorganisationer. Slutrapport 31 december 2030. EHDS-relevans: precisionshälsa kräver standardiserad hälsodatadelning.", "ehds": "precisionshälsa kräver standardiserad hälsodatadelning.", "korr": "", "dep": "1, 81", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Genomik/AI"}, {"name": "Teknik/IT", "score": 2, "comment": "Samordning"}, {"name": "Strategi", "score": 3, "comment": "Socialstyrelsen"}, {"name": "Juridik", "score": 2, "comment": "GMS-juridik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Precisionsmed."}, {"name": "Kompetens", "score": 2, "comment": "Klinisk genomik"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "GMS-samordning"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Genomikdata"}, {"name": "Data management & governance", "score": 2, "comment": "SoS"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Genomikvariabler"}, {"name": "Juridik", "score": 2, "comment": "GMS-juridik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen (regeringsuppdrag november 2025)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "samverkan"}, {"category": "Fokusområde", "values": "strategi, teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 83, "n": "Patientdatalagen (PDL 2008:355)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Socialdepartementet", "tid": "2008–pågående (under revidering)", "st": "Gällande lagstiftning", "fin": "Ej tillämpligt (lagstiftning)", "fok": "Primäranvändning + Sekundäranvändning", "mg": "Alla vårdgivare, regioner, kommuner, forskare", "del": "D", "sub": "D", "nk": "Grundlagstiftning för behandling av personuppgifter inom hälso- och sjukvården. Kap. 6 reglerar sammanhållen journalföring (NPÖ). Kap. 7 reglerar kvalitetsregister med opt-out-modell. Under revidering i samband med EHDS-anpassning och SOU 2024:33. Central för att förstå juridiska ramar kring all hälsodatahantering i Sverige.", "ehds": "", "korr": "", "dep": "5, 77, 78, 79", "ai": [{"name": "Datatillgång", "score": 3, "comment": "All vårddata"}, {"name": "Teknik/IT", "score": 1, "comment": "Juridiskt ramverk"}, {"name": "Strategi", "score": 2, "comment": "Grundlag"}, {"name": "Juridik", "score": 3, "comment": "PDL central"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Vårdkontinuitet"}, {"name": "Kompetens", "score": 1, "comment": "Juridisk"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Juridiskt ramverk"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "All PDL-data"}, {"name": "Data management & governance", "score": 3, "comment": "PDL-governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "PDL-definitioner"}, {"name": "Juridik", "score": 3, "comment": "PDL central"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialdepartementet", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 84, "n": "EU AI Act (förordning 2024/1689)", "fk": "EU", "typ": "Lagstiftning/strategi/policy", "ans": "EU-kommissionen; nationellt PTS (föreslagen marknadskontrollmyndighet, SOU 2025:101)", "tid": "Antagen augusti 2024, stegvis ikraftträdande 2025–2027", "st": "Gällande EU-förordning", "fin": "Ej tillämpligt (lagstiftning)", "fok": "Primäranvändning (kliniskt beslutsstöd) + Sekundäranvändning (AI-modeller)", "mg": "Alla som utvecklar eller använder AI-system inom hälso- och sjukvård", "del": "D", "sub": "D", "nk": "EU-förordning som klassificerar AI-system efter risknivå. Hälso- och sjukvårds-AI klassificeras generellt som högrisk (Annex III, punkt 5). Krav på riskhantering, datagovernance, transparens, mänsklig tillsyn. Koppling till MDR/IVDR för medicintekniska AI-produkter. PTS föreslås som marknadskontrollmyndighet (SOU 2025:101). IMY:s AI-sandbox testar tillämpningen. TEF-Health (nr 65) och RISE (nr 75) erbjuder testbäddar.", "ehds": "", "korr": "", "dep": "65, 75, 86, 89", "ai": [{"name": "Datatillgång", "score": 2, "comment": "AI-systemdata"}, {"name": "Teknik/IT", "score": 2, "comment": "AI-klassificering"}, {"name": "Strategi", "score": 3, "comment": "EU-lag"}, {"name": "Juridik", "score": 3, "comment": "Högrisk hälso-AI"}, {"name": "Nyttokalkyler", "score": 2, "comment": "AI-säkerhet"}, {"name": "Kompetens", "score": 2, "comment": "AI-regulering"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "AI-regulering"}, {"name": "Data management & governance", "score": 1, "comment": "EU/PTS"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "AI-klassificering"}, {"name": "Juridik", "score": 2, "comment": "Högrisk-juridik"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "EU-kommissionen; nationellt PTS (föreslagen marknadskontrollmyndighet, SOU 2025:101)", "tags": [{"category": "Aktörstyp", "values": "EHDS"}, {"category": "Verksamhetstyp", "values": "juridik"}, {"category": "Fokusområde", "values": "juridik, teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 85, "n": "Digitaliseringsstrategin 2025–2030", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Regeringskansliet (Finansdepartementet/Infrastrukturdepartementet)", "tid": "2025–2030", "st": "Beslutad strategi", "fin": "Ej specificerat (sektorsövergripande)", "fok": "Begränsat — sektorsövergripande", "mg": "All offentlig sektor", "del": "D", "sub": "D", "nk": "Sektorsövergripande strategi för digitalisering av offentlig sektor. Hälso- och sjukvård är en av flera prioriterade sektorer. Kopplar till Ena (nr 10), NDI (nr 9) och AI-strategin (nr 89). Sätter ramarna för digital utveckling men är inte hälsodataspecifik.", "ehds": "", "korr": "", "dep": "9, 10, 89", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Sektorsövergrip."}, {"name": "Teknik/IT", "score": 1, "comment": "Policy"}, {"name": "Strategi", "score": 3, "comment": "Regeringsstrategi"}, {"name": "Juridik", "score": 1, "comment": "Ramverk"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Digital utveckling"}, {"name": "Kompetens", "score": 1, "comment": "Generell"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Begränsad"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Policy"}, {"name": "Data management & governance", "score": 1, "comment": "Regeringen"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 1, "comment": "Ramverk"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regeringskansliet (Finansdepartementet/Infrastrukturdepartementet)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "strategi"}, {"category": "Fokusområde", "values": "strategi"}, {"category": "Användning", "values": "EJ VÅRDRELATERAT"}]}, {"nr": 86, "n": "IMY AI-regulatorisk sandbox", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Integritetsskyddsmyndigheten (IMY)", "tid": "Sedan 2024, expansion planerad", "st": "Operativt", "fin": "IMY:s anslag", "fok": "Sekundäranvändning (AI-tillämpningar med persondata)", "mg": "Organisationer som utvecklar AI med personuppgifter", "del": "D", "sub": "D", "nk": "IMY driver en regulatorisk sandbox enligt EU AI Act art. 57–62 där organisationer kan testa AI-lösningar under GDPR-tillsyn. Hälsodata är ett prioriterat tillämpningsområde givet högrisk-klassificeringen. Koppling till AI Act (nr 84) och AI-strategin (nr 89). Expansion planerad i linje med handlingsplanen (nr 90).", "ehds": "", "korr": "", "dep": "84, 89", "ai": [{"name": "Datatillgång", "score": 2, "comment": "AI+persondata"}, {"name": "Teknik/IT", "score": 2, "comment": "Sandbox-miljö"}, {"name": "Strategi", "score": 2, "comment": "IMY"}, {"name": "Juridik", "score": 3, "comment": "GDPR/AI Act"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Regulatorisk test"}, {"name": "Kompetens", "score": 2, "comment": "Dataskydd+AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Sandbox-test"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "AI-hälsodata"}, {"name": "Data management & governance", "score": 1, "comment": "IMY"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "GDPR-gränsfall"}, {"name": "Juridik", "score": 3, "comment": "GDPR/AI Act"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Integritetsskyddsmyndigheten (IMY)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "innovation, AI"}, {"category": "Fokusområde", "values": "juridik, teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 87, "n": "Regeringsuppdrag Socialstyrelsen — utökad insamling av hälsodata", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Socialstyrelsen", "tid": "2026 (slutrapport 30 april 2027)", "st": "Pågående uppdrag", "fin": "26 MSEK (2026)", "fok": "Sekundäranvändning (nationella hälsodataregister)", "mg": "Socialstyrelsen, regioner, vårdgivare", "del": "D", "sub": "D", "nk": "Operationaliserar SOU 2024:57 (nr 80) genom att utöka Socialstyrelsens datainsamling till att omfatta primärvård, specialiserad öppenvård, väntetider, administrerade läkemedel och kommunal hälso- och sjukvård. Dessa nya datakategorier matchar EHDS art. 14 prioriterade datakategorier. Direkt koppling till vårddatahubben (nr 76) som kan fungera som regionernas kanal för den utökade rapporteringen.", "ehds": "", "korr": "", "dep": "38, 61, 76, 77, 80", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Utökade register"}, {"name": "Teknik/IT", "score": 2, "comment": "Ny insamling"}, {"name": "Strategi", "score": 3, "comment": "Regeringsuppdrag"}, {"name": "Juridik", "score": 3, "comment": "SOU 2024:57"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Nationell uppföljning"}, {"name": "Kompetens", "score": 2, "comment": "Registerkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Registerutökning"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Nya datakategorier"}, {"name": "Data management & governance", "score": 3, "comment": "SoS"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "Nya variabler"}, {"name": "Juridik", "score": 3, "comment": "SOU 2024:57"}], "nytta": [{"level": "Strategisk", "text": "Operationaliserar SOU 2024:57"}, {"level": "Taktisk", "text": "26 MSEK för utökad datainsamling 2026"}, {"level": "Operativ", "text": "Nya datakategorier möjliggör väntetidsanalys"}, {"level": "Teknisk", "text": "Anslutning till vårddatahubb möjlig"}, {"level": "Datamässig", "text": "Primärvård, administrerade läkemedel, kommunal hälso- och sjukvård"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Socialstyrelsen, 21 regioner, privata vårdgivare, kommuner", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, juridik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 88, "n": "SOU 2026:6 — Nationell digital infrastruktur för hälso- och sjukvården (NDI-utredningen)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Utredare Tomas Werngren (Dir. 2023:177)", "tid": "Publicerad 19 januari 2026", "st": "Avslutad utredning, remissbehandling", "fin": "1 500 MSEK (2026, föreslagen nivå)", "fok": "Primäranvändning + Sekundäranvändning (nationell infrastruktur)", "mg": "Regioner, myndigheter, Inera, SKR", "del": "D", "sub": "D", "nk": "Utredning med 6 huvudrekommendationer: 1) Nya roller/ansvar för statliga aktörer, 2) Direkt statlig finansiering till regioner för digital infrastruktur, 3) Kommunalt stöd via E-hälsomyndigheten/Socialstyrelsen, 4) Ny lagstiftning för interoperabilitet, 5) Starkt ledarskap, 6) Patientcentrerad kultur. Kritisk iakttagelse: samhällskritisk infrastruktur bör ej ligga hos aktörer som staten inte kan styra (implicit kritik mot Inera/SKR-modellen). Governance-spänning med KCHD/vårddatahubb som ligger under SKR.", "ehds": "", "korr": "", "dep": "9, 76, 77, 83, 85, 89, 91", "ai": [{"name": "Datatillgång", "score": 3, "comment": "NDI-data"}, {"name": "Teknik/IT", "score": 2, "comment": "Infrastrukturplan"}, {"name": "Strategi", "score": 3, "comment": "1500 MSEK"}, {"name": "Juridik", "score": 3, "comment": "Ny lagstiftning"}, {"name": "Nyttokalkyler", "score": 3, "comment": "Samhällsnytta"}, {"name": "Kompetens", "score": 2, "comment": "Bredkompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "NDI-infrastruktur"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Nationell sekundär"}, {"name": "Data management & governance", "score": 3, "comment": "Statlig governance"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "NDI-standarder"}, {"name": "Juridik", "score": 3, "comment": "Ny lagstiftning"}], "nytta": [{"level": "Strategisk", "text": "1 500 MSEK — massiv infrastruktursatsning"}, {"level": "Taktisk", "text": "6 rekommendationer för nationell digital infrastruktur"}, {"level": "Operativ", "text": "Ny lagstiftning för interoperabilitet"}, {"level": "Teknisk", "text": "Statlig finansiering direkt till regioner"}, {"level": "Datamässig", "text": "NDI-data för primär- och sekundäranvändning"}], "ds": "Se nyckelkaraktäristik", "tek": "Föreslår ny statlig infrastruktur med interoperabilitetskrav, direkt finansiering till regioner", "akt": "Utredare Tomas Werngren, Socialdepartementet, E-hälsomyndigheten, Socialstyrelsen, Inera, SKR, regioner", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "juridik, strategi"}, {"category": "Fokusområde", "values": "juridik, strategi, teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 89, "n": "Sveriges AI-strategi och AI-kommissionen (SOU 2025:12)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Finansdepartementet/AI-sekretariatet (minister Erik Slottner); AI-kommissionen (ordförande Carl-Henric Svanberg)", "tid": "AI-kommissionen: SOU 2025:12 (75 förslag). AI-strategi: 20 februari 2026", "st": "Beslutad strategi", "fin": "479 MSEK (2026); ca 500 MSEK/år 2027–2030", "fok": "Sekundäranvändning (AI-tillämpningar i hälso- och sjukvård)", "mg": "Myndigheter, regioner, akademi, näringsliv", "del": "D", "sub": "D", "nk": "AI-kommissionen (SOU 2025:12) föregick strategin med 75 förslag. Strategin har tre pelare: Samhällsnytta, Hållbar utveckling, Konkurrenskraft. Ambition: global topp-10 inom AI. Hälsorelevans: EHDS-utnyttjande nämns explicit, NDI prioriteras, AI Sweden IDV kartlade 179 AI-initiativ i 21 regioner. AI-verkstad (100 MSEK vardera Skatteverket/FK 2026–2030). PTS föreslås som AI Act-myndighet (SOU 2025:101). Koppling till AI Factory Mimer (nr 24), DDLS (nr 11), WASP (nr 13).", "ehds": "", "korr": "", "dep": "13, 24, 84, 88, 90", "ai": [{"name": "Datatillgång", "score": 3, "comment": "AI-träningsdata"}, {"name": "Teknik/IT", "score": 3, "comment": "AI-infrastruktur"}, {"name": "Strategi", "score": 3, "comment": "479 MSEK"}, {"name": "Juridik", "score": 2, "comment": "AI Act-koppling"}, {"name": "Nyttokalkyler", "score": 3, "comment": "AI-innovation"}, {"name": "Kompetens", "score": 3, "comment": "AI-kompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "AI-infrastruktur"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "AI-tillämpningar"}, {"name": "Data management & governance", "score": 2, "comment": "AI-sekretariatet"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 2, "comment": "AI Act"}], "nytta": [{"level": "Strategisk", "text": "479 MSEK 2026 — Sverige global topp-10 AI"}, {"level": "Taktisk", "text": "AI-verkstad offentlig sektor inkl hälsa"}, {"level": "Operativ", "text": "100+ myndigheter AI/data-uppdrag"}, {"level": "Teknisk", "text": "AI Factory, GPU-kluster, språkmodeller"}, {"level": "Datamässig", "text": "AI-träningsdata från hälsodata-register"}], "ds": "AI-modeller, träningsdata, syntetisk data, benchmarkdata", "tek": "Se nyckelkaraktäristik", "akt": "Finansdepartementet, AI-sekretariatet, AI Sweden, Vinnova, VR, 100+ myndigheter, PTS", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "strategi, AI"}, {"category": "Fokusområde", "values": "strategi, teknik, kompetens"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 90, "n": "Handlingsplan för AI-strategin", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Regeringskansliet (Finansdepartementet)", "tid": "20 februari 2026; uppföljning årligen 2027–2030", "st": "Beslutad", "fin": "Del av AI-strategins 479+ MSEK", "fok": "Sekundäranvändning (AI i offentlig sektor inkl hälsa)", "mg": "100+ myndigheter, regioner, akademi", "del": "D", "sub": "D", "nk": "40+ konkreta åtgärder. Hälsorelevanta: NDI-utredare (S 2024:A), EHDS primär/sekundäranvändnings-propositioner, data steward vid SCB/DIGG, AI-verkstad offentlig sektor inklusive hälsa, ny interoperabilitetslag 2026. Nyckelåtgärder: 100+ myndigheter AI/data-uppdrag (Fi2025/02284), Skatteverket+FK AI-verkstad 200 MSEK totalt, KB språkmodeller, AI Factory LiU (nr 24), Nordic-Baltic AI Center, 7 universitet AI-kurser. Tidslinje: Årlig uppföljning DIGG+PTS 2027–2030, AI-verkstad operativ 2030, EHDS fasad 2027–2029.", "ehds": "", "korr": "", "dep": "9, 84, 85, 88, 89, 91", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Åtgärdsdata"}, {"name": "Teknik/IT", "score": 2, "comment": "40+ åtgärder"}, {"name": "Strategi", "score": 3, "comment": "Handlingsplan"}, {"name": "Juridik", "score": 2, "comment": "Interop.lag 2026"}, {"name": "Nyttokalkyler", "score": 2, "comment": "EHDS-fasad"}, {"name": "Kompetens", "score": 2, "comment": "Genomförandekompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Åtgärdsplan"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "AI+EHDS"}, {"name": "Data management & governance", "score": 2, "comment": "Regeringen"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generell"}, {"name": "Juridik", "score": 2, "comment": "Interop.lag 2026"}], "nytta": [{"level": "Strategisk", "text": "Se nyckelkaraktäristik"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Regeringskansliet (Finansdepartementet)", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "strategi"}, {"category": "Fokusområde", "values": "strategi, teknik"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 91, "n": "Samordnare för digital infrastruktur i hälso- och sjukvården (Mats Nilsson, S 2024:A)", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Lagstiftning/strategi/policy", "ans": "Mats Nilsson (utsedd samordnare, Socialdepartementet)", "tid": "2024–2026 (fyra delrapporter + slutrapport 1 april 2026)", "st": "Pågående uppdrag", "fin": "Ej specificerat (del av Socialdepartementets budget)", "fok": "Primäranvändning + Sekundäranvändning (nationell infrastruktur)", "mg": "Regioner, myndigheter, Inera, SKR, akademi, näringsliv", "del": "D", "sub": "D", "nk": "Regeringsuppdrag att samordna och föreslå vägar framåt för en nationell digital infrastruktur för hälso- och sjukvården. Fyra delrapporter levererade (april 2024, juni 2024, juni 2025, september 2025). Slutrapport planerad 1 april 2026. Nära koppling till men skild från E-hälsomyndighetens NDI-bygge (nr 9) — Mats Nilsson utreder policy och riktning, EHM bygger teknisk infrastruktur. Ska föreslå konkreta lösningar för både primär- och sekundäranvändning enligt EHDS. Koppling till SOU 2026:6 (nr 88) som behandlar samma frågor men från annat perspektiv (Tomas Werngren).", "ehds": "", "korr": "", "dep": "9, 57, 77, 88", "ai": [{"name": "Datatillgång", "score": 3, "comment": "NDI-planering"}, {"name": "Teknik/IT", "score": 2, "comment": "Samordnarroll"}, {"name": "Strategi", "score": 3, "comment": "Regeringsprio"}, {"name": "Juridik", "score": 3, "comment": "EHDS-juridik"}, {"name": "Nyttokalkyler", "score": 3, "comment": "EHDS-implementering"}, {"name": "Kompetens", "score": 2, "comment": "Policykompetens"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Samordnarroll NDI"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "EHDS primär+sekundär"}, {"name": "Data management & governance", "score": 3, "comment": "Regeringsuppdrag"}, {"name": "Variabelbeskrivningar/metadata", "score": 3, "comment": "NDI-förslag"}, {"name": "Juridik", "score": 3, "comment": "EHDS-juridik"}], "nytta": [{"level": "Strategisk", "text": "Samordnar Sveriges EHDS-implementering"}, {"level": "Taktisk", "text": "Fyra delrapporter ger successiv vägledning"}, {"level": "Operativ", "text": "Konkreta förslag för nationell infrastruktur"}, {"level": "Teknisk", "text": "Policy-förslag som driver teknisk utveckling"}, {"level": "Datamässig", "text": "Ramar för primär- och sekundäranvändning"}], "ds": "Se nyckelkaraktäristik", "tek": "Se nyckelkaraktäristik", "akt": "Mats Nilsson (samordnare), Socialdepartementet, E-hälsomyndigheten, Socialstyrelsen, regioner, Inera", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "samverkan, strategi"}, {"category": "Fokusområde", "values": "strategi, juridik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 92, "n": "Health Data Centre (HDC) / Region Halland informationsdriven vård", "del": "B", "sub": "B", "fk": "Regionerna", "typ": "Samverkan / demonstrator / forskning", "ans": "Högskolan i Halmstad (Leap for Life) i samverkan med Region Halland", "tid": "2020–pågående (HDC etablerat ~2020; Health Data Sweden-partner sedan januari 2026)", "st": "Operativt", "fin": "12,2 MSEK (EU ERUF + Region Halland + HH, 2021–2023); tillkommande medel via Health Data Sweden/EDIH", "fok": "Sekundäranvändning (informationsdriven vård, AI-forskning på hälsodata)", "mg": "Forskare, Region Halland verksamhetschefer, läkemedelsindustri, AI-utvecklare", "nk": "Health Data Centre (HDC) vid Högskolan i Halmstad är ett centrum för forskning och analys inom hälsodata och AI. Kärnan är en säker teknisk infrastruktur som möjliggör analys och forskning på hälsodata i enlighet med gällande regelverk. HDC arbetar med 'real world data' tillsammans med bland annat läkemedelsindustrin och Region Halland. Prediktionsmodeller utvecklas för patientgrupper som hjärtsvikt, kronisk njursjukdom, diabetes, KOL och cancer. Region Halland har arbetat med informationsdriven vård sedan ~2005 och fick EP PerMed Best Practice-utmärkelse november 2025. Markus Lingman (överläkare/strateg) och Magnus Clarin (forsknings- och innovationsdirektör) är nyckelpersoner. CAISR Health vid Högskolan i Halmstad bedriver forskning med partners som Cambio, AstraZeneca och InterSystems. Koppling till Health Data Sweden (nr 21) som EDIH-partner sedan januari 2026. Projekt kring federerat lärande med Region Kronoberg och Region Örebro. EHDS-relevans: medel — regional dataplattform som kan bidra till EHDS-sekundäranvändning.", "ehds": "Medel — regional dataplattform för informationsdriven vård", "korr": "HDC är primärt en forsknings- och analysmiljö, inte en formell TRE i samma mening som t.ex. GU TRE eller Bianca. Dock hanteras känsliga hälsodata i säker miljö.", "dep": "3, 7, 19, 21", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Regional vårddata"}, {"name": "Teknik/IT", "score": 3, "comment": "AI/ML-plattform"}, {"name": "Strategi", "score": 2, "comment": "Regional prio"}, {"name": "Juridik", "score": 2, "comment": "PDL/GDPR"}, {"name": "Nyttokalkyler", "score": 3, "comment": "EP PerMed-pris"}, {"name": "Kompetens", "score": 3, "comment": "CAISR Health AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "HDC-plattform"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "Regional RWD"}, {"name": "Data management & governance", "score": 2, "comment": "HH/Region Halland"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "COSMIC-data"}, {"name": "Juridik", "score": 2, "comment": "PDL/GDPR"}], "nytta": [{"level": "Strategisk", "text": "Hallandsmodellen som nationellt föredöme för informationsdriven vård"}, {"level": "Taktisk", "text": "Federerat lärande med Region Kronoberg och Örebro"}, {"level": "Operativ", "text": "AI-prediktionsmodeller för hjärtsvikt, njursjukdom, cancer"}, {"level": "Teknisk", "text": "Säker analysmiljö kopplad till regionala hälsodata"}, {"level": "Datamässig", "text": "Real world data från Region Hallands COSMIC-system"}], "ds": "COSMIC-datamodell, ICD-10-SE, KVÅ, ATC, ML-modeller", "tek": "Säker analysmiljö vid Högskolan i Halmstad, COSMIC-dataextrakt, ML/AI-pipelines, federerat lärande", "akt": "Högskolan i Halmstad (Leap for Life, CAISR Health), Region Halland, AI Sweden, AstraZeneca, Cambio, InterSystems, Region Kronoberg, Region Örebro", "tags": [{"category": "Aktörstyp", "values": "region, universitet/akademi"}, {"category": "Verksamhetstyp", "values": "samverkan, forskning, AI, SPE/TRE"}, {"category": "Fokusområde", "values": "teknik, kompetens"}, {"category": "Användning", "values": "sekundäranvändning"}]}, {"nr": 93, "n": "NSG Forskning och Life Science", "del": "A", "sub": "A1", "fk": "Regionerna", "typ": "Samverkan / demonstrator / forskning", "ans": "SKR (kunskapsstyrningssystemet); ordförande Beatrice Melin (Region Västerbotten)", "tid": "Pågående (del av kunskapsstyrningen sedan ~2020)", "st": "Operativt", "fin": "Del av SKR:s verksamhet och kunskapsstyrningsöverenskommelsen", "fok": "Sekundäranvändning (forskning, kunskapsluckor, life science-integration)", "mg": "Forsknings- och utvecklingsdirektörer i alla sjukvårdsregioner, NPO:er, akademi, industri", "nk": "Nationell samverkansgrupp inom kunskapsstyrningen med uppdrag att klargöra forskningens roll och integrera forskningsresultat i nationella programområden. Arbetar med systematisk identifiering och spridning av kunskapsluckor till relevanta aktörer (SBU, KKBF, ALF-regionerna). Sex regionala samverkansgrupper (RSG) speglar arbetet. Insatsområden: kunskapsluckor, integrering av forskning i kunskapsstyrning, AI för kunskapsstödsproduktion (NAG AI under NSG metoder). Koppling till Life Science-strategin (nr 81) och precisionshälsa-uppdraget (nr 82). Nära samverkan med NSG Hälsodata (nr 8) kring datadriven forskning. EHDS-relevans: indirekt — forskning som använder EHDS-data.", "ehds": "Indirekt — forskning som använder EHDS-data", "korr": "", "dep": "8, 11, 42, 81, 82", "ai": [{"name": "Datatillgång", "score": 2, "comment": "Forskningsdata"}, {"name": "Teknik/IT", "score": 1, "comment": "Organisatoriskt"}, {"name": "Strategi", "score": 3, "comment": "Kunskapsstyrning"}, {"name": "Juridik", "score": 2, "comment": "Forskningsetik"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Kunskapsluckor"}, {"name": "Kompetens", "score": 3, "comment": "FoU-direktörer"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Organisatoriskt"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Forskningskoordinering"}, {"name": "Data management & governance", "score": 1, "comment": "Via NSG Hälsodata"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Kunskapsluckor"}, {"name": "Juridik", "score": 1, "comment": "Forskningsetik"}], "nytta": [{"level": "Strategisk", "text": "Klargör forskningens roll i kunskapsstyrningen"}, {"level": "Taktisk", "text": "Systematisk identifiering och spridning av kunskapsluckor"}, {"level": "Operativ", "text": "Stödjer NPO:er med forskningsunderlag"}, {"level": "Teknisk", "text": "AI för kunskapsstödsproduktion (NAG AI)"}, {"level": "Datamässig", "text": "Koppling till registerdata och hälsodata för forskning"}], "ds": "Kunskapsluckor, forskningsunderlag, evidensrapporter", "tek": "SKR:s kunskapsstyrningsplattform", "akt": "SKR, 6 sjukvårdsregioner (RSG), SBU, KKBF, ALF-regioner", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "forskning, samverkan"}, {"category": "Fokusområde", "values": "kompetens, strategi"}, {"category": "Användning", "values": "sekundäranvändning"}], "wg_beskr": "Nationell samverkansgrupp inom kunskapsstyrningen.", "wg_tek": ""}, {"nr": 94, "n": "Infektionsverktyget", "del": "C", "sub": "C2", "fk": "Regionerna", "typ": "Digital infrastruktur för datadelning", "ans": "Inera AB", "tid": "Pågående (ny version med modern samverkansarkitektur planerad 2025)", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud (finansieras via ägarskap från regioner/kommuner/SKR)", "fok": "Primäranvändning (uppföljning av antibiotikaanvändning och vårdrelaterade infektioner) + Sekundäranvändning (rapporter och analys)", "mg": "Strama-nätverk, smittskyddsläkare, vårdhygien, verksamhetschefer", "nk": "Nationellt IT-stöd för att dokumentera, lagra och återkoppla information om vårdrelaterade infektioner och antibiotikaanvändning. Alla regioner och offentligt finansierade privata vårdgivare kan använda tjänsten. Data överförs från journalsystem via NTjP till Infektionsverktygets databas. Rapportverktyget på Sjunet visualiserar antibiotikaanvändning, ordinationsorsaker och vårdrelaterade infektioner. Ny version med moderna API:er enligt Ineras samverkansarkitektur planerad 2025 — pionjär för REST/JSON-mönster. Kräver anslutning till NTjP, HSA, SITHS och Terminologitjänsten. EHDS-relevans: antibiotikaresistensdata kan vara relevant under EHDS.", "ehds": "Indirekt — antibiotikaresistensdata och infektionsövervakning", "korr": "", "dep": "39, 41, 43, 48, 63", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Antibiotikaord."}, {"name": "Teknik/IT", "score": 2, "comment": "NTjP-baserat"}, {"name": "Strategi", "score": 2, "comment": "Strama/AMR"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Patientsäkerhet"}, {"name": "Kompetens", "score": 1, "comment": "Infektionsmed."}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "NTjP-anslutning"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Antibiotikarapporter"}, {"name": "Data management & governance", "score": 2, "comment": "Inera"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Ordinationsorsak+diagnos"}, {"name": "Juridik", "score": 1, "comment": "Begränsad"}], "nytta": [{"level": "Strategisk", "text": "Nationell övervakning av antibiotikaresistens"}, {"level": "Taktisk", "text": "Stödjer Strama-nätverkens förbättringsarbete"}, {"level": "Operativ", "text": "Dagsfärska rapporter om antibiotikaordinationer per enhet"}, {"level": "Teknisk", "text": "Pionjär för Ineras nya samverkansarkitektur (REST/JSON)"}, {"level": "Datamässig", "text": "Antibiotikaordinationer med ordinationsorsak från alla regioner"}], "ds": "Antibiotikaordinationer, ordinationsorsak, diagnoser, vårdrelaterade infektioner, labsvar", "tek": "NTjP (SOAP/XML → REST/JSON), Sjunet-baserat rapportverktyg, Inera-driftat", "akt": "Inera AB, 21 regioner, Folkhälsomyndigheten, Strama", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "infrastruktur för datadelning"}, {"category": "Fokusområde", "values": "teknik, nytta"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}], "wg_beskr": "Infektionsverktyget samlar information om antibiotikaanvändning från alla Sveriges regioner. När vårdpersonal registrerar information om antibiotikaanvändning i sitt vårdinformationssystem skickas informationen till Infektionsverktygets databas. Informationen aggregeras och visas upp i Infektionsverktygets rapportverktyg. Vårdgivare kan också hämta sin bearbetade information via ett elektroniskt gränssnitt, ett så kallat API.", "wg_tek": "Gemensam nationell webbplats på Sjunet."}, {"nr": 95, "n": "Nationellt AI-uppdrag i offentlig sektor (DIGG/IMY)", "del": "D", "sub": "D", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "DIGG (leder), IMY, Arbetsförmedlingen, Bolagsverket, Skatteverket", "tid": "Juli 2024–januari 2025 (riktlinjer); AI-verkstad planerad 2026–2030", "st": "Avslutat (riktlinjer) / Pågående (AI-verkstad)", "fin": "Del av DIGG:s och IMY:s uppdragsbudget; AI-verkstad: 100 MSEK vardera Skatteverket/FK 2026–2030", "fok": "Primäranvändning + Sekundäranvändning (AI-riktlinjer och infrastruktur för offentlig förvaltning)", "mg": "Alla myndigheter, kommuner och regioner", "nk": "Regeringsuppdrag (juli 2024) till DIGG och IMY att ta fram vägledande riktlinjer för generativ AI inom offentlig förvaltning. Riktlinjer publicerade 21 januari 2025 på digg.se/ai. Fyra delar: 1) Infrastruktur och tjänster för AI (referensarkitektur, AI-tillämpningar), 2) Förtroendemodell för automatiserat beslutsfattande, 3) AI-guide, 4) Samlad information om relevanta AI-projekt. AI-verkstad planeras av Försäkringskassan och Skatteverket (30 MSEK vardera initialt, 100 MSEK/år i full skala). KB utvecklar språkmodeller för offentlig sektor. Hälsorelevans: riktlinjerna gäller även regioner; AI-verkstaden öppen för hälso-AI. EHDS-relevans: indirekt — generella AI-riktlinjer som påverkar hälsodatahantering.", "ehds": "Indirekt — generella AI-riktlinjer för offentlig sektor", "korr": "", "dep": "84, 85, 89, 90", "ai": [{"name": "Datatillgång", "score": 2, "comment": "AI-tjänster"}, {"name": "Teknik/IT", "score": 2, "comment": "Referensarkitektur"}, {"name": "Strategi", "score": 3, "comment": "Regeringsuppdrag"}, {"name": "Juridik", "score": 3, "comment": "GDPR/AI Act-riktlinjer"}, {"name": "Nyttokalkyler", "score": 2, "comment": "Effektivisering"}, {"name": "Kompetens", "score": 3, "comment": "Kompetenslyft AI"}], "kchd": [{"name": "Teknik att docka in i", "score": 1, "comment": "Generellt AI-stöd"}, {"name": "Sekundäranvändning av hälsodata", "score": 1, "comment": "Ej hälsospecifikt"}, {"name": "Data management & governance", "score": 2, "comment": "DIGG dataplan"}, {"name": "Variabelbeskrivningar/metadata", "score": 1, "comment": "Generellt"}, {"name": "Juridik", "score": 2, "comment": "AI Act-vägledning"}], "nytta": [{"level": "Strategisk", "text": "Nationella AI-riktlinjer för hela offentlig sektor"}, {"level": "Taktisk", "text": "AI-verkstad för delad infrastruktur och kompetens"}, {"level": "Operativ", "text": "AI-guide och kompetenslyft för myndigheter/regioner"}, {"level": "Teknisk", "text": "Referensarkitektur och gemensamma AI-tjänster"}, {"level": "Datamässig", "text": "Samlad information om AI-projekt i offentlig sektor"}], "ds": "AI-riktlinjer, referensarkitektur, AI-projektdatabas", "tek": "digg.se/ai, AI-verkstad (Skatteverket/FK), KB språkmodeller", "akt": "DIGG, IMY, Skatteverket, Försäkringskassan, Arbetsförmedlingen, Bolagsverket, KB", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet"}, {"category": "Verksamhetstyp", "values": "strategi, AI"}, {"category": "Fokusområde", "values": "kompetens, strategi, teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}], "wg_beskr": "Uppdrag från regeringen att göra det enklare för offentlig förvaltning att använda sig av artificiell intelligens (AI) med syftet att stärka Sveriges välfärd och konkurrenskraft. Uppdragets fyra delar: 1) Infrastruktur och tjänster för AI — referensarkitektur för AI och AI-tillämpningar. 2) Förtroendemodell — ramverk för automatiserat beslutsfattande med stöd av AI. 3) AI-guide — för att öka förståelsen och möjligheterna för offentliga aktörer att använda AI. 4) Samlad information om relevanta AI-projekt — exempel på AI-lösningar samlas ihop och presenteras.", "wg_tek": ""}, {"nr": 96, "n": "Nationella Arkitekturrådet (Inera)", "del": "C", "sub": "C1", "fk": "Stat, inkl myndigheter och/eller privat", "typ": "Samverkan / demonstrator / forskning", "ans": "Inera AB i samverkan med regioner och myndigheter", "tid": "Pågående", "st": "Operativt", "fin": "Del av Ineras tjänsteutbud", "fok": "Primäranvändning + Sekundäranvändning (nationell arkitekturstyrning för e-hälsa)", "mg": "IT-arkitekter i regioner, myndigheter och Inera; journalsystemleverantörer", "nk": "Nationellt råd för arkitekturfrågor kring hälso-IT och digital infrastruktur. Bereder arkitekturbeslut som påverkar nationella tjänster. T2-arkitekturen (fastslagen juni 2023) som möjliggör REST/JSON-integrationer utanför NTjP, medvetet EIRA-anpassad för EHDS, har sitt ursprung i rådets arbete. Samverkar med Regionernas Arkitekturråd (RAR) som granskar regiongemensamma lösningar. EHDS-relevans: direkt — arkitekturstyrning för EHDS-anpassade integrationer.", "ehds": "Direkt — arkitekturstyrning för EHDS-anpassade integrationer", "korr": "Bör inte förväxlas med Regionernas Arkitekturråd (RAR) som är ett regiongemensamt råd under DiN.", "dep": "39, 41, 48, 58, 60", "ai": [{"name": "Datatillgång", "score": 1, "comment": "Arkitekturramverk"}, {"name": "Teknik/IT", "score": 3, "comment": "T2-arkitektur"}, {"name": "Strategi", "score": 3, "comment": "Nationell styrning"}, {"name": "Juridik", "score": 2, "comment": "EIRA/EHDS"}, {"name": "Nyttokalkyler", "score": 1, "comment": "Indirekt"}, {"name": "Kompetens", "score": 2, "comment": "IT-arkitektur"}], "kchd": [{"name": "Teknik att docka in i", "score": 3, "comment": "Arkitekturstyrning"}, {"name": "Sekundäranvändning av hälsodata", "score": 2, "comment": "Via arkitekturriktlinjer"}, {"name": "Data management & governance", "score": 2, "comment": "Inera/RAR"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "T2-kontrakt"}, {"name": "Juridik", "score": 2, "comment": "EIRA/EHDS"}], "nytta": [{"level": "Strategisk", "text": "Nationell arkitekturstyrning för e-hälsa"}, {"level": "Taktisk", "text": "T2-arkitekturen möjliggör moderna integrationer"}, {"level": "Operativ", "text": "Bereder arkitekturbeslut för nationella tjänster"}, {"level": "Teknisk", "text": "REST/JSON, EIRA-anpassning, EHDS-förberedelse"}, {"level": "Datamässig", "text": "Arkitekturramverk för interoperabel datadelning"}], "ds": "Arkitekturdokumentation, T2-specifikationer, EIRA-ramverk", "tek": "T2-arkitektur, REST/JSON, EIRA, NTjP-utveckling", "akt": "Inera AB, RAR, 21 regioner, E-hälsomyndigheten", "tags": [{"category": "Aktörstyp", "values": "stat/myndighet, region"}, {"category": "Verksamhetstyp", "values": "samverkan"}, {"category": "Fokusområde", "values": "teknik, strategi"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}]}, {"nr": 97, "n": "Regiongemensam satsning på AI", "del": "A", "sub": "A1", "fk": "Regionerna", "typ": "Samverkan / demonstrator / forskning", "ans": "21 regioner via Ledningsrådet för AI; SKR samordnar", "tid": "Oktober 2024–pågående (beslut 25 okt 2024; handlingsplan 31 jan 2025; färdplan 2025)", "st": "Operativt", "fin": "Regionernas egna resurser (expertbidrag); SKR samordningsstöd", "fok": "Primäranvändning + Sekundäranvändning (AI-implementering i hälso- och sjukvård)", "mg": "Digitaliseringsdirektörer, HoS-direktörer, regionjurister, AI-utvecklare i 21 regioner", "nk": "Regiondirektörsnätverket beslutade 25 oktober 2024 att samarbeta kring AI för att gemensamt lösa hinder för AI-lösningar. Handlingsplan beslutad 31 januari 2025. Färdplan med nuläge och mål framtagen 2025. Leds av Ledningsrådet för AI (digitaliseringsdirektörer, HoS-direktör, regionjurist, life science-expert). Fyra samarbetsgrupper med regionernas experter: 1) Datatillgång (data management, arkitektur, informationssäkerhet), 2) Juridik och etik (AI Act, MDR, HSL, upphandling), 3) Nyttokalkyler och riskanalys (HTA, patientsäkerhet), 4) Kompetensförsörjning (HR, ledarskap). Nära koppling till DiN (nr 8) och KCHD:s vårddatahubb-arbete. SKR samordnar och stödjer. EHDS-relevans: hög — datatillgång för AI kräver EHDS-förberedelse.", "ehds": "Hög — AI-datatillgång kräver EHDS-anpassning", "korr": "", "dep": "8, 19, 76, 84, 89", "ai": [{"name": "Datatillgång", "score": 3, "comment": "Samarbetsgrupp data"}, {"name": "Teknik/IT", "score": 2, "comment": "Arkitektur/infra"}, {"name": "Strategi", "score": 3, "comment": "Regiondirektörsbeslut"}, {"name": "Juridik", "score": 3, "comment": "AI Act/MDR-grupp"}, {"name": "Nyttokalkyler", "score": 3, "comment": "HTA/riskgrupp"}, {"name": "Kompetens", "score": 3, "comment": "Kompetensgrupp"}], "kchd": [{"name": "Teknik att docka in i", "score": 2, "comment": "Via datatillgångsgrupp"}, {"name": "Sekundäranvändning av hälsodata", "score": 3, "comment": "AI-datatillgång"}, {"name": "Data management & governance", "score": 3, "comment": "Datatillgångsgrupp"}, {"name": "Variabelbeskrivningar/metadata", "score": 2, "comment": "Standardisering"}, {"name": "Juridik", "score": 3, "comment": "Juridikgruppen"}], "nytta": [{"level": "Strategisk", "text": "Regiongemensamt beslut — alla 21 regioner samarbetar kring AI"}, {"level": "Taktisk", "text": "Fyra expertgrupper löser gemensamma hinder"}, {"level": "Operativ", "text": "Konkreta stödmaterial för AI-implementering i varje region"}, {"level": "Teknisk", "text": "Gemensam datainfrastruktur och arkitekturkrav"}, {"level": "Datamässig", "text": "Standardiserade data som förutsättning för AI-lösningar"}], "ds": "Hälsodata, AI-modeller, nyttokalkyler, juridiska underlag", "tek": "Regionala AI-plattformar, gemensamma referensarkitekturer", "akt": "21 regioner, SKR (samordning), Ledningsrådet för AI, 4 samarbetsgrupper", "tags": [{"category": "Aktörstyp", "values": "region"}, {"category": "Verksamhetstyp", "values": "samverkan, AI"}, {"category": "Fokusområde", "values": "strategi, kompetens, juridik, teknik"}, {"category": "Användning", "values": "primäranvändning, sekundäranvändning"}], "wg_beskr": "Satsning beslutad av regiondirektörerna gemensamt. 4 arbetsgrupper: Juridik, Datatillgång, Kompetens, Nyttokalkyl.", "wg_tek": ""},{"nr":98,"n":"HealthData@EU","del":"A","sub":"A1","fk":"EU","typ":"Gränsöverskridande EU-infrastruktur för sekundäranvändning av hälsodata","ans":"Europeiska kommissionen (DG SANTE); Sverige: Socialstyrelsen (föreslagen samordnande HDAB)","tid":"Pilot 2022–2024; obligatorisk drift senast 26 mars 2029 enligt EHDS","st":"Under uppbyggnad","fin":"EU-medfinansiering (EU4Health, Digital Europe, Horizon Europe). Sveriges SENASH-projekt ca 28 MSEK.","fok":"Sekundäranvändning (forskning, innovation, policy, tillsyn, statistik, folkhälsa, beredskap)","mg":"Forskare, läkemedels- och medtechföretag, regulatorer, EU-agenturer, policymakare och statistikmyndigheter","nk":"Federerad EU-infrastruktur som kopplar nationella HDAB till en central plattform driven av kommissionen. Princip: bring your questions to the data — analys sker i säkra behandlingsmiljöer, bara aggregerade resultat tas ut. Föregicks av EHDS2-piloten (2022–2024) ledd av franska Health Data Hub med 17 partner. Central plattform släppt som öppen källkod mars 2025.","ehds":"mycket hög — HealthData@EU är EHDS-förordningens centrala infrastruktur för sekundäranvändning. Sekundäranvändningsreglerna börjar tillämpas 26 mars 2029.","korr":"","dep":"9, 10, 56, 76, 77","ai":[{"name":"Datatillgång","score":3,"comment":"EU-bred hälsodataåtkomst"},{"name":"Teknik/IT","score":2,"comment":"Federerad arkitektur, eDelivery, öppen källkod"},{"name":"Strategi","score":3,"comment":"EHDS-hörnsten, sektorspecifikt gemensamt dataområde"},{"name":"Juridik","score":3,"comment":"EHDS-förordning + GDPR"},{"name":"Nyttokalkyler","score":2,"comment":"Forskning, innovation, AI"},{"name":"Kompetens","score":2,"comment":"HDAB-uppbyggnad pågår"}],"kchd":[{"name":"Teknik att docka in i","score":2,"comment":"HealthDCAT-AP, federerad analys, säkra miljöer"},{"name":"Sekundäranvändning av hälsodata","score":3,"comment":"Kärnsyfte"},{"name":"Data management & governance","score":3,"comment":"HDAB-styrning, EHDS-styrelsen"},{"name":"Variabelbeskrivningar/metadata","score":3,"comment":"HealthDCAT-AP-katalog som EU-standard"},{"name":"Juridik","score":3,"comment":"EHDS sekundäranvändning"}],"nytta":[{"level":"Strategisk","text":"EU-gemensam ingång för hälsodataforskning och innovation"},{"level":"Taktisk","text":"Förenklar gränsöverskridande studier och regulatoriska bedömningar"},{"level":"Operativ","text":"Federerad analys i säkra behandlingsmiljöer"},{"level":"Datamässig","text":"Standardiserad metadatakatalog via HealthDCAT-AP"}],"ds":"HealthDCAT-AP (metadata), OMOP och FHIR som kandidatformat. EHDS kräver inte standardisering vid källan.","tek":"Decentraliserad/federerad: central plattform (öppen källkod på code.europa.eu) plus nationella noder via EU:s eDelivery. Cross-border Engine, National Connector, Cross-border Gateway. Säkra behandlingsmiljöer för federerad analys.","akt":"EU-kommissionen, HaDEA, nationella HDAB, EHDS-styrelsen (2 reprs per medlemsstat). I Sverige: Socialstyrelsen, IVO, SCB, Vetenskapsrådet, E-hälsomyndigheten (SENASH-konsortium).","tags":[],"wg_beskr":"","wg_tek":""},{"nr":99,"n":"NKR 220 — Nationellt Kvalitetsregister för Cervixcancerprevention (NKCx)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitets- och screeningregister, certifieringsnivå 2","ans":"CPUA Karolinska (på uppdrag av Region Stockholm); ledning Joakim Dillner, Center för Cervixcancerprevention, Karolinska Universitetslaboratoriet Huddinge","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda (screeningstyrning och forskning)","mg":"screening- och cellprovsverksamhet, cytologi/patologi, folkhälsa, forskare","nk":"sammanslagning av två tidigare register; data från kallelser, cytologi, HPV och vävnadsprover plus kopia av befolkningsregistret. Består av Analysregister och Processregister (NPCx). HPV-data omfattar ca 1 miljon poster och ca 350 000 nya prov per år. Analysdatabasen anges ha 100 % nationell täckning; processregistret täckte vid rapporttillfället ca 45 % av den kvinnliga befolkningen och byggs ut nationellt","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"SNOMED för provdiagnoser (anges i RUT); övriga kodverk: uppgift saknas","tek":"egen analys- och processregisterlösning vid Karolinska; specifik leverantör: uppgift saknas","akt":"samtliga regioner","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":100,"n":"NKR 184 — Svenska Barncancerregistret (SBCR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer), certifieringsnivå 3","ans":"CPUA Karolinska; registerhållare Päivi Lähteenmäki (KI). Fysiskt centrum: Barncancerforskningsenheten, KI. Drivs i samarbete med RCC Väst; stödteam via RCC","tid":"I drift","st":"Operativt","fin":"Barncancerfonden och nationella kvalitetsregistermedel.","fok":"båda","mg":"barnonkologi och barnhematologi, sex barncancercentra, forskare","nk":"alla cancerdiagnoser hos barn ≤18 år samt transfusionskrävande kroniska anemier. Ursprung tidigt 1980-tal; kvalitetsregisterstatus 2011. Modulindelat efter vårdplaneringsgrupper; SALUB/RADTOX flyttade till INCA 2021","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":101,"n":"NKR 124 — Svenska Hypofysregistret","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1","ans":"CPUA Karolinska; nationellt ansvar och stöd via RCC Stockholm Gotland. Styrgrupp med representanter från alla sex regioner","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda","mg":"endokrinologi, neurokirurgi, onkologi, oftalmologi, patologi, klinisk kemi, forskare","nk":"hypofystumörer och andra hypofyssjukdomar; bildat 1991 av Svenska Hypofysgruppen, SKR-stöd sedan 2009, på INCA sedan 2012. Ca 300–500 nya fall per år. Variabler: röntgenfynd, hormonkoncentrationer, kirurgi, histopatologi, strålbehandling, livskvalitet","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (sedan 2012)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":102,"n":"NKR 215 — CF-registret (Kvalitetsregister för cystisk fibros)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister; certifieringsnivå anges till 3 (kunskapsstyrningvard.se) respektive 2 (äldre SKR-arkiv) – uppgift varierar mellan källor","ans":"CPUA Karolinska; registerhållare Christina Krantz (Uppsala CF-center). Stöds av SKR; samarbetar med QRC Stockholm och Registercentrum Sydost","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via SKR.","fok":"båda","mg":"CF-vård (lung- och barnmedicin, dietist, fysioterapeut), forskare","nk":"cystisk fibros; startår 1992; longitudinell uppföljning av alla CF-patienter (medianöverlevnad nu över 40 år); data från årskontroll på CF-center","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas (registrerar mutationskombinationer)","tek":"IT-leverantör uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":103,"n":"NKR 15 — Svenska Neuroregister (Neuroreg)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (paraplyregister med delregister)","ans":"CPUA Karolinska; centralt Jan Hillert (KI/Karolinska). Registercentrum-tillhörighet: uppgift saknas (osäker)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda (vårdnära beslutsstöd och forskning)","mg":"neurologi (flera diagnoser), forskare","nk":"neurologiska sjukdomar; MS först (Svenska MS-registret), därefter delregister för Parkinson, MG, epilepsi, narkolepsi och ALS (2021). MS-delregistret täcker över 85 % av MS-patienterna med uppföljning i snitt över 10 år. PROM via patientportalen PER","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"Carmona (neuro.carmona.se); patientöversikt via Omda Health Analytics AB","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":104,"n":"NKR 33 — Svensk Reumatologis Kvalitetsregister (SRQ)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt specialitetsbaserat kvalitetsregister, certifieringsnivå 1; har informationsspecifikation (SRQ 2.0) som möjliggör automatiserad informationsförsörjning","ans":"CPUA Karolinska; registerhållare Lotta Ljung (Akademiskt specialistcentrum, Stockholm). Nationell styrgrupp; forskningsnätverk P2I Care","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda","mg":"reumatologi (alla sjukvårdsregioner), forskare, läkemedels- och medtechindustri","nk":"reumatiska och inflammatoriska sjukdomar; startår 1996; vårdkontakter, diagnos, behandling, rehabilitering, provresultat, PROM. Subregister Basdata och Besök. Kvartalsrapporter per enhet","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"informationsspecifikation SRQ 2.0 finns; ICD-10/ATC: uppgift saknas","tek":"Carmona (rareg.carmona.se)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":105,"n":"NKR 1 — BORIS (BarnObesitasRegister I Sverige)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Karolinska; registerhållare Pernilla Danielsson-Liljeqvist (KI; ordförande NAG obesitas barn och ungdom). Styrgrupp med klinisk, epidemiologisk och IT-kompetens","tid":"I drift","st":"Operativt","fin":"Stöds av Socialstyrelsen och SKR.","fok":"båda","mg":"barnmedicin och barnkliniker, forskare, patientorganisation","nk":"barn och tonåringar i obesitasbehandling; startår 2005 (Claude Marcus, Rikscentrum Barnobesitas, Karolinska Huddinge); process- och resultatindikatorer (vikt, följdsjukdomar)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"egen webbplattform (e-boris.se); leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":106,"n":"NKR 27 — Nationellt kvalitetsregister för öron-, näs- och halssjukvård","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister med nio delregister (sex kirurgiska, tre hörselrehabilitering)","ans":"CPUA Karolinska; registerhållare Lars Lundman (tidigare Joacim Stalfors). Anslutet till Registercentrum Västra Götaland sedan hösten 2012. Varje delregister leds av referensgrupp; ordförandena bildar styrgrupp","tid":"I drift","st":"Operativt","fin":"Anslag från staten och sjukvårdsregionerna.","fok":"båda (primärt kvalitet och förbättring)","mg":"ÖNH-läkare, sjuksköterskor, audionomer, civilingenjörer, forskare","nk":"mäter kvalitet inom ÖNH; startade med fem delregister 1997 och har vuxit; stort fokus på patientrapporterade resultat (PROM). Drivs på uppdrag av Svensk Förening för Otorhinolaryngologi, Huvud- och Halskirurgi (SFOHH)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"driftas via Registercentrum VG; specifik leverantör (Carmona/Omda): uppgift saknas explicit","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":107,"n":"NKR 79 — SNQ (Svenskt Neonatalt Kvalitetsregister)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1","ans":"CPUA Karolinska; registerhållare Mikael Norman (KI), extra kontakt Stellan Håkansson. Registercentrum: QRC Stockholm (flytt från RCC Norr 2020)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel; ekonomi samlad på Karolinska.","fok":"båda","mg":"neonatologi, obstetrik, forskare, beslutsfattare, föräldrar","nk":"nyföddhetsvård; nationellt heltäckande; data från inskrivning till utskrivning samt vissa graviditets- och förlossningsdata och återbesök vid 2 och 5 års ålder; sidoregister för retinopati. Ca 10 000 nyfödda neonatalvårdas per år","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"MedSciNet (PNQ-portalen; numera Omda)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":108,"n":"NKR 511 — InfCare Hepatit","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2; tre komponenter (kliniskt beslutsstöd, kvalitetsregister, forskningsdatabas)","ans":"CPUA Karolinska; registerhållare och styrgrupp via Medicinsk enhet Infektionssjukdomar, Karolinska","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via SKR.","fok":"båda samt kliniskt beslutsstöd","mg":"infektionssjukvård, gastroenterologi, forskare","nk":"hepatit B och C; startade 2008 (Karolinska och Sahlgrenska), nationellt kvalitetsregister sedan 2015. Variabler: virustyp, virusmängd, smittväg, levervärden, fibrosbedömning","ehds":"","korr":"","dep":"2, 49","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"plattform på RealQ; driftansvarigt företag BCB Medical. Beslutsstöd körs via Sjunet","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":109,"n":"NKR 77 — InfCare HIV","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1; tre komponenter (beslutsstöd, kvalitetsregister, forskningsdatabas)","ans":"CPUA Karolinska; registerhållare Christina Carlander (Karolinska). Styrgrupp 12 personer (inklusive patient- och föreningsrepresentanter), fyra arbetsgrupper","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via SKR.","fok":"båda samt kliniskt beslutsstöd","mg":"infektionssjukvård (hivkliniker), barnmedicin, forskare, patientorganisation","nk":"personer som lever med hiv; startår 2003 (Karolinska och Sahlgrenska), nationellt sedan 2008. Variabler: kön vid födsel, könsidentitet, födelseland, transmissionsväg, testdatum, laboratorievärden, behandling, PROM/PREM","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"använder DDM-Tool (europeiskt samarbete); formella kodverk: uppgift saknas","tek":"plattform på RealQ; driftansvarigt företag BCB AB","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":110,"n":"NKR 154 — Nationella njurcancerregistret (NNCR/NSKCR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer)","ans":"CPUA Karolinska; nationellt stödjande RCC Stockholm Gotland. Nationell styrgrupp som även samordnar forskning","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via RCC/SKR.","fok":"båda","mg":"urologi, onkologi, forskare","nk":"alla nya primära fall av njurcancer (opererade och icke-opererade); startår 2005; diagnostik och primärbehandling, kirurgiska kvalitetsvariabler, komplikationer inom 90 dagar, 5- och 10-årsuppföljning. Ca 1 250 fall per år. IPÖ njurcancer finns sedan 2014","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; morfologi kodas via SNOMED/ICD-O-3 (anges i administratörsmanual). Individuell patientöversikt (IPÖ) finns","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":111,"n":"NKR 93 — Svenska Korsbandsregistret (XBase)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Karolinska; registerhållare Magnus Forssblad. Registercentrum-tillhörighet: uppgift saknas explicit (osäker)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda","mg":"ortopedi, fysioterapi, forskare","nk":"ligamentskador i knä, framför allt främre korsbandsskador; i första hand operativa ingrepp men även icke-operativt behandlade. Uppföljning 1, 2, 5 och 10 år postoperativt med enkäter (PROM) och fysioterapeutuppföljning","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"egen webbplattform XBase (aclregister.nu); leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":112,"n":"NKR 232 — Svenska KLL-registret","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer), certifieringsnivå 2","ans":"CPUA Karolinska; nationellt ansvar RCC Stockholm Gotland. Nationell styrgrupp som samordnar forskning","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via RCC/SKR.","fok":"båda","mg":"hematologi, forskare","nk":"kronisk lymfatisk leukemi; egen registerstatus sedan 2007 (tidigare i Svenska Lymfomregistret 2000–2007), på INCA 2007. Alla nydiagnostiserade ≥18 år, ca 500–650 fall per år. Indikatorer för FISH del(17p), TP53- och IGHV-mutation, ledtider","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; dödsdatum hämtas från befolkningsregister; formella kodverk: uppgift saknas","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":113,"n":"NKR 48 — Nationella bröstcancerregistret (NKBC)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer), certifieringsnivå 1","ans":"CPUA Karolinska; RCC Stockholm Gotland primärt samordnande. Nationell styrgrupp (bl.a. Irma Fredriksson, Johan Hartman, Kerstin Sandelin)","tid":"I drift","st":"Operativt","fin":"Anslag från Beslutsgruppen för Nationella Kvalitetsregister (SKR).","fok":"båda","mg":"bröstkirurgi, onkologi, patologi, forskare","nk":"diagnostik och behandling av bröstcancer; ledtider, diagnostik, tumörkarakteristika, kirurgi, onkologisk behandling, uppföljning; PROM via enkäter. Nära 9 000 insjuknar per år; relativ 5-årsöverlevnad över 90 %","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; formella kodverk: uppgift saknas explicit","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":114,"n":"NKR 75 — SveDem (Svenska registret för kognitiva sjukdomar/demenssjukdomar)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1 (kunskapsstyrningvard.se) respektive 2 (äldre SKR-arkiv) – uppgift varierar","ans":"CPUA Karolinska; registerhållare Maria Eriksdotter (geriatriska kliniken, Karolinska). Kansli vid ME Åldrande, Karolinska","tid":"I drift","st":"Operativt","fin":"Finansieras via SKR och Socialstyrelsen (stat, region, kommun).","fok":"båda","mg":"geriatrik, minnesmottagningar, primärvård, kommunal hälso- och sjukvård, forskare","nk":"flerhändelseregister som följer patienten genom hela vårdkedjan (specialistmottagning, vårdcentral, hemsjukvård, särskilt boende); startade maj 2007 (initiativ Swedish Brain Power). Datakälla till 16 medicinska indikatorer samt omvårdnadsindikatorer i Socialstyrelsens riktlinjer. Ett av världens största demensregister","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"IT-plattform utvecklad i samarbete med Uppsala Clinical Research Center (UCR); ny plattform 2021","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":115,"n":"NKR 88 — Q-IVF (Nationellt kvalitetsregister för assisterad befruktning)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Karolinska; drivs gemensamt av svenska IVF-kliniker. Registerhållare och styrgrupp: uppgift saknas explicit","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via SKR.","fok":"båda","mg":"reproduktionsmedicin och IVF-kliniker, obstetrik, forskare","nk":"samtliga startade IVF-behandlingar (färska och frysta), egna och donerade gameter, donatorinsemination och fertilitetsbevarande äggfrysning. Startår 2007 (byggde på tidigare individbaserat register från 1990-talet). Variabler: hormonstimulering, ägguttag, fertiliseringsmetod, embryotransfer, graviditetsutfall, komplikationer (t.ex. OHSS)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift saknas","tek":"MedSciNet (qivf-portalen; numera Omda)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":116,"n":"NKR 236 — Nationellt kvalitetsregister för myeloproliferativa sjukdomar (MPN)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer/hematologi)","ans":"CPUA Karolinska; nationellt stödjande RCC Stockholm Gotland. Nationell styrgrupp. Namngiven registerhållare: uppgift saknas","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via RCC/SKR.","fok":"båda","mg":"hematologi och hematologisk cancervård, forskare","nk":"nydiagnostiserade MPN (ET, PV, primär/prefibrotisk myelofibros, MPN-U, KNL, KEL/HES) hos patienter ≥18 år; diagnoser från 2008, på INCA 2008. Säkerställer likvärdig vård enligt nationellt vårdprogram. Ca 600 nya patienter per år","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; registrerar mutationsanalyser (JAK2, CALR, MPL); formella kodverk: uppgift saknas explicit","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":117,"n":"NKR 177 — Graviditetsregistret","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1","ans":"CPUA Karolinska; registerhållare anges i senare källa som Maria-Teresia Svanvik (tidigare Olof Stephansson – källkonflikt, sannolikt byte). Registercentrum QRC Stockholm. Tre arbetsgrupper (mödrahälsovård, fosterdiagnostik, förlossning)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och Region Stockholm.","fok":"båda","mg":"obstetrik och gynekologi, mödrahälsovård (barnmorskor), fosterdiagnostik, förlossningsvård, forskare","nk":"mödrahälsovård, fosterdiagnostik och förlossning/BB; startår 2013 (sammanslagning av Mödrahälsovårdsregistret [1999] och Nationella kvalitetsregistret för fosterdiagnostik [2006] plus förlossningsdata). Följer hela vårdkedjan för gravida och barn","ehds":"","korr":"","dep":"2, 7","ai":[],"kchd":[],"nytta":[],"ds":"använder ICD-10-diagnoskoder; rapporterar ej via INCA","tek":"MedSciNet (numera Omda); direktöverföring från Obstetrix, Partus och Cosmic Birth","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":118,"n":"NKR 218 — EndoVaskulär behandling av Akut Stroke (EVAS)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1","ans":"CPUA Karolinska; kontaktpersoner i NKR-ansökan Tommy Andersson (Neuroradiologiska kliniken, Karolinska) och Åke Holmberg. Registercentrum QRC Stockholm. Styrgrupp med neurointerventionister och Riksstroke-representanter","tid":"I drift","st":"Operativt","fin":"Statligt och nationellt finansierat kvalitetsregister.","fok":"båda","mg":"neurointervention och neuroradiologi, strokevård (NPO Nervsystemets sjukdomar), forskare","nk":"endovaskulär behandling (trombektomi) vid akut ischemisk stroke med stor kärlocklusion; startår 2012 (NKR-nr 218), webbinrapportering från 2014. Nära kopplat till och en utvidgning av Riksstroke","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"använder mått mTICI och NIHSS; ICD-10/KVÅ: uppgift saknas; rapporterar ej via INCA","tek":"statsfinansierad dataplattform med statistikmodul; delar data med Riksstroke; specifik leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":119,"n":"NKR 211 — Svenska Hemofiliregistret (Nationella registret för blödningssjukdomar)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Karolinska; ursprunglig styrgrupp med de tre hemofilicentra (Karolinska/Astrid Lindgren, SUS, Sahlgrenska). Aktuell registerhållare: uppgift saknas. Registercentrum QRC Stockholm","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via SKL/SKR.","fok":"båda","mg":"hematologi och koagulation (koagulationsmottagningar, barnkoagulation), forskare","nk":"blödningssjukdomar (hemofili A, hemofili B, von Willebrands sjukdom); uppstartsbidrag från SKL beviljat efter ansökan 2012. Longitudinell uppföljning för att kvantifiera sjukdomsbörda och behandlingseffekter. Bytt namn till Nationella registret för blödningssjukdomar","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"ICD-10/ATC: uppgift saknas; rapporterar ej via INCA","tek":"bygger på IT-plattform från Kappa-registerstudien (Malmö); aktuell leverantör och plattformsnamn: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":120,"n":"NKR 138 — Svenska testikelcancerregistret – SWENOTECA","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer), certifieringsnivå 2","ans":"CPUA Karolinska; nationell monitorering från RCC Syd (Lund). Nationell kvalitetsregistergrupp via RCC. Namngiven registerhållare: uppgift saknas","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel via RCC/SKR.","fok":"båda","mg":"onkologi och urologi, forskare","nk":"följer hela vårdkedjan för testikelcancer (seminom och nonseminom): diagnos, utredning, behandlingsval, återfallsbehandling, uppföljning (5–10 år), ledtider, vårdprogramsföljsamhet. SWENOTECA-nätverket är långvarigt; kvalitetsregisterrapportering via RCC/INCA från 1 jan 2012","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; registrerar tumörmarkörer, stadium, riskgrupp; nationell biobank kopplad under uppbyggnad; ICD-O/Snomed: uppgift saknas explicit","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":121,"n":"NKR 163 — Internetbehandlingsregistret (SibeR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (psykiatri)","ans":"CPUA Karolinska; registerhållare Cecilia Svanborg (Internetpsykiatri/Psykiatri Sydväst). Registercentrum Västra Götaland. Styrgrupp med nationell representation","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel.","fok":"båda","mg":"psykiatri, primärvård, somatisk vård som bedriver IKBT, forskare","nk":"internetbaserade psykologiska behandlingar (vägledd IKBT) för bl.a. ADHD, IBS, depression, OCD, insomni, stress- och ångestsyndrom; lanserades 2015; data om diagnostisk bedömning, tillgänglighet, fullföljandegrad, behandlingseffekt; alla åldrar; inom psykiatri, primärvård och somatisk vård","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"validerade sjukdomsspecifika skattningsskalor (PROM); formella kodverk: uppgift saknas","tek":"driftas på Registercentrum VG:s plattform (psykiatriregisterportalen; Carmona-/Omda-miljö, ej uttryckligen namngivet)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":122,"n":"NKR 45 — Bättre beroendevård (BBV)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (psykiatri/specialiserad beroendevård)","ans":"CPUA Karolinska; registerhållare Johan Franck (KI, verksamhetschef Beroendecentrum Stockholm). Styrgrupp med verksamhetschefer och brukar-/patientrepresentanter. Samarbete med Svensk förening för beroendemedicin och CAN. Registercentrum QRC Stockholm (operativt även i RC VG:s psykiatriportal)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel (via QRC Stockholm).","fok":"båda","mg":"psykiatri och specialiserad beroendevård (NPO psykisk hälsa), forskare","nk":"startår 2009 som Svenskt Beroenderegister (SBR), namnbyte till Bättre Beroendevård november 2020 (ny databas). Vuxna med beroendediagnos i specialiserad beroendevård; särskilt ansvar för uppföljning av läkemedelsassisterad rehabilitering vid opioidberoende (tidigare LAROS). Mäter samtliga av Socialstyrelsens rekommenderade kvalitetsindikatorer för specialiserad beroendevård och är ofta enda datakällan för dessa","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"registrerar diagnoser, vårdkontakter, behandling, resultat; ICD-10/ATC: uppgift saknas; data publiceras på Vården i siffror","tek":"Registercentrum VG:s psykiatriportal (Carmona-/Omda-miljö, ej uttryckligen namngivet)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":123,"n":"NKR 39 — Andningssviktregistret (Swedevox)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Region Skåne. Styrgrupp: uppgift saknas","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"lungmedicin och andningsvård, forskare","nk":"patienter som startar hemsyrgas eller hemventilator; innehåller vårdkontakter, diagnos, behandling och provresultat (lungfunktion, blodgaser) samt PROM via frågeformulär. Omfattar även CPAP (visualiseras för närvarande inte i RUT)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"plattform och leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":124,"n":"NKR 40 — RIKSHÖFT","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för höftfraktur","ans":"CPUA Region Skåne. RC Syd-miljön (Lund)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"ortopedi och geriatrik, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"","tek":"","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":125,"n":"NKR 16 — Nationella Kataraktregistret (NCR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för kataraktkirurgi; ett av de mest etablerade ögonregistren","ans":"CPUA Region Skåne. EyeNet Sweden/RC Syd; registerspecialist Andreas Lindström nämns i RC Syd-material","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"oftalmologi, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"EyeNet Sweden-associerat; leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":126,"n":"NKR 150 — Svenska Fotledsregistret (SwedAnkle)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för fotledskirurgi","ans":"CPUA Region Skåne. RC Syd-miljön","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"ortopedi och fotkirurgi, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"","tek":"","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":127,"n":"NKR 57 — CP-uppföljningsprogrammet i Sverige (CPUP)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister och livslångt uppföljningsprogram för cerebral pares; innehåller funktion (rörelse, kommunikation, ät- och sväljningsförmåga, kognition), behandling och röntgen. Startade som kliniskt uppföljningsprogram i Skåne/Blekinge/Halland för drygt 20 år sedan; primärmål att minska höftledsluxationer","ans":"CPUA Region Skåne. RC Syd-miljön; relaterat till MMCUP och HabQ","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda (klinisk uppföljning och forskning)","mg":"barnortopedi, habilitering, neuropediatrik, fysio- och arbetsterapi, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"RUT-strukturerat enligt GSIM (generellt för RUT)","tek":"plattform: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":128,"n":"NKR 17 — Svenska Cornearegistret","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för hornhinnekirurgi och corneatransplantationer","ans":"CPUA Region Skåne. EyeNet Sweden/RC Syd","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"oftalmologi, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"EyeNet Sweden-associerat; leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":129,"n":"NKR 230 — Nationellt kvalitetsregister för Akut lymfatisk leukemi (ALL)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer)","ans":"CPUA Region Skåne. Del av Blodcancerregistret (RCC och Svensk Förening för Hematologi)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering; RCC-stöd.","fok":"båda","mg":"hematologi och onkologi, forskare","nk":"alla nydiagnostiserade ALL hos vuxna; primärdiagnostik, undergrupp, behandling, recidiv, progress, död, ev. allogen stamcellstransplantation. Akut-leukemiregistret (tidigare NRALV; AML och ALL) bildades 1997","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (RCC)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":130,"n":"NKR 231 — Blodcancerregistret Akut Myeloisk Leukemi (AML)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer)","ans":"CPUA Region Skåne. Del av Blodcancerregistret (RCC och Svensk Förening för Hematologi)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering; RCC-stöd.","fok":"båda","mg":"hematologi och onkologi, forskare","nk":"vuxna (≥18 år) med AML sedan 1997; bostadsort, laboratorieresultat, handläggning, utfall, överlevnad","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (delregistren gick över till webbregistrering via INCA 2008)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":131,"n":"NKR 4 — Nationellt Kvalitetsregister för Urinblåscancer och övrig Urotelial Cancer (Blåscancerregistret)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer) för urinblåsa, urinrör, urinledare och njurbäcken; primärdiagnostik, behandling, recidiv, progress, död, cystektomivariabler, onkologisk behandling. Ursprung i regionala register från tidigt 1990-tal. Grundkomponent i forskningsdatabasen BladderBaSe (v2.0)","ans":"CPUA Regionstyrelsen Region Östergötland (bekräftat cancercentrum.se). RCC Syd har nationell stödfunktion för urinblåsecancer","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering; RCC-stöd.","fok":"båda","mg":"urologi och onkologi, forskare","nk":"","ehds":"","korr":"Korrigering: Underlaget anger Region Skåne, men korrekt CPUA är Region Östergötland. RCC Syd är endast stödjande RCC.","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"inklusionskriterier använder ICD-O-3-lägeskoder (t.ex. C68.0, C66.9); övriga kodverk: konkret stöd saknas","tek":"INCA-plattformen (interaktiv rapport i INCA)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":132,"n":"NKR 25 — SWEDCON – Nationellt register för medfödda hjärtsjukdomar","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för medfödda hjärtfel (barn till vuxen/GUCH)","ans":"CPUA Region Skåne (CPUA-funktionen utövas av chefen för Registercentrum Syd). Styrgrupp via regionala ACHD-grupper samt SWEDCON/Barn, SWEDCON/Kirurgi, SWEDCON/Fetal","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"barn- och vuxenkardiologi (GUCH), thoraxkirurgi, forskare","nk":"startår 2009 (utbyggnad av GUCH-registret från 1998); fetaldel sedan 2014. Fyra delregister (fetal, barn, barnhjärtkirurgi, GUCH) med gemensam bas av persondata, diagnoser, operationer och kateterburna ingrepp","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"UCR (Uppsala Clinical Research Center) sköter drift och datauttag","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":133,"n":"NKR 32 — Nationella Registret över Smärtrehabilitering (NRS)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för specialiserad och multimodal smärtrehabilitering","ans":"CPUA Region Skåne. Registercentrum: UCR (NRS listas bland UCR:s register)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"smärtrehabilitering och rehabiliteringsmedicin, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"UCR","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":134,"n":"NKR 417 — LKG-registret (läpp-, käk-, gomspalt)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för läpp-, käk- och/eller gomspalt; tvärprofessionellt","ans":"CPUA Region Skåne. RC Syd-miljön (anslutet register)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"LKG-team (plastik- och käkkirurgi, ÖNH, logopedi, ortodonti), forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"","tek":"","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":135,"n":"NKR 55 — Svenska Skulder och Armbågs Registret (SSAR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för skulder- och armbågskirurgi (i första hand axelplastiker)","ans":"CPUA Region Skåne (RC Syd-anknutet; den specifika CPUA-sidan har inte lokaliserats – liten kvarstående osäkerhet). Registerhållare: Björn Salomonsson. Gemensam styrgrupp för Axelprotes- och Armbågsprotesregistret under SSAS","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"ortopedi (axel och armbåge), forskare","nk":"startade 1 januari 1999 på initiativ av Svenska Skulder- och ArmbågsSällskapet (SSAS); rapportering av plastikoperationer i axelleden (patientdata, diagnos, implantatdata); huvudsakligt slutmått är omoperation med implantatbyte. Femårsuppföljning brevledes av patienter opererade 1999 och framåt","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"RC Syd (Lund); registerplattform 3C/Comporto","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":136,"n":"NKR 234 — Lymfomregistret (Svenska Lymfomregistret, SLR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer) för alla maligna lymfom hos vuxna (≥18 år); diagnosmetod, sjukdomskaraktäristika, primärbehandling, behandlingssvar, återfall. Introducerat 2000 (Svenska lymfomgruppen, SLG); registrering via INCA sedan 2007; mäter kvalitetsindikatorer i åtta vårdprogram","ans":"CPUA Region Skåne. Styrgrupp: SLG; del av Blodcancerregistret (RCC och Svensk Förening för Hematologi)","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering; RCC-stöd.","fok":"båda","mg":"hematologi och onkologi, forskare","nk":"","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (sedan 2007)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":137,"n":"NKR 56 — SQRTPA (Scandinavian Quality Register for Thyroid, Parathyroid and Adrenal Surgery)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kirurgiskt åtgärdsregister för sjukdomar i sköldkörtel, bisköldkörtlar och binjurar","ans":"CPUA Region Skåne. Registercentrum: RC Syd. Styrgrupp: Svensk Förening för Endokrinkirurgi och Svensk ÖNH-förening","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"endokrinkirurgi, forskare","nk":"startår 2004 (binjuremodul tillkom 2009); diagnostik, operation och uppföljning; registrerar både vanliga diagnoser (knölstruma, primär hyperparathyroidism) och ovanliga (bisköldkörtel- och binjurecancer). Informationsspecifikation SQRTPA 3.6 finns","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"informationsspecifikation finns; formella kodverk: konkret stöd saknas","tek":"RC Syd","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":138,"n":"NKR 80 — Nationellt kvalitetsregister för kateterablation","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för kateterburen behandling av hjärtrytmstörningar","ans":"CPUA Styrelsen för Region Skåne (bekräftat via UCR:s patientinformation). Registercentrum: UCR","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"kardiologi och elektrofysiologi, forskare","nk":"registrerar och jämför vårdresultat mellan vårdenheter nationellt; registrerar tekniska uppgifter om behandlingen","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"UCR","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":139,"n":"NKR 60 — Nationellt kvalitetsregister för Esofagus och Ventrikelcancer (NREV)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (cancer) för matstrupe och magsäck","ans":"CPUA Region Skåne. RCC-struktur","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering; RCC-stöd.","fok":"båda","mg":"kirurgi och onkologi (övre GI), forskare","nk":"","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"rapporterar via INCA; specifika kodverk: uppgift saknas","tek":"INCA-plattformen (RCC-mönster)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":140,"n":"NKR 83 — Makularegistret (Svenska Makularegistret, SMR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för uppföljning och behandling av sjukdomar med kärlnybildning under gula fläcken (våt makuladegeneration)","ans":"CPUA Region Skåne (sedan januari 2025; bekräftat makulareg.se). Registerhållare: Inger Westborg. EyeNet Sweden/RC Syd","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"oftalmologi, forskare","nk":"startade 2003, webbaserades 2008; utfallsregister med synskärpa som resultatmått, antal och typ av behandling, biverkningar. Inrapportering vid första behandlingsbesöket samt vid uppföljande återbesök","ehds":"","korr":"Korrigering: Region Skåne är korrekt CPUA sedan januari 2025. RUT visar fortfarande tidigare huvudman Region Blekinge.","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"EyeNet Sweden-associerat; leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":141,"n":"NKR 156 — BPSD-registret","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för beteendemässiga och psykiska symtom vid demens; strukturerad bedömning och åtgärder (NPI, checklista, bemötandeplan), främst i kommunal vård och omsorg","ans":"CPUA Region Skåne. RC Syd-miljön. Relaterat till SveDem","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"kommunal äldreomsorg och demensvård, geriatrik, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"","tek":"","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":142,"n":"NKR 160 — HAKIR (Handkirurgiskt kvalitetsregister)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Region Skåne (sedan årsskiftet; bekräftat hakir.se). Registerhållare: Marianne Arner (Handkirurgiska kliniken, Södersjukhuset). Nationell registerkoordinator: Annika Elmstedt. Personuppgiftsbiträdesavtal mellan Södersjukhuset AB och RC Syd","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel (Beslutsgruppen för Nationella Kvalitetsregister sedan 2010) och regional medfinansiering.","fok":"båda","mg":"handkirurgi, forskare","nk":"webbaserat register som omfattar stora delar av landets handkirurgi; diagnos, operation, komplikationer samt PROM (åtta frågor om symtom och funktion före samt 3 och 12 månader efter operation), utökad uppföljning av kraft och rörlighet, ibland röntgen","ehds":"","korr":"Korrigering: Region Skåne är korrekt CPUA sedan årsskiftet 2024/2025 (flytt från Södersjukhuset AB). RUT och kvalitetsregister.se visar fortfarande Södersjukhuset AB.","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"RUT-strukturerat enligt GSIM","tek":"webbaserat; drift sköts av RC Syd (Lund)","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":143,"n":"NKR 167 — Svenska Traumaregistret (SweTrau)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för traumavård (svårt skadade patienter)","ans":"CPUA Region Skåne (sedan januari 2025; bekräftat swetrau.se). Registerhållare: Folke Hammarqvist (sedan 2023, efterträdde Lars Lundberg). RC Syd-miljön","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"akutsjukvård, kirurgi, intensivvård, ortopedi, forskare","nk":"heltäckande beskrivning av skademekanism, åtgärder på skadeplats, vitalparametrar, skadegrad, traumaomhändertagande, operationer, vårdtid, funktionsnivå vid utskrivning och 30-dagarsmortalitet; data från skadetillfället genom hela vårdförloppet samt uppföljning upp till ett år. Registrerar sedan 2011","ehds":"","korr":"Korrigering: Region Skåne är korrekt CPUA sedan januari 2025. RUT visar fortfarande tidigare huvudman Region Blekinge.","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"RC Syd; specifik plattform: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":144,"n":"NKR 166 — Amputations- och Protesregistret (SwedeAmp)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister sedan 2011 med multidisciplinärt fokus","ans":"CPUA Region Skåne. RC Syd-miljön; registeransvarig Sara Johansson nämns i RC Syd-material","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"kärlkirurgi och ortopedi, ortopedteknik, rehabilitering, forskare","nk":"data om demografi, amputationsdata, kirurgisk data, protesförsörjning samt patientens situation före och 6, 12 och 24 månader efter amputation (för amputation ovan fotleden). Inkluderar förnyade ingrepp (revision, re-amputation, bilaterala)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"RUT-strukturerat enligt GSIM","tek":"plattform och leverantör: uppgift saknas","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":145,"n":"NKR 164 — Kvalitetsregister för MMC, annan neuralrörsdefekt och hydrocefalus (MMCUP)","del":"A","sub":"A1","fk":"Regionerna","typ":"uppföljningsprogram och nationellt kvalitetsregister för livslång uppföljning av personer med ryggmärgsbråck (MMC)","ans":"CPUA Region Skåne. RC Syd-miljön; relaterat till CPUP och HabQ","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda (klinisk uppföljning och forskning)","mg":"habilitering, barnmedicin, neurokirurgi, urologi, forskare","nk":"medicinskt tillstånd, urologisk funktion, tarmfunktion, fysisk funktionsförmåga, aktivitetsförmåga och kognitiv funktion; bedömningar av flera professioner dokumenteras enligt vårdprogrammets tidpunkter och följs över tid","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"","tek":"","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":146,"n":"NKR 406 — Svenskt Kvalitetsregister för Rehabilitering vid Synnedsättning (SKRS)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister för rehabilitering vid synnedsättning (syncentralernas verksamhet); inkluderar barn och ungdomar och bedriver kontinuerlig systematisk validering","ans":"CPUA Region Skåne (Region Skåne övertog CPUA-ansvaret för SKRS). RC Syd-miljön","tid":"I drift","st":"Operativt","fin":"Nationella kvalitetsregistermedel och regional medfinansiering.","fok":"båda","mg":"syncentraler nationellt, forskare","nk":"","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"konkret stöd saknas","tek":"registrering flyttades 29 januari 2026 från plattformen Pharos till plattformen 3C","akt":"","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":147,"n":"NKR 30 — Svenska Ledprotesregistret (SLR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med knä-/höftprotes, vårdenheter och forskare","nk":"omfattar alla landets enheter som utför höft- och knäprotesoperationer, primäroperationer och omoperationer, samt knäosteotomier; innehåller diagnos, protestyp, proteskomponenter, patientdemografi, operationsteknik, förebyggande åtgärder mot infektion och trombos samt patientrapporterat utfall före och efter operation. År 2025 firades 50 år av ledprotesregistrering i Sverige. Under 2020 rapporterades 19 718 primära höftproteser och 11 806 primära knäproteser","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"täckningsgrad beräknas mot patientregistret med åtgärdskoder; specifik kodverksanvändning i övrigt framgår inte av tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (slr.registercentrum.se)","akt":"ortopedi vid Sahlgrenska akademin/Göteborgs universitet","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":148,"n":"NKR 21 — Svenska Hjärt-lungräddningsregistret (SHLR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Västra Götalandsregionen; registerhållare Carl Magnusson","tid":"I drift","st":"Operativt","fin":"nationellt kvalitetsregister finansierat av stat och regioner, med stöd även från Svenska HLR-rådet","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter behandlade med HLR, ambulanssjukvård, sjukhus och forskare","nk":"samlar data om de kritiska länkarna i kedjan som räddar liv vid HLR, på och utanför sjukhus; består av två delregister. Internationell föregångare; överlevnaden efter hjärtstopp har ungefär tredubblats under cirka 30 år","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (shlr.registercentrum.se); automatisk dataöverföring med stöd av journalleverantören Omda (journalsystemet Paratus, först ut Region Östergötland maj 2024)","akt":"Sahlgrenska universitetssjukhuset/Sahlgrenska akademin; stöd av Svenska HLR-rådet","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":149,"n":"NKR 9 — Nationella Diabetesregistret (NDR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Västra Götalandsregionen; registerhållare Katarina Eeg-Olofsson","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; har drabbats av kraftigt minskade medel","fok":"primär klinisk uppföljning och sekundär forskning","mg":"personer med diabetes, vårdenheter i primär- och specialistvård, forskare","nk":"samlar data om barn och vuxna med diabetes; skapades 1996 (vuxna) som svar på Sankt Vincent-deklarationen. Barndiabetesregistret Swediabkids startade 2000 och är helt integrerat i NDR sedan 2018. Registrerar typ 1-diabetes inklusive LADA, typ 2-diabetes och annan specificerad diabetes; ej graviditetsdiabetes","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"täckningsgrad beräknas mot läkemedelsregistret (ATC-baserat) och patientregistret; specifik kodverksanvändning i övrigt saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (ndr.registercentrum.se); nyligen byte av IT-plattform; direktöverföring bl.a. via medrave4","akt":"skapat av Svensk Förening för Diabetologi; barndelen av barnläkarföreningens delförening; Svenska Diabetesförbundet i styrgruppen","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":150,"n":"NKR 13 — Nationellt kvalitetsregister för bipolär affektiv sjukdom (BipoläR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 3","ans":"CPUA Västra Götalandsregionen; registerhållare Mikael Landén (Sahlgrenska)","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med bipolär sjukdom, psykiatriska vårdenheter, forskare","nk":"samlar data om vård och utfall vid bipolär sjukdom (personnummer, vårdkontakter, diagnos, behandling, tidigare skov, ärftlighet, läkemedel). Datainsamling startade 2004","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Inte ett cancerregister men har använt INCA-plattformen tekniskt","tek":"registret övergick till IT-plattformen INCA i drift via Registercentrum Västra Götaland (bipolar.registercentrum.se, numera bipsy.registercentrum.se)","akt":"bipolärmottagningen vid Sahlgrenska, brukarförening","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":151,"n":"NKR 62 — Svenskt Register för Rehabiliteringsmedicin (WebRehab/SveReh)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Västra Götalandsregionen; registerhållare Katharina Stibrant Sunnerhagen (Sahlgrenska)","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; deltagande enheter betalar mindre avgift","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter inom specialiserad rehabilitering, rehabiliteringsenheter, forskare","nk":"avser rehabilitering vid förvärvade hjärnskador, ryggmärgsskador och andra komplexa tillstånd; innehåller diagnoser, väntetider, vårdtider, effekter, komplikationer och frågeformulärssvar. Lanserades som WebRehab Sweden 1997 (online sedan 2007); namnbyte till Svenskt Register för Rehabiliteringsmedicin november 2021","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"ICF-modellen och instrumentet RAND-36; diagnoskodverk i övrigt saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (svereh.registercentrum.se); flytt till ny plattform 2021. Historiskt på plattformen OpenQreg med folkbokföringskoppling och stark autentisering","akt":"grundat av Svenska sällskapet för rehabiliteringsmedicin","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":152,"n":"NKR 101 — Nationellt Rättspsykiatriskt kvalitetsregister (RättspsyK)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 1","ans":"CPUA Västra Götalandsregionen (regionstyrelsen)","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter inom rättspsykiatrisk vård, rättspsykiatriska verksamheter, forskare","nk":"följer upp vårdinsatser inom rättspsykiatrisk vård, där patienter är frihetsberövade och vårdas under tvångslagar; flera subregister med formulär för nyregistrering, årsuppföljning och avslut av LRV-vård. Startår: 2008","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (rattspsyk.registercentrum.se)","akt":"Svenska Rättspsykiatriska Föreningen","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":153,"n":"NKR 111 — Svenska Kvalitetsregistret för Gynekologisk Cancer","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet, certifieringsnivå 2","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"kvinnor med gynekologisk cancer, gynekologisk/onkologisk vård, forskare","nk":"omfattar alla maligna tumörer i kvinnans genitalia (äggstocks-, livmoderkropps-, livmoderhals- och vulvacancer, inkl. borderlinetumörer). Delregister startade 2008 (äggstock), 2010 (livmoderkropp), 2011 (livmoderhals), 2012 (vulva). Innehåller canceranmälan samt uppgifter om kirurgisk och onkologisk behandling och komplikationer","ehds":"","korr":"","dep":"2, 6, 4","ai":[],"kchd":[],"nytta":[],"ds":"registrering via INCA gäller som canceranmälan; cancerregistret bygger på Socialstyrelsens föreskrifter. Kodverksanvändning i övrigt framgår inte uttryckligen av tillgängliga källor. Rapporterar via INCA","tek":"INCA-plattformen (RCC)","akt":"förvaltas av Regionalt cancercentrum väst; nära samarbete med vårdprogramgrupperna","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":154,"n":"NKR 132 — Svenskt kvalitetsregister för huvud- och halscancer (SweHNCR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet, certifieringsnivå 1","ans":"CPUA Västra Götalandsregionen; registerhållare Eva Hammerlid (Sahlgrenska universitetssjukhuset, Göteborg)","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med huvud- och halscancer, ÖNH- och onkologisk vård, forskare","nk":"omfattar cancer i läpp, munhåla, svalg, struphuvud, näsa, bihålor och spottkörtlar; innehåller canceranmälan, ledtider, behandlingsbeslut, kirurgisk och onkologisk behandling samt uppföljning. Startår: 2008. Sedan introduktionen 2008 har antalet HH-cancerfall ökat med 42 procent (framför allt HPV-inducerad orofarynxcancer)","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"registrering via INCA gäller som canceranmälan; kodverksanvändning i övrigt framgår inte uttryckligen av tillgängliga källor. Rapporterar via INCA","tek":"INCA-plattformen (RCC)","akt":"utvecklat i samarbete mellan specialiteterna onkologi och otorhinolaryngologi tillsammans med RCC Väst","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":155,"n":"NKR 174 — Svenska Artrosregistret (BOA)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med artros i höft, knä och hand; primärvård, arbetsterapeuter och fysioterapeuter; forskare","nk":"omfattar patienter med artros som erbjudits grundbehandling inom primärvården; innehåller patientdemografi, mest besvärande led (höft, knä eller hand), tidigare utredningar/behandlingar, följsamhet till grundbehandling samt patientrapporterat utfall efter 3 månader och 1 år (smärta, fysisk aktivitet, rörelserädsla, livskvalitet, patientnöjdhet). Hette BOA-registret (Bättre omhändertagande av patienter med artros) från start 2008/2009 till januari 2023","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (boa.registercentrum.se / artrosregistret.registercentrum.se)","akt":"utvecklat med medel från Försäkringskassan, landstingsmiljarden och FoU-medel från VGR; blev nationellt kvalitetsregister 2010","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":156,"n":"NKR 237 — Det Svenska Kvalitetsregistret för myelom (Svenska Myelomregistret)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet","ans":"CPUA Västra Götalandsregionen; registerhållare Cecilie Hveding Blimark (Göteborg)","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med myelom/AL-amyloidos, hematologisk vård, forskare","nk":"register för multipelt myelom; sedan 2024 samlas data även vid diagnos för AL-amyloidos. Registret har eget status och ligger på INCA-plattformen","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"registrering via INCA; kodverksanvändning i övrigt framgår inte uttryckligen av tillgängliga källor. Rapporterar via INCA","tek":"INCA-plattformen (RCC), med nationellt stödteam vid RCC Väst (Göteborg)","akt":"Svenska Myelomgruppen","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":157,"n":"NKR 173 — Svenska Sömnapnéregistret (SESAR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 3","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med sömnapné, sömnmedicinsk/ÖNH-vård, forskare","nk":"följer patienter med obstruktiv sömnapné (OSA) genom hela vården, från utredning till behandling och uppföljning. Innehåller kvalitetsmått som tid till diagnos och behandling, samsjuklighet, val av behandlingsform (CPAP, apnéskena) samt kontakter med vårdpersonal","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"använder instrumenten Asthma Control Test/COPD-test förekommer ej; för OSA används kliniska mått. Specifik kodverksanvändning framgår inte av tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (sesar.registercentrum.se)","akt":"registret klassificeras under öron-, näs- och halssjukdomar","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":158,"n":"NKR 170 — Svenska Frakturregistret (SFR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (har informationsspecifikation enligt RUT)","ans":"huvudman och CPUA är Västra Götalandsregionen; registerhållare Olof Wolf","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med frakturer, ortopedisk vård, forskare och implantattillverkare","nk":"registrerar kroppens samtliga ortopediska frakturer med uppgifter om skada, skadeorsak och behandling – både kirurgisk och icke-kirurgisk. Resultatdata består av reoperationsfrekvens, mortalitet och patientrapporterade utfallsmått. Unikt i världen genom att registrera både kirurgisk och icke-kirurgisk behandling. Startade i en uppbyggnadsfas från 2012","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"registret har en informationsspecifikation (förutsättning för automatiserad informationsutlämning enligt RUT); täckningsgrad beräknas mot PAR med åtgärdskoder; specifik kodverksanvändning i övrigt framgår inte uttryckligen. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (sfr.registercentrum.se)","akt":"forskningskoordination via Uppsala universitet","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":159,"n":"NKR 203 — Bröstimplantatregistret (BRIMP)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister","ans":"CPUA Västra Götalandsregionen; registerhållare Birgit Stark (Karolinska universitetssjukhuset, Solna)","tid":"I drift","st":"Operativt","fin":"offentliga medel via SKR/staten, med bidrag även från de två plastikkirurgiska yrkesföreningarna","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med bröstimplantat (cancerrekonstruktion och estetisk kirurgi), plastikkirurgisk vård, forskare","nk":"följer permanenta bröstimplantat från alla tillverkare och registrerar både primäroperationer och reoperationer, samt patientspecifika data, indikation, antibiotika och kirurgisk teknik. Syftet är att tidigt upptäcka oväntade komplikationer relaterade till specifika implantat och tekniker. Startade i maj 2014, delvis föranlett av PIP-skandalen","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (brimp.registercentrum.se)","akt":"startat av Svensk Plastikkirurgisk Förening och Svensk Förening för Estetisk Plastikkirurgi","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":160,"n":"NKR 122 — Luftvägsregistret (LVR)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister (har informationsspecifikation enligt RUT)","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med astma och KOL, primär- och specialistvård, forskare","nk":"register för patienter med astma (barn och vuxna) och KOL; registrering sker i primärvård, organspecifik öppenvård och, för KOL, slutenvård vid exacerbation. Innehåller vårdkontakter, diagnos, exacerbationer, behandling, samsjuklighet, lungfunktion, allergitester samt självrapporterade symtom (Asthma Control Test och COPD Assessment Test). Engelskt namn Swedish National Airway Register (SNAR)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"registret har informationsspecifikation; använder ACT och CAT som instrument; täckning beräknas mot läkemedelsuttag (ATC-baserat). Specifik diagnoskodverksanvändning i övrigt framgår inte uttryckligen. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (lvr.registercentrum.se); direktöverföring bl.a. via medrave4; journalmallar i bl.a. Cambio COSMIC underlättar inrapportering","akt":"nationell styrgrupp med epidemiolog och senior expertis","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":161,"n":"NKR 201 — RiksFot (Svenska fotkirurgiska registret)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 2","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter inom elektiv fotkirurgi, ortopedisk vård, forskare","nk":"nationellt register för elektiv fot- och fotledskirurgi för patienter över 16 år; cirka 20 diagnoser inkluderas, vilket beräknas täcka cirka 75 procent av fot- och fotledskirurgin, och omfattar både offentliga och privata vårdgivare. Nationell skarp start våren 2015 (april 2015)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"använder frågeformulär/PROM; specifik kodverksanvändning framgår inte uttryckligen av tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (fot.registercentrum.se)","akt":"kopplat till Svenska Fotkirurgiska Sällskapet","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":162,"n":"NKR 301 — Svenskt Pediatriskt Ortopediskt Qvalitetsregister (SPOQ)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister, certifieringsnivå 3","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering (Socialstyrelsens statsbidragsunderlag 2025 anger 913 493 kr till SPOQ)","fok":"primär klinisk uppföljning och sekundär forskning","mg":"barn med utvalda ortopediska tillstånd, barnortopedisk vård, forskare","nk":"omfattar fem barnortopediska diagnoser – höftledsinstabilitet (DDH), Perthes (LCPD), höftfyseolys (SCFE), klumpfot (PEVA) och patellaluxation. Registret fick statligt och regionalt anslag från 2014; uppbyggnad 2014–2015 och togs i bruk 1 januari 2016 (vetenskapliga artiklar refererar ibland till 2015 som designations-/initieringsår)","ehds":"","korr":"","dep":"2","ai":[],"kchd":[],"nytta":[],"ds":"uppgift om specifika kodverk saknas i tillgängliga källor. Rapporterar inte via INCA","tek":"Registercentrum Västra Götaland (spoq.registercentrum.se)","akt":"beslut på Svensk Barnortopedisk Förenings årsmöte 2012","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":163,"n":"NKR 500 — Nationellt kvalitetsregister för mammografiscreening (NKM/NKB)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet, certifieringsnivå 3 (har informationsspecifikation enligt SKR)","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"kvinnor i screeningålder, mammografiverksamheter, forskare","nk":"omfattar kvinnor 40–74 år som inbjuds till mammografiscreening och innehåller bröstradiologiska data för hela processen – inbjudan, deltagande, ledtider, screeningresultat och diagnostisk utredning. Målgruppen utgör totalt cirka 2,1 miljoner kvinnor. På grund av stora datamängder sker automatisk dataöverföring från mammografienheternas journalsystem utan extra manuell registrering","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"nationella undersöknings- och fyndkoder (förvaltas av NAM); registret har informationsspecifikation. Rapporterar inom INCA-/RCC-strukturen","tek":"automatisk dataöverföring från mammografienheternas journalsystem; förvaltas inom RCC-strukturen (statistik via statistik.incanet.se-miljön används för flera RCC-register)","akt":"förvaltas av Regionalt cancercentrum väst; RCC Väst är nationellt stöd","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":164,"n":"NKR 128 — Kvalitetsregister för cancer i lever, gallblåsa och gallvägar (SweLiv)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet, certifieringsnivå 2","ans":"CPUA Västra Götalandsregionen; verksamhetsområde Kirurgi har lokalt juridiskt ansvar för datainsamlingen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med lever-/gallcancer, kirurgisk och onkologisk vård, forskare","nk":"består av två delar – ett diagnosregister för patienter med primär cancer i lever, gallvägar och gallblåsa, och ett interventionsregister för kirurgisk eller ablativ behandling av både primär och metastatisk cancer. Innehåller ledtider, diagnos, patologiska fynd och kirurgisk behandling; sedan 2021 även onkologisk behandling. Inklusion förutsätter ålder 16 år eller äldre och svenskt personnummer. Startade 2008 (hette tidigare NLGR, bytte namn 2014)","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"registrering via INCA; kodverksanvändning i övrigt framgår inte uttryckligen av tillgängliga källor. Rapporterar via INCA","tek":"INCA-plattformen (RCC); öppen statistik via statistik.incanet.se/SweLiv","akt":"nationell styrgrupp","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""},{"nr":165,"n":"NKR 171 — Nationellt kvalitetsregister för Tyreoideacancer (sköldkörtelcancer)","del":"A","sub":"A1","fk":"Regionerna","typ":"nationellt kvalitetsregister inom cancerområdet. Certifieringsnivå: källorna är motstridiga – SKR:s sköldkörtelcancer-sida anger nivå 3 medan en parallell SKR-sida för tyreoideacancer anger nivå K (kandidatregister); detta bör verifieras manuellt, men nivå 3 förefaller vara den aktuella diagnos-/sköldkörtel-sidan","ans":"CPUA Västra Götalandsregionen","tid":"I drift","st":"Operativt","fin":"nationella kvalitetsregistermedel via Överenskommelsen staten–SKR med regional medfinansiering; förvaltas inom RCC-strukturen","fok":"primär klinisk uppföljning och sekundär forskning","mg":"patienter med sköldkörtelcancer, endokrinkirurgisk och onkologisk vård, forskare","nk":"registrerar nyupptäckta primära sköldkörtelcancerfall (ej benigna tumörer eller obduktionsfynd) och är tänkt att vara heltäckande; har stark koppling till det nationella vårdprogrammet med gemensam styrgrupp. Startade 1 januari 2013; tio årsrapporter 2013–2023","ehds":"","korr":"","dep":"2, 6","ai":[],"kchd":[],"nytta":[],"ds":"registrering via INCA; kodverksanvändning i övrigt framgår inte uttryckligen av tillgängliga källor. Rapporterar via INCA","tek":"INCA-plattformen (RCC), stödteam RCC Väst","akt":"gemensam styrgrupp med det nationella vårdprogrammet","tags":[{"category":"Verksamhetstyp","values":"kvalitetsregister"},{"category":"Aktörstyp","values":"region"}],"wg_beskr":"","wg_tek":""}];
/* ─────────── CONSTANTS ─────────── */
const SUB_LABELS = {
  A1: "A1 – Regionala initiativ",
  A2: "A2 – Statliga initiativ",
  A3: "A3 – EU / internationella",
  B:  "B – TRE-miljöer",
  C1: "C1 – Regionala stödsystem",
  C2: "C2 – Statliga stödsystem",
  C3: "C3 – EU / internationella stöd",
  D:  "D – Lagstiftning, strategi & policy"
};
const DEL_LABELS = {
  A: "Del A – Infrastruktur & datadelning",
  B: "Del B – TRE-miljöer",
  C: "Del C – Stödsystem & standarder",
  D: "Del D – Lagstiftning & strategi"
};
const DEL_COLORS = {
  A: { bg: "#E8F0FE", border: "#4285F4", text: "#1A56DB", dot: "#4285F4" },
  B: { bg: "#FEF3E2", border: "#E8913A", text: "#B45309", dot: "#E8913A" },
  C: { bg: "#E6F5EC", border: "#2D8A56", text: "#166534", dot: "#2D8A56" },
  D: { bg: "#F3E8FE", border: "#8B5CF6", text: "#6D28D9", dot: "#8B5CF6" }
};
const FK_LABELS = {
  "Regionerna": "Regionerna",
  "Stat, inkl myndigheter och/eller privat": "Stat / myndigheter",
  "EU": "EU"
};
const TAG_CATS = ["Aktörstyp", "Verksamhetstyp", "Fokusområde", "Användning"];
function parseMSEK(s) {
  if (!s) return 0;
  const m = s.match(/([\d\s,.]+)\s*MSEK/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/\s/g, "").replace(",", ".")) || 0;
}
function getTagValues(item, cat) {
  const t = item.tags.find(tg => tg.category === cat);
  return t ? t.values.split(", ").map(v => v.trim()) : [];
}
/* ─────────── FILTER SECTION ─────────── */
function FilterSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: open ? "#F0F4FF" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1B3A5C", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
      </button>
      {open && <div style={{ padding: "6px 12px 10px 20px" }}>{children}</div>}
    </div>
  );
}
/* ─────────── FILTER CHECKBOX ─────────── */
function FilterCheck({ label, checked, onChange, count, color }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: "#374151", fontFamily: "'DM Sans', sans-serif", background: checked ? "#F0F4FF" : "transparent" }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#F7F8FA"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ width: 16, height: 16, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: checked ? "none" : "1.5px solid #CBD5E1", background: checked ? (color || "#1B3A5C") : "#fff" }}>
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginLeft: "auto" }}>{count}</span>}
    </label>
  );
}
/* ─────────── INITIATIVE CARD ─────────── */
function InitCard({ item, selected, onSelect, onClick, ov }) {
  const col = DEL_COLORS[item.del];
  const matVal = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const matLevel = MATURITY_LEVELS.find(m => m.value === matVal);
  const msek = parseMSEK(item.fin);
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${selected ? col.border : ov?.arbetaVidere ? "#F59E0B" : "#E5E7EB"}`, padding: 0, cursor: "pointer", transition: "all 0.2s", boxShadow: selected ? `0 0 0 2px ${col.border}33` : ov?.arbetaVidere ? "0 0 0 2px #F59E0B33" : "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", position: "relative", transform: selected ? "scale(1.01)" : "scale(1)" }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = col.border + "88"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = ov?.arbetaVidere ? "#F59E0B" : "#E5E7EB"; e.currentTarget.style.boxShadow = ov?.arbetaVidere ? "0 0 0 2px #F59E0B33" : "0 1px 3px rgba(0,0,0,0.04)"; }}}>
      <div style={{ height: 4, borderRadius: "12px 12px 0 0", background: `linear-gradient(90deg, ${col.border}, ${col.border}88)` }} />
      <div style={{ padding: "12px 14px 14px" }} onClick={onClick}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "2px 7px", borderRadius: 4, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{item.sub}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>Nr {item.nr}</span>
          {(ov && ov.arbetaVidere) && <span style={{fontSize:11}}>⭐</span>}
          {(ov && ov.qa && ov.qa.approved && ov.qa.approved.done) && <span style={{fontSize:11,color:"#22C55E"}}>✓</span>}
          <div style={{ flex: 1 }} />
          {matLevel && <span style={{ fontSize: 9, fontWeight: 600, color: matLevel.color, background: matLevel.color + "14", padding: "2px 7px", borderRadius: 10, whiteSpace: "nowrap" }}>{matLevel.label}</span>}
        </div>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", margin: "0 0 6px 0", lineHeight: 1.35, fontFamily: "'DM Sans', sans-serif" }}>{item.n}</h3>
        <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "'Source Sans 3', sans-serif" }}>
          {item.nk ? item.nk.substring(0, 180) + (item.nk.length > 180 ? "…" : "") : ""}
        </p>
        {msek > 0 && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><Banknote size={12} color="#9CA3AF" /><span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{msek.toLocaleString("sv-SE")} MSEK</span></div>}
      </div>
      <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2, cursor: "pointer", padding: 4 }} onClick={e => { e.stopPropagation(); onSelect(); }}>
        {selected ? <CheckSquare size={18} color={col.border} fill={col.bg} /> : <Square size={18} color="#CBD5E1" />}
      </div>
    </div>
  );
}
/* ─────────── SCORE BAR ─────────── */
function ScoreBar({ label, score, comment, color = "#1B3A5C" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
      <span style={{ width: 160, color: "#6B7280", flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 3 }}>{[1,2,3].map(s => <div key={s} style={{ width: 24, height: 8, borderRadius: 4, background: s <= score ? color : "#E5E7EB" }} />)}</div>
      <span style={{ color: "#9CA3AF", fontSize: 11 }}>{comment}</span>
    </div>
  );
}
/* ─────────── DETAIL MODAL ─────────── */
function DetailModal({ item, onClose, allItems, overridesCache, refreshOverrides, analysisObjects = [], onCreateContinuityAnalysis }) {
  const [override, setOverride] = useState(null);
  const [showMeta, setShowMeta] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    getOverride(item.nr).then(ov => setOverride(ov));
    const sub = subscribeToTable('overrides', (payload) => {
      if (payload.new && payload.new.nr === item.nr) {
        const fallback = { fields: {}, arbetaVidere: false, qa: {}, infoGathering: {}, maturity: null, jurisdictions: [], jurisdictionOther: "", sources: [], fieldHistory: {} };
        setOverride({ ...fallback, ...payload.new.data });
      }
    });
    return () => sub.unsubscribe();
  }, [item.nr]);
  const handleSave = async () => {
    await saveOverride(item.nr, override);
    if (refreshOverrides) refreshOverrides();
  };
  const autoSave = useCallback((nextOverride) => {
    saveOverride(item.nr, nextOverride).then(() => { if (refreshOverrides) refreshOverrides(); });
  }, [item.nr, refreshOverrides]);
  const toggleArbetaVidere = async () => {
    const next = { ...override, arbetaVidere: !override.arbetaVidere };
    setOverride(next);
    await saveOverride(item.nr, next);
    if (refreshOverrides) refreshOverrides();
  };
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  if (!override) return null;
  const gfv = (field) => getFieldValue(item, field, override);
  const maturity = override.maturity !== null ? override.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const matLevel = MATURITY_LEVELS.find(m => m.value === maturity);
  const isApproved = override.qa?.approved?.done;
  const col = DEL_COLORS[item.del];
  const deps = item.dep ? item.dep.split(",").map(d => parseInt(d.trim())).filter(Boolean) : [];
  const depItems = deps.map(nr => allItems.find(i => i.nr === nr)).filter(Boolean);
  const linkedAO = analysisObjects.filter(o => Array.isArray(o.linkedInitiatives) && o.linkedInitiatives.includes(item.nr));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: expanded ? "stretch" : "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: expanded ? 12 : "40px 20px", overflowY: expanded ? "hidden" : "auto", transition: "padding 0.2s" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: expanded ? 12 : 16, maxWidth: expanded ? "100%" : 720, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.15)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: expanded ? "100%" : "none", transition: "max-width 0.2s, border-radius 0.2s" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg, ${col.border}, ${col.border}CC)`, padding: "24px 28px", color: "#fff", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title={expanded ? "Förminska" : "Expandera"}>{expanded ? "⊟" : "⊞"}</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "3px 10px", borderRadius: 6 }}>{item.sub}</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Nr {item.nr}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif", paddingRight: 32 }}>{item.n}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={toggleArbetaVidere} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: override.arbetaVidere ? "2px solid #F59E0B" : "1px solid #E5E7EB", background: override.arbetaVidere ? "#FFFBEB" : "rgba(255,255,255,0.15)", color: override.arbetaVidere ? "#B45309" : "rgba(255,255,255,0.8)" }}>
              {override.arbetaVidere ? <span style={{fontSize:12}}>⭐</span> : <span style={{fontSize:12,opacity:0.4}}>☆</span>}
              {override.arbetaVidere ? "Prioriterad" : "Arbeta vidare"}
            </button>
            {matLevel && <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: "#fff" }}>{matLevel.label}</span>}
            {isApproved && <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "rgba(34,197,94,0.3)", color: "#fff" }}>✅ Godkänd</span>}
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px", maxHeight: expanded ? "none" : "60vh", overflowY: "auto", flex: expanded ? 1 : "none" }}>
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "#ECFEFF", border: "1px solid #A5F3FC", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0E7490", textTransform: "uppercase", letterSpacing: "0.04em" }}>🛡️ Kontinuitetsanalys</span>
            {linkedAO.length > 0
              ? linkedAO.map(o => (
                  <span key={o.id} title={o.typ} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "#fff", border: "1px solid #A5F3FC", color: "#0E7490", fontWeight: 600 }}>{o.namn || "Namnlöst"}</span>
                ))
              : <span style={{ fontSize: 11, color: "#0E7490", fontStyle: "italic" }}>Ingen analys ännu</span>}
            <div style={{ flex: 1 }} />
            {onCreateContinuityAnalysis && (
              <button onClick={(e) => { e.stopPropagation(); onCreateContinuityAnalysis(item); }}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid #0E7490", background: "#0E7490", color: "#fff" }}>
                + Skapa{linkedAO.length > 0 ? " ny" : ""}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setShowEdit(!showEdit)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer", border: showEdit ? "1px solid #4285F4" : "1px solid #E5E7EB", background: showEdit ? "#E8F0FE" : "#fff", color: showEdit ? "#1A56DB" : "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{fontSize:11}}>✏️</span> {showEdit ? "Stäng redigering" : "Redigera"}
            </button>
            <button onClick={() => setShowMeta(!showMeta)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer", border: showMeta ? "1px solid #8B5CF6" : "1px solid #E5E7EB", background: showMeta ? "#F3E8FE" : "#fff", color: showMeta ? "#6D28D9" : "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{fontSize:11}}>🛡</span> {showMeta ? "Dölj QA & Metadata" : "QA & Metadata"}
            </button>
          </div>
          {/* METADATA PANEL */}
          {showMeta && <div style={{ marginBottom: 16, padding: 14, background: "#FAFBFC", borderRadius: 10, border: "1px solid #E5E7EB" }}>
            <CardMetadataPanel item={item} override={override} setOverride={setOverride} onSave={handleSave} />
          </div>}
          {/* EDITABLE FIELDS */}
          {showEdit && <div style={{ marginBottom: 16, padding: 14, background: "#FFF8F0", borderRadius: 10, border: "1px solid #FCD34D" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", marginBottom: 8 }}>Redigera fält (sparas i override-lager, original bevaras alltid i historik)</div>
            <EditableField label="Namn" field="n" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Ansvarig" field="ans" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Typ" field="typ" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Finansieringskälla" field="fk" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Finansiering" field="fin" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Tidplan" field="tid" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Målgrupp" field="mg" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Fokus" field="fok" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Nyckelkaraktäristik" field="nk" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="EHDS-relevans" field="ehds" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Datastandarder" field="ds" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Teknisk miljö" field="tek" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Aktörer" field="akt" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Arbetsgruppens beskrivning" field="wg_beskr" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Teknologi/infrastruktur (arbetsgruppen)" field="wg_tek" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Beroenden (kommaseparerade nr)" field="dep" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Korrigering" field="korr" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 6 }}>Strukturerade fält</div>
              <ScoreArrayEditor label="AI-relevans (6 dimensioner)" field="ai" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <ScoreArrayEditor label="KCHD-relevans (5 dimensioner)" field="kchd" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <NyttaEditor item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <TagsEditor item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            </div>
          </div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20, padding: 16, background: "#F7F8FA", borderRadius: 12 }}>
            {[["Mognadsgrad", matLevel ? matLevel.label : (item.st || "—")],["Finansiering", item.fin || "—"],["Finansieringskälla", item.fk],["Tidsperiod", item.tid || "—"],["Ansvarig", item.ans],["Hälsodatafokus", item.fok || "—"],["Målgrupp", item.mg || "—"],["Typ", item.typ]].map(([l, v], idx) => (
              <div key={idx}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Nyckelkaraktäristik</h4><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{item.nk}</p></div>
          {item.ehds && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>EHDS-relevans</h4><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{item.ehds}</p></div>}
          {item.wg_beskr && <div style={{ marginTop: 4, marginBottom: 12, padding: "10px 12px", background: "#F0F7FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1A56DB", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Arbetsgruppens beskrivning</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.wg_beskr}</div>
          </div>}
          {item.wg_tek && <div style={{ marginBottom: 12, padding: "10px 12px", background: "#F5F3FF", borderRadius: 8, border: "1px solid #DDD6FE" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6D28D9", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Teknologi och infrastruktur (arbetsgruppen)</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.wg_tek}</div>
          </div>}
          {item.korr && <div style={{ marginBottom: 20, padding: 12, background: "#FEF3C7", borderRadius: 8, border: "1px solid #FCD34D" }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Korrektioner</h4><p style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5, margin: 0 }}>{item.korr}</p></div>}
          {item.ai && item.ai.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>AI-relevans</h4>{item.ai.map((a, i) => <ScoreBar key={i} label={a.name} score={a.score} comment={a.comment} color="#4285F4" />)}</div>}
          {item.kchd && item.kchd.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>KCHD-relevans</h4>{item.kchd.map((k, i) => <ScoreBar key={i} label={k.name} score={k.score} comment={k.comment} color="#2D8A56" />)}</div>}
          {item.nytta && item.nytta.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Nyttodimensioner</h4>{item.nytta.map((ny, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", gap: 8, fontSize: 12.5 }}><span style={{ fontWeight: 700, color: col.text, background: col.bg, padding: "2px 8px", borderRadius: 4, fontSize: 11, flexShrink: 0 }}>{ny.level}</span><span style={{ color: "#374151", lineHeight: 1.4 }}>{ny.text}</span></div>
          ))}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {item.ds && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Datastandarder</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.ds}</p></div>}
            {item.tek && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Teknik</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.tek}</p></div>}
          </div>
          {item.akt && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Aktörer</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.akt}</p></div>}
          <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Taggar</h4><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{item.tags.map((tg, i) => tg.values.split(", ").map((v, j) => <span key={`${i}-${j}`} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F3F4F6", color: "#4B5563", fontWeight: 500 }}>{tg.category}: {v}</span>))}</div></div>
          {depItems.length > 0 && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Beroenden</h4><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{depItems.map(d => <span key={d.nr} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: DEL_COLORS[d.del].bg, color: DEL_COLORS[d.del].text, fontWeight: 600, border: `1px solid ${DEL_COLORS[d.del].border}33` }}>Nr {d.nr}: {d.n.length > 40 ? d.n.substring(0, 40) + "…" : d.n}</span>)}</div></div>}
          {item.jurisdiktioner && <div style={{ marginTop: 12, marginBottom: 12, padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FDBA74" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A3412", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Rekommenderade jurisdiktioner</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.jurisdiktioner}</div>
          </div>}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button onClick={() => { onClose(); setTimeout(() => document.dispatchEvent(new CustomEvent("openDeepDive", { detail: item.nr })), 100); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>
              <Database size={13} /> Datafördjupning
            </button>
          </div>
          <SuggestionField itemNr={item.nr} />
        </div>
      </div>
    </div>
  );
}
/* ─────────── COMPARE PANEL ─────────── */
function ComparePanel({ items, onClose }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95vw", maxWidth: 1100, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1B3A5C", margin: 0 }}>Jämför initiativ ({items.length} valda)</h3>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12.5 }}>
            <thead><tr>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: "#6B7280", fontSize: 11, textTransform: "uppercase", position: "sticky", left: 0, background: "#fff", width: 140 }}>Fält</th>
              {items.map(it => <th key={it.nr} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: DEL_COLORS[it.del].text, background: DEL_COLORS[it.del].bg, borderRadius: "8px 8px 0 0", minWidth: 200 }}>Nr {it.nr}: {it.n.length > 30 ? it.n.substring(0, 30) + "…" : it.n}</th>)}
            </tr></thead>
            <tbody>
              {[["Mognadsgrad", it => { const m = STATUS_TO_MATURITY[it.st]; const ml = m ? MATURITY_LEVELS.find(l => l.value === m) : null; return ml ? ml.label : (it.st || "—"); }],["Finansiering", it => it.fin || "—"],["Finansieringskälla", it => it.fk],["Tidsperiod", it => it.tid || "—"],["Ansvarig", it => it.ans],["Hälsodatafokus", it => it.fok || "—"],["EHDS-relevans", it => it.ehds || "—"],
                ["AI-relevans (snitt)", it => { if (!it.ai || !it.ai.length) return "—"; return (it.ai.reduce((s, a) => s + a.score, 0) / it.ai.length).toFixed(1) + " / 3"; }],
                ["KCHD-relevans (snitt)", it => { if (!it.kchd || !it.kchd.length) return "—"; return (it.kchd.reduce((s, a) => s + a.score, 0) / it.kchd.length).toFixed(1) + " / 3"; }],
                ["Datastandarder", it => it.ds || "—"],["Teknik", it => it.tek || "—"]
              ].map(([label, fn], ri) => (
                <tr key={label} style={{ background: ri % 2 === 0 ? "#F9FAFB" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#4B5563", position: "sticky", left: 0, background: ri % 2 === 0 ? "#F9FAFB" : "#fff" }}>{label}</td>
                  {items.map(it => <td key={it.nr} style={{ padding: "8px 12px", color: "#374151", lineHeight: 1.4, verticalAlign: "top" }}>{fn(it)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ─────────── MATRIX VIEW (Del A fyrfältare) ─────────── */
/* ─────────── PERSISTENT STORAGE (Supabase) ─────────── */
// storageGet/storageSet kept as thin wrappers for backward compat with export/import
const storageGet = async (key) => {
  if (key.startsWith("override:")) return getOverride(parseInt(key.split(":")[1]));
  if (key.startsWith("deepdive:")) return getDeepDive(parseInt(key.split(":")[1]));
  if (key.startsWith("suggestion:")) return getSuggestion(parseInt(key.split(":")[1]));
  if (key === "candidates_list") return getCandidates();
  if (key === "analysis_objects") return getAnalysisObjects();
  return null;
};
const storageSet = async (key, val) => {
  if (key.startsWith("override:")) return saveOverride(parseInt(key.split(":")[1]), val);
  if (key.startsWith("deepdive:")) return saveDeepDive(parseInt(key.split(":")[1]), val);
  if (key.startsWith("suggestion:")) return saveSuggestion(parseInt(key.split(":")[1]), val);
  if (key === "candidates_list") return saveCandidates(val);
  if (key === "analysis_objects") return saveAnalysisObjects(val);
};
/* ─────────── EXPORT / IMPORT HELPERS (Supabase) ─────────── */
import { supabase } from './supabaseClient';
const exportAllData = async () => {
  const [ov, dd, sug, cand] = await Promise.all([
    supabase.from('overrides').select('*'),
    supabase.from('deepdives').select('*'),
    supabase.from('suggestions').select('*'),
    supabase.from('candidates').select('*'),
  ]);
  const backup = { overrides: ov.data || [], deepdives: dd.data || [], suggestions: sug.data || [], candidates: cand.data || [] };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aktivitetskartan_backup_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  return (ov.data?.length || 0) + (dd.data?.length || 0) + (sug.data?.length || 0) + (cand.data?.length || 0);
};
const importAllData = () => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) { resolve(0); return; }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);
          let count = 0;
          if (backup.overrides?.length) { await supabase.from('overrides').upsert(backup.overrides, { onConflict: 'nr' }); count += backup.overrides.length; }
          if (backup.deepdives?.length) { await supabase.from('deepdives').upsert(backup.deepdives, { onConflict: 'nr' }); count += backup.deepdives.length; }
          if (backup.suggestions?.length) { await supabase.from('suggestions').upsert(backup.suggestions, { onConflict: 'nr' }); count += backup.suggestions.length; }
          if (backup.candidates?.length) { await supabase.from('candidates').upsert(backup.candidates, { onConflict: 'id' }); count += backup.candidates.length; }
          resolve(count);
        } catch (err) {
          alert("Kunde inte läsa filen. Kontrollera att det är en giltig backup-fil.");
          resolve(0);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
};
/* ─────────── DATA DEEPDIVE PANEL ─────────── */
/* ─────────── MATURITY LEVELS ─────────── */
const MATURITY_LEVELS = [
  { value: 1, label: "Planerad", color: "#9CA3AF", desc: "Beslut fattat men ej påbörjat" },
  { value: 2, label: "Under uppbyggnad", color: "#F59E0B", desc: "Utveckling/upphandling pågår" },
  { value: 3, label: "Pilot/test", color: "#8B5CF6", desc: "Begränsad drift, testas" },
  { value: 4, label: "Operativ (begränsad)", color: "#3B82F6", desc: "I drift men ej full utrullning" },
  { value: 5, label: "Fullt implementerad", color: "#22C55E", desc: "I drift nationellt/fullt utrullad" },
  { value: 6, label: "Avslutat", color: "#6B7280", desc: "Projektet är avslutat" },
];
const STATUS_TO_MATURITY = {
  "Operativt": 5, "Under uppbyggnad": 2, "Under driftsättning": 3, "Under utredning": 1,
  "Pågående uppdrag": 4, "Pågående": 4, "Nystartat": 2, "Avslutat": 6, "Avslutat/övergång": 6,
  "Ikraftträdd — implementation pågår": 4, "Remitterad": 1, "Beslutad": 1, "Beslutad strategi": 1,
  "Gällande lagstiftning": 5, "Gällande EU-förordning": 5, "Avslutad utredning, remissbehandling": 1,
};
const JURISDICTIONS = [
  "GDPR (EU 2016/679)", "PDL — Patientdatalagen (2008:355)", "OSL — Offentlighets- och sekretesslagen",
  "EHDS — EU 2025/327", "AI Act — EU 2024/1689", "MDR — Medicintekniska förordningen",
  "IVDR — In vitro-diagnostik", "NIS2 — Cybersäkerhetsdirektivet", "Biobankslagen (2023:38)",
  "Registerförfattningar (SoS)", "Etikprövningslagen (2003:460)", "Upphovsrättslagen",
  "SVOD — Socialstyrelsens föreskrifter om öppenvårdsdokumentation",
];
const QA_STEPS = [
  { key: "aiResearch", label: "AI-research", required: true },
  { key: "manualEdit", label: "Manuell redigering", required: true },
  { key: "aiRecheck", label: "Ny AI-kontroll", required: false },
  { key: "approved", label: "Godkänd", required: true },
];
const INFO_METHODS = [
  { key: "desktopResearch", label: "Desktop research (inkl AI)" },
  { key: "dialogExpert", label: "Dialog med sakkunnig" },
  { key: "reviewedExpert", label: "Granskad av sakkunnig" },
  { key: "dialogGroup", label: "Dialog i grupp" },
];
/* ─────────── KONTINUITET & HÅLLBARHET (Metodstöd för digital försörjningskedja) ─────────── */
// Trafikljus-skala för självskattning av sårbarhet/resiliens per dimension.
const CONTINUITY_SCALE = [
  { value: "god", label: "God förmåga / låg sårbarhet", short: "God", color: "#22C55E" },
  { value: "svaghet", label: "Vissa svagheter", short: "Svagheter", color: "#F59E0B" },
  { value: "betydande", label: "Betydande sårbarhet", short: "Betydande", color: "#F97316" },
  { value: "kritisk", label: "Kritisk sårbarhet", short: "Kritisk", color: "#DC2626" },
];
const SCALE_BY_VALUE = Object.fromEntries(CONTINUITY_SCALE.map(s => [s.value, s]));
const SCALE_SEVERITY = { god: 1, svaghet: 2, betydande: 3, kritisk: 4 };
// De sex analysdimensionerna ur Metodstödet, steg 2. Varje dimension skattas + besvaras i fritext.
const CONTINUITY_DIMENSIONS = [
  { key: "verksamhetskritikalitet", label: "Verksamhetskritikalitet", icon: "🏥",
    desc: "Vilka system, tjänster, dataflöden och leverantörer är mest kritiska för vård, administration, ledning, uppföljning och beredskap?",
    questions: ["Vilka processer måste fungera för att vården ska kunna upprätthållas?", "Vilka informationstillgångar är mest kritiska?", "Vad blir konsekvensen vid avbrott?"] },
  { key: "beroenden_inlasning", label: "Beroenden & inlåsning", icon: "🔒",
    desc: "Tekniska, avtalsmässiga, kompetensmässiga eller marknadsmässiga inlåsningseffekter — beroende av leverantörer, plattformar, molntjänster eller specialistkonsulter.",
    questions: ["Vilka leverantörs-, plattforms- eller molnberoenden finns?", "Finns inlåsning i avtal, format eller kompetens?", "Hur svårt vore det att byta eller komplettera?"] },
  { key: "data_interop", label: "Data & interoperabilitet", icon: "🔌",
    desc: "Hur data lagras, används, delas och kan flyttas — dataportabilitet, öppna standarder, dokumenterade gränssnitt och möjligheten att byta komponenter.",
    questions: ["Kan data flyttas eller återanvändas (portabilitet)?", "Används öppna standarder och dokumenterade gränssnitt?", "Går komponenter att byta ut eller komplettera?"] },
  { key: "cybersakerhet", label: "Cybersäkerhet & informationssäkerhet", icon: "🛡️",
    desc: "Skyddsåtgärder, beroenden och risker som identifierats i befintligt arbete (Cybersäkerhetskollen, RSA, informationsklassning, leverantörsbedömningar).",
    questions: ["Vad visar Cybersäkerhetskollen / RSA för analysobjektet?", "Vilka skyddsåtgärder och incidentförmågor finns?", "Vilka risker bär leverantörskedjan?"] },
  { key: "ekonomi", label: "Ekonomi & handlingsutrymme", icon: "💰",
    desc: "Kostnadsdrivare: licenser, abonnemang, integrationer, konsultberoenden, förvaltning, migrerings- och exitkostnader — i relation till budgetutrymme.",
    questions: ["Vilka är de största kostnadsdrivarna?", "Vad skulle det kosta att minska eller bryta ett beroende (migrering/exit)?", "Hur förhåller sig kostnaderna till budgetutrymmet?"] },
  { key: "kompetens", label: "Kompetenser & förmågor", icon: "🧠",
    desc: "Interna kompetenser och förmågor att förstå, styra, säkra, vidareutveckla och vid behov förändra den digitala försörjningskedjan.",
    questions: ["Har regionen kompetens att styra leverantörer och förstå konsekvenser?", "Finns förmåga att genomföra förändringar?", "Vilka kompetenser saknas?"] },
];
// Rättsliga ramverk ur Metodstödet, steg 1 — relevansbedömning + bedömningstext per ramverk.
const LEGAL_FRAMEWORKS = [
  { key: "hsl", namn: "Hälso- och sjukvårdslagen", varfor: "Hur infrastrukturen påverkar vårdens jämlikhet, behovsstyrning och god vård på lika villkor." },
  { key: "psl", namn: "Patientsäkerhetslagen", varfor: "Digitala system och tillgång till rätt information i rätt tid som del av patientsäkerhetsarbetet." },
  { key: "pdl", namn: "Patientdatalagen", varfor: "Åtkomst, loggning, spärrar, sammanhållen journalföring och hantering av hälsodata." },
  { key: "interop_se", namn: "Lag om interoperabilitetskrav vid datadelning (föreslagen)", varfor: "Krav på gemensamma interoperabilitetslösningar och återanvändbara strukturer." },
  { key: "gdpr", namn: "Dataskyddsförordningen (GDPR)", varfor: "Rättslig grund, inbyggt dataskydd, tredjelandsöverföring och kontroll över personuppgiftsbehandling." },
  { key: "ehds", namn: "EHDS-förordningen", varfor: "Krav på interoperabilitet, strukturerad hälsodata, portabilitet och tillgängliggörande för primär- och sekundäranvändning." },
  { key: "nis2", namn: "NIS2 / Cybersäkerhetslagen", varfor: "Riskhantering, resiliens, incidentförmåga, ledningsansvar, leverantörskedjor och kontinuitetsåtgärder." },
  { key: "ai_act", namn: "AI-förordningen", varfor: "Hur AI-system får införas, övervakas och användas, särskilt i högrisknära kliniska sammanhang." },
  { key: "cra", namn: "Cyber Resilience-förordningen", varfor: "Krav på säkra digitala produkter, sårbarhetshantering, uppdateringar och transparens över livscykeln." },
  { key: "data_act", namn: "Data-förordningen", varfor: "Rätt till data från uppkopplade produkter — påverkar medicinteknik, portabilitet och leverantörslåsningar." },
  { key: "dga", namn: "Data Governance-förordningen", varfor: "Säkra former för att tillgängliggöra skyddade data för forskning och sekundäranvändning." },
  { key: "open_data", namn: "Öppna data-lagen", varfor: "Hur icke-känsliga datamängder görs tillgängliga i öppna, maskinläsbara format." },
  { key: "iea", namn: "Interoperable Europe Act", varfor: "Tryck på interoperabilitet, återanvändning, öppna standarder och dokumenterade gränssnitt." },
  { key: "digital_networks", namn: "Digital Networks-förordningen (framväxande)", varfor: "Kan påverka nätresiliens och beroenden till strategisk digital infrastruktur." },
  { key: "tech_sovereignty", namn: "Tech Sovereignty Package (framväxande)", varfor: "Kan påverka långsiktiga vägval och kontroll över strategisk digital infrastruktur." },
];
const ANALYSIS_OBJECT_TYPES = ["Systemmiljö", "Dataplattform", "Leverantörsberoende", "Informationskedja", "Försörjningskedja (verksamhetsområde)"];
// Kompetenskategorier ur Metodstödet, rad 84–91 — för fältet "Deltagande funktioner".
const KOMPETENSER = [
  "Strategisk IT-arkitektur, integrationer och digital infrastruktur",
  "Informationssäkerhet, cybersäkerhet och riskhantering",
  "Upphandling, leverantörsstyrning och avtalsförvaltning",
  "Juridik, dataskydd och informationshantering",
  "Ekonomi, kostnadsanalys och nyttobedömning",
  "Representanter från berörda verksamheter och informationsägare",
  "Beredskap, kontinuitetshantering och krisledning",
];
// Ansvarsområden ur Metodstödet, rad 56 — vem som ansvarar för respektive perspektiv.
const ANSVAR_OMRADEN = [
  { key: "kontinuitet", label: "Kontinuitetsperspektivet" },
  { key: "juridik", label: "Rättslig bedömning (enskild lag & på totalen)" },
  { key: "ekonomi", label: "Ekonomisk analys" },
  { key: "cybersakerhet", label: "Cybersäkerhetsunderlag" },
  { key: "arkitektur", label: "Arkitekturöversikt" },
  { key: "sammanvagning", label: "Sammanvägning av resultat" },
];
// Korta kolumnetiketter för rättsliga ramverk i översiktsmatrisen.
const LEGAL_KORT = { hsl: "HSL", psl: "PSL", pdl: "PDL", interop_se: "IntOp", gdpr: "GDPR", ehds: "EHDS", nis2: "NIS2", ai_act: "AI Act", cra: "CRA", data_act: "Data", dga: "DGA", open_data: "Öppna", iea: "IEA", digital_networks: "DigNet", tech_sovereignty: "TechSov" };
// Metodstödets fyra steg (för accordion-rubriker i analysvyn).
const CONTINUITY_STEPS = [
  { n: 1, label: "Avgränsa analysobjekt & samla underlag", desc: "Identifiera kritiska processer, informationstillgångar och tillämpliga rättsliga krav." },
  { n: 2, label: "Beskriv beroenden & dimensioner", desc: "Självskatta och beskriv de sex analysdimensionerna." },
  { n: 3, label: "Bedöm konsekvenser, risker & sårbarheter", desc: "Sammanvägd bedömning av vad som händer om beroendena brister." },
  { n: 4, label: "Prioritera åtgärder & dokumentera", desc: "Slutsatser, rekommenderade prioriteringar och åtgärdsförslag." },
];

/* ─────────── OVERRIDE HELPERS (getOverride & saveOverride imported from storage.js) ─────────── */
const getFieldValue = (item, field, override) => {
  if (override && override.fields && override.fields[field] !== undefined) return override.fields[field];
  return item[field];
};
/* ─────────── CARD METADATA PANEL ─────────── */
function CardMetadataPanel({ item, override, setOverride, onSave }) {
  const maturity = override.maturity !== null ? override.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const qa = override.qa || {};
  const info = override.infoGathering || {};
  const jurisdictions = override.jurisdictions || [];
  const debounceRef = useRef(null);
  const updateOv = (path, val) => {
    const next = JSON.parse(JSON.stringify(override));
    const parts = path.split(".");
    let obj = next;
    for (let i = 0; i < parts.length - 1; i++) { if (!obj[parts[i]]) obj[parts[i]] = {}; obj = obj[parts[i]]; }
    obj[parts[parts.length - 1]] = val;
    setOverride(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { saveOverride(item.nr, next); }, 600);
  };
  const toggleQa = (key) => {
    const curr = qa[key] || {};
    updateOv("qa." + key, curr.done ? { done: false, date: null, name: "" } : { done: true, date: new Date().toISOString().slice(0, 10), name: "" });
  };
  const toggleInfo = (key) => updateOv("infoGathering." + key, !info[key]);
  const toggleJuris = (j) => {
    const next = jurisdictions.includes(j) ? jurisdictions.filter(x => x !== j) : [...jurisdictions, j];
    updateOv("jurisdictions", next);
  };
  const isApproved = qa.approved && qa.approved.done;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* QA Chain */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Kvalitetssäkring</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {QA_STEPS.map((step, idx) => {
            const s = qa[step.key] || {};
            return (
              <button key={step.key} onClick={() => toggleQa(step.key)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                  border: s.done ? "1px solid #22C55E" : "1px solid #E5E7EB",
                  background: s.done ? "#F0FFF4" : "#fff",
                  color: s.done ? "#166534" : "#6B7280",
                  opacity: !step.required ? 0.7 : 1,
                }}>
                {s.done ? <span style={{fontSize:12}}>✓</span> : <span style={{fontSize:12,opacity:0.3}}>○</span>}
                {step.label}{!step.required && " (frivillig)"}
                {s.done && s.date && <span style={{ fontSize: 9, color: "#9CA3AF" }}>{s.date}</span>}
              </button>
            );
          })}
        </div>
        {isApproved && <div style={{ marginTop: 4, fontSize: 10, color: "#166534", fontWeight: 600 }}>✅ Kortet är godkänt och säkert att använda</div>}
      </div>
      {/* Info Gathering */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Informationsinsamling</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {INFO_METHODS.map(m => (
            <button key={m.key} onClick={() => toggleInfo(m.key)}
              style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10, cursor: "pointer",
                border: info[m.key] ? "1px solid #4285F4" : "1px solid #E5E7EB",
                background: info[m.key] ? "#E8F0FE" : "#fff",
                color: info[m.key] ? "#1A56DB" : "#6B7280", fontWeight: info[m.key] ? 600 : 400,
              }}>
              {info[m.key] ? "✓ " : ""}{m.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#6B7280" }}>Annat:</span>
          <input value={info.other || ""} onChange={e => updateOv("infoGathering.other", e.target.value)}
            style={{ border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", fontSize: 10, flex: 1 }}
            placeholder="Fritext..." />
        </div>
      </div>
      {/* Maturity */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Mognadsgrad</div>
        <div style={{ display: "flex", gap: 2 }}>
          {MATURITY_LEVELS.map(m => (
            <button key={m.value} onClick={() => updateOv("maturity", maturity === m.value ? null : m.value)}
              title={m.desc}
              style={{ flex: 1, padding: "6px 2px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", textAlign: "center",
                border: maturity === m.value ? "2px solid " + m.color : "1px solid #E5E7EB",
                background: maturity === m.value ? m.color + "18" : "#fff",
                color: maturity === m.value ? m.color : "#9CA3AF",
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {/* Jurisdictions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Jurisdiktioner / regelverk</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {JURISDICTIONS.map(j => (
            <button key={j} onClick={() => toggleJuris(j)}
              style={{ padding: "3px 8px", borderRadius: 12, fontSize: 9.5, cursor: "pointer",
                border: jurisdictions.includes(j) ? "1px solid #DC2626" : "1px solid #E5E7EB",
                background: jurisdictions.includes(j) ? "#FEF2F2" : "#fff",
                color: jurisdictions.includes(j) ? "#991B1B" : "#6B7280",
                fontWeight: jurisdictions.includes(j) ? 600 : 400,
              }}>
              {j}
            </button>
          ))}
        </div>
        <input value={override.jurisdictionOther || ""} onChange={e => updateOv("jurisdictionOther", e.target.value)}
          style={{ marginTop: 4, border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", fontSize: 10, width: "100%" }}
          placeholder="Övrigt regelverk..." />
      </div>
      {/* Sources */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Källor</div>
        {(override.sources || []).map((src, i) => (
          <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3, alignItems: "center" }}>
            <span style={{fontSize:10,color:"#9CA3AF"}}>🔗</span>
            <input value={src.label || ""} onChange={e => { const s = [...(override.sources||[])]; s[i] = {...s[i], label: e.target.value}; updateOv("sources", s); }}
              style={{ border: "1px solid #E5E7EB", borderRadius: 4, padding: "2px 6px", fontSize: 10, width: 100 }} placeholder="Etikett" />
            <input value={src.url || ""} onChange={e => { const s = [...(override.sources||[])]; s[i] = {...s[i], url: e.target.value}; updateOv("sources", s); }}
              style={{ border: "1px solid #E5E7EB", borderRadius: 4, padding: "2px 6px", fontSize: 10, flex: 1 }} placeholder="https://..." />
            <button onClick={() => { const s = (override.sources||[]).filter((_,j) => j !== i); updateOv("sources", s); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#DC2626", fontSize: 12 }}>×</button>
          </div>
        ))}
        <button onClick={() => updateOv("sources", [...(override.sources||[]), { label: "", url: "" }])}
          style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>
          + Lägg till källa
        </button>
      </div>
    </div>
  );
}
/* ─────────── FIELD EDITOR ─────────── */
function EditableField({ label, field, item, override, setOverride, autoSave }) {
  const [editing, setEditing] = useState(false);
  const origVal = item[field] || "";
  const hasOverride = override.fields && override.fields[field] !== undefined;
  const displayVal = hasOverride ? override.fields[field] : origVal;
  const save = (val) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    // Save current to history before overwriting
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (hasOverride) {
      next.fieldHistory[field].push(next.fields[field]);
    } else {
      next.fieldHistory[field].push(origVal);
    }
    // Keep max 10 history entries
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = val;
    setOverride(next);
    setEditing(false);
    if (autoSave) autoSave(next);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    // Move current override to history
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(next.fields[field]);
    delete next.fields[field];
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  if (editing) {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{label}</div>
        <textarea defaultValue={displayVal} rows={3} style={{ width: "100%", border: "1px solid #4285F4", borderRadius: 6, padding: "6px 8px", fontSize: 11, resize: "vertical", fontFamily: "inherit" }}
          onBlur={e => save(e.target.value)} autoFocus />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 6, position: "relative", group: true }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{label}</span>
        {hasOverride && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#9CA3AF" }} title="Redigera">
          <span style={{fontSize:10}}>✏️</span>
        </button>
        {hasOverride && (
          <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#F59E0B" }} title="Återställ till original (sparar redigering i historik)">
            <span style={{fontSize:10}}>↩</span>
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{displayVal || <span style={{ color: "#CBD5E1", fontStyle: "italic" }}>Ej ifyllt</span>}</div>
    </div>
  );
}
/* ─────────── SCORE ARRAY EDITOR (AI/KCHD) ─────────── */
function ScoreArrayEditor({ label, field, item, override, setOverride, autoSave }) {
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateItem = (idx, key, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx][key] = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{label}</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((dim, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280", minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dim.name}</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3].map(s => (
                  <button key={s} onClick={() => updateItem(idx, "score", s)}
                    style={{ width: 24, height: 24, borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: dim.score === s ? "2px solid #4285F4" : "1px solid #E5E7EB",
                      background: dim.score === s ? (s === 3 ? "#D1FAE5" : s === 2 ? "#FEF3C7" : "#F3F4F6") : "#fff",
                      color: dim.score === s ? (s === 3 ? "#065F46" : s === 2 ? "#92400E" : "#6B7280") : "#9CA3AF",
                    }}>{s}</button>
                ))}
              </div>
              <input value={dim.comment || ""} onChange={e => updateItem(idx, "comment", e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "3px 6px", fontSize: 10, fontFamily: "inherit" }}
                placeholder="Kommentar..." />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ─────────── NYTTA EDITOR ─────────── */
function NyttaEditor({ item, override, setOverride, autoSave }) {
  const field = "nytta";
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateItem = (idx, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx].text = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Nyttodimensioner</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((ny, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#4285F4", minWidth: 70, paddingTop: 4, textTransform: "uppercase" }}>{ny.level}</span>
              <textarea value={ny.text || ""} onChange={e => updateItem(idx, e.target.value)} rows={2}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "4px 6px", fontSize: 10, fontFamily: "inherit", resize: "vertical" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ─────────── TAGS EDITOR ─────────── */
function TagsEditor({ item, override, setOverride, autoSave }) {
  const field = "tags";
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateTag = (idx, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx].values = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Taggar</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((tag, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280", minWidth: 100, fontWeight: 600 }}>{tag.category}</span>
              <input value={tag.values || ""} onChange={e => updateTag(idx, e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "3px 6px", fontSize: 10, fontFamily: "inherit" }}
                placeholder="Kommaseparerade värden..." />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const DEEPDIVE_FIELDS = [
  { key: "formaga", label: "Datarelaterad förmåga som adresseras", type: "checktext",
    options: ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"] },
  { key: "doman", label: "Datadomän / verksamhetsdata", type: "text" },
  { key: "frekvens", label: "Dataegenskaper: realtid/frekvens", type: "select", options: ["Ej specificerat", "Batch (dagligen/veckovis)", "Near real-time (minuter/timmar)", "Real-time (kontinuerligt)"] },
  { key: "datatyp", label: "Dataegenskaper: datatyp/format", type: "text" },
  { key: "datamangd", label: "Dataegenskaper: datamängd/omfattning", type: "text" },
  { key: "kallsystem", label: "Datakällor: källsystem", type: "text" },
  { key: "iot", label: "Datakällor: IoT/sensordata", type: "text" },
  { key: "standarder", label: "Standarder och modeller", type: "text" },
  { key: "kvalitet", label: "Dataförberedelser och kvalitet", type: "text" },
];
const DEEPDIVE_DEFAULTS = {"5": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data governance (styrning, säkerhet, integritet)", "Data management (sammanhållen data, semantik)", "Externa krav (EHDS, NDI)"], "formaga_text": "Kärnfunktion: realtids titthål över vårdgivargränser. Stark governance via Samtyckestjänsten, Spärrtjänsten, Loggtjänsten. FHIR-adapter för EHDS planeras ~2029. Adresserar INTE analys/AI.", "doman": "14 kliniska informationskategorier: vårdkontakter, anteckningar, diagnoser, funktionstillstånd, vårdplan, läkemedel (inkl NLL), provsvar, remisser, bilddiagnostik-remisser, mödravård, uppmärksamhetsinformation, vaccinationer, tillväxtkurva barn.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Strukturerad XML (SOAP/WSDL/XSD via RIV-TA Basic Profile 2.1) + ostrukturerad fritext i kliniska anteckningar. Kodad data: ICD-10-SE, KVÅ, ATC, SNOMED CT, NPU. Mutual TLS med SITHS funktionscertifikat.", "datamangd": "NTjP: ~516 miljoner anrop/månad (okt 2024, +40% YoY). NPÖ-sökningar +15% YoY. Alla 21 regioner anslutna som producenter och konsumenter. Potentiellt ~10,5 miljoner invånare.", "kallsystem": "Cambio COSMIC (17 regioner), Oracle Health Millennium (VGR, Skåne), CGM TakeCare (Stockholm). Kommunala system: Procapita, Treserva, Magna Cura, Viva via agenter. E-hälsomyndigheten (NLL). Svevac (vaccination).", "iot": "Ingen IoT/sensordata. Strikt EHR-journaldokumentation. Närmast mätdata: tillväxtkurvor (manuellt dokumenterade).", "standarder": "RIV-TA Basic Profile 2.1 (SOAP/XML). HSA (organisationsidentitet). SITHS (autentisering, eIDAS substantial). ICD-10-SE, KVÅ, ATC, SNOMED CT, NPU. T2-referensarkitektur (2023). FHIR PoC genomförd men ej i produktion.", "kvalitet": "Ingen central ETL — data hämtas on-demand från källsystem. Kvalitetssäkring via: Verifiering av Tjänsteproducent (teknisk testning per källsystem × tjänstekontrakt), Etablering av samverkan (end-to-end-test). Datakvalitetsansvar hos respektive vårdgivare. Klassificerad som NMI (Nationellt Medicinskt Informationssystem)."}, "11": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Externa krav (EHDS, NDI)"], "formaga_text": "Stark beräkningskraft via NAISS (Bianca, Berzelius, Dardel). 144+ nf-core pipelines. SciLifeLab Data Centre som centralt nav. FEGA Sweden för GDPR-kompatibel genomikdelning. GA4GH-standarder (Beacon v2, htsget).", "doman": "Genomik (WGS, WES, scRNA-seq), transkriptomik (spatial via Visium), proteomik (MS + Olink), metabolomik, kryo-EM, medicinsk bilddata (via AIDA), klinisk data (kvalitetsregister, biobanker med >150M prover), epidemiologisk övervakning (avloppsvatten-monitorering).", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "FASTQ/BAM/VCF (genomik), TIFF/OME-TIFF (mikroskopi), DICOM (medicinsk bild), mzML/mzXML (proteomik), HDF5/H5AD (single-cell), CSV/TSV (tabulär). Nextflow-pipelines med Docker/Singularity-containers.", "datamangd": "Multi-petabyte-skala. UPPMAX >7 PB lagringskapacitet. Bianca: 4 480 kärnor, 204 noder (128 GB), 10 GPU-noder (NVIDIA A100). Per WGS-prov: ~100–200 GB rå FASTQ, expanderar 5–10× vid analys. Biobank Sverige: >150M prover. NGI SNP&SEQ: Swedac ISO 17025-ackrediterat.", "kallsystem": "10 SciLifeLab-plattformar (Genomics/NGI, Clinical Genomics, NBIS, Proteomics m.fl.). 4 DDLS Data Science Nodes. NAISS: Bianca, Rackham, Dardel, Berzelius, Alvis. GMS 7 regionala centra. Internationella: EGA, ENA, PRIDE, UniProt.", "iot": "Sekvensinstrument: Illumina NovaSeq X Plus, PacBio HiFi, Oxford Nanopore. Masspektrometrar: Orbitrap, LC-MS/MS. Kryo-EM vid 5 sites. NMR-spektrometrar. Avloppsvattenmätning för patogenövervakning.", "standarder": "FAIR-principer (grundläggande). GA4GH: Beacon v2, Phenopackets, htsget, DUO. ISO/IEC 17025 (NGI SNP&SEQ). nf-core pipelines (144+). ELIXIR RDMkit. GDPR. Data Stewardship Wizard (DMP). FEGA Sweden.", "kvalitet": "FastQC (rå-QC), MultiQC (aggregering), CheckQC (automatiserad Illumina-runfolder-QC). Cutadapt (adapter-trimming). nf-core-pipelines med inbyggd QC i varje steg. DMP:er obligatoriska. NBIS erbjuder kostnadsfri datahanteringskonsultation. Data lagras minst 10 år. End-to-end-kryptering via DDS."}, "20": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data governance (styrning, säkerhet, integritet)", "Data management (sammanhållen data, semantik)", "Externa krav (EHDS, NDI)"], "formaga_text": "DSP (Data Science Platform, mars 2025) med DGX-2 och Verdi-system för GPU-beräkning. DOI-baserad publicering till 41+ länder. AIDA Data Sharing Policy (publicerad i Nature Scientific Data). REMS för digital åtkomsthantering. Deltar i EUCAIM, Bigpicture, GDI.", "doman": "Medicinsk bilddiagnostik: radiologi (CT, MRI, röntgen, mammografi, CTPA, MR-Linac), patologi (helglasbilder/WSI med H&E och immunhistokemi), dermatologi. Anatomiska domäner: bröst, kolon, lever, ovarium, skelett, thorax, prostata, hjärna. SCAPIS kardiopulmonell CT från 6 universitetssjukhus.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "DICOM (radiologi), Hamamatsu NDP-format (patologi-WSI, 20×–40× förstoring). Annotationer: segmenteringsmasker, bounding boxes, klassificeringsetiketter, SNOMED-CT-kopplade ontologitermer. Totalt ~1,05 miljoner annotationer över 52 dataset.", "datamangd": "52 dataset (50 reella + 2 syntetiska), 56,95 TB reell data + 124 GB syntetisk. 154 917 reella skanningar + 106 448 syntetiska. DSP Verdi: 3,2 PB HDD + 153 TB SSD. DGX-2: 15× NVIDIA Tesla V100, 1,5 TB RAM. Operativt sedan oktober 2018. 200+ externa datadelningshändelser till 41+ länder.", "kallsystem": "Sjukhus-PACS (retrospektiv extraktion). Region Östergötland (primär datakälla, avtal 2025). 6 SCAPIS-sjukhussites. AIDA-egen molnbaserad PACS. Skannertyper: Hamamatsu NanoZoomer (XR, 2.0 HT, XRL), Aperio/Leica Scanscope. ~50 AIDA-partners (akademi, industri, vård).", "iot": "Patologiskannrar (Hamamatsu NanoZoomer-serien), CT-skannrar, MRI (inkl MR-Linac), röntgen/CR-system, mammografienheter. All data extraheras retrospektivt — inga realtidsflöden. Federerat lärande utforskas via MAIA-plattformen.", "standarder": "DICOM (primär bildstandard). FAIR-principer. DOI via DataCite (doi:10.23698/aida/[id]). SNOMED-CT (tumörmorfologi, organkodning). AO/OTA (frakturklassificering). AIDA-licenssystem (BY, standard, kontrollerad). GDPR-anonymisering enligt egen publicerad policy.", "kvalitet": "DICOM-anonymisering: automatiserade verktyg + iterativ manuell granskning, 1 av 100 undersökningar fullständigt manuellt granskade. Ansiktssuddighetalgoritmer (CT-skallar). Anonymisering sker vid kliniken före överföring. Dubbelgranskad annotation (en läkare annoterar, en kontrollerar). SNOMED-CT-kopplad ontologi. Stadler et al. (2020): 8 vägledande principer för databasuppbyggnad."}, "1": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "GMS samordnar genomisk diagnostik nationellt. Central datainfrastruktur under utveckling med BDC beräkningskluster. Stark governance via avtal mellan 7 universitetssjukvårdsregioner. EHDS-genomik är prioriterad datakategori.", "doman": "Klinisk genomik: helgenomsekvensering (WGS), helexomsekvensering (WES), genpaneler, somatisk tumörgenomik. Sjukdomsdomäner: sällsynta sjukdomar, cancer (solida och hematologiska), farmakogenomik. Tillhörande klinisk data: diagnoskoder, behandlingsdata, familjehistorik.", "frekvens": "Near real-time (minuter/timmar)", "datatyp": "FASTQ (råsekvens), BAM/CRAM (alignment), VCF/gVCF (varianter), BED (regioner). Kliniska rapporter i PDF + strukturerat format. Phenopackets (GA4GH) för fenotypdata. Scout-systemet (Clinical Genomics, SciLifeLab) för variantanalys.", "datamangd": "~120 MSEK regionavtal. 7 regionala genomikcentra. BDC: 6 beräkningsnoder + 1,3 PB lagring. Ca 5 000-10 000 kliniska WGS-analyser/år (uppskattning 2025). Mål: all klinisk genetik via WGS inom 5 år.", "kallsystem": "Illumina NovaSeq 6000/X Plus (sekvensering), Scout/Chanjo (variantanalys SciLifeLab Clinical Genomics), LIMS-system per centrum, Cytogenomics/CytoSure (strukturella varianter), regionala journalsystem för klinisk data.", "iot": "Sekvensinstrument: Illumina NovaSeq X Plus, NovaSeq 6000, MiSeq. Arraychip: Infinium Global Screening Array. Under utvärdering: Oxford Nanopore för snabb diagnostik.", "standarder": "GA4GH: Beacon v2, Phenopackets v2, htsget, DUO (Data Use Ontology). HGNC gennomenklatur. ACMG/AMP variantklassificering. VCF v4.3. FHIR Genomics IG (under pilotering). ICD-10-SE + Orphanet-koder för sällsynta sjukdomar.", "kvalitet": "Clinical Genomics pipeline (nf-core MIP) med inbyggd QC per steg. Sanger-verifiering av patogena varianter. Coverage-krav: >30× mediandjup för WGS, >99% av gener >20×. Internt kalibreringsprogram med NA12878-referens. Swedac-ackreditering eftersträvas."}, "2": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "100+ register med varierande datamodeller. Stark governance via PDL kap 7 (opt-out). Registercentrum (QRC, UCR, RCC) förvaltar data. NKRR hanterar forskarutlämning. Konsolidering 17→7 plattformar pågår under NAG kvalitetsregister.", "doman": "Alla kliniska domäner: hjärt-kärl (SWEDEHEART, RiksSvikt), cancer (alla cancerformer via RCC), ortopedi (Svenska Höftprotesregistret, Knäprotesregistret), diabetes (NDR), stroke (Riksstroke), psykiatri (PsykiatrIN), demens (SveDem), reumatologi (SRQ), m.fl. >100 register.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Strukturerade variabler per register (variabellistor publicerade). Formats: proprietära per plattform (INCA, RC-plattformen, LifeReg, Stratum m.fl.), CSV/XML vid utlämning. ICD-10-SE, KVÅ, ATC-koder integrerade. Registervariabelbiblioteket (RUT/Dataguiden) dokumenterar tillgängliga variabler.", "datamangd": "100+ register, uppskattningsvis 50-80 miljoner registreringar totalt. SWEDEHEART: >750 000 patienter. NDR: >600 000 patienter. Cancerregistret: ~80 000 nya fall/år. 178 MSEK statlig årlig finansiering + regionernas egenfinansiering.", "kallsystem": "Journalsystem (COSMIC, Millennium, TakeCare) → manuell + halvautomatisk registrering → registerplattformar (INCA, RC-plattformen, LifeReg, Stratum, UCR-plattformen m.fl.). NKRR/IUTKR för forskarutlämning.", "iot": "Inget direkt IoT. Data härrör från manuell klinisk registrering. Pågående arbete med automatiserad överföring från journalsystem (\"registrera en gång, återanvänd\").", "standarder": "ICD-10-SE, KVÅ, ATC, Snomed CT (varierande per register). Registerspecifika variabellistor. PDL kap 7 (juridisk grund). Registerförordningar (2001:707 m.fl.). NKRR:s utlämningsprocess.", "kvalitet": "Validering vid inmatning (plattformsspecifik). Täckningsgrad varierar (50-99% beroende på register). Bortfallsanalyser i årsrapporter. Registercentrum utför datakvalitetsgranskningar. Extern revision av Vård- och omsorgsanalys."}, "3": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "Regionernas egna system genererar den primärdata som alla andra initiativ bygger på. Stor heterogenitet: 3 huvudjournalsystem, olika datalager, olika AI-mognad. SUSSA (9 COSMIC-regioner) och Millennium-blocket (VGR, Skåne) är de två stora grupperna.", "doman": "All klinisk verksamhet: primärvård, specialistvård (somatisk + psykiatrisk), akut, operation, intensivvård, kommunal hälso- och sjukvård. Lab, röntgen, patologi. Administrativa system: väntetider, ekonomi, personal.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Journaldata (fritext + strukturerad), labbresultat (numeriska + kodade), bilddiagnostik (DICOM), operationsdata, läkemedelsordinationer (ATC), diagnoskoder (ICD-10-SE), åtgärdskoder (KVÅ). Varierande proprietära format per journalsystem.", "datamangd": "~10,5 miljoner invånare. 21 regioner. COSMIC: 17 regioner (~6M invånare). Millennium: 2 regioner (VGR + Skåne, ~3M). TakeCare: Stockholm (~2,4M). Hundratals terabyte klinisk data totalt.", "kallsystem": "Cambio COSMIC (17 reg.), Oracle Health Millennium (VGR, Skåne), CompuGroup TakeCare (Stockholm). Lab: Flexlab, SoftLab, Klinisk kemi-system. Bild: Sectra PACS, GE PACS. Operation: Orbit, MetaVision. Intensivvård: PDMS (Clinisoft, MetaVision).", "iot": "Patientövervakning: monitorering (SpO2, EKG, blodtryck). Infusionspumpar. Ventilatorer (data sällan strukturerat extraherad). Hemmonitorering (pilot i vissa regioner). CGM (kontinuerlig blodsockermätning) i diabetesvård.", "standarder": "ICD-10-SE (diagnoser), KVÅ (åtgärder), ATC (läkemedel), Snomed CT (varierande), DICOM (bild), HL7 v2 (lab), RIV-TA (NTjP-integration). Varje region har egen informationsarkitektur.", "kvalitet": "Varierande per region. Kodningskvalitet (ICD-10) granskad av Socialstyrelsen. Datalager med ETL-processer (varierande kvalitet). Ingen nationell standard för datakvalitetsmätning. SUSSA har viss gemensam modell."}, "4": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "1177 är invånarens primära digitala ingång till vården. Ny version under utveckling med moderniserad arkitektur. Kan bli MyHealth@EU primary use access point. Integrerar med NPÖ för journalåtkomst.", "doman": "Invånartjänster: hälsoråd/triagering (1177 Vårdguiden), journalåtkomst (via NPÖ), tidbokning, receptförnyelse, e-tjänster per region, säkra meddelanden till vårdgivare, vaccinationsbokningar, provsvarsvisning.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Webbinnehåll (HTML/JSON), invånarinteraktionsdata, ärendedata (meddelanden, bokningar), journalvisning (hämtas via NPÖ/NTjP i SOAP/XML). Ny arkitektur: REST/JSON, mikrotjänster.", "datamangd": "~10,5 miljoner potentiella användare (alla invånare). Hundratals miljoner sidvisningar/år. E-tjänster: varierar per region (40-200 per region). 1177 Vårdguiden: ~200 miljoner besök/år.", "kallsystem": "NPÖ (via NTjP, journaldata), regionala tidbokningstjänster, regionala e-tjänsteplattformar, 1177 Vårdguiden (innehållsplattform Episerver/Optimizely). SITHS/BankID för autentisering.", "iot": "Inget direkt IoT. Potentiellt i framtiden: hemmonitoreringsdata visad via 1177, egenmätta hälsovärden (blodtryck, vikt, blodsockernivåer) — pilotprojekt i vissa regioner.", "standarder": "RIV-TA (NTjP-integration), SAML/OIDC (autentisering), SITHS, BankID, HSA (organisationskatalog). WCAG 2.1 AA (tillgänglighet). Ny arkitektur: FHIR R4 planeras.", "kvalitet": "Tillgänglighetsgranskningar (WCAG). SLA för uppetid (99,9%). Innehållsgranskningsprocess för medicinsk information (1177 Vårdguiden). Användartester och nöjdhetsmätningar."}, "6": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "INCA är den centrala IT-plattformen för cancerregistrering i Sverige. IPÖ ger realtidsöversikt i patientmötet. Stark governance via RCC i samverkan. Cancerdata prioriterad under EHDS.", "doman": "Alla cancerformer: diagnos, stadieindelning (TNM), behandling (kirurgi, cytostatika, strålning, immunterapi), uppföljning, överlevnad. IPÖ: PROM/PREM-data (patientrapporterade utfall). ~25 cancerspecifika kvalitetsregister.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Strukturerade registervariablar per cancerform. ICD-10-SE (diagnos), ICD-O-3 (tumörmorfologi/-topografi), TNM-klassifikation, KVÅ (åtgärder), ATC (läkemedel). IPÖ: patientrapporterade PROM-formulär. Webbaserade inmatningsformulär.", "datamangd": "Cancerregistret: ~80 000 nya maligna tumörer/år. Sedan 1958. ~25 diagnosspecifika register. IPÖ: implementerat för 15+ diagnoser, >100 000 registreringar/år. Driftas av Sogeti. Regional lagring i INCA-plattformen.", "kallsystem": "Manuell inmatning via INCA-webbformulär. Journalsystem (COSMIC, Millennium, TakeCare) som källa — men begränsad automatisk överföring. Patologisystem (för morfologikoder). Strålbehandlingssystem.", "iot": "Inget direkt IoT. Cancerbehandlingsapparater (linjäracceleratorer, PET-CT) genererar data men den överförs manuellt till registren.", "standarder": "ICD-10-SE, ICD-O-3 (topografi+morfologi), TNM 8th edition, KVÅ, ATC. INCA eget API för datautlämning. RCC:s variabellistor. Snomed CT (begränsat). ENCR (European Network of Cancer Registries) jämförelsestandard.", "kvalitet": "Täckningsgrad >96% (Cancerregistret, Socialstyrelsen granskar). Valideringsregler vid inmatning. Årliga datakvalitetsrapporter per register. Regionala onkologicentra granskar lokalt. Eftersläpning i registrering (6-12 mån) problematiskt."}, "7": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "SUSSA-samverkan ger 9 COSMIC-regioner gemensam datamodell för datalager. Stark källa för sekundäranvändning. Direktåtkomst till klinisk data utan manuell registrering. Viktig partner för vårddatahubb.", "doman": "All klinisk data i COSMIC: vårdkontakter (öppen/sluten), diagnoser, åtgärder, läkemedel, lab, remisser, vårddokumentation. Administrativa data: väntetider, resursutnyttjande, beläggning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "SQL-baserat datalager med COSMIC-datamodell. ICD-10-SE, KVÅ, ATC standardkodning. Cambio COSMIC XML-exportformat. CSV/Excel vid manuella uttag. COSMIC Intelligence (BI-verktyg) för rapporter.", "datamangd": "9 regioner: Dalarna, Gävleborg, Uppsala, Sörmland, Västmanland, Värmland, Norrbotten, Västerbotten, Jämtland-Härjedalen. Ca 2,2 miljoner invånare. Flera terabyte datalager per region.", "kallsystem": "Cambio COSMIC (kärnsystem). COSMIC datalager (DW). COSMIC Intelligence (BI). Labsystem integrerade via HL7. Röntgensvar via RIS/PACS-koppling.", "iot": "Inget direkt IoT kopplat till SUSSA-datalager. Monitoreringsdata från intensivvård kan finnas i COSMIC men extraheras sällan systematiskt.", "standarder": "COSMIC-datamodell (proprietär men dokumenterad). ICD-10-SE, KVÅ, ATC, NPU (labbkoder). SQL-baserade extrakt. Gemensam SUSSA-datamodell under utveckling.", "kvalitet": "ETL-processer per region (varierande kvalitet). Gemensam variabeldefinition inom SUSSA. Kodningsgranskning i regionala kodningsgrupper. Cambio levererar DW-schema med dokumentation."}, "8": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"], "formaga_text": "KCHD är navet för regiongemensam hälsodatastrategi. NSG Hälsodata fattar strategiska beslut, DiN (Digitaliseringsnätverket) styr IT-direktörernas prioriteringar. 5 subprojekt 2026: Datamodell, Mappningsmotor, Beräkning Väntetider/PAR, FHIR API, Demo-miljö.", "doman": "Sekundäranvändning av all regional hälsodata: väntetidsdata (0-3-90-90 vårdgarantin), PAR-SV/PAR-OV (patientregistret), kvalitetsregisterdata, standardiserade variabler. Metanivå: datastyrning, kompetens, regelverk.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Mappningsspecifikationer (JSON/YAML), FHIR R4-resurser, openEHR-arketyper, OMOP CDM-mappningar, Socialstyrelsens flatfiler (PAR-format). Docker-containers med transformationslogik. Git-baserad versionshantering.", "datamangd": "Potentiellt alla 21 regioners data. POC-fas med 5 pilotdataflöden. DG REFORM-finansierat konsultuppdrag (1 år). Målbild: nationell hub som processar alla regioners rapporteringsflöden.", "kallsystem": "Regionala journalsystem (COSMIC, Millennium, TakeCare) → regionala datalager → KCHD hub-relay. Socialstyrelsens specifikationer (PAR-SV, PAR-OV). Pilot med Region 22 demomiljö (FastAPI, MinIO, EHRbase).", "iot": "Inget direkt IoT. Hub-konceptet hanterar strukturerad data, inte realtidssensordata.", "standarder": "FHIR R4 (HL7 Sweden basprofiler), openEHR (arketyper via CKM), OMOP CDM v5.4 (via OMOP4Sweden), Socialstyrelsens variabelspecifikationer, RIV-TA (bakåtkompatibilitet). GitOps-baserad distribution.", "kvalitet": "DQ0-DQ6 kvalitetskontroller i POC-pipelinen (Tier 1-9 transformationer). Ifyllnadsgrad (fill rate) som primärt kvalitetsmått. Automatiserad validering mot Socialstyrelsens specifikationer. CHECKLIST.md och SPRINT_LOG.md för utvecklingskontroll."}, "9": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "NDI är Sveriges huvudsakliga EHDS-implementeringsinitiativ. E-hälsomyndigheten bygger teknisk infrastruktur medan samordnare Mats Nilsson utreder policy. Fyra delrapporter levererade, slutrapport april 2026.", "doman": "All hälsodata för primär- och sekundäranvändning: EHR, läkemedel, labb, bilddiagnostik, utskrivning, genomik (i linje med EHDS 14 datakategorier). Målbild: nationell plattform som knyter samman alla datakällor.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Under specifikation. Förväntat: FHIR R4 (EEHRxF-format), HL7 CDA (MyHealth@EU-kompatibilitet), OMOP CDM (sekundäranvändning). API-baserad arkitektur.", "datamangd": "Nationell skala: 10,5 miljoner invånare, alla vårdgivare. Slutrapport 1 april 2026 ska specificera scope och dimensionering.", "kallsystem": "Alla befintliga system: journalsystem, NTjP, NPÖ, 1177, NLL, Socialstyrelsen, SCB. Målbild: nationell orkestreringsplattform.", "iot": "Inte i initialfas. Framtida: hemmonitorering, wearables, medicinteknisk utrustning kan inkluderas.", "standarder": "EHDS (EU 2025/327), EEHRxF (European EHR Exchange Format), FHIR R4, HL7 CDA, SNOMED CT, ICD-10-SE (→ICD-11), LOINC (labb). EIRA (European Interoperability Reference Architecture).", "kvalitet": "Under specifikation. Förväntas inkludera: datakvalitetskrav per datakategori, certifieringsprocess för anslutna system, kontinuerlig kvalitetsmonitorering."}, "10": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "Ena är sektorsövergripande digital infrastruktur. Hälsodata är en tillämpningsdomän men inte huvudfokus. Byggblock: SDK, digital post, auktorisering, API-hantering. Begränsad direkt hälsodatarelevans men viktiga grundkomponenter.", "doman": "Förvaltningsgemensam: alla offentliga sektorer. Hälsodatarelevanta byggblock: SDK (Säker digital kommunikation), auktorisering (behörighetsstyrning), API-hantering, digital post (för invånarkommunikation).", "frekvens": "Real-time (kontinuerligt)", "datatyp": "API-standarder (REST/JSON), meddelandeformat (SDK), identitetsdata (Sweden Connect), adressdata, organisationsdata. Inte hälsodata per se utan infrastrukturkomponenter.", "datamangd": "Hela offentlig sektor: ~500 myndigheter, 290 kommuner, 21 regioner. Ca 55 MSEK budget (2024). Ej hälsodataspecifikt.", "kallsystem": "DIGG:s egna byggblock. Sweden Connect (eIDAS). Skatteverkets folkbokföring. Bolagsverkets företagsregister. Lantmäteriets geodata.", "iot": "Inte tillämpligt.", "standarder": "OASIS (SDK-protokoll), OAuth 2.0/OIDC (autentisering), REST/JSON (API-design), eIDAS 2.0, EIRA (arkitekturramverk). W3C Verifiable Credentials (under utvärdering).", "kvalitet": "DIGG:s kvalitetskrav per byggblock. SLA-avtal. Certifieringsprocess för anslutna myndigheter."}, "12": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "SENASH förbereder HDAB-funktioner: metadatakatalog och databeställningssystem kopplat till EHDS. EU4Health + VR-finansiering. Samverkan mellan 4 HBAD-myndigheter. Knyter samman RUT/Dataguiden med EHDS-krav.", "doman": "Registerdata hos HBAD-myndigheter: Socialstyrelsens hälsodataregister, SCB:s registerdata, Folkhälsomyndighetens smittskyddsdata, Läkemedelsverkets data. Metadatanivå: variabelbeskrivningar, kvalitetsindikatorer, åtkomstregler.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Metadata (DCAT-AP, GSIM-modellen), databeställningsformulär, regelverksspecifikationer. Registerdata: flatfiler, SAS-format, CSV. Under utveckling: EHDS-kompatibla metadataformat.", "datamangd": "Alla nationella hälsodataregister (Socialstyrelsen 6 register + kvalitetsregister). SCB:s 100+ statistikregister. Ca 28 MSEK total projektbudget (60% EU, 40% nationellt).", "kallsystem": "Socialstyrelsens register, SCB:s register, FoHM:s SmiNet/NVR, Läkemedelsverkets register. RUT/Dataguiden (metadata). MONA (SCB:s analysplattform).", "iot": "Inte tillämpligt.", "standarder": "DCAT-AP (metadatakatalog), GSIM (statistisk informationsmodell), EHDS-metadataformat (under utveckling), HealthData@EU-noden. ISO 11179 (metadata registry).", "kvalitet": "Metadatakvalitetskrav enligt EHDS art. 55-56. Kvalitetsindikatorer per dataset. Harmonisering av variabelbeskrivningar mellan HBAD-myndigheter."}, "13": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "WASP är Sveriges största forskningsprogram (6,5 mdr SEK). Generellt AI-fokus, inte hälsodataspecifikt. WASP-HS adresserar samhällsaspekter. Spillover-effekt: AI-kompetens och metoder tillämpbara på hälsodata.", "doman": "AI generellt: maskininlärning, djupinlärning, autonoma system, mjukvara, AI-etik (WASP-HS). Hälsodatatillämpningar förekommer men är inte primärt fokus. Forskningsdomäner: robotik, naturlig språkbehandling, datorseende, optimering.", "frekvens": "Ej specificerat", "datatyp": "Forskningsdata i alla format: bilddata, textdata, sensordata, simuleringsdata. Beräkningsresurser: GPU-kluster, molnresurser.", "datamangd": "600+ forskare. 80+ doktorander. 5 universitet (LiU, KTH, Chalmers, Lund, Umeå). 6 500 MSEK totalbudget 2016-2030.", "kallsystem": "Universitetens egna beräkningsresurser. NAISS superdatorer (Berzelius, Alvis). Industripartners data (konfidentiellt).", "iot": "Sensorer och robotar i forskningsprojekt. Inte hälso-IoT specifikt.", "standarder": "Öppna forskningsstandarder. PyTorch, TensorFlow, JAX (ML-ramverk). FAIR-principer (forskning). Ej hälsodatastandarder.", "kvalitet": "Vetenskaplig peer review. Reproducerbarhet genom öppen kod. Ej hälsodataspecifik kvalitetssäkring."}, "14": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "NAISS tillhandahåller nationell beräkningsinfrastruktur. Bianca vid UPPMAX specifikt för känslig data (inkl. hälsodata). Arrhenius (EuroHPC), Berzelius (AI), Dardel (KTH) — alla tillgängliga för hälsodataforskning med rätt avtal.", "doman": "All beräkningsintensiv forskning: genomik/bioinformatik (största hälsodataanvändningen), proteinstruktur, epidemiologisk modellering, medicinsk bildanalys, NLP på klinisk text.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla beräkningsformat: FASTQ/BAM/VCF (genomik), DICOM (bild), HDF5 (maskininlärning), CSV/Parquet (tabulär), Singularity/Docker containers (pipelines).", "datamangd": "6 centra: C3SE (Chalmers), HPC2N (Umeå), LUNARC (Lund), NSC (Linköping), PDC (KTH), UPPMAX (Uppsala). Totalt >50 PB lagringskapacitet. 150 MSEK (2023, VR-basanslag).", "kallsystem": "Forskarnas egna data (uppladdade). Registerdata (via etikgodkännande). Sekvenseringsdata (från SciLifeLab, GMS). Internationell data (EGA, ENA).", "iot": "Ej direkt — beräknar data från IoT men tar inte emot realtidsströmmar.", "standarder": "SLURM (resurshantering), Singularity/Apptainer (containers), SUNET/Swamid (autentisering), Wharf (säker filöverföring till Bianca). ISO 27001-inspirerad säkerhet.", "kvalitet": "SLA per system (99,5%+ uppetid). NAISS kompetenscentrum för support. SNIC/NAISS användarenkäter. Bianca: isolerade noder, inga nätverksanslutningar."}, "15": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "ASHA bygger säker analysmiljö för regionala hälsodata kopplad till NSC:s beräkningsinfrastruktur. Utvecklar federerade analysmetoder. Samverkan med AIDA Data Hub. Vinnova-finansierat.", "doman": "Regional hälsodata från Region Östergötland: journaldata, labbdata, bilddiagnostik. Fokus på federerad analys — beräkning sker vid datakällan utan central lagring.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Klinisk data i regionalt format (COSMIC-extrakt). ML-modeller (Python/R). Federerade analysprotokoll. DICOM (bilddata via AIDA-koppling).", "datamangd": "Region Östergötlands ~470 000 invånare. NSC:s beräkningsresurser. 30 MSEK Vinnova-finansiering (2023-2027).", "kallsystem": "COSMIC (Region Östergötland), CMIV (bilddata), SciLifeLab (genomikdata). NSC superdator för beräkning.", "iot": "MR-skannrar och CT (bilddata via CMIV). Inte realtids-IoT.", "standarder": "OMOP CDM (under pilotering), FHIR R4, DICOM. Federerat lärande: PySyft/Flower-ramverk (under utvärdering). GDPR-compliance by design.", "kvalitet": "Vinnovas projektuppföljning. Etikprövning obligatorisk. Datakvalitetskontroller vid extraktion."}, "16": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "MONA är SCB:s befintliga SPE (Secure Processing Environment). Forskare analyserar mikrodata via säker fjärråtkomst utan att data lämnar SCB. Utreds som nationell SPE inom EHDS.", "doman": "SCB:s registerdata: LISA (arbetsmarknad), folk- och bostadsräkningar, utbildningsregister. Kopplad till Socialstyrelsens hälsodataregister, Cancerregistret, Läkemedelsregistret via samkörning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "SAS-dataset, STATA-format, R-kompatibla data. Avidentifierade mikrodata med SCB som länknyckelinnehavare. Tabelluttag måste sekretessprövas före export.", "datamangd": "Hela Sveriges befolkning (~10,5M). 100+ statistikregister. Tusentals forskningsprojekt per år. Ca 2 000 aktiva MONA-användare.", "kallsystem": "SCB:s egna register (LISA, befolkningsregistret). Länkade register från Socialstyrelsen, Folkhälsomyndigheten, Läkemedelsverket, CSN, Försäkringskassan m.fl.", "iot": "Inte tillämpligt.", "standarder": "GSIM (metadata), GSBPM (statistisk process), SCB:s egna sekretesspolicyer. EHDS-kompatibilitet utreds (SPE-krav art. 50).", "kvalitet": "SCB:s kvalitetsramverk (European Statistics Code of Practice). Sekretesspröving av alla tabelluttag. Registervalidering och årlig kvalitetsdokumentation."}, "17": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "SAFOS är Försäkringskassans plattform för säker myndighetssamverkan. Virtuellt datacenter. Hälsodatarelevans begränsad till sjukskrivnings- och rehabiliteringsdata.", "doman": "Myndighetsintern samverkan: sjukskrivningsdata, rehabilitering, arbetsförmågebedömning. Koppling till Försäkringskassans handläggningsprocess. Samarbetsytor och mötestjänster.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Dokument (sjukintyg, utlåtanden), ärendedata, videokonferens, samarbetsdokument. Allt lagras i Försäkringskassans datacenter.", "datamangd": "Försäkringskassan + samverkande myndigheter. Exakt volym ej offentlig.", "kallsystem": "Webcert/Intygstjänster (sjukintyg), Försäkringskassans handläggningssystem, Arbetsförmedlingens system.", "iot": "Inte tillämpligt.", "standarder": "Försäkringskassans interna standarder. Webbaserat, plattformsoberoende. Svenska molntjänstkrav (ej utländska molntjänster).", "kvalitet": "Försäkringskassans säkerhetsklassade personal. Informationsklassning. Ej hälsodataspecifik kvalitetssäkring."}, "18": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "WCMM stärker molekylärmedicin vid svenska universitet. Rekryterar internationella forskare. Inte primärt hälsodatainfrastruktur utan forskningsprogram. Begränsad EHDS-relevans.", "doman": "Molekylärmedicin: single-cell-genomik, spatial transkriptomik, proteomik, metabolomik, kryo-EM. Translationell forskning: grundforskning → klinisk tillämpning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Experimentell data: single-cell RNA-seq (H5AD), spatial data (Visium), proteomikdata (mzML), kryo-EM (MRC/MRCS), mikroskopi (TIFF/OME-TIFF).", "datamangd": "1 000 MSEK Wallenberg-finansiering 2014-2028. 4 noder: LiU, Umeå, GU, Lund. 100+ rekryterade forskare.", "kallsystem": "SciLifeLab-plattformar (NGI, proteomikfaciliteter). Universitetens egna labbutrustning. BioImage Archive, EBI.", "iot": "Laboratorieinstrument: sekvenserare, masspektrometrar, kryo-EM-mikroskop. Inte klinisk IoT.", "standarder": "FAIR-principer, MINSEQE (sekvensering), MIAPE (proteomik). Bioinformatikstandarder (nf-core). Ej hälsodatastandarder.", "kvalitet": "Vetenskaplig peer review. Standardiserade bioinformatikpipelines. Kvalitetskontroller per experiment."}, "19": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "AI Sweden IDV kartlade 179 AI-initiativ inom hälso- och sjukvård i 21 regioner. Fokus: federerat lärande, syntetisk data, AI-mognadsbedömning. Avslutat 2025 — lärdomar informerar vidare arbete.", "doman": "AI-tillämpningar i vård: bilddiagnostik-AI, kliniskt beslutsstöd, prediktionsmodeller, NLP på journaltext, processautomation. Kartläggning av 179 initiativ i 21 regioner.", "frekvens": "Ej specificerat", "datatyp": "Kartläggningsdata (enkätresultat, intervjudata). Syntetiska dataset (prototyper). AI-modeller (Python/PyTorch/TensorFlow). Federerat lärande-prototyper.", "datamangd": "179 kartlagda AI-initiativ. 30 MSEK total projektbudget. Pilotprojekt med 4-5 regioner.", "kallsystem": "Regionernas journalsystem (via anonymiserade extrakt). AI Swedens GPU-resurser (Berzelius). HDC Region Halland (samarbetspartner).", "iot": "Inte direkt i kartläggningen. Kartlagda initiativ inkluderar medicinteknisk AI (t.ex. ECG-analys).", "standarder": "OHDSI/OMOP (diskuterat men ej implementerat). Federerat lärande-ramverk (Flower, PySyft). AI Swedens referensarkitektur. Ej hälsodatastandarder formellt.", "kvalitet": "Kartläggningsmetodik dokumenterad. AI-mognadsbedömningsverktyg. Projektets slutrapport publicerad."}, "21": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "EU-finansierat EHDS-förberedelseprojekt. KTH koordinerar. Piloterar metadatahantering och datadelning. Partners: Socialstyrelsen, SCB, E-hälsomyndigheten, VR.", "doman": "Metadatahantering för EHDS: datasetkatalogisering, åtkomstregler, kvalitetsindikatorer. Pilotering av EHDS-kompatibel datadelning mellan svenska aktörer.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Metadata (DCAT-AP), piloteringsdata från svenska register. EHDS-kompatibla format under utveckling.", "datamangd": "6 MEuro (EU Digital Europe Programme). Multinationellt konsortium. Svensk pilotering med begränsat dataset.", "kallsystem": "Socialstyrelsens register, SCB, E-hälsomyndigheten. HealthData@EU-testbädd.", "iot": "Inte tillämpligt.", "standarder": "EHDS (EU 2025/327), HealthData@EU-noden, DCAT-AP, FHIR R4. EHDS datakategorier (art. 33). Implementerande akter (under utveckling).", "kvalitet": "EU-projektrapportering. Piloteringsresultat utvärderas. EHDS-kravuppfyllnad mäts."}, "22": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"], "formaga_text": "Europeisk federerad plattform för cancerbilddata. DICOM-standard. Svenska noder (LiU, Umeå, VB, KI) bidrar. Kopplat till AIDA Data Hub. Cancer imaging prioriterad under EHDS.", "doman": "Cancerbilddiagnostik: CT, MRI, mammografi, patologi (WSI), PET-CT. Alla cancerformer. Annoterade dataset för AI-träning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "DICOM (radiologi), WSI-format (patologi: Hamamatsu NDP, Aperio SVS), NIfTI (hjärnbilder), segmenteringsmasker, annotationsdata. SNOMED CT-kodade lesioner.", "datamangd": "17 MEuro EU-budget. 80+ partners. 200 000+ bilder planerat. Svenska bidrag via AIDA Data Hub (52 dataset, 57 TB).", "kallsystem": "Sjukhus-PACS (retrospektiva extrakt), AIDA Data Hub, nationella cancerbildarkiv. Federerad åtkomst utan central lagring.", "iot": "CT-skannrar, MRI, PET-CT, patologiskannrar. Retrospektiv data — inte realtidsström.", "standarder": "DICOM, DICOMweb, FHIR ImagingStudy, SNOMED CT (annotationer). Federerad infrastruktur: EUCAIM Central Hub + nationella noder. FAIR-principer.", "kvalitet": "DICOM-anonymisering (ansiktssuddning, metadata-rensning). Annotationskvalitet: dubbelgranskad av radiologer. Dataset-DOI via DataCite."}, "23": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "EuroHPC petascale-superdator vid NSC/Linköping. Generell beräkningsresurs — inte hälsodataspecifik. Kan användas för storskalig hälsodataanalys med rätt avtal.", "doman": "All beräkningsintensiv forskning: klimatmodellering, materialvetenskap, genomik, AI-träning. Hälsodata möjligt men inte primärt.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla HPC-format. Parallella beräkningsjobb. GPU-acceleration tillgänglig.", "datamangd": "68,5 MEuro (EuroHPC JU + nationellt). Topprestanda: ~30 PFLOPS. Del av NAISS.", "kallsystem": "Forskarnas egna data. EuroHPC-åtkomst via PRACE/EuroHPC JU.", "iot": "Inte tillämpligt.", "standarder": "SLURM, MPI, OpenMP, CUDA. EuroHPC JU access policies.", "kvalitet": "NSC driftstandard. EuroHPC JU uppföljning."}, "24": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "EuroHPC AI Factory för storskalig AI-träning. GPU-rik infrastruktur. Inte hälsodataspecifik men kan användas. Koppling till Mimer-systemet vid NSC.", "doman": "Storskalig AI: stora språkmodeller (LLM), datorseende, generativ AI. Hälso-AI möjligt med rätt avtal och datasäkerhet.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "AI-träningsdata: bilder, text, tabulär, multimodal. GPU-optimerade format (TFRecord, WebDataset).", "datamangd": "60 MEuro (EuroHPC + nationellt). Tusentals GPU:er (NVIDIA H100-generation). 2024-2029.", "kallsystem": "Forskardata, öppna dataset, industripartners data.", "iot": "Inte tillämpligt.", "standarder": "PyTorch, JAX, DeepSpeed. NVIDIA CUDA/NCCL. EuroHPC JU regler. Ej hälsodatastandarder.", "kvalitet": "RISE:s kvalitetsramverk. EuroHPC benchmarks."}, "25": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "Europeisk infrastruktur för genomikdatadelning under 1+MG-deklarationen. GA4GH-standarder (Beacon, htsget). Svensk nod vid NBIS. Direkt EHDS-koppling: genomikdata specificerad.", "doman": "Genomikdata: referensgenom, klinisk genomik, populationsgenetik. Fenotypdata kopplad till genom. 27 EU-länder.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "VCF/gVCF (varianter), BAM/CRAM (alignment), Phenopackets (fenotyp), Beacon v2-svar (discovery). DUO (Data Use Ontology) för åtkomstregler.", "datamangd": "40 MEuro (EU Digital Europe). 32 MSEK till svensk nod (NBIS). Mål: 1+ miljoner genom tillgängliga via federerad infrastruktur.", "kallsystem": "Nationella genomikcentra (GMS i Sverige), biobanker, klinisk genetik. EGA (European Genome-phenome Archive). FEGA Sweden.", "iot": "Sekvensinstrument (indirekt — genererar den data som delas).", "standarder": "GA4GH: Beacon v2, htsget, Phenopackets v2, DUO, Passports. FHIR Genomics IG. DCAT-AP (metadata). ISO 27001 (säkerhet).", "kvalitet": "GA4GH interoperabilitetstester. GDI conformance suite. ELIXIR datakvalitetsramverk."}, "26": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "NBIS är nationellt bioinformatikcentrum vid SciLifeLab. Stödjer forskare med dataanalys, datapublicering, datahantering. Driftar FEGA Sweden, svensk ELIXIR-nod, GDI-implementation.", "doman": "Bioinformatik: genomik, transkriptomik, proteomik, metabolomik, strukturbiologi, bildanalys. Datahantering: DMP, datapublicering, FAIR-implementering.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "FASTQ/BAM/VCF (genomik), TIFF/OME-TIFF (mikroskopi), mzML (proteomik), HDF5/H5AD (single-cell). nf-core pipelines (144+). Nextflow+Docker/Singularity.", "datamangd": "105 MSEK (2023, VR + SciLifeLab). Noder vid alla MedFak utom Örebro. 40+ bioinformatiker. DDS (Data Delivery System): end-to-end-krypterad dataöverföring.", "kallsystem": "SciLifeLab-plattformar (NGI, Clinical Genomics, Proteomics m.fl.). Internationella arkiv: EGA, ENA, PRIDE, UniProt, PDB. FEGA Sweden.", "iot": "Sekvensinstrument (Illumina, PacBio, Nanopore) — NBIS tar emot data, inte realtidsström.", "standarder": "FAIR-principer. GA4GH (Beacon, htsget, Phenopackets, DUO). ELIXIR RDMkit. nf-core (144+ pipelines). ISO 17025 (NGI ackreditering). Data Stewardship Wizard.", "kvalitet": "FastQC, MultiQC, CheckQC, Cutadapt (bioinformatik-QC). DMP obligatoriska. NBIS erbjuder gratis datahanteringskonsultation. Data lagras minst 10 år."}, "27": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "Bianca är NAISS-systemet för känslig data vid UPPMAX/Uppsala. Isolerade projektkluster utan internet. Mest använda miljön för hälsodataforskning i Sverige. Wharf för säker filöverföring.", "doman": "Känslig forskningsdata: klinisk data, genomikdata, registerdata, bilddata. Alla forskningsprojekt med etikgodkännande för känsliga personuppgifter.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla forskningsformat: VCF, BAM, DICOM, CSV, SAS, STATA, R. Linux-miljö med fria programvaruinstallationer. Singularity-containers.", "datamangd": "4 480 kärnor, 204 noder (128 GB RAM), 10 GPU-noder (NVIDIA A100). >7 PB lagringskapacitet (UPPMAX totalt). Ca 75 MSEK löpande (del av NAISS). Hundratals aktiva projekt.", "kallsystem": "Forskarnas egna data. SCB/Socialstyrelsen (registerdata via utlämning). SciLifeLab/GMS (genomikdata). Internationella arkiv.", "iot": "Inte tillämpligt — beräkningsmiljö, inte datainsamling.", "standarder": "NAISS säkerhetspolicy. Wharf (säker filöverföring). SFTP via SUNET. Tvåfaktorsautentisering. Isolerade projektkluster (ingen internetåtkomst inifrån). SLURM.", "kvalitet": "Bianca-säkerhetsmodell: projektkluster utan nätverksåtkomst, inspelning av alla terminalsessioner (thinlinc), automatisk sessionstidsgräns. UPPMAX supportteam. NAISS SLA."}, "28": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Externa krav (EHDS, NDI)"], "formaga_text": "Joint Action som utvecklade gemensamma principer för EHDS sekundäranvändning: datakvalitet, metadata, SPE-krav. Resultat informerar EHDS implementerande akter. Sverige deltog aktivt.", "doman": "EHDS-policynivå: datakvalitetsprinciper, metadatastandard, SPE-krav, datasetkategorisering, åtkomstregler, etiska principer för sekundäranvändning.", "frekvens": "Ej specificerat", "datatyp": "Policydokument, rekommendationer, tekniska specifikationer. Piloteringsresultat (begränsad faktisk data).", "datamangd": "21 EU-medlemsstater deltar. Finland koordinerar. Budget ej specificerat (EU4Health Joint Action).", "kallsystem": "Nationella hälsodatamyndigheter i 21 EU-länder. Europeiska kommissionen (DG SANTE, HaDEA).", "iot": "Inte tillämpligt.", "standarder": "EHDS-utkast (nu EU 2025/327), DCAT-AP (metadata), HL7 FHIR, OMOP CDM (diskuterat), ISO 27001 (SPE-krav), GDPR art. 89 (forskningsundantag).", "kvalitet": "EU-projektrapportering. Joint Action-kvalitetssäkring. Peer review av leverabler."}};
function DataDeepDivePanel({ itemNr, onClose }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    storageGet("deepdive:" + itemNr).then(d => {
      setData(d || DEEPDIVE_DEFAULTS[itemNr] || {});
      setLoaded(true);
    });
  }, [itemNr]);
  const save = async () => {
    setSaving(true);
    await storageSet("deepdive:" + itemNr, data);
    setSaving(false);
  };
  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const toggleCheck = (key, opt) => {
    const arr = data[key + "_checks"] || [];
    const next = arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
    setData(prev => ({ ...prev, [key + "_checks"]: next }));
  };
  if (!loaded) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}><Loader size={20} /> Laddar...</div>;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: expanded ? "stretch" : "center", padding: expanded ? 12 : 0, transition: "padding 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: expanded ? 12 : 16, width: expanded ? "100%" : 680, maxWidth: expanded ? "100%" : 680, maxHeight: expanded ? "100%" : "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", transition: "width 0.2s, border-radius 0.2s" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0F7FF", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} color="#1A56DB" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", fontFamily: "'DM Sans', sans-serif" }}>Datafördjupning — #{itemNr}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#4285F4", color: "#fff" }}>
              {saving ? "Sparar..." : "Spara"} 
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 14, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }} title={expanded ? "Förminska" : "Expandera"}>{expanded ? "⊟" : "⊞"}</button>
            <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>Stäng</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {DEEPDIVE_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
              {f.type === "checktext" ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {f.options.map(opt => {
                      const checked = (data[f.key + "_checks"] || []).includes(opt);
                      return <button key={opt} onClick={() => toggleCheck(f.key, opt)} style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10.5, cursor: "pointer", border: checked ? "1px solid #4285F4" : "1px solid #E5E7EB", background: checked ? "#E8F0FE" : "#fff", color: checked ? "#1A56DB" : "#6B7280", fontWeight: checked ? 600 : 400 }}>{opt}</button>;
                    })}
                  </div>
                  <textarea value={data[f.key + "_text"] || ""} onChange={e => update(f.key + "_text", e.target.value)} placeholder="Fritext..." rows={2} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit" }} />
                </div>
              ) : f.type === "select" ? (
                <select value={data[f.key] || ""} onChange={e => update(f.key, e.target.value)} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, background: "#fff" }}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <textarea value={data[f.key] || ""} onChange={e => update(f.key, e.target.value)} rows={2} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ─────────── SUGGESTION FIELD (used inside DetailModal) ─────────── */
function SuggestionField({ itemNr }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    storageGet("suggestion:" + itemNr).then(d => {
      setText(d || "");
      setLoaded(true);
      if (d && d.length > 0) setExpanded(true);
    });
  }, [itemNr]);
  const save = async () => {
    setSaving(true);
    await storageSet("suggestion:" + itemNr, text);
    setSaving(false);
  };
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #E5E7EB", paddingTop: 10 }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 600, color: "#B45309" }}>
        <Edit3 size={13} />
        Föreslå ändringar {text ? "(" + text.length + " tecken)" : ""}
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {expanded && loaded && (
        <div style={{ marginTop: 6 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Skriv ditt förslag här. Alla kan redigera detta fält." style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "8px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit", minHeight: 80, maxHeight: 300 }} />
          <button onClick={save} disabled={saving} style={{ marginTop: 4, padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E8913A", background: saving ? "#FEF3E2" : "#fff", color: "#B45309" }}>
            {saving ? "Sparar..." : "Spara förslag"}
          </button>
        </div>
      )}
    </div>
  );
}
/* ─────────── MAP VIEW ─────────── */
const GEO_ASSIGNMENTS = {
  // city: { lat, lon, label }
  "Linköping": { lat: 58.41, lon: 15.63 },
  "Stockholm": { lat: 59.33, lon: 18.07 },
  "Solna": { lat: 59.36, lon: 18.00 },
  "Göteborg": { lat: 57.71, lon: 11.97 },
  "Uppsala": { lat: 59.86, lon: 17.64 },
  "Lund": { lat: 55.71, lon: 13.19 },
  "Örebro": { lat: 59.27, lon: 15.21 },
  "Halmstad": { lat: 56.67, lon: 12.86 },
  "Falkenberg": { lat: 56.91, lon: 12.49 },
  "Sundsvall": { lat: 62.39, lon: 17.31 },
  "Kalmar": { lat: 56.66, lon: 16.36 },
};
const INIT_GEO = {
  1: "Göteborg", 13: "Linköping", 14: "Linköping", 15: "Linköping",
  16: "Örebro", 17: "Stockholm", 18: "Linköping", 19: "Göteborg",
  20: "Linköping", 21: "Stockholm", 22: "Linköping", 23: "Linköping",
  24: "Linköping", 27: "Uppsala", 29: "Solna", 30: "Göteborg",
  31: "Uppsala", 32: "Lund", 33: "Göteborg", 35: "Örebro",
  37: "Falkenberg", 46: "Solna", 47: "Solna", 55: "Uppsala",
  56: "Stockholm", 62: "Solna", 65: "Solna", 73: "Uppsala",
  74: "Solna", 86: "Stockholm", 92: "Halmstad",
  // Stockholm-based national
  4: "Stockholm", 5: "Stockholm", 8: "Stockholm", 9: "Stockholm",
  38: "Stockholm", 39: "Stockholm", 40: "Stockholm", 41: "Stockholm",
  43: "Stockholm", 44: "Stockholm", 45: "Stockholm", 48: "Stockholm",
  49: "Stockholm", 50: "Stockholm", 51: "Stockholm", 57: "Stockholm",
  58: "Stockholm", 61: "Stockholm", 63: "Stockholm", 64: "Stockholm",
  71: "Stockholm", 72: "Stockholm", 76: "Stockholm", 82: "Stockholm",
  87: "Stockholm", 93: "Stockholm", 94: "Stockholm", 96: "Stockholm",
  // DIGG
  10: "Sundsvall", 95: "Sundsvall",
  // RISE
  75: "Göteborg",
  // SciLifeLab
  11: "Stockholm", 25: "Uppsala", 26: "Uppsala", 53: "Stockholm", 54: "Stockholm",
};
// National (no single location) and International
const NATIONAL_NRS = [2, 3, 6, 7, 34, 36, 42, 59, 60, 66, 97,
  // Legislation/policy
  78, 79, 80, 81, 83, 85, 88, 89, 90, 91];
const INTL_NRS = [28, 52, 67, 68, 69, 70, 77, 84, 12];
function MapView({ data, onClickItem }) {
  const [selectedCity, setSelectedCity] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  // Group by city
  const cityGroups = useMemo(() => {
    const groups = {};
    data.forEach(item => {
      const city = INIT_GEO[item.nr];
      if (city && GEO_ASSIGNMENTS[city]) {
        if (!groups[city]) groups[city] = [];
        groups[city].push(item);
      }
    });
    return groups;
  }, [data]);
  const nationalItems = useMemo(() => data.filter(d => NATIONAL_NRS.includes(d.nr)), [data]);
  const intlItems = useMemo(() => data.filter(d => INTL_NRS.includes(d.nr)), [data]);
  // Load Leaflet and init map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });
    };
    loadLeaflet().then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, {
        center: [62.5, 16],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 10,
        minZoom: 3,
      }).addTo(map);
      mapInstanceRef.current = map;
      // Add markers
      Object.entries(cityGroups).forEach(([city, items]) => {
        const geo = GEO_ASSIGNMENTS[city];
        if (!geo) return;
        const count = items.length;
        const r = Math.max(12, Math.min(28, 8 + count * 1.5));
        const icon = L.divIcon({
          className: "",
          html: "<div style='width:" + (r*2) + "px;height:" + (r*2) + "px;border-radius:50%;background:#2563EB;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:" + (r > 14 ? 11 : 9) + "px;font-weight:700;font-family:DM Sans,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer'>" + count + "</div>",
          iconSize: [r*2, r*2],
          iconAnchor: [r, r],
        });
        const marker = L.marker([geo.lat, geo.lon], { icon }).addTo(map);
        const popupContent = "<div style='font-family:DM Sans,system-ui,sans-serif;min-width:200px'>" +
          "<div style='font-weight:700;font-size:14px;color:#1B3A5C;margin-bottom:4px'>" + (city === "Solna" ? "Solna/Stockholm" : city) + "</div>" +
          "<div style='font-size:11px;color:#6B7280;margin-bottom:6px'>" + count + " initiativ</div>" +
          items.map(i => "<div style='font-size:10px;padding:2px 0;color:#374151'><b style='color:" + typColor(i.typ) + "'>#" + i.nr + "</b> " +
            (i.n.length > 35 ? i.n.substring(0,35) + "…" : i.n) + "</div>").join("") +
          "</div>";
        marker.bindPopup(popupContent, { maxWidth: 300, maxHeight: 250 });
        marker.on("click", () => setSelectedCity(city));
        markersRef.current[city] = marker;
      });
      // Fit bounds to Sweden
      map.fitBounds([[55.3, 11], [69.1, 24]], { padding: [20, 20] });
    });
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Markers are static since data doesn't change city assignments
  }, [data, cityGroups]);
  // Pan to selected city
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCity) return;
    const geo = GEO_ASSIGNMENTS[selectedCity];
    if (geo) {
      mapInstanceRef.current.setView([geo.lat, geo.lon], 7, { animate: true });
      if (markersRef.current[selectedCity]) {
        markersRef.current[selectedCity].openPopup();
      }
    }
  }, [selectedCity]);
  const InitBadge = ({ item }) => (
    <div onClick={() => onClickItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer", background: typColor(item.typ) + "15", border: "1px solid " + typColor(item.typ) + "40", color: typColor(item.typ), fontWeight: 500, lineHeight: 1.2 }}
      onMouseEnter={e => e.currentTarget.style.background = typColor(item.typ) + "30"}
      onMouseLeave={e => e.currentTarget.style.background = typColor(item.typ) + "15"}>
      <span style={{ fontWeight: 700 }}>#{item.nr}</span>
      <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 25 ? item.n.substring(0, 25) + "…" : item.n}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Leaflet Map */}
      <div style={{ flex: "0 0 420px", position: "relative", borderRight: "1px solid #E5E7EB" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", bottom: 30, left: 8, background: "rgba(255,255,255,0.93)", borderRadius: 8, padding: "6px 10px", fontSize: 9, color: "#6B7280", border: "1px solid #E5E7EB", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          {[["#4285F4", "Infrastruktur"], ["#E8913A", "Samverkan"], ["#8B5CF6", "Superdator"], ["#DC2626", "Lagstiftning"]].map(([col, l]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 3, marginRight: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: col }} /> {l}
            </span>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {selectedCity && cityGroups[selectedCity] ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <MapPin size={16} color="#1A56DB" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>{selectedCity === "Solna" ? "Solna/Stockholm" : selectedCity}</h3>
              <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{cityGroups[selectedCity].length} initiativ</span>
              <button onClick={() => { setSelectedCity(null); if (mapInstanceRef.current) mapInstanceRef.current.fitBounds([[55.3, 11], [69.1, 24]], { padding: [20, 20] }); }} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>Visa alla</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {cityGroups[selectedCity].map(i => <InitBadge key={i.nr} item={i} />)}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 10px" }}>Geografisk fördelning</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(cityGroups).sort((a, b) => b[1].length - a[1].length).map(([city, items]) => (
                <div key={city} onClick={() => setSelectedCity(city)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <MapPin size={12} color="#3B82F6" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", minWidth: 100 }}>{city === "Solna" ? "Solna/Stockholm" : city}</span>
                  <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (items.length / Math.max(...Object.values(cityGroups).map(g => g.length)) * 100) + "%", background: "#3B82F6", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", minWidth: 24, textAlign: "right" }}>{items.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* National */}
        <div style={{ marginBottom: 16, borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>🇸🇪</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>Nationella initiativ</h3>
            <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{nationalItems.length}</span>
          </div>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 6px" }}>Verkar över hela Sverige — ingen enskild ort</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {nationalItems.map(i => <InitBadge key={i.nr} item={i} />)}
          </div>
        </div>
        {/* International */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Globe size={14} color="#6B7280" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>Internationella / EU</h3>
            <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{intlItems.length}</span>
          </div>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 6px" }}>Gränsöverskridande eller EU-styrda initiativ</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {intlItems.map(i => <InitBadge key={i.nr} item={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ─────────── TAG GROUPS & CONNECTION CATEGORIES ─────────── */
const TAG_GROUPS = [
  { key: "standarder", label: "Standarder", tags: ["OMOP", "OpenEHR", "HL7", "FHIR", "Health D-CAT AP", "GA4GH", "ICD-10", "Snomed CT", "KVÅ", "NTjP", "ATC", "GSIM"] },
  { key: "anvfall", label: "Användningsfall", tags: ["Vård av patient", "Vård av annan patient", "Precisionsmedicin", "PROM", "PREM", "Innovation", "Styrning", "Analys", "Uppföljning", "Forskning", "Life science", "Kvalitetsregister", "Hälsodataregister"] },
  { key: "anvomrade", label: "Användningsområde", tags: ["Genomik", "Biobank", "Sekundäranvändning", "Primäranvändning"] },
];
const CONNECTION_CATS = ["Samskapa", "Överlapp", "Stötta", "Docka in i", "Lära av", "Hålla koll på"];
const CAT_COLORS = { "Samskapa": "#1A56DB", "Överlapp": "#B45309", "Stötta": "#166534", "Docka in i": "#7E22CE", "Lära av": "#0F766E", "Hålla koll på": "#6B7280" };

function TagGroupPicker({ override, setOverride, autoSave, itemNr }) {
  const [openGroup, setOpenGroup] = useState(null);
  const tags = (override && override.tags) || {};
  const toggle = (groupKey, tag) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.tags) next.tags = {};
    if (!next.tags[groupKey]) next.tags[groupKey] = [];
    const idx = next.tags[groupKey].indexOf(tag);
    if (idx >= 0) next.tags[groupKey].splice(idx, 1); else next.tags[groupKey].push(tag);
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {TAG_GROUPS.map(g => {
        const selected = tags[g.key] || [];
        const isOpen = openGroup === g.key;
        return (
          <div key={g.key}>
            <div onClick={() => setOpenGroup(isOpen ? null : g.key)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", textTransform: "uppercase", letterSpacing: 0.4 }}>{g.label}</span>
              <span style={{ fontSize: 10, color: "#5a7a9a" }}>({selected.length})</span>
              <span style={{ fontSize: 10, color: "#5a7a9a", marginLeft: 2 }}>{isOpen ? "▾" : "▸"}</span>
            </div>
            {selected.length > 0 && !isOpen && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {selected.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#1B3A5C", color: "#fff", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            )}
            {isOpen && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 0" }}>
                {g.tags.map(t => {
                  const sel = selected.includes(t);
                  return (
                    <span key={t} onClick={() => toggle(g.key, t)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, border: sel ? "1.5px solid #1B3A5C" : "1.5px solid #C0C8D0", background: sel ? "#1B3A5C" : "#fff", color: sel ? "#fff" : "#2c3e50", transition: "all 0.15s" }}>{t}</span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConnectionPicker({ itemNr, starred, override, setOverride, autoSave, overridesCache }) {
  const [open, setOpen] = useState(false);
  const [editingNr, setEditingNr] = useState(null);
  const connections = (override && override.connections) || [];
  const others = starred.filter(i => i.nr !== itemNr);
  const connMap = {};
  connections.forEach(c => { connMap[c.nr] = c.cats || []; });

  const toggleConnection = (targetNr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.connections) next.connections = [];
    const idx = next.connections.findIndex(c => c.nr === targetNr);
    if (idx >= 0) {
      next.connections.splice(idx, 1);
      if (editingNr === targetNr) setEditingNr(null);
    } else {
      next.connections.push({ nr: targetNr, cats: [] });
      setEditingNr(targetNr);
    }
    setOverride(next);
    if (autoSave) autoSave(next);
  };

  const toggleCat = (targetNr, cat) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.connections) next.connections = [];
    const conn = next.connections.find(c => c.nr === targetNr);
    if (!conn) return;
    if (!conn.cats) conn.cats = [];
    const idx = conn.cats.indexOf(cat);
    if (idx >= 0) conn.cats.splice(idx, 1); else conn.cats.push(cat);
    setOverride(next);
    if (autoSave) autoSave(next);
  };

  const connectedItems = connections.filter(c => others.some(o => o.nr === c.nr));

  return (
    <div>
      {connectedItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: open ? 12 : 0 }}>
          {connectedItems.map(c => {
            const item = others.find(o => o.nr === c.nr);
            if (!item) return null;
            const col = DEL_COLORS[item.del] || DEL_COLORS.A;
            return (
              <div key={c.nr} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#F6F8FA", borderRadius: 8, border: "1px solid #D0D7DE" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "1px 6px", borderRadius: 4 }}>{item.nr}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f1f2e", flex: 1 }}>{item.n.length > 40 ? item.n.substring(0, 40) + "…" : item.n}</span>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {(c.cats || []).map(cat => (
                    <span key={cat} style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 8, background: CAT_COLORS[cat] || "#6B7280", color: "#fff", fontWeight: 600 }}>{cat}</span>
                  ))}
                </div>
                <span onClick={() => setEditingNr(editingNr === c.nr ? null : c.nr)} style={{ cursor: "pointer", fontSize: 11, color: "#5a7a9a", fontWeight: 600 }}>✎</span>
                <span onClick={() => toggleConnection(c.nr)} style={{ cursor: "pointer", fontSize: 13, color: "#B91C1C", fontWeight: 600, lineHeight: 1 }}>×</span>
              </div>
            );
          })}
          {editingNr && connMap[editingNr] !== undefined && (
            <div style={{ padding: "8px 12px", background: "#EFF2F5", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B3A5C", textTransform: "uppercase", marginBottom: 6 }}>Kategorisera koppling till #{editingNr}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {CONNECTION_CATS.map(cat => {
                  const sel = (connMap[editingNr] || []).includes(cat);
                  return (
                    <span key={cat} onClick={() => toggleCat(editingNr, cat)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, border: sel ? "none" : "1.5px solid #C0C8D0", background: sel ? (CAT_COLORS[cat] || "#6B7280") : "#fff", color: sel ? "#fff" : "#2c3e50", transition: "all 0.15s" }}>{cat}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", background: "none", border: "1.5px solid #1B3A5C", borderRadius: 8, padding: "5px 14px", cursor: "pointer", marginTop: connectedItems.length > 0 ? 8 : 0 }}>
        {open ? "Stäng" : "+ Koppla till annat initiativ"}
      </button>
      {open && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {others.map(item => {
            const isConn = connMap[item.nr] !== undefined;
            const col = DEL_COLORS[item.del] || DEL_COLORS.A;
            return (
              <div key={item.nr} onClick={() => { toggleConnection(item.nr); }} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: isConn ? "2px solid #1B3A5C" : "1.5px solid #D0D7DE", background: isConn ? "#E8EDF5" : "#fff", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isConn) e.currentTarget.style.borderColor = "#7a8a9e"; }} onMouseLeave={e => { if (!isConn) e.currentTarget.style.borderColor = "#D0D7DE"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: col.text, background: col.bg, padding: "1px 5px", borderRadius: 4 }}>{item.nr}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f1f2e" }}>{item.n.length > 30 ? item.n.substring(0, 30) + "…" : item.n}</span>
                  {isConn && <span style={{ marginLeft: "auto", fontSize: 14, color: "#1B3A5C" }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── PRIORITIZED VIEW (Prioriterade) ─────────── */
// Prio-specifika fält som inte renderas på det vanliga kortet — används av "Alla med Prio-fält ifyllda"-läget.
const PRIO_ONLY_FIELDS = ["status", "behov", "behovsniva", "overlap", "anvtyp", "nyttjande", "forutsattningar", "outnyttjat", "agarskap", "styrning", "ekonomi", "strategi", "ovrigt"];
const PRIO_SECTIONS = [
  { title: "Syfte & behov", nr: 1, fields: [
    { key: "fok", label: "Hälsodatafokus", hint: "Vilken typ av hälsodata hanteras? Vilka datatyper och dataflöden omfattas?" },
    { key: "typ", label: "Typ", hint: "T.ex. register, plattform, standard, kvalitetssystem…" },
    { key: "nk", label: "Nyckelkaraktäristik", hint: "Vad utmärker initiativet? Syfte, omfattning och funktionalitet" },
    { key: "status", label: "Status", hint: "Under utveckling / driftsatt / används i projektform / används rutinmässigt för vård eller forskning" },
    { key: "behov", label: "Behov & gap", hint: "Vilka prioriterade behov fyller initiativet utifrån vård- och forskningsändamål? Vilka gap finns?" },
    { key: "behovsniva", label: "Behovsnivå", hint: "Nationellt, regionalt eller lokalt behov?" },
    { key: "overlap", label: "Överlapp med andra infrastrukturer", hint: "Vilka infrastrukturer överlappar? Typ av överlapp (funktionell / data / målgrupp) och grad (låg / medel / hög)" },
  ]},
  { title: "Nyttjande & effekt", nr: 2, fields: [
    { key: "mg", label: "Målgrupp", hint: "Vem använder infrastrukturen?" },
    { key: "anvtyp", label: "Användningstyp", hint: "Forskning, klinik, AI, verksamhetsutveckling, kvalitetsarbete?" },
    { key: "nyttjande", label: "Nyttjandegrad", hint: "Antal användare, projekt och regioner. Konkreta nyttor och utfall" },
    { key: "forutsattningar", label: "Förutsättningar för nyttjande", hint: "Vad krävs av regionerna? Resurser, kompetenser och andra förutsättningar för dataproduktion, överföring, lagring och användning" },
    { key: "outnyttjat", label: "Outnyttjad kapacitet", hint: "Vad finns men används inte? Potential för breddad användning" },
  ]},
  { title: "Organisation & ägarskap", nr: 3, fields: [
    { key: "ans", label: "Ansvarig", hint: "Vem ansvarar för initiativet?" },
    { key: "akt", label: "Aktörer", hint: "Vilka organisationer är involverade?" },
    { key: "agarskap", label: "Ägandeskap & åtagande", hint: "Regionernas åtagande och ägandeskap. Villkor för överlåtelse (lärarundantag, fribrev, kommersiella avtal). Ansvar, beslutsbefogenheter, nyttjanderätter" },
    { key: "styrning", label: "Styrning & samverkan", hint: "Beslutsstruktur och organisation. Möjlighet till ökat nyttjande av regionerna? Förutsättningar för samtliga 21 regioner att delta" },
  ]},
  { title: "Teknik & standarder", nr: 4, fields: [
    { key: "tek", label: "Teknik", hint: "Teknisk uppbyggnad: central lagring, on-prem, off-prem, molntjänst (t.ex. Azure)?" },
    { key: "ds", label: "Datastandarder", hint: "Vilka standarder används och stöds? Strategisk inriktning för standarder" },
  ]},
  { title: "Ekonomi & strategi", nr: 5, fields: [
    { key: "ekonomi", label: "Ekonomisk modell", hint: "Hittills nedlagda kostnader, regionernas och andra finansiärers åtagande, fördelning av kostnader för utveckling, drift och förvaltning" },
    { key: "strategi", label: "Strategisk betydelse", hint: "Kritikalitet för vård, forskning och nationella mål (t.ex. EHDS). Framtida potential och möjlighet till breddad användning" },
  ]},
  { title: "Övrigt", nr: 6, fields: [
    { key: "ovrigt", label: "Övriga kommentarer", hint: "Övriga relevanta frågeställningar, observationer eller noteringar" },
  ]},
];
function PrioFieldEditor({ field, item, override, setOverride, autoSave }) {
  const [editing, setEditing] = useState(false);
  const origVal = item[field.key] || "";
  const hasOv = override.fields && override.fields[field.key] !== undefined;
  const displayVal = hasOv ? override.fields[field.key] : origVal;
  const save = (val) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field.key]) next.fieldHistory[field.key] = [];
    next.fieldHistory[field.key].push(hasOv ? next.fields[field.key] : origVal);
    if (next.fieldHistory[field.key].length > 10) next.fieldHistory[field.key] = next.fieldHistory[field.key].slice(-10);
    next.fields[field.key] = val;
    setOverride(next);
    setEditing(false);
    if (autoSave) autoSave(next);
  };
  if (editing) {
    return (
      <textarea defaultValue={displayVal} rows={2} autoFocus onBlur={e => save(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
        placeholder={field.hint || ""}
        style={{ width: "100%", border: "1.5px solid #1B3A5C", borderRadius: 6, padding: "6px 10px", fontSize: 13, resize: "vertical", fontFamily: "inherit", minHeight: 44, lineHeight: 1.5, color: "#1a1a1a" }} />
    );
  }
  return (
    <div onClick={() => setEditing(true)} style={{ cursor: "pointer", fontSize: 13, color: displayVal ? "#1a1a1a" : "#7a8a9e", lineHeight: 1.55, minHeight: 22, borderRadius: 5, padding: "3px 6px", transition: "background 0.15s", fontStyle: displayVal ? "normal" : "italic" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#E8EDF2"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {displayVal || (field.hint || "Klicka för att redigera…")}
      {hasOv && <span style={{ fontSize: 9, color: "#D97706", marginLeft: 4 }}>✏️</span>}
    </div>
  );
}
function PrioritizedView({ data, overridesCache, refreshOverrides, onClickItem }) {
  const [mode, setMode] = useState("starred"); // "starred" | "filled"
  const [layout, setLayout] = useState("list"); // "list" | "grid"
  const starred = useMemo(() => data.filter(i => {
    const ov = overridesCache[i.nr];
    if (mode === "starred") return ov && ov.arbetaVidere;
    // "filled" — alla med minst ett Prio-only-fält ifyllt
    if (!ov || !ov.fields) return false;
    return PRIO_ONLY_FIELDS.some(k => {
      const v = ov.fields[k];
      return v != null && String(v).trim() !== "";
    });
  }), [data, overridesCache, mode]);
  const [overrides, setOverrides] = useState({});
  const [selectedExport, setSelectedExport] = useState(new Set());
  useEffect(() => {
    starred.forEach(item => {
      getOverride(item.nr).then(ov => {
        setOverrides(prev => ({ ...prev, [item.nr]: ov }));
      });
    });
  }, [starred]);
  const setOvForNr = (nr) => (next) => {
    setOverrides(prev => ({ ...prev, [nr]: next }));
  };
  const autoSaveForNr = (nr) => (nextOverride) => {
    saveOverride(nr, nextOverride).then(() => { if (refreshOverrides) refreshOverrides(); });
  };
  const toggleExportSelect = (nr) => setSelectedExport(prev => { const n = new Set(prev); if (n.has(nr)) n.delete(nr); else n.add(nr); return n; });
  const selectAllForExport = () => { if (selectedExport.size === starred.length) setSelectedExport(new Set()); else setSelectedExport(new Set(starred.map(i => i.nr))); };

  const buildCardMarkdown = (item, ov) => {
    const lines = [];
    lines.push("# " + item.nr + ". " + item.n);
    lines.push("");
    lines.push("**Delområde:** " + (item.sub || "–") + "  ");
    lines.push("**Beskrivning:** " + (item.d || "–"));
    lines.push("");
    PRIO_SECTIONS.forEach(section => {
      lines.push("## " + section.nr + ". " + section.title);
      lines.push("");
      section.fields.forEach(f => {
        const hasOv = ov.fields && ov.fields[f.key] !== undefined;
        const val = hasOv ? ov.fields[f.key] : (item[f.key] || "");
        lines.push("**" + f.label + ":** " + (val || "–"));
      });
      lines.push("");
    });
    lines.push("## 7. Taggning");
    lines.push("");
    const tags = ov.tags || {};
    TAG_GROUPS.forEach(g => {
      const sel = tags[g.key] || [];
      lines.push("**" + g.label + ":** " + (sel.length > 0 ? sel.join(", ") : "–"));
    });
    lines.push("");
    lines.push("## 8. Kopplingar");
    lines.push("");
    const conns = ov.connections || [];
    if (conns.length === 0) { lines.push("Inga kopplingar"); }
    else {
      conns.forEach(c => {
        const target = data.find(d => d.nr === c.nr);
        const name = target ? target.n : "Nr " + c.nr;
        const cats = (c.cats || []).join(", ");
        lines.push("- **" + c.nr + ". " + name + "**" + (cats ? " (" + cats + ")" : ""));
      });
    }
    lines.push("");
    return lines.join("\n");
  };

  const exportMarkdown = () => {
    const items = starred.filter(i => selectedExport.has(i.nr));
    if (items.length === 0) return;
    const parts = items.map(item => buildCardMarkdown(item, overrides[item.nr] || {}));
    const md = "# Prioriterade initiativ — Export\n\n_Exporterad " + new Date().toLocaleDateString("sv-SE") + "_\n\n---\n\n" + parts.join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prioriterade-initiativ-" + new Date().toISOString().slice(0, 10) + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printCards = () => {
    const items = starred.filter(i => selectedExport.has(i.nr));
    if (items.length === 0) return;
    const parts = items.map(item => {
      const ov = overrides[item.nr] || {};
      let html = '<div style="page-break-after:always;font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:20px 0">';
      html += '<h1 style="font-size:22px;color:#0f1f2e;border-bottom:2px solid #1B3A5C;padding-bottom:8px">' + item.nr + '. ' + item.n + '</h1>';
      html += '<p style="color:#3a4a5a;font-size:13px"><strong>Delområde:</strong> ' + (item.sub || '–') + '</p>';
      html += '<p style="color:#1a1a1a;font-size:13px">' + (item.d || '') + '</p>';
      PRIO_SECTIONS.forEach(section => {
        html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">' + section.nr + '. ' + section.title + '</h2>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px">';
        section.fields.forEach(f => {
          const hasOvF = ov.fields && ov.fields[f.key] !== undefined;
          const val = hasOvF ? ov.fields[f.key] : (item[f.key] || '');
          html += '<tr><td style="padding:4px 8px;font-weight:700;color:#2c3e50;width:180px;vertical-align:top;border-bottom:1px solid #eee">' + f.label + '</td>';
          html += '<td style="padding:4px 8px;color:#1a1a1a;border-bottom:1px solid #eee">' + (val || '<span style="color:#999">–</span>') + '</td></tr>';
        });
        html += '</table>';
      });
      html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">7. Taggning</h2>';
      const tags = ov.tags || {};
      TAG_GROUPS.forEach(g => {
        const sel = tags[g.key] || [];
        html += '<p style="font-size:12.5px;margin:4px 0"><strong>' + g.label + ':</strong> ' + (sel.length > 0 ? sel.map(t => '<span style="background:#1B3A5C;color:#fff;padding:1px 7px;border-radius:8px;font-size:11px;margin-right:3px">' + t + '</span>').join(' ') : '–') + '</p>';
      });
      html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">8. Kopplingar</h2>';
      const conns = ov.connections || [];
      if (conns.length === 0) { html += '<p style="font-size:12.5px;color:#999">Inga kopplingar</p>'; }
      else {
        html += '<ul style="font-size:12.5px;padding-left:20px">';
        conns.forEach(c => {
          const target = data.find(dd => dd.nr === c.nr);
          const name = target ? target.n : 'Nr ' + c.nr;
          const cats = (c.cats || []).map(cat => '<span style="background:' + (CAT_COLORS[cat] || '#6B7280') + ';color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px">' + cat + '</span>').join('');
          html += '<li><strong>' + c.nr + '. ' + name + '</strong>' + cats + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
      return html;
    });
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Prioriterade initiativ</title></head><body style="margin:0;padding:20px">' + parts.join('') + '</body></html>');
    w.document.close();
    w.print();
  };

  if (starred.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a6a7a" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>⭐</span>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1B3A5C" }}>Inga prioriterade initiativ</p>
        <p style={{ fontSize: 13, color: "#3a4a5a" }}>Öppna ett kort och klicka "Arbeta vidare" för att stjärnmarkera det</p>
      </div>
    );
  }
  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f1f2e", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Prioriterade initiativ</h2>
          <p style={{ fontSize: 13, color: "#3a4a5a", margin: "0 0 8px" }}>{starred.length} {mode === "starred" ? "stjärnmarkerade initiativ" : "initiativ med Prio-fält ifyllda"} — klicka på fältvärden för att redigera direkt</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setMode("starred")} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: mode === "starred" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: mode === "starred" ? "#FFFBEB" : "#fff", color: mode === "starred" ? "#B45309" : "#6B7280" }}>⭐ Bara stjärnmärkta</button>
            <button onClick={() => setMode("filled")} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: mode === "filled" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: mode === "filled" ? "#E8F0FE" : "#fff", color: mode === "filled" ? "#1A56DB" : "#6B7280" }}>📝 Alla med Prio-fält ifyllda</button>
            <span style={{ width: 1, background: "#E5E7EB", margin: "0 4px" }} />
            <button onClick={() => setLayout("list")} title="Lista (fulla kort)" style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: layout === "list" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: layout === "list" ? "#1B3A5C" : "#fff", color: layout === "list" ? "#fff" : "#6B7280" }}>☰ Lista</button>
            <button onClick={() => setLayout("grid")} title="Rutnät (kompakt)" style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: layout === "grid" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: layout === "grid" ? "#1B3A5C" : "#fff", color: layout === "grid" ? "#fff" : "#6B7280" }}>▦ Rutnät</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={selectAllForExport} style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", background: "#fff", border: "1.5px solid #1B3A5C", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            {selectedExport.size === starred.length ? "Avmarkera alla" : "Markera alla"}
          </button>
          {selectedExport.size > 0 && (<>
            <button onClick={exportMarkdown} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#1B3A5C", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
              Exportera .md ({selectedExport.size})
            </button>
            <button onClick={printCards} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#1B3A5C", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
              Skriv ut / PDF ({selectedExport.size})
            </button>
          </>)}
        </div>
      </div>
      {layout === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {starred.map(item => {
            const ov = overrides[item.nr] || {};
            const col = DEL_COLORS[item.del] || {};
            const f = ov.fields || {};
            return (
              <div key={item.nr} onClick={() => onClickItem && onClickItem(item)}
                style={{ background: "#fff", border: "1px solid " + (col.border || "#E5E7EB"), borderLeft: "4px solid " + (col.border || "#E5E7EB"), borderRadius: 8, padding: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, minHeight: 130, transition: "transform 0.1s, box-shadow 0.1s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: col.bg || "#F3F4F6", color: col.text || "#374151" }}>{item.sub}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>Nr {item.nr}</span>
                  {ov.arbetaVidere && <span style={{ marginLeft: "auto", fontSize: 11 }} title="Stjärnmärkt">⭐</span>}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1B3A5C", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.n}</div>
                {f.status && <div style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: "#374151" }}>Status:</b> {f.status}</div>}
                {f.typ && <div style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}><b style={{ color: "#374151" }}>Typ:</b> {f.typ}</div>}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: layout === "list" ? "flex" : "none", flexDirection: "column", gap: 20 }}>
        {starred.map(item => {
          const col = DEL_COLORS[item.del];
          const ov = overrides[item.nr];
          if (!ov) return null;
          return (
            <div key={item.nr} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D0D7DE", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${col.border}, ${col.border}88)` }} />
              <div style={{ padding: "18px 24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <input type="checkbox" checked={selectedExport.has(item.nr)} onChange={() => toggleExportSelect(item.nr)} style={{ width: 16, height: 16, accentColor: "#1B3A5C", cursor: "pointer", flexShrink: 0 }} title="Markera för export/utskrift" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "3px 10px", borderRadius: 6 }}>{item.sub}</span>
                  <span style={{ fontSize: 11, color: "#3a4a5a", fontWeight: 600 }}>Nr {item.nr}</span>
                  <span style={{ fontSize: 13 }}>⭐</span>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f1f2e", margin: 0, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{item.n}</h3>
                </div>
                {PRIO_SECTIONS.map(section => (
                  <div key={section.title} style={{ marginBottom: 16 }}>
                    <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
                      <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                        <span style={{ color: "#5a7a9a", marginRight: 6 }}>{section.nr}.</span>{section.title}
                      </h4>
                    </div>
                    <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: section.fields.length === 1 ? "1fr" : "1fr 1fr", gap: "10px 24px" }}>
                        {section.fields.map(f => (
                          <div key={f.key}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#2c3e50", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{f.label}</div>
                            <PrioFieldEditor field={f} item={item} override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
                    <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                      <span style={{ color: "#5a7a9a", marginRight: 6 }}>7.</span>Taggning
                    </h4>
                  </div>
                  <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
                    <TagGroupPicker override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} itemNr={item.nr} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
                    <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                      <span style={{ color: "#5a7a9a", marginRight: 6 }}>8.</span>Kopplingar till andra prioriterade
                    </h4>
                  </div>
                  <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
                    <ConnectionPicker itemNr={item.nr} starred={starred} override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} overridesCache={overridesCache} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ─────────── PRIO NETWORK VIEW ─────────── */
function PrioNetworkView({ data, overridesCache, onClickItem }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const [hovered, setHovered] = useState(null);
  const simRef = useRef(null);
  const starred = useMemo(() => data.filter(i => {
    const ov = overridesCache[i.nr];
    return ov && ov.arbetaVidere;
  }), [data, overridesCache]);
  const dataMap = useMemo(() => { const m = {}; starred.forEach(d => m[d.nr] = d); return m; }, [starred]);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!svgRef.current || starred.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { w, h } = dims;
    const nodes = starred.map(d => {
      const ov = overridesCache[d.nr] || {};
      const conns = (ov.connections || []).filter(c => dataMap[c.nr]);
      return { id: d.nr, nr: d.nr, label: "#" + d.nr + " " + (d.n.length > 22 ? d.n.substring(0, 22) + "…" : d.n), shortLabel: "#" + d.nr, fullName: d.n, del: d.del, typ: d.typ, connCount: conns.length, r: Math.max(12, Math.min(26, 10 + conns.length * 3)) };
    });
    const nodeSet = new Set(starred.map(d => d.nr));
    const links = [];
    const linkSet = new Set();
    starred.forEach(d => {
      const ov = overridesCache[d.nr] || {};
      (ov.connections || []).forEach(c => {
        if (!nodeSet.has(c.nr)) return;
        const key = Math.min(d.nr, c.nr) + "-" + Math.max(d.nr, c.nr);
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: d.nr, target: c.nr, cats: c.cats || [], sourceNr: d.nr });
        }
      });
    });
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.3, 4]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", d => { const c = d.cats[0]; return c ? (CAT_COLORS[c] || "#9CA3AF") : "#C0C8D0"; })
      .attr("stroke-width", d => d.cats.length > 0 ? 2.5 : 1.5)
      .attr("stroke-dasharray", d => d.cats.length === 0 ? "4,3" : "none");
    const linkLabels = g.append("g").selectAll("text").data(links.filter(l => l.cats.length > 0)).join("text")
      .text(d => d.cats.join(", "))
      .attr("font-size", 8.5).attr("font-weight", 600).attr("fill", d => { const c = d.cats[0]; return c ? (CAT_COLORS[c] || "#6B7280") : "#6B7280"; })
      .attr("text-anchor", "middle").attr("font-family", "'DM Sans', sans-serif");
    const node = g.append("g").selectAll("g").data(nodes, d => d.id).join("g").attr("cursor", "pointer");
    node.each(function(d) {
      const el = d3.select(this);
      const col = DEL_COLORS[d.del] || DEL_COLORS.A;
      el.append("circle").attr("r", d.r).attr("fill", col.border).attr("stroke", "#0f1f2e").attr("stroke-width", 2);
    });
    node.append("text").text(d => d.shortLabel).attr("dy", d => d.r + 14).attr("text-anchor", "middle")
      .attr("font-size", 10).attr("font-weight", 700).attr("fill", "#0f1f2e").attr("font-family", "'DM Sans', sans-serif");
    const tooltip = svg.append("g").style("display", "none");
    const ttBg = tooltip.append("rect").attr("fill", "#0f1f2e").attr("rx", 6).attr("ry", 6);
    const ttText = tooltip.append("text").attr("fill", "#fff").attr("font-size", 12).attr("font-weight", 600).attr("font-family", "'DM Sans', sans-serif");
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 3.5);
      link.attr("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15);
      linkLabels.attr("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15);
      node.attr("opacity", n => {
        if (n.id === d.id) return 1;
        return links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 1 : 0.2;
      });
      ttText.text(d.fullName + " — " + d.connCount + " kopplingar");
      const bbox = ttText.node().getBBox();
      ttBg.attr("x", bbox.x - 10).attr("y", bbox.y - 5).attr("width", bbox.width + 20).attr("height", bbox.height + 10);
      tooltip.attr("transform", "translate(" + (event.offsetX + 14) + "," + (event.offsetY - 24) + ")").style("display", null);
      setHovered(d.nr);
    }).on("mouseout", function() {
      node.attr("opacity", 1);
      d3.select(this).select("circle").attr("stroke-width", 2);
      link.attr("opacity", 1);
      linkLabels.attr("opacity", 1);
      tooltip.style("display", "none");
      setHovered(null);
    }).on("dblclick", function(event, d) {
      event.stopPropagation();
      if (onClickItem && dataMap[d.nr]) onClickItem(dataMap[d.nr]);
    });
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 10))
      .on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        linkLabels.attr("x", d => (d.source.x + d.target.x) / 2).attr("y", d => (d.source.y + d.target.y) / 2 - 5);
        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      });
    simRef.current = sim;
    const drag = d3.drag()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);
    return () => sim.stop();
  }, [starred, overridesCache, dims, dataMap]);
  if (starred.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a6a7a" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1B3A5C" }}>Inga prioriterade initiativ</p>
        <p style={{ fontSize: 13, color: "#3a4a5a" }}>Stjärnmarkera initiativ och skapa kopplingar i Prioriterade-fliken</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 16px", background: "#F6F8FA", borderBottom: "1px solid #D0D7DE", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1f2e" }}>Prio-nätverk</span>
        <span style={{ fontSize: 11, color: "#3a4a5a" }}>{starred.length} noder · Dblklick = detalj · Dra = flytta</span>
        <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
          {CONNECTION_CATS.map(cat => (
            <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: CAT_COLORS[cat] }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: CAT_COLORS[cat], display: "inline-block" }} />{cat}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg ref={svgRef} width={dims.w} height={dims.h} style={{ background: "#FAFBFC" }} />
      </div>
    </div>
  );
}
/* ─────────── GUIDE VIEW (Lathund) ─────────── */
function GuideView() {
  const sectionStyle = { background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
  const headingStyle = { fontSize: 14, fontWeight: 800, color: "#1B3A5C", marginBottom: 4, marginTop: 0, fontFamily: "'DM Sans', sans-serif" };
  const subStyle = { fontSize: 11.5, color: "#6B7280", marginBottom: 14, marginTop: 0 };
  const rowStyle = { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 120, flexShrink: 0 };
  const descStyle = { fontSize: 12, color: "#6B7280", lineHeight: 1.5 };
  const chipStyle = (bg, border, color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: bg, border: `1px solid ${border}`, color, marginRight: 4, marginBottom: 4 });
  const stepBox = (bg, border) => ({ flex: 1, background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center", position: "relative" });
  const arrowStyle = { display: "flex", alignItems: "center", fontSize: 22, color: "#9CA3AF", fontWeight: 300, padding: "0 2px" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px 0", fontFamily: "'DM Sans', sans-serif" }}>Aktivitetskartan — lathund</h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>97 hälsodatainitiativ — läs, analysera, redigera, kvalitetssäkra</p>
      </div>

      {/* TWO-COLUMN: Användare + Redaktör */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* LEFT — Användare */}
        <div style={{ ...sectionStyle, background: "#F0F7FF", borderColor: "#B8D4F0" }}>
          <h3 style={{ ...headingStyle, color: "#1A56DB" }}>Utforska och analysera</h3>
          <p style={subStyle}>Alla användare — ingen inloggning krävs</p>
          <div style={rowStyle}><span style={labelStyle}>Sök</span><span style={descStyle}>Fritext i headern — söker på namn, beskrivning, ansvarig och nummer</span></div>
          <div style={rowStyle}><span style={labelStyle}>Filter</span><span style={descStyle}>Del (A–D), underkategori, finansieringskälla, mognadsgrad, jurisdiktioner, taggar (4 kategorier), "Arbeta vidare", QA-godkänd</span></div>
          <div style={rowStyle}><span style={labelStyle}>6 vyer</span><span style={descStyle}>Kort, Matris, Nätverk, Karta, Kandidater, Lathund</span></div>
          <div style={rowStyle}><span style={labelStyle}>Sortering</span><span style={descStyle}>Rapportordning (nr), Namn A–Ö, AI-relevans, KCHD-relevans, Finansiering (MSEK)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Detaljmodal</span><span style={descStyle}>Klicka på ett kort → alla data, AI- och KCHD-poäng, nyttodimensioner, EHDS, beroenden, taggar</span></div>
          <div style={rowStyle}><span style={labelStyle}>Datafördjupning</span><span style={descStyle}>Utökade datafält: förmågor, domän, frekvens, standarder, kvalitet m.m. (9 fält per kort)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Jämför</span><span style={descStyle}>Kryssa 2–5 kort → jämför sida vid sida med all data och poäng</span></div>
          <div style={rowStyle}><span style={labelStyle}>Skriv ut</span><span style={descStyle}>Markera kort → genererar HTML-fil med all data → öppna + Ctrl+P för PDF</span></div>
          <div style={rowStyle}><span style={labelStyle}>Export / import</span><span style={descStyle}>Spara/ladda alla ändringar som JSON-fil (backup)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Expandera</span><span style={descStyle}>Alla modaler har helskärmsknapp (⊞) i övre hörnet</span></div>
        </div>

        {/* RIGHT — Redaktör */}
        <div style={{ ...sectionStyle, background: "#FFF9F0", borderColor: "#E8C9A0" }}>
          <h3 style={{ ...headingStyle, color: "#B45309" }}>Redigera och kvalitetssäkra</h3>
          <p style={subStyle}>Ändringar sparas automatiskt i Supabase (delat mellan alla)</p>
          <div style={rowStyle}><span style={labelStyle}>Redigera fält</span><span style={descStyle}>17 textfält + AI-poäng (6 dim.), KCHD-poäng (5 dim.), nyttodimensioner, taggar. Historik sparas (max 10 per fält)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Mognadsgrad</span><span style={descStyle}>6 nivåer: Planerad → Under uppbyggnad → Pilot/test → Operativ (begränsad) → Fullt implementerad → Avslutat</span></div>
          <div style={rowStyle}>
            <span style={labelStyle}>QA-kedja</span>
            <span style={descStyle}>
              4 steg: <span style={chipStyle("#E8F0FE","#4285F4","#1A56DB")}>AI-research</span>
              <span style={chipStyle("#E8F0FE","#4285F4","#1A56DB")}>Manuell redigering</span>
              <span style={chipStyle("#F3E8FE","#8B5CF6","#6D28D9")}>Ny AI-kontroll (frivillig)</span>
              <span style={chipStyle("#F0FFF4","#22C55E","#166534")}>Godkänd</span>
            </span>
          </div>
          <div style={rowStyle}><span style={labelStyle}>Informations&shy;insamling</span><span style={descStyle}>Bocka av metoder: desktop research (inkl AI), dialog med sakkunnig, granskad av sakkunnig, dialog i grupp + fritextfält</span></div>
          <div style={rowStyle}><span style={labelStyle}>Jurisdiktioner</span><span style={descStyle}>13 regelverk (GDPR, PDL, EHDS, AI Act, MDR m.fl.) + fritextfält för övrigt</span></div>
          <div style={rowStyle}><span style={labelStyle}>Källor</span><span style={descStyle}>Lägg till URL + etikett per initiativ (obegränsat antal)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Arbeta vidare</span><span style={descStyle}>Stjärnmarkera kort (⭐) för att prioritera — filtrerbart</span></div>
          <div style={rowStyle}><span style={labelStyle}>Föreslå ändringar</span><span style={descStyle}>Fritext per kort — sparas separat, syns vid utskrift</span></div>
          <div style={rowStyle}><span style={labelStyle}>Datafördjupning</span><span style={descStyle}>Redigera 9 datafält: förmåga (checkboxar + text), domän, frekvens, datatyp, datamängd, källsystem, IoT/sensor, standarder, kvalitet</span></div>
          <div style={rowStyle}><span style={labelStyle}>Kandidater</span><span style={descStyle}>Föreslå nya initiativ som kan bli egna kort — med prioritet, status, EHDS-relevans</span></div>
        </div>
      </div>

      {/* QA PROCESS */}
      <div style={{ ...sectionStyle, background: "#F0FFF4", borderColor: "#A7D7B8", marginBottom: 20 }}>
        <h3 style={{ ...headingStyle, color: "#166534", textAlign: "center" }}>Kvalitetsprocess — från AI-utkast till godkänt kort</h3>
        <p style={{ ...subStyle, textAlign: "center" }}>Varje kort genomgår upp till 4 steg. Steg 3 är frivilligt.</p>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginTop: 16, marginBottom: 16 }}>
          <div style={stepBox("#E8F0FE", "#4285F4")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1A56DB", marginBottom: 4 }}>1. AI-research</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Grunddata genereras</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>AI samlar in och strukturerar information om varje initiativ</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#FFF9F0", "#E8913A")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#B45309", marginBottom: 4 }}>2. Manuell redigering</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Redaktör granskar</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Redigera textfält, sätt mognadsgrad, koppla jurisdiktioner, lägg till källor</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#F3E8FE", "#8B5CF6")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#6D28D9", marginBottom: 4 }}>3. Ny AI-kontroll</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Frivilligt steg</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Komplettera datafördjupning, verifiera fakta, korskontrollera</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#F0FFF4", "#22C55E")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 4 }}>4. Godkänd</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Klart att använda</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Kortet visas med grön bock (✅), filtrerbart som "QA-godkänd"</div>
          </div>
        </div>
      </div>

      {/* STRUCTURE — Del A–D */}
      <div style={{ ...sectionStyle, marginBottom: 20 }}>
        <h3 style={headingStyle}>Kartans struktur — 4 delar, 8 underkategorier</h3>
        <p style={subStyle}>Initiativen är organiserade i 4 delar med totalt 8 underkategorier</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { del: "A", label: "Infrastruktur & datadelning", color: "#4285F4", bg: "#E8F0FE", subs: ["A1 – Regionala initiativ", "A2 – Statliga initiativ", "A3 – EU / internationella"] },
            { del: "B", label: "TRE-miljöer", color: "#E8913A", bg: "#FEF3E2", subs: ["B – Trusted Research Environments"] },
            { del: "C", label: "Stödsystem & standarder", color: "#2D8A56", bg: "#E6F5EC", subs: ["C1 – Regionala stödsystem", "C2 – Statliga stödsystem", "C3 – EU / internationella stöd"] },
            { del: "D", label: "Lagstiftning & strategi", color: "#8B5CF6", bg: "#F3E8FE", subs: ["D – Lagstiftning, strategi & policy"] },
          ].map(d => (
            <div key={d.del} style={{ background: d.bg, border: `1px solid ${d.color}33`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: d.color, marginBottom: 4 }}>Del {d.del} — {d.label}</div>
              {d.subs.map(s => <div key={s} style={{ fontSize: 11, color: "#374151", marginBottom: 2 }}>• {s}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "12px 0", color: "#9CA3AF", fontSize: 11.5, lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4 }}>Alla ändringar sparas automatiskt i Supabase — delat mellan alla användare, alla enheter.</div>
        <div>Grunddata (97 initiativ) är inbakad i appen och uppdateras vid ny deploy.</div>
      </div>
    </div>
  );
}
/* ─────────── CANDIDATES VIEW (Kandidater) ─────────── */
const CANDIDATE_STATUSES = ["Föreslagen", "Under utredning", "Beslutad", "Avvisad"];
const CANDIDATE_PRIORITIES = ["Hög", "Medel", "Låg"];
const CANDIDATE_FIELDS = [
  { key: "namn", label: "Namn", type: "text", placeholder: "Initiativets namn" },
  { key: "organisation", label: "Organisation / ansvarig", type: "text", placeholder: "Vem driver detta?" },
  { key: "varforRelevant", label: "Varför relevant för KCHD?", type: "textarea", placeholder: "Kort motivering..." },
  { key: "kalla", label: "Källa / URL", type: "text", placeholder: "https://..." },
  { key: "prioritet", label: "Prioritet", type: "select", options: CANDIDATE_PRIORITIES },
  { key: "status", label: "Status i vår process", type: "select", options: CANDIDATE_STATUSES },
  { key: "foreslagenAv", label: "Föreslagen av", type: "text", placeholder: "Namn" },
  { key: "relateradeTill", label: "Relaterade befintliga initiativ (nr)", type: "text", placeholder: "t.ex. 56, 76" },
  { key: "ehdsRelevans", label: "EHDS-relevans", type: "text", placeholder: "Koppling till EHDS?" },
  { key: "noteringar", label: "Noteringar", type: "textarea", placeholder: "Övriga kommentarer..." },
];
const DEFAULT_CANDIDATES = [
  {
    id: 1, namn: "OMOP4Sweden (uppföljare/utökat)", organisation: "Swelife / GU / KI",
    varforRelevant: "OMOP CDM är central standard för EHDS sekundäranvändning. Befintligt kort #56 täcker piloten (aug–dec 2025, 500 kSEK) men en bredare svensk OMOP-satsning bör dokumenteras separat. SCIFI-PEARL vid GU och DARWIN EU-koppling motiverar eget kort för den större bilden.",
    kalla: "https://www.ohdsi.org", prioritet: "Hög", status: "Under utredning",
    foreslagenAv: "Peder", relateradeTill: "56, 55, 76, 30",
    ehdsRelevans: "Direkt — OMOP CDM nämns som möjlig standard för EHDS sekundäranvändning",
    noteringar: "Befintligt kort #56 täcker Vinnova-piloten. Denna kandidat avser ett bredare OMOP-ekosystem i Sverige.", datum: "2026-03-09"
  },
];
function CandidatesView() {
  const [candidates, setCandidates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  useEffect(() => {
    storageGet("candidates_list").then(data => {
      setCandidates(data && data.length ? data : DEFAULT_CANDIDATES);
      setLoaded(true);
    });
  }, []);
  const save = async (list) => {
    setCandidates(list);
    await storageSet("candidates_list", list);
  };
  const addNew = () => {
    const next = [...candidates, { id: Date.now(), namn: "", organisation: "", varforRelevant: "", kalla: "", prioritet: "Medel", status: "Föreslagen", foreslagenAv: "", relateradeTill: "", ehdsRelevans: "", noteringar: "", datum: new Date().toISOString().slice(0, 10) }];
    save(next);
    setEditingId(next[next.length - 1].id);
  };
  const updateField = (id, key, val) => {
    const next = candidates.map(c => c.id === id ? { ...c, [key]: val } : c);
    save(next);
  };
  const remove = (id) => {
    if (confirm("Ta bort denna kandidat?")) save(candidates.filter(c => c.id !== id));
  };
  const prioColor = (p) => p === "Hög" ? "#DC2626" : p === "Medel" ? "#F59E0B" : "#6B7280";
  const statusColor = (s) => s === "Beslutad" ? "#22C55E" : s === "Under utredning" ? "#3B82F6" : s === "Avvisad" ? "#9CA3AF" : "#8B5CF6";
  if (!loaded) return null;
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Kandidater — potentiella nya initiativ</h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{candidates.length} kandidater. Initiativ som kan bli egna kort i dashboarden.</p>
        </div>
        <button onClick={addNew} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>+ Ny kandidat</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {candidates.map(cand => {
          const isEditing = editingId === cand.id;
          return (
            <div key={cand.id} style={{ background: "#fff", border: "1px solid " + (cand.status === "Beslutad" ? "#86EFAC" : "#E5E7EB"), borderRadius: 10, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isEditing ? "#FAFBFC" : "#fff" }}
                onClick={() => setEditingId(isEditing ? null : cand.id)}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", flex: 1 }}>{cand.namn || "Namnlös kandidat"}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: prioColor(cand.prioritet), background: prioColor(cand.prioritet) + "14" }}>{cand.prioritet}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: statusColor(cand.status), background: statusColor(cand.status) + "14" }}>{cand.status}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{cand.datum}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{isEditing ? "▾" : "▸"}</span>
              </div>
              {/* Expanded edit area */}
              {isEditing && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {CANDIDATE_FIELDS.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 2 }}>{f.label}</label>
                      {f.type === "select" ? (
                        <select value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)}
                          style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" }}>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)} rows={2}
                          placeholder={f.placeholder} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
                      ) : (
                        <input value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)}
                          placeholder={f.placeholder} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" }} />
                      )}
                    </div>
                  ))}
                  <button onClick={() => remove(cand.id)} style={{ alignSelf: "flex-end", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B" }}>Ta bort kandidat</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ─────────── KONTINUITET & HÅLLBARHET VIEW ─────────── */
function newAnalysisObject() {
  return {
    id: Date.now(), namn: "", typ: ANALYSIS_OBJECT_TYPES[0], datum: new Date().toISOString().slice(0, 10),
    beslutssituation: "", avgransningar: "", analysfragor: "", beroda: "", ambitionsniva: "",
    bestallare: "", samordning: "", deltagare: [], ansvar: {},
    linkedInitiatives: [], underlag: "",
    leverantorer: [], legal: {}, dimensions: {}, riskbedomning: "", slutsatser: "", atgarder: "",
  };
}
function buildContinuityMarkdown(obj, allData) {
  const L = [];
  L.push("# Kontinuitetsanalys: " + (obj.namn || "Namnlöst analysobjekt"));
  L.push("");
  L.push("**Typ:** " + obj.typ + "  ");
  L.push("**Datum:** " + obj.datum);
  L.push("");
  L.push("## 1. Avgränsning & underlag");
  L.push("**Beslutssituation:** " + (obj.beslutssituation || "—"));
  L.push("**Avgränsningar:** " + (obj.avgransningar || "—"));
  L.push("**Analysfrågor:** " + (obj.analysfragor || "—"));
  L.push("**Berörda verksamheter & informationsflöden:** " + (obj.beroda || "—"));
  L.push("**Ambitionsnivå:** " + (obj.ambitionsniva || "—"));
  L.push("**Beställare:** " + (obj.bestallare || "—") + "  ");
  L.push("**Samordningsansvarig:** " + (obj.samordning || "—"));
  if (obj.deltagare && obj.deltagare.length) L.push("**Deltagande funktioner:** " + obj.deltagare.join("; "));
  if (obj.ansvar && Object.keys(obj.ansvar).some(k => obj.ansvar[k])) {
    L.push("");
    L.push("**Ansvarsfördelning:**");
    ANSVAR_OMRADEN.forEach(a => { if (obj.ansvar[a.key]) L.push("- " + a.label + ": " + obj.ansvar[a.key]); });
  }
  if (obj.linkedInitiatives && obj.linkedInitiatives.length) {
    const names = obj.linkedInitiatives.map(nr => { const d = allData.find(x => x.nr === nr); return d ? "Nr " + nr + " — " + d.n : "Nr " + nr; });
    L.push("**Kopplade initiativ:** " + names.join("; "));
  }
  L.push("**Underlag:** " + (obj.underlag || "—"));
  if (obj.leverantorer && obj.leverantorer.length) L.push("**Centrala leverantörer / plattformar:** " + obj.leverantorer.join(", "));
  L.push("");
  L.push("### Tillämpliga rättsliga ramverk");
  const relevant = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant);
  if (relevant.length === 0) L.push("_Inga markerade._");
  relevant.forEach(f => { L.push("- **" + f.namn + "**" + (obj.legal[f.key].note ? ": " + obj.legal[f.key].note : "")); });
  L.push("");
  L.push("## 2. Beroenden & dimensioner");
  CONTINUITY_DIMENSIONS.forEach(dim => {
    const d = (obj.dimensions && obj.dimensions[dim.key]) || {};
    const sc = d.level ? SCALE_BY_VALUE[d.level] : null;
    L.push("### " + dim.label + (sc ? " — _" + sc.label + "_" : ""));
    if (d.nulage) L.push("**Nuläge:** " + d.nulage);
    if (d.beroenden) L.push("**Beroenden:** " + d.beroenden);
    if (d.konsekvens) L.push("**Konsekvenser:** " + d.konsekvens);
    if (d.atgardsbehov) L.push("**Åtgärdsbehov:** " + d.atgardsbehov);
    L.push("");
  });
  L.push("## 3. Konsekvenser, risker & sårbarheter");
  L.push(obj.riskbedomning || "—");
  L.push("");
  L.push("## 4. Slutsatser & åtgärder");
  L.push("**Slutsatser:** " + (obj.slutsatser || "—"));
  L.push("**Rekommenderade åtgärder:** " + (obj.atgarder || "—"));
  return L.join("\n");
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function buildContinuityObjectHtml(obj, allData) {
  const e = escapeHtml;
  const dimRows = CONTINUITY_DIMENSIONS.map(dim => {
    const d = (obj.dimensions && obj.dimensions[dim.key]) || {};
    const sc = d.level ? SCALE_BY_VALUE[d.level] : null;
    const bodyBits = [];
    if (d.nulage) bodyBits.push("<b>Nuläge:</b> " + e(d.nulage));
    if (d.beroenden) bodyBits.push("<b>Beroenden:</b> " + e(d.beroenden));
    if (d.konsekvens) bodyBits.push("<b>Konsekvenser:</b> " + e(d.konsekvens));
    if (d.atgardsbehov) bodyBits.push("<b>Åtgärdsbehov:</b> " + e(d.atgardsbehov));
    const body = bodyBits.length ? bodyBits.join("<br>") : "<span style='color:#9CA3AF'>—</span>";
    const chipColor = sc ? sc.color : "#9CA3AF";
    const chipLabel = sc ? e(sc.label) : "Ej bedömt";
    return "<tr><th style='text-align:left;padding:8px;border:1px solid #E5E7EB;background:#FAFBFC;width:180px;vertical-align:top'>" +
      e(dim.label) + "<br><span style='display:inline-block;margin-top:4px;padding:2px 8px;border-radius:10px;font-size:10px;color:#fff;background:" + chipColor + "'>" + chipLabel + "</span></th>" +
      "<td style='padding:8px;border:1px solid #E5E7EB;font-size:11px;vertical-align:top'>" + body + "</td></tr>";
  }).join("");
  const legalItems = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant)
    .map(f => "<li><b>" + e(f.namn) + "</b>" + (obj.legal[f.key].note ? ": " + e(obj.legal[f.key].note) : "") + "</li>").join("");
  const initiativeItems = (obj.linkedInitiatives || []).map(nr => {
    const d = allData.find(x => x.nr === nr);
    return "<li>Nr " + nr + (d ? " — " + e(d.n) : "") + "</li>";
  }).join("");
  return "<section class='cont-obj'>" +
    "<h1>Kontinuitetsanalys: " + e(obj.namn || "Namnlöst analysobjekt") + "</h1>" +
    "<div class='meta'><b>Typ:</b> " + e(obj.typ) + " &middot; <b>Datum:</b> " + e(obj.datum) + "</div>" +
    "<h2>1. Avgränsning & underlag</h2>" +
    "<p><b>Beslutssituation:</b> " + (e(obj.beslutssituation) || "—") + "</p>" +
    "<p><b>Avgränsningar:</b> " + (e(obj.avgransningar) || "—") + "</p>" +
    "<p><b>Analysfrågor:</b> " + (e(obj.analysfragor) || "—") + "</p>" +
    "<p><b>Berörda verksamheter & informationsflöden:</b> " + (e(obj.beroda) || "—") + "</p>" +
    "<p><b>Ambitionsnivå:</b> " + (e(obj.ambitionsniva) || "—") + "</p>" +
    "<p><b>Beställare:</b> " + (e(obj.bestallare) || "—") + " &middot; <b>Samordningsansvarig:</b> " + (e(obj.samordning) || "—") + "</p>" +
    ((obj.deltagare && obj.deltagare.length) ? "<p><b>Deltagande funktioner:</b> " + obj.deltagare.map(e).join("; ") + "</p>" : "") +
    ((obj.ansvar && Object.keys(obj.ansvar).some(k => obj.ansvar[k])) ? "<p class='label'>Ansvarsfördelning</p><ul>" + ANSVAR_OMRADEN.filter(a => obj.ansvar[a.key]).map(a => "<li><b>" + e(a.label) + ":</b> " + e(obj.ansvar[a.key]) + "</li>").join("") + "</ul>" : "") +
    (initiativeItems ? "<p class='label'>Kopplade initiativ</p><ul>" + initiativeItems + "</ul>" : "") +
    "<p><b>Underlag:</b> " + (e(obj.underlag) || "—") + "</p>" +
    ((obj.leverantorer && obj.leverantorer.length) ? "<p><b>Centrala leverantörer / plattformar:</b> " + obj.leverantorer.map(e).join(", ") + "</p>" : "") +
    "<p class='label'>Tillämpliga rättsliga ramverk</p>" +
    (legalItems ? "<ul>" + legalItems + "</ul>" : "<p style='color:#9CA3AF'>Inga markerade.</p>") +
    "<h2>2. Beroenden & dimensioner</h2>" +
    "<table>" + dimRows + "</table>" +
    "<h2>3. Konsekvenser, risker & sårbarheter</h2>" +
    "<p>" + (e(obj.riskbedomning) || "—") + "</p>" +
    "<h2>4. Slutsatser & åtgärder</h2>" +
    "<p><b>Slutsatser:</b> " + (e(obj.slutsatser) || "—") + "</p>" +
    "<p><b>Rekommenderade åtgärder:</b> " + (e(obj.atgarder) || "—") + "</p>" +
    "</section>";
}
function openContinuityPrint(objs, allData) {
  const w = window.open("", "_blank");
  if (!w) return;
  const body = objs.map(o => buildContinuityObjectHtml(o, allData)).join("<div style='page-break-after:always'></div>");
  w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>Kontinuitetsanalys</title>" +
    "<style>" +
    "body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;max-width:900px;margin:24px auto;padding:0 24px;font-size:12px;line-height:1.5}" +
    "h1{font-size:20px;color:#1B3A5C;margin:0 0 6px}" +
    "h2{font-size:14px;color:#1B3A5C;margin:24px 0 8px;border-bottom:2px solid #E5E7EB;padding-bottom:4px}" +
    "table{border-collapse:collapse;width:100%;margin:8px 0}" +
    ".meta{color:#6B7280;font-size:11px;margin-bottom:6px}" +
    ".label{font-size:10px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-top:12px}" +
    "@media print{body{margin:0}}" +
    "</style></head><body>" + body +
    "<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>" +
    "</body></html>");
  w.document.close();
}
const contInput = { width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" };
const contLabel = { fontSize: 10, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 3, marginTop: 8 };

function ContChipsInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {values.map(v => (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 12, fontSize: 11, background: "#ECFEFF", color: "#0E7490", border: "1px solid #A5F3FC" }}>
              {v}
              <button onClick={() => onChange(values.filter(x => x !== v))} style={{ background: "none", border: "none", cursor: "pointer", color: "#0E7490", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder={placeholder} style={contInput} />
        <button onClick={add} style={{ padding: "4px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", whiteSpace: "nowrap" }}>Lägg till</button>
      </div>
    </div>
  );
}

function ContScalePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {CONTINUITY_SCALE.map(s => {
        const active = value === s.value;
        return (
          <button key={s.value} onClick={() => onChange(active ? null : s.value)}
            title={s.label}
            style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
              border: "1px solid " + (active ? s.color : "#E5E7EB"),
              background: active ? s.color : "#fff", color: active ? "#fff" : "#6B7280" }}>
            {s.short}
          </button>
        );
      })}
    </div>
  );
}

function ContInitiativePicker({ selected, allData, onToggle }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return allData.filter(d => !query || d.n.toLowerCase().includes(query) || String(d.nr).includes(query)).slice(0, 60);
  }, [q, allData]);
  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sök initiativ att koppla..." style={contInput} />
      <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: 6, marginTop: 6, padding: 4 }}>
        {list.map(d => {
          const on = selected.includes(d.nr);
          return (
            <label key={d.nr} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 4px", fontSize: 11, cursor: "pointer", color: "#374151" }}>
              <input type="checkbox" checked={on} onChange={() => onToggle(d.nr)} />
              <span><b>{d.nr}</b> — {d.n}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ContObjectEditor({ obj, onPatch, allData }) {
  const [step, setStep] = useState(1);
  const updateDim = (key, patch) => onPatch({ dimensions: { ...obj.dimensions, [key]: { ...(obj.dimensions[key] || {}), ...patch } } });
  const updateLegal = (key, patch) => onPatch({ legal: { ...obj.legal, [key]: { ...(obj.legal[key] || {}), ...patch } } });
  const toggleInit = (nr) => {
    const cur = obj.linkedInitiatives || [];
    onPatch({ linkedInitiatives: cur.includes(nr) ? cur.filter(x => x !== nr) : [...cur, nr] });
  };
  const stepBtn = (n) => (
    <button onClick={() => setStep(n)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
      border: step === n ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: step === n ? "#1B3A5C" : "#fff", color: step === n ? "#fff" : "#6B7280" }}>
      {n}. {CONTINUITY_STEPS[n - 1].label}
    </button>
  );
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 12px" }}>
        {[1, 2, 3, 4].map(stepBtn)}
        <div style={{ flex: 1 }} />
        <button onClick={() => downloadText("kontinuitetsanalys-" + (obj.namn || "objekt").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".md", buildContinuityMarkdown(obj, allData))}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>Exportera .md</button>
        <button onClick={() => openContinuityPrint([obj], allData)}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151" }}>Skriv ut / PDF</button>
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>{CONTINUITY_STEPS[step - 1].desc}</p>

      {step === 1 && (
        <div>
          <label style={contLabel}>Typ av analysobjekt</label>
          <select value={obj.typ} onChange={e => onPatch({ typ: e.target.value })} style={contInput}>
            {ANALYSIS_OBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={contLabel}>Beslutssituation som analysen ska stödja</label>
          <textarea value={obj.beslutssituation} onChange={e => onPatch({ beslutssituation: e.target.value })} rows={2} style={contInput}
            placeholder="T.ex. strategiskt vägval, belysa sårbarheter, förbereda upphandling, arkitekturstyrning..." />
          <label style={contLabel}>Avgränsningar (vad analysen inte omfattar)</label>
          <textarea value={obj.avgransningar || ""} onChange={e => onPatch({ avgransningar: e.target.value })} rows={2} style={contInput}
            placeholder="System, processer eller perspektiv som ligger utanför denna analys" />
          <label style={contLabel}>Analysfrågor som ska besvaras</label>
          <textarea value={obj.analysfragor || ""} onChange={e => onPatch({ analysfragor: e.target.value })} rows={2} style={contInput}
            placeholder="De konkreta frågor regionen vill ha svar på i denna analys" />
          <label style={contLabel}>Berörda verksamheter & kritiska informationsflöden</label>
          <textarea value={obj.beroda} onChange={e => onPatch({ beroda: e.target.value })} rows={2} style={contInput} />
          <label style={contLabel}>Ambitionsnivå</label>
          <input value={obj.ambitionsniva} onChange={e => onPatch({ ambitionsniva: e.target.value })} style={contInput} placeholder="Avgränsad / fördjupad / bred analys" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={contLabel}>Beställare</label>
              <input value={obj.bestallare || ""} onChange={e => onPatch({ bestallare: e.target.value })} style={contInput} placeholder="Namn / roll" />
            </div>
            <div>
              <label style={contLabel}>Samordningsansvarig</label>
              <input value={obj.samordning || ""} onChange={e => onPatch({ samordning: e.target.value })} style={contInput} placeholder="Namn / roll" />
            </div>
          </div>
          <label style={contLabel}>Deltagande funktioner / kompetenser</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {KOMPETENSER.map(k => {
              const on = (obj.deltagare || []).includes(k);
              return (
                <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer", fontSize: 11, color: "#374151" }}>
                  <input type="checkbox" checked={on} onChange={() => {
                    const cur = obj.deltagare || [];
                    onPatch({ deltagare: on ? cur.filter(x => x !== k) : [...cur, k] });
                  }} style={{ marginTop: 2 }} />
                  <span>{k}</span>
                </label>
              );
            })}
          </div>
          <label style={{ ...contLabel, marginTop: 12, fontSize: 11, color: "#1B3A5C", fontWeight: 700 }}>Ansvarsfördelning per perspektiv</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ANSVAR_OMRADEN.map(a => (
              <div key={a.key}>
                <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 2 }}>{a.label}</label>
                <input value={(obj.ansvar && obj.ansvar[a.key]) || ""} onChange={e => onPatch({ ansvar: { ...(obj.ansvar || {}), [a.key]: e.target.value } })}
                  style={contInput} placeholder="Namn / roll" />
              </div>
            ))}
          </div>
          <label style={contLabel}>Kopplade initiativ (från kartläggningen)</label>
          <ContInitiativePicker selected={obj.linkedInitiatives || []} allData={allData} onToggle={toggleInit} />
          <label style={contLabel}>Insamlat underlag (konsekvensanalyser, RSA, kontinuitetsplaner, avtal, arkitektur...)</label>
          <textarea value={obj.underlag} onChange={e => onPatch({ underlag: e.target.value })} rows={2} style={contInput} />
          <label style={contLabel}>Centrala leverantörer / plattformar (driver inlåsnings- och koncentrationsrisker)</label>
          <ContChipsInput values={obj.leverantorer || []} onChange={v => onPatch({ leverantorer: v })} placeholder="T.ex. Cambio COSMIC, Microsoft Azure, Oracle Health..." />
          <label style={{ ...contLabel, marginTop: 16, fontSize: 12, color: "#1B3A5C", fontWeight: 800 }}>Tillämpliga rättsliga ramverk & styrande krav</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LEGAL_FRAMEWORKS.map(f => {
              const lv = obj.legal[f.key] || {};
              return (
                <div key={f.key} style={{ border: "1px solid " + (lv.relevant ? "#BFDBFE" : "#F3F4F6"), borderRadius: 6, padding: "6px 8px", background: lv.relevant ? "#F5F9FF" : "#fff" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!lv.relevant} onChange={() => updateLegal(f.key, { relevant: !lv.relevant })} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 11 }}><b style={{ color: "#1B3A5C" }}>{f.namn}</b> <span style={{ color: "#9CA3AF" }}>— {f.varfor}</span></span>
                  </label>
                  {lv.relevant && (
                    <input value={lv.note || ""} onChange={e => updateLegal(f.key, { note: e.target.value })} style={{ ...contInput, marginTop: 4 }} placeholder="Bedömning för detta analysobjekt..." />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CONTINUITY_DIMENSIONS.map(dim => {
            const d = obj.dimensions[dim.key] || {};
            return (
              <div key={dim.key} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{dim.icon} {dim.label}</span>
                  <ContScalePicker value={d.level} onChange={v => updateDim(dim.key, { level: v })} />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 8px" }}>{dim.desc}</p>
                <div style={{ fontSize: 10, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "6px 8px", marginBottom: 8 }}>
                  Frågor att besvara: {dim.questions.join(" · ")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><label style={contLabel}>Nuläge</label><textarea value={d.nulage || ""} onChange={e => updateDim(dim.key, { nulage: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Beroenden</label><textarea value={d.beroenden || ""} onChange={e => updateDim(dim.key, { beroenden: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Konsekvenser</label><textarea value={d.konsekvens || ""} onChange={e => updateDim(dim.key, { konsekvens: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Åtgärdsbehov</label><textarea value={d.atgardsbehov || ""} onChange={e => updateDim(dim.key, { atgardsbehov: e.target.value })} rows={2} style={contInput} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>Väg samman konsekvenser för verksamhetskontinuitet, informations- och cybersäkerhet, juridik, ekonomi, kompetens, upphandling och interoperabilitet om beroendena brister.</p>
          <textarea value={obj.riskbedomning} onChange={e => onPatch({ riskbedomning: e.target.value })} rows={10} style={contInput} />
        </div>
      )}

      {step === 4 && (
        <div>
          <label style={contLabel}>Slutsatser (centrala beroenden, koncentrationer, inlåsningseffekter)</label>
          <textarea value={obj.slutsatser} onChange={e => onPatch({ slutsatser: e.target.value })} rows={5} style={contInput} />
          <label style={contLabel}>Rekommenderade prioriteringar & åtgärder</label>
          <textarea value={obj.atgarder} onChange={e => onPatch({ atgarder: e.target.value })} rows={5} style={contInput} />
        </div>
      )}
    </div>
  );
}

function ContOverview({ objects, allData, onExportAll }) {
  if (objects.length === 0) return <p style={{ fontSize: 13, color: "#9CA3AF", padding: 20 }}>Inga analysobjekt än. Lägg till objekt under fliken Analysobjekt.</p>;
  const supplierMap = {};
  objects.forEach(o => {
    (o.leverantorer || []).forEach(s => {
      const k = s && s.trim(); if (!k) return;
      if (!supplierMap[k]) supplierMap[k] = { name: k, objects: [], initSet: new Set() };
      supplierMap[k].objects.push(o);
      (o.linkedInitiatives || []).forEach(nr => supplierMap[k].initSet.add(nr));
    });
  });
  const suppliers = Object.values(supplierMap).sort((a, b) => (b.objects.length - a.objects.length) || (b.initSet.size - a.initSet.size));
  const maxObjs = Math.max(1, ...suppliers.map(s => s.objects.length));
  const cell = (level) => {
    const sc = level ? SCALE_BY_VALUE[level] : null;
    return <td style={{ textAlign: "center", padding: 4 }}>
      <span title={sc ? sc.label : "Ej bedömt"} style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: sc ? sc.color : "#E5E7EB" }} />
    </td>;
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: 0 }}>Sårbarhets-heatmap — analysobjekt × dimensioner</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onExportAll} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>Exportera alla (.md)</button>
          <button onClick={() => openContinuityPrint(objects, allData)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151" }}>Skriv ut alla / PDF</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Analysobjekt</th>
              {CONTINUITY_DIMENSIONS.map(d => <th key={d.key} title={d.label} style={{ padding: "6px 4px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 16 }}>{d.icon}</th>)}
              <th title="Värsta läge bland dimensioner · antal bedömda" style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10 }}>Värsta · Bedömt</th>
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Ramverk</th>
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Initiativ</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => {
              const legalCount = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant).length;
              const dimLevels = CONTINUITY_DIMENSIONS.map(d => (obj.dimensions && obj.dimensions[d.key] && obj.dimensions[d.key].level) || null);
              const assessed = dimLevels.filter(v => v).length;
              const worst = dimLevels.reduce((acc, v) => (v && (!acc || SCALE_SEVERITY[v] > SCALE_SEVERITY[acc])) ? v : acc, null);
              const worstSc = worst ? SCALE_BY_VALUE[worst] : null;
              return (
                <tr key={obj.id}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, color: "#1B3A5C" }}>
                    {obj.namn || "Namnlöst"} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>· {obj.typ}</span>
                  </td>
                  {CONTINUITY_DIMENSIONS.map(d => <React.Fragment key={d.key}>{cell((obj.dimensions && obj.dimensions[d.key] && obj.dimensions[d.key].level) || null)}</React.Fragment>)}
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                    {worstSc
                      ? <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: worstSc.color, color: "#fff" }}>{worstSc.short}</span>
                      : <span style={{ fontSize: 10, color: "#9CA3AF" }}>—</span>}
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{assessed}/6</span>
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{legalCount}</td>
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{(obj.linkedInitiatives || []).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {CONTINUITY_SCALE.map(s => (
          <span key={s.value} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6B7280" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />{s.label}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6B7280" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#E5E7EB", display: "inline-block" }} />Ej bedömt</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: "#9CA3AF" }}>
        {CONTINUITY_DIMENSIONS.map((d, i) => <span key={d.key}>{d.icon} {d.label}{i < CONTINUITY_DIMENSIONS.length - 1 ? "  ·  " : ""}</span>)}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: "28px 0 4px" }}>Leverantörskoncentration</h3>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>Vilka leverantörer och plattformar bär upp flest analysobjekt? Riskkoncentrationer enligt Metodstödet steg 2 (beroenden & inlåsning).</p>
      {suppliers.length === 0 ? (
        <p style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>Inga leverantörer angivna på analysobjekten än. Lägg till under steg 1.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {suppliers.map(s => (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "220px 1fr 140px", gap: 10, alignItems: "center" }}>
              <span title={s.objects.map(o => o.namn || "Namnlöst").join(", ")} style={{ fontSize: 12, color: "#1B3A5C", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <div style={{ background: "#F3F4F6", borderRadius: 4, height: 14, overflow: "hidden" }}>
                <div style={{ background: "#0E7490", height: "100%", width: (s.objects.length / maxObjs * 100) + "%" }} />
              </div>
              <span style={{ fontSize: 10, color: "#6B7280" }}>{s.objects.length} objekt · {s.initSet.size} initiativ</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: "28px 0 4px" }}>Ramverkstäckning</h3>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>Vilka rättsliga ramverk har markerats som relevanta per analysobjekt? Hovra över en cell för bedömningstexten.</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Analysobjekt</th>
              {LEGAL_FRAMEWORKS.map(f => (
                <th key={f.key} title={f.namn + " — " + f.varfor} style={{ padding: "6px 6px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{LEGAL_KORT[f.key] || f.key}</th>
              ))}
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10 }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => {
              const count = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant).length;
              return (
                <tr key={obj.id}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, color: "#1B3A5C" }}>{obj.namn || "Namnlöst"}</td>
                  {LEGAL_FRAMEWORKS.map(f => {
                    const r = obj.legal && obj.legal[f.key];
                    const on = r && r.relevant;
                    return (
                      <td key={f.key} title={f.namn + (on && r.note ? " — " + r.note : "")} style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: on ? "#0E7490" : "#F3F4F6", border: on ? "none" : "1px solid #E5E7EB" }} />
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280", fontWeight: 600 }}>{count}</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ padding: "6px 8px", borderTop: "2px solid #E5E7EB", color: "#9CA3AF", fontSize: 10 }}>Σ objekt</td>
              {LEGAL_FRAMEWORKS.map(f => {
                const count = objects.filter(o => o.legal && o.legal[f.key] && o.legal[f.key].relevant).length;
                return <td key={f.key} style={{ textAlign: "center", padding: "6px 4px", borderTop: "2px solid #E5E7EB", color: "#9CA3AF", fontSize: 10 }}>{count || ""}</td>;
              })}
              <td style={{ borderTop: "2px solid #E5E7EB" }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContDependencyGraph({ objects, allData }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!svgRef.current || objects.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { w, h } = dims;
    const aoNodes = objects.map(o => {
      const levels = CONTINUITY_DIMENSIONS.map(d => (o.dimensions && o.dimensions[d.key] && o.dimensions[d.key].level) || null).filter(Boolean);
      const worst = levels.reduce((acc, v) => (!acc || SCALE_SEVERITY[v] > SCALE_SEVERITY[acc]) ? v : acc, null);
      return { id: "ao_" + o.id, type: "ao", label: o.namn || "Namnlöst", fullName: (o.namn || "Namnlöst") + " · " + o.typ, color: worst ? SCALE_BY_VALUE[worst].color : "#9CA3AF", r: 22 };
    });
    const linkedNrs = new Set();
    objects.forEach(o => (o.linkedInitiatives || []).forEach(nr => linkedNrs.add(nr)));
    const initNodes = [...linkedNrs].map(nr => {
      const d = allData.find(x => x.nr === nr);
      return { id: "init_" + nr, type: "init", nr, label: "#" + nr, fullName: d ? "Nr " + nr + " — " + d.n : "Nr " + nr, color: "#6B7280", r: 8 };
    });
    const supMap = {};
    objects.forEach(o => (o.leverantorer || []).forEach(s => {
      const k = (s || "").trim(); if (!k) return;
      if (!supMap[k]) supMap[k] = { id: "sup_" + k, type: "supplier", label: k, fullName: "Leverantör: " + k, color: "#0E7490", count: 0 };
      supMap[k].count++;
    }));
    const supplierNodes = Object.values(supMap).map(s => ({ ...s, r: Math.max(10, Math.min(24, 8 + s.count * 3)) }));
    const nodes = [...aoNodes, ...initNodes, ...supplierNodes];
    const links = [];
    objects.forEach(o => {
      const aoId = "ao_" + o.id;
      (o.linkedInitiatives || []).forEach(nr => links.push({ source: aoId, target: "init_" + nr, kind: "contains" }));
      (o.leverantorer || []).forEach(s => { const k = (s || "").trim(); if (k && supMap[k]) links.push({ source: aoId, target: supMap[k].id, kind: "provides" }); });
    });
    linkedNrs.forEach(nr => {
      const d = allData.find(x => x.nr === nr);
      if (!d || !d.dep) return;
      d.dep.split(",").map(s => parseInt(s.trim())).filter(Boolean).forEach(t => {
        if (linkedNrs.has(t) && nr < t) links.push({ source: "init_" + nr, target: "init_" + t, kind: "dep" });
      });
    });
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.kind === "contains" ? 55 : d.kind === "provides" ? 90 : 45).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius(d => d.r + 4));
    const link = svg.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", d => d.kind === "contains" ? "#D1D5DB" : d.kind === "provides" ? "#0E7490" : "#F87171")
      .attr("stroke-width", d => d.kind === "contains" ? 1.6 : 1.4)
      .attr("stroke-dasharray", d => d.kind === "dep" ? "3,3" : null)
      .attr("opacity", 0.65);
    const node = svg.append("g").selectAll("g").data(nodes).enter().append("g")
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHovered(d))
      .on("mouseleave", () => setHovered(null))
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.color)
      .attr("stroke", d => d.type === "ao" ? "#1B3A5C" : "#fff")
      .attr("stroke-width", d => d.type === "ao" ? 3 : 1.5);
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.r + 11)
      .attr("font-size", d => d.type === "ao" ? 11 : d.type === "supplier" ? 10 : 9)
      .attr("font-weight", d => d.type === "ao" ? 700 : 500)
      .attr("fill", "#1B3A5C")
      .attr("pointer-events", "none")
      .text(d => d.type === "init" ? d.label : (d.label.length > 22 ? d.label.substring(0, 22) + "…" : d.label));
    sim.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });
    return () => sim.stop();
  }, [objects, allData, dims]);
  if (objects.length === 0) return <p style={{ fontSize: 13, color: "#9CA3AF", padding: 20 }}>Inga analysobjekt än.</p>;
  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "calc(100vh - 260px)", minHeight: 500, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10 }}>
      <svg ref={svgRef} width={dims.w} height={dims.h} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.95)", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 10, color: "#6B7280", display: "flex", gap: 14, flexWrap: "wrap", maxWidth: "70%" }}>
        <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: "#22C55E", border: "2px solid #1B3A5C", verticalAlign: "middle", marginRight: 4 }} />Analysobjekt (färg = värsta läge)</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#6B7280", verticalAlign: "middle", marginRight: 4 }} />Kopplat initiativ</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#0E7490", verticalAlign: "middle", marginRight: 4 }} />Leverantör</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: "#D1D5DB", verticalAlign: "middle", marginRight: 4 }} />Ingår i</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: "#0E7490", verticalAlign: "middle", marginRight: 4 }} />Tillhandahålls av</span>
        <span><span style={{ display: "inline-block", width: 16, height: 0, borderTop: "2px dashed #F87171", verticalAlign: "middle", marginRight: 4 }} />Initiativ-beroende</span>
      </div>
      {hovered && (
        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(27,58,92,0.95)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 11, maxWidth: 480 }}>
          {hovered.type === "ao" ? "🛡️ " : hovered.type === "supplier" ? "🏭 " : ""}{hovered.fullName || hovered.label}
        </div>
      )}
    </div>
  );
}

function ContinuityView({ allData }) {
  const [objects, setObjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [subTab, setSubTab] = useState("objekt");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  useEffect(() => {
    storageGet("analysis_objects").then(data => { setObjects(Array.isArray(data) ? data : []); setLoaded(true); });
    const sub = subscribeToTable('analysis_objects', (payload) => {
      const row = payload.new;
      if (row && Array.isArray(row.data)) setObjects(row.data);
    });
    return () => sub.unsubscribe();
  }, []);
  const save = async (list) => { setObjects(list); await storageSet("analysis_objects", list); };
  const addNew = () => { const o = newAnalysisObject(); const next = [...objects, o]; save(next); setEditingId(o.id); setSubTab("objekt"); };
  const addFromInitiative = (init) => {
    const o = newAnalysisObject();
    o.namn = init.n;
    o.typ = "Dataplattform";
    o.linkedInitiatives = [init.nr];
    const next = [...objects, o]; save(next); setEditingId(o.id); setSubTab("objekt");
    setPickerOpen(false); setPickerQuery("");
  };
  const pickerHits = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return allData.filter(d => !q || d.n.toLowerCase().includes(q) || String(d.nr).includes(q)).slice(0, 40);
  }, [pickerQuery, allData]);
  const patch = (id, p) => save(objects.map(o => o.id === id ? { ...o, ...p } : o));
  const remove = (id) => { if (confirm("Ta bort detta analysobjekt?")) save(objects.filter(o => o.id !== id)); };
  const exportAll = () => {
    const text = objects.map(o => buildContinuityMarkdown(o, allData)).join("\n\n---\n\n");
    downloadText("kontinuitetsanalys-alla-" + new Date().toISOString().slice(0, 10) + ".md", text);
  };
  if (!loaded) return null;
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Kontinuitet & hållbarhet</h2>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Analys av den digitala försörjningskedjan med kontinuitetshantering som grund — enligt Metodstödet. Ett analysobjekt kan vara en systemmiljö, dataplattform, ett leverantörsberoende eller en informationskedja.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setSubTab("objekt")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "objekt" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "objekt" ? "#1B3A5C" : "#fff", color: subTab === "objekt" ? "#fff" : "#6B7280" }}>Analysobjekt</button>
        <button onClick={() => setSubTab("oversikt")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "oversikt" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "oversikt" ? "#1B3A5C" : "#fff", color: subTab === "oversikt" ? "#fff" : "#6B7280" }}>Översikt</button>
        <button onClick={() => setSubTab("graf")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "graf" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "graf" ? "#1B3A5C" : "#fff", color: subTab === "graf" ? "#fff" : "#6B7280" }}>Beroendegraf</button>
        <div style={{ flex: 1 }} />
        {subTab === "objekt" && (
          <>
            <button onClick={() => { setPickerOpen(!pickerOpen); setPickerQuery(""); }} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #BFDBFE", background: pickerOpen ? "#DBEAFE" : "#F5F9FF", color: "#1A56DB" }}>+ Från initiativ</button>
            <button onClick={addNew} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>+ Tomt analysobjekt</button>
          </>
        )}
      </div>
      {subTab === "objekt" && pickerOpen && (
        <div style={{ border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, background: "#F5F9FF", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#1B3A5C", fontWeight: 700, marginBottom: 6 }}>Skapa kontinuitetsanalys utifrån ett befintligt initiativ</div>
          <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 8px" }}>Namn och koppling förifylls — du kan ändra typ och allt annat efteråt.</p>
          <input value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} autoFocus placeholder="Sök initiativ på namn eller nummer..." style={contInput} />
          <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6 }}>
            {pickerHits.length === 0 && <p style={{ padding: 10, fontSize: 11, color: "#9CA3AF", margin: 0 }}>Inga träffar.</p>}
            {pickerHits.map(d => (
              <button key={d.nr} onClick={() => addFromInitiative(d)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", borderBottom: "1px solid #F3F4F6", background: "transparent", cursor: "pointer", fontSize: 12, color: "#1B3A5C" }}>
                <b>Nr {d.nr}</b> — {d.n} <span style={{ color: "#9CA3AF", fontSize: 11 }}>· {d.typ}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {subTab === "oversikt" ? (
        <ContOverview objects={objects} allData={allData} onExportAll={exportAll} />
      ) : subTab === "graf" ? (
        <ContDependencyGraph objects={objects} allData={allData} />
      ) : objects.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9CA3AF", padding: "20px 0" }}>Inga analysobjekt än. Klicka "+ Nytt analysobjekt" för att börja en kontinuitetsanalys.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {objects.map(obj => {
            const isEditing = editingId === obj.id;
            return (
              <div key={obj.id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isEditing ? "#FAFBFC" : "#fff" }} onClick={() => setEditingId(isEditing ? null : obj.id)}>
                  {isEditing
                    ? <input value={obj.namn} onClick={e => e.stopPropagation()} onChange={e => patch(obj.id, { namn: e.target.value })} placeholder="Namn på analysobjekt" style={{ ...contInput, flex: 1, fontWeight: 700 }} />
                    : <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", flex: 1 }}>{obj.namn || "Namnlöst analysobjekt"}</span>}
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: "#1A56DB", background: "#E8F0FE" }}>{obj.typ}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{isEditing ? "▾" : "▸"}</span>
                </div>
                {isEditing && (
                  <div>
                    <ContObjectEditor obj={obj} onPatch={p => patch(obj.id, p)} allData={allData} />
                    <div style={{ padding: "0 16px 14px", textAlign: "right" }}>
                      <button onClick={() => remove(obj.id)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B" }}>Ta bort analysobjekt</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── ANALYSIS VIEW ─────────── */
function AnalysisView({ data, onClickItem }) {
  const [tab, setTab] = useState("A");
  const tabs = [
    { id: "A", label: "Förmågegap", icon: "📊", desc: "Vad behöver vi, vem har det?" },
    { id: "B", label: "Dockningsindex", icon: "🔌", desc: "Hur lätt kan vi koppla oss till detta?" },
    { id: "C", label: "Kluster", icon: "🔗", desc: "Vilka initiativ bildar ekosystem?" },
    { id: "D", label: "Mognadstrappa", icon: "📈", desc: "Vad bör vi göra i vilken ordning?" },
    { id: "E", label: "Regiongemensamt", icon: "🎯", desc: "Vad driver vi själva vs. dockar in i?" },
  ];
  const AI_DIMS = ["Datatillgång", "Teknik/IT", "Strategi", "Juridik", "Nyttokalkyler", "Kompetens"];
  const KCHD_DIMS = ["Teknik att docka in i", "Sekundäranvändning av hälsodata", "Data management & governance", "Variabelbeskrivningar/metadata", "Juridik"];
  const getAiScore = (item, dim) => (item.ai || []).find(a => a.name === dim)?.score || 0;
  const getKchdScore = (item, dim) => (item.kchd || []).find(k => k.name === dim)?.score || 0;
  const getKchdComment = (item, dim) => (item.kchd || []).find(k => k.name === dim)?.comment || "";
  const avgAi = (item) => { const scores = (item.ai || []).map(a => a.score); return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0; };
  const avgKchd = (item) => { const scores = (item.kchd || []).map(k => k.score); return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0; };
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  const fkLabel = (fk) => fk === "Regionerna" ? "Reg" : fk && fk.includes("Stat") ? "Stat" : "EU";
  const InitBadge = ({ item, showScore, score }) => (
    <div onClick={() => onClickItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, fontSize: 10.5, cursor: "pointer", background: typColor(item.typ) + "18", border: "1px solid " + typColor(item.typ) + "44", color: typColor(item.typ), fontWeight: 500, lineHeight: 1.2 }}
      onMouseEnter={e => e.currentTarget.style.background = typColor(item.typ) + "30"}
      onMouseLeave={e => e.currentTarget.style.background = typColor(item.typ) + "18"}>
      <span style={{ fontWeight: 700 }}>#{item.nr}</span>
      <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 28 ? item.n.substring(0, 28) + "…" : item.n}</span>
      {showScore && <span style={{ marginLeft: 2, fontWeight: 700, fontSize: 10, background: typColor(item.typ), color: "#fff", borderRadius: 4, padding: "1px 4px" }}>{score}</span>}
    </div>
  );
  // ─── ANALYS A: Förmågegap ───
  const renderA = () => {
    const dimData = AI_DIMS.map(dim => {
      const sorted = [...data].sort((a, b) => getAiScore(b, dim) - getAiScore(a, dim));
      const top = sorted.filter(i => getAiScore(i, dim) === 3).slice(0, 12);
      const mid = sorted.filter(i => getAiScore(i, dim) === 2).slice(0, 6);
      return { dim, top, mid, topCount: sorted.filter(i => getAiScore(i, dim) === 3).length };
    });
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>A. Förmågegap-matris</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Visar vilka initiativ som scorar högst (3) inom varje AI-dimension. Regionerna har ofta svag juridik- och kompetensförmåga — initiativen nedan kan fylla dessa luckor.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dimData.map(({ dim, top, mid, topCount }) => (
            <div key={dim} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{dim}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{topCount} initiativ med score 3</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {top.map(i => <InitBadge key={i.nr} item={i} showScore score={3} />)}
                {mid.slice(0, 4).map(i => <InitBadge key={i.nr} item={i} showScore score={2} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  // ─── ANALYS B: Dockningsindex ───
  const renderB = () => {
    const scored = data.map(item => {
      const dock = getKchdScore(item, "Teknik att docka in i");
      const sek = getKchdScore(item, "Sekundäranvändning av hälsodata");
      const varb = getKchdScore(item, "Variabelbeskrivningar/metadata");
      const raw = dock + sek + varb;
      const fkBonus = item.fk === "Regionerna" ? 1.5 : item.fk && item.fk.includes("Stat") ? 1.0 : 0.7;
      const index = (raw * fkBonus).toFixed(1);
      return { ...item, dockIndex: parseFloat(index), rawDock: raw, dock, sek, varb, fkBonus };
    }).sort((a, b) => b.dockIndex - a.dockIndex);
    const top20 = scored.slice(0, 20);
    const maxIdx = top20[0]?.dockIndex || 1;
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>B. Dockningsindex</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Rankad lista baserad på KCHD-relevans (Teknik att docka + Sekundäranvändning + Variabelbeskrivningar) × finansieringsnärhet (Regionerna: ×1.5, Stat: ×1.0, EU: ×0.7). Högre = lättare att börja samarbeta med.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {top20.map((item, idx) => (
            <div key={item.nr} onClick={() => onClickItem(item)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: idx < 3 ? "#F0FFF4" : idx < 10 ? "#fff" : "#FAFAFA", border: "1px solid " + (idx < 3 ? "#86EFAC" : "#E5E7EB"), borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
              onMouseLeave={e => e.currentTarget.style.background = idx < 3 ? "#F0FFF4" : idx < 10 ? "#fff" : "#FAFAFA"}>
              <span style={{ fontSize: 14, fontWeight: 800, color: idx < 3 ? "#166534" : "#6B7280", width: 28, textAlign: "right" }}>{idx + 1}</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: typColor(item.typ), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", minWidth: 32 }}>#{item.nr}</span>
              <span style={{ fontSize: 11.5, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n}</span>
              <div style={{ width: 100, height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", width: (item.dockIndex / maxIdx * 100) + "%", background: idx < 3 ? "#22C55E" : idx < 10 ? "#4285F4" : "#9CA3AF", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: idx < 3 ? "#166534" : "#374151", width: 36, textAlign: "right" }}>{item.dockIndex}</span>
              <span style={{ fontSize: 9, color: "#9CA3AF", width: 28 }}>{fkLabel(item.fk)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  // ─── ANALYS C: Klusteranalys ───
  const renderC = () => {
    const nrSet = new Set(data.map(d => d.nr));
    const adj = {};
    data.forEach(d => { adj[d.nr] = new Set(); });
    data.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && nrSet.has(n)).forEach(n => {
        adj[d.nr].add(n); adj[n].add(d.nr);
      });
    });
    // Find connected components
    const visited = new Set();
    const clusters = [];
    data.forEach(d => {
      if (visited.has(d.nr)) return;
      const cluster = [];
      const queue = [d.nr];
      while (queue.length) {
        const nr = queue.shift();
        if (visited.has(nr)) continue;
        visited.add(nr);
        cluster.push(nr);
        (adj[nr] || new Set()).forEach(n => { if (!visited.has(n)) queue.push(n); });
      }
      clusters.push(cluster);
    });
    const sortedClusters = clusters.sort((a, b) => b.length - a.length);
    const dataMap = {};
    data.forEach(d => dataMap[d.nr] = d);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>C. Klusteranalys</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Visar sammanhängande ekosystem av initiativ. Att satsa på t.ex. precisionsmedicin kräver engagemang i hela klustret, inte bara ett initiativ. Kluster sorterade efter storlek.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedClusters.filter(cl => cl.length > 1).map((cl, idx) => {
            const items = cl.map(nr => dataMap[nr]).filter(Boolean).sort((a, b) => b.ai.reduce((s, x) => s + x.score, 0) - a.ai.reduce((s, x) => s + x.score, 0));
            const fkDist = {};
            items.forEach(i => { const fk = fkLabel(i.fk); fkDist[fk] = (fkDist[fk] || 0) + 1; });
            return (
              <div key={idx} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>Kluster {idx + 1}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{items.length} initiativ</span>
                  {Object.entries(fkDist).map(([fk, n]) => (
                    <span key={fk} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: fk === "Reg" ? "#E6F5EC" : fk === "Stat" ? "#F3F4F6" : "#EFF6FF", color: fk === "Reg" ? "#166534" : fk === "Stat" ? "#374151" : "#1A56DB" }}>{fk}: {n}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                  {items.map(i => <InitBadge key={i.nr} item={i} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ─── ANALYS D: Mognadstrappa ───
  const renderD = () => {
    const statusOrder = { "Operativt": 3, "Under uppbyggnad": 2, "Under driftsättning": 2, "Under utredning": 1, "Pågående uppdrag": 2, "Pågående": 2, "Nystartat": 1, "Avslutat": 0, "Avslutat/övergång": 0, "Ikraftträdd — implementation pågår": 2, "Remitterad": 1, "Beslutad": 2, "Beslutad strategi": 2, "Gällande lagstiftning": 3, "Gällande EU-förordning": 3, "Avslutad utredning, remissbehandling": 1 };
    const statusBucket = (st) => {
      const v = statusOrder[st];
      if (v === undefined) return 1;
      return v;
    };
    const statusLabel = (v) => v >= 3 ? "Operativt" : v >= 2 ? "Under uppbyggnad" : v >= 1 ? "Under utredning" : "Avslutat";
    const statusColor = (v) => v >= 3 ? "#22C55E" : v >= 2 ? "#F59E0B" : v >= 1 ? "#6366F1" : "#9CA3AF";
    const items = data.map(item => ({
      ...item,
      aiAvg: avgAi(item),
      maturity: statusBucket(item.st)
    }));
    const quadrants = [
      { label: "🎯 Nu — börja samverka idag", filter: i => i.maturity >= 3 && i.aiAvg >= 2, bg: "#F0FFF4", border: "#86EFAC" },
      { label: "⏳ Snart — förbered er", filter: i => i.maturity >= 2 && i.maturity < 3 && i.aiAvg >= 2, bg: "#FFFBEB", border: "#FCD34D" },
      { label: "👁 Bevaka — hög potential", filter: i => i.maturity < 2 && i.aiAvg >= 2, bg: "#EFF6FF", border: "#93C5FD" },
      { label: "📋 Låg prioritet", filter: i => i.aiAvg < 2, bg: "#F9FAFB", border: "#E5E7EB" },
    ];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>D. Mognadstrappa</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Korsrefererar mognad (status) med AI-relevans (genomsnittlig score). Operativa initiativ med hög AI-relevans är "low-hanging fruit" som regionerna kan börja samverka med idag.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {quadrants.map(q => {
            const matches = items.filter(q.filter).sort((a, b) => b.aiAvg - a.aiAvg);
            return (
              <div key={q.label} style={{ background: q.bg, border: "1px solid " + q.border, borderRadius: 10, padding: 14, minHeight: 100 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>{q.label} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>({matches.length})</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                  {matches.slice(0, 20).map(i => <InitBadge key={i.nr} item={i} showScore score={i.aiAvg.toFixed(1)} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ─── ANALYS E: Regiongemensamt vs. externt ───
  const renderE = () => {
    const groups = [
      { key: "drive", label: "🟢 Regionerna driver själva", desc: "Här bestämmer ni takten", filter: i => i.fk === "Regionerna", bg: "#F0FFF4", border: "#86EFAC" },
      { key: "adapt", label: "🔴 Regionerna måste anpassa sig", desc: "Lagstiftning och policy — följ med", filter: i => i.fk !== "Regionerna" && (i.typ || "").toLowerCase().includes("lagstiftning") || (i.typ || "").toLowerCase().includes("policy") || (i.typ || "").toLowerCase().includes("strategi"), bg: "#FEF2F2", border: "#FECACA" },
      { key: "dock", label: "🔵 Regionerna kan välja att docka in", desc: "Stat/EU-infrastruktur och samverkan — prioriteringsfrågan", filter: i => i.fk !== "Regionerna" && !((i.typ || "").toLowerCase().includes("lagstiftning") || (i.typ || "").toLowerCase().includes("policy") || (i.typ || "").toLowerCase().includes("strategi")), bg: "#EFF6FF", border: "#93C5FD" },
    ];
    // Avoid double-counting: assign each item to first matching group
    const assigned = new Set();
    const groupItems = groups.map(g => {
      const items = data.filter(i => !assigned.has(i.nr) && g.filter(i)).sort((a, b) => avgKchd(b) - avgKchd(a));
      items.forEach(i => assigned.add(i.nr));
      return { ...g, items };
    });
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>E. Regiongemensamt vs. externt — KCHD:s beslutsstöd</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Tredje gruppen (blå) är den strategiska prioriteringsfrågan: vilka externa initiativ ska regionerna aktivt docka in i? Sorterade efter KCHD-relevans.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groupItems.map(g => (
            <div key={g.key} style={{ background: g.bg, border: "1px solid " + g.border, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{g.label}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>({g.items.length} initiativ)</span>
              </div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 8px" }}>{g.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {g.items.map(i => <InitBadge key={i.nr} item={i} showScore score={avgKchd(i).toFixed(1)} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sub-tabs */}
      <div style={{ padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: tab === t.id ? "1px solid #4285F4" : "1px solid #E5E7EB", background: tab === t.id ? "#E8F0FE" : "#fff", color: tab === t.id ? "#1A56DB" : "#6B7280", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <span style={{ fontSize: 10, color: "#9CA3AF", alignSelf: "center", marginLeft: 8, fontStyle: "italic" }}>{tabs.find(t => t.id === tab)?.desc}</span>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {tab === "A" && renderA()}
        {tab === "B" && renderB()}
        {tab === "C" && renderC()}
        {tab === "D" && renderD()}
        {tab === "E" && renderE()}
      </div>
    </div>
  );
}
/* ─────────── NETWORK VIEW ─────────── */
function NetworkView({ data, onClickItem }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [focusNrs, setFocusNrs] = useState(new Set());
  const [hops, setHops] = useState(1);
  const [hovered, setHovered] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const simRef = useRef(null);
  const dataMap = useMemo(() => { const m = {}; data.forEach(d => m[d.nr] = d); return m; }, [data]);
  // Build full adjacency (bidirectional)
  const adj = useMemo(() => {
    const a = {};
    data.forEach(d => { a[d.nr] = new Set(); });
    data.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && a[n] !== undefined).forEach(n => {
        a[d.nr].add(n);
        a[n].add(d.nr);
      });
    });
    return a;
  }, [data]);
  // Expand from focus nodes by N hops
  const visibleNrs = useMemo(() => {
    if (focusNrs.size === 0) return new Set(data.map(d => d.nr));
    const visited = new Set(focusNrs);
    let frontier = new Set(focusNrs);
    for (let h = 0; h < hops; h++) {
      const next = new Set();
      frontier.forEach(nr => {
        (adj[nr] || new Set()).forEach(n => { if (!visited.has(n)) { visited.add(n); next.add(n); } });
      });
      frontier = next;
    }
    return visited;
  }, [focusNrs, hops, adj, data]);
  // Color by typ
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  const fkShape = (fk) => {
    if (fk === "Regionerna") return "circle";
    if (fk && fk.includes("Stat")) return "rect";
    return "diamond";
  };
  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  // d3-force simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const visData = data.filter(d => visibleNrs.has(d.nr));
    const visSet = new Set(visData.map(d => d.nr));
    const nodes = visData.map(d => ({
      id: d.nr, nr: d.nr, label: "#" + d.nr + " " + (d.n.length > 25 ? d.n.substring(0, 25) + "…" : d.n),
      shortLabel: "#" + d.nr,
      fullName: d.n, typ: d.typ, fk: d.fk, del: d.del,
      isFocus: focusNrs.has(d.nr),
      connections: (adj[d.nr] || new Set()).size,
      r: Math.max(8, Math.min(22, 6 + ((adj[d.nr] || new Set()).size) * 1.5))
    }));
    const links = [];
    const linkSet = new Set();
    visData.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && visSet.has(n)).forEach(n => {
        const key = Math.min(d.nr, n) + "-" + Math.max(d.nr, n);
        if (!linkSet.has(key)) { linkSet.add(key); links.push({ source: d.nr, target: n }); }
      });
    });
    const { w, h } = dims;
    const g = svg.append("g");
    // Zoom
    const zoom = d3.zoom().scaleExtent([0.2, 4]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);
    // Arrow marker
    svg.append("defs").append("marker").attr("id", "arrow").attr("viewBox", "0 -5 10 10").attr("refX", 20).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-4L10,0L0,4").attr("fill", "#CBD5E1");
    // Links
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#E5E7EB").attr("stroke-width", 1.5).attr("marker-end", "url(#arrow)");
    // Node groups
    const node = g.append("g").selectAll("g").data(nodes, d => d.id).join("g").attr("cursor", "pointer");
    // Draw shapes
    node.each(function(d) {
      const el = d3.select(this);
      const color = typColor(d.typ);
      const isFocus = d.isFocus;
      el.append("circle")
        .attr("r", d.r)
        .attr("fill", color + (isFocus ? "" : "CC"))
        .attr("stroke", isFocus ? "#0F2942" : color)
        .attr("stroke-width", isFocus ? 3 : 1.5);
    });
    // Labels
    node.append("text").text(d => d.shortLabel).attr("dy", d => d.r + 12).attr("text-anchor", "middle")
      .attr("font-size", 9).attr("font-weight", 600).attr("fill", "#374151").attr("font-family", "'DM Sans', sans-serif");
    // Hover tooltip
    const tooltip = svg.append("g").attr("class", "tooltip").style("display", "none");
    const ttBg = tooltip.append("rect").attr("fill", "#1B3A5C").attr("rx", 6).attr("ry", 6);
    const ttText = tooltip.append("text").attr("fill", "#fff").attr("font-size", 11).attr("font-family", "'DM Sans', sans-serif");
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 3).attr("stroke", "#0F2942");
      link.attr("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? typColor(d.typ) : "#E5E7EB")
        .attr("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1.5);
      ttText.text(d.fullName + " (" + d.connections + " koppl.)");
      const bbox = ttText.node().getBBox();
      ttBg.attr("x", bbox.x - 8).attr("y", bbox.y - 4).attr("width", bbox.width + 16).attr("height", bbox.height + 8);
      tooltip.attr("transform", "translate(" + (event.offsetX + 12) + "," + (event.offsetY - 20) + ")").style("display", null);
      setHovered(d.nr);
    }).on("mouseout", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", d.isFocus ? 3 : 1.5).attr("stroke", d.isFocus ? "#0F2942" : typColor(d.typ));
      link.attr("stroke", "#E5E7EB").attr("stroke-width", 1.5);
      tooltip.style("display", "none");
      setHovered(null);
    }).on("click", function(event, d) {
      event.stopPropagation();
      setFocusNrs(prev => {
        const next = new Set(prev);
        if (next.has(d.nr)) next.delete(d.nr); else next.add(d.nr);
        return next;
      });
    }).on("dblclick", function(event, d) {
      event.stopPropagation();
      onClickItem(dataMap[d.nr]);
    });
    svg.on("click", () => {}); // prevent zoom reset
    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 6))
      .on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      });
    simRef.current = sim;
    // Drag
    const drag = d3.drag()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);
    return () => sim.stop();
  }, [data, visibleNrs, focusNrs, dims, adj, dataMap]);
  // Search suggestions
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const t = searchTerm.toLowerCase();
    return data.filter(d => (d.n.toLowerCase().includes(t) || ("#" + d.nr).includes(t))).slice(0, 8);
  }, [searchTerm, data]);
  const toggleFocus = (nr) => {
    setFocusNrs(prev => { const n = new Set(prev); if (n.has(nr)) n.delete(nr); else n.add(nr); return n; });
    setSearchTerm("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 8, padding: "4px 10px", border: "1px solid #E5E7EB" }}>
            <Search size={13} color="#9CA3AF" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Sök initiativ att fokusera..." style={{ border: "none", background: "transparent", fontSize: 11, outline: "none", width: 160 }} />
          </div>
          {suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {suggestions.map(d => (
                <div key={d.nr} onClick={() => toggleFocus(d.nr)} style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", borderBottom: "1px solid #F3F4F6", background: focusNrs.has(d.nr) ? "#E8F0FE" : "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = focusNrs.has(d.nr) ? "#E8F0FE" : "#fff"}>
                  <span style={{ fontWeight: 700 }}>#{d.nr}</span> {d.n.length > 40 ? d.n.substring(0, 40) + "…" : d.n}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
          <span>Djup:</span>
          {[1, 2, 3].map(h => (
            <button key={h} onClick={() => setHops(h)} style={{ width: 24, height: 24, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: hops === h ? "1px solid #4285F4" : "1px solid #E5E7EB", background: hops === h ? "#E8F0FE" : "#fff", color: hops === h ? "#1A56DB" : "#6B7280" }}>{h}</button>
          ))}
        </div>
        {focusNrs.size > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {[...focusNrs].map(nr => (
              <span key={nr} onClick={() => toggleFocus(nr)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "#0F2942", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                #{nr} ×
              </span>
            ))}
            <button onClick={() => setFocusNrs(new Set())} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "none", border: "1px solid #E5E7EB", cursor: "pointer", color: "#6B7280" }}>Visa alla</button>
          </div>
        )}
        <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>{visibleNrs.size} noder · Klicka = fokus · Dblklick = detalj · Dra = flytta</span>
      </div>
      {/* Legend */}
      <div style={{ padding: "6px 16px", background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 16, fontSize: 10, color: "#6B7280" }}>
        {[["#4285F4", "Infrastruktur"], ["#E8913A", "Samverkan/forskning"], ["#8B5CF6", "Superdatorcentra"], ["#DC2626", "Lagstiftning/policy"]].map(([col, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: col, display: "inline-block" }} /> {label}
          </span>
        ))}
      </div>
      {/* SVG canvas */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg ref={svgRef} width={dims.w} height={dims.h} style={{ background: "#FAFBFC" }} />
      </div>
    </div>
  );
}
function MatrixView({ data, onClickItem }) {
  const fkLabels = { "Regionerna": "Regionerna", "Stat, inkl myndigheter och/eller privat": "Stat / myndigheter", "EU": "EU" };
  const fkKeys = ["Regionerna", "Stat, inkl myndigheter och/eller privat", "EU"];
  const typBuckets = {
    infra: { label: "Digital infrastruktur för datadelning", match: t => t && t.toLowerCase().includes("infrastruktur") },
    samverkan: { label: "Samverkan / demonstrator / forskning", match: t => t && (t.includes("Samverkan") || t.toLowerCase().includes("forskning")) },
    super: { label: "Superdatorcentra för känslig data", match: t => t && t.includes("Superdator") },
    lagstiftning: { label: "Lagstiftning / strategi / policy", match: t => t && (t.includes("Lagstiftning") || t.includes("strategi") || t.includes("policy")) }
  };
  const typKeys = ["infra", "samverkan", "super", "lagstiftning"];
  const typColors = {
    infra: { bg: "#E8F0FE", text: "#1A56DB", border: "#4285F4" },
    samverkan: { bg: "#FEF3E2", text: "#B45309", border: "#E8913A" },
    super: { bg: "#F3E8FE", text: "#6D28D9", border: "#8B5CF6" },
    lagstiftning: { bg: "#FEE2E2", text: "#991B1B", border: "#DC2626" }
  };
  const getCell = (fk, typKey) => data.filter(i => i.fk === fk && typBuckets[typKey].match(i.typ));
  const activeTypKeys = typKeys.filter(tk => fkKeys.some(fk => getCell(fk, tk).length > 0));
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif" }}>Sexfältare (Typ × Finansieringskälla)</h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{data.length} initiativ fördelade på typ och finansieringskälla. Använd filter i sidofältet för att välja urval.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px repeat(3, 1fr)", gap: 8 }}>
        <div />
        {fkKeys.map(fk => (
          <div key={fk} style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#166534", background: "#E6F5EC", borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}>{fkLabels[fk]}</div>
        ))}
        {activeTypKeys.map(tk => (
          <React.Fragment key={tk}>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: typColors[tk].text, background: typColors[tk].bg, borderRadius: 8, fontFamily: "'DM Sans', sans-serif", borderLeft: "4px solid " + typColors[tk].border, lineHeight: 1.3 }}>{typBuckets[tk].label}</div>
            {fkKeys.map(fk => {
              const items = getCell(fk, tk);
              return (
                <div key={fk + "-" + tk} style={{ background: items.length > 0 ? "#fff" : "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: items.length > 8 ? 10 : 14, minHeight: 60, maxHeight: 340, overflowY: items.length > 8 ? "auto" : "visible" }}>
                  {items.length === 0 ? <span style={{ fontSize: 11, color: "#CBD5E1", fontStyle: "italic" }}>Inga</span> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {items.map(item => {
                        const delCol = {A:"#4285F4",B:"#E8913A",C:"#2D8A56",D:"#8B5CF6"}[item.del] || "#6B7280";
                        return (
                          <div key={item.nr} onClick={() => onClickItem(item)} style={{ padding: "5px 8px", borderRadius: 5, cursor: "pointer", background: typColors[tk].bg, border: "1px solid " + typColors[tk].border + "33", fontSize: 11, lineHeight: 1.25, color: typColors[tk].text, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
                            onMouseEnter={e => { e.currentTarget.style.background = typColors[tk].border + "22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = typColors[tk].bg; }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>#{item.nr}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 38 ? item.n.substring(0, 38) + "…" : item.n}</span>
                            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: delCol, background: delCol + "18", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{item.sub}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {items.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{items.length} initiativ</div>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
/* ─────────── MAIN DASHBOARD ─────────── */
export default function Dashboard() {
  const [filters, setFilters] = useState({ del: [], sub: [], fk: [], maturity: [], jurisdictions: [], arbetaVidere: false, qaApproved: false, tags: {} });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [detailItem, setDetailItem] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overridesCache, setOverridesCache] = useState({});
  const [analysisObjects, setAnalysisObjects] = useState([]);
  useEffect(() => {
    // Load all overrides from Supabase in one query
    getAllOverrides().then(cache => setOverridesCache(cache)).catch(() => {});
    // Subscribe to realtime changes so all users see updates instantly
    const sub = subscribeToTable('overrides', (payload) => {
      if (payload.eventType === 'DELETE') {
        setOverridesCache(prev => { const next = { ...prev }; delete next[payload.old.nr]; return next; });
      } else {
        const row = payload.new;
        setOverridesCache(prev => ({ ...prev, [row.nr]: row.data }));
      }
    });
    return () => sub.unsubscribe();
  }, []);
  useEffect(() => {
    getAnalysisObjects().then(list => setAnalysisObjects(Array.isArray(list) ? list : [])).catch(() => {});
    const sub = subscribeToTable('analysis_objects', (payload) => {
      const row = payload.new;
      if (row && Array.isArray(row.data)) setAnalysisObjects(row.data);
    });
    return () => sub.unsubscribe();
  }, []);
  const printSelected = useCallback(async () => {
    const items = DATA.filter(i => selected.has(i.nr));
    if (items.length === 0) return;
    // Fetch deepdive + suggestion data for all selected items
    const ddMap = {};
    const sugMap = {};
    for (const item of items) {
      const dd = await storageGet("deepdive:" + item.nr);
      ddMap[item.nr] = dd || DEEPDIVE_DEFAULTS[item.nr] || null;
      const sug = await storageGet("suggestion:" + item.nr);
      sugMap[item.nr] = sug || null;
    }
    const DN = { A: "Del A", B: "Del B", C: "Del C", D: "Del D" };
    const esc = (s) => s ? String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : "";
    const scoreBadge = (arr) => (arr||[]).map(a =>
      "<span style='display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;margin:1px 2px;" +
      (a.score===3?"background:#D1FAE5;color:#065F46":a.score===2?"background:#FEF3C7;color:#92400E":"background:#F3F4F6;color:#6B7280") +
      "'>"+esc(a.name)+": "+a.score+" ("+esc(a.comment)+")</span>"
    ).join("");
    const nyttaHtml = (arr) => (arr||[]).map(n =>
      "<div style='margin-bottom:2px'><span style='display:inline-block;width:70px;font-weight:600;font-size:9px;color:#4285F4;text-transform:uppercase'>"+esc(n.level)+"</span> <span style='font-size:10.5px'>"+esc(n.text)+"</span></div>"
    ).join("");
    const tagHtml = (arr) => (arr||[]).map(t =>
      "<span style='display:inline-block;padding:1px 6px;border-radius:8px;font-size:9px;margin:1px;background:#F3F4F6;color:#374151'>"+esc(t.category)+": "+esc(t.values)+"</span>"
    ).join("");
    const ddFieldLabels = {
      formaga: "Datarelaterad f\u00f6rm\u00e5ga",
      doman: "Datadom\u00e4n / verksamhetsdata",
      frekvens: "Realtid/frekvens",
      datatyp: "Datatyp/format",
      datamangd: "Datam\u00e4ngd/omfattning",
      kallsystem: "K\u00e4llsystem",
      iot: "IoT/sensordata",
      standarder: "Standarder och modeller",
      kvalitet: "Dataf\u00f6rberedelser och kvalitet"
    };
    const deepdiveHtml = (dd) => {
      if (!dd) return "";
      var rows = "";
      // Förmåga (checks + text)
      var checks = (dd.formaga_checks || []).map(c => "<span style='display:inline-block;padding:2px 8px;border-radius:12px;font-size:9.5px;margin:1px;background:#E8F0FE;color:#1A56DB;font-weight:500'>&#10003; "+esc(c)+"</span>").join("");
      var fText = dd.formaga_text ? "<div style='font-size:10.5px;margin-top:3px'>"+esc(dd.formaga_text)+"</div>" : "";
      if (checks || fText) rows += "<div style='margin-bottom:6px'><div style='font-weight:600;font-size:10px;color:#374151;margin-bottom:2px'>Datarelaterad f\u00f6rm\u00e5ga</div>"+checks+fText+"</div>";
      // Remaining 8 fields
      var keys = ["doman","frekvens","datatyp","datamangd","kallsystem","iot","standarder","kvalitet"];
      keys.forEach(function(k) {
        var val = dd[k];
        if (val && val.trim()) {
          rows += "<div style='margin-bottom:4px'><span style='font-weight:600;font-size:10px;color:#374151'>"+ddFieldLabels[k]+":</span> <span style='font-size:10.5px'>"+esc(val)+"</span></div>";
        }
      });
      if (!rows) return "";
      return "<div style='font-weight:700;font-size:11px;color:#8B5CF6;margin-top:10px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>Dataf\u00f6rdjupning</div>" + rows;
    };
    const cards = items.map(item => {
      const aiT = (item.ai||[]).reduce((s,a) => s+a.score, 0);
      const kT = (item.kchd||[]).reduce((s,a) => s+a.score, 0);
      const dd = ddMap[item.nr];
      const sug = sugMap[item.nr];
      return "<div style='page-break-inside:avoid;border:1px solid #ccc;border-radius:8px;padding:16px 18px;margin-bottom:14px'>" +
        "<div style='display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:2px solid #1A56DB;padding-bottom:6px'>" +
        "<span style='font-weight:800;font-size:15px;color:#1A56DB'>#"+item.nr+"</span>" +
        "<span style='font-weight:700;font-size:13px;color:#1B3A5C'>"+esc(item.n)+"</span>" +
        "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#E8F0FE;color:#1A56DB'>"+(DN[item.del]||item.del)+"</span></div>" +
        "<div style='font-size:11px;line-height:1.6;color:#374151'>" +
        "<div><b>Ansvarig:</b> "+esc(item.ans)+"</div>" +
        "<div><b>Typ:</b> "+esc(item.typ)+"</div>" +
        "<div><b>Finansiering:</b> "+esc(item.fk)+" &mdash; "+esc(item.fin)+"</div>" +
        "<div><b>Mognadsgrad:</b> "+esc(item.st)+" | <b>Tidplan:</b> "+esc(item.tid)+"</div>" +
        "<div><b>Fokus:</b> "+esc(item.fok)+"</div>" +
        "<div><b>M&aring;lgrupp:</b> "+esc(item.mg)+"</div>" +
        "</div>" +
        "<div style='margin-top:8px;font-size:11px;line-height:1.5;color:#374151'><b>Nyckelkarakt&auml;ristik:</b> "+esc(item.nk)+"</div>" +
        (item.ehds ? "<div style='margin-top:4px;font-size:11px'><b>EHDS-relevans:</b> "+esc(item.ehds)+"</div>" : "") +
        (item.wg_beskr ? "<div style='margin-top:8px;padding:8px 10px;background:#F0F7FF;border-radius:6px;border:1px solid #BFDBFE'><div style=\'font-size:10px;font-weight:700;color:#1A56DB;margin-bottom:3px;text-transform:uppercase\'>Arbetsgruppens beskrivning</div><div style=\'font-size:11px;color:#374151;line-height:1.5\'>"+esc(item.wg_beskr)+"</div></div>" : "") +
        (item.wg_tek ? "<div style='margin-top:4px;padding:8px 10px;background:#F5F3FF;border-radius:6px;border:1px solid #DDD6FE'><div style=\'font-size:10px;font-weight:700;color:#6D28D9;margin-bottom:3px;text-transform:uppercase\'>Teknologi och infrastruktur (arbetsgruppen)</div><div style=\'font-size:11px;color:#374151;line-height:1.5\'>"+esc(item.wg_tek)+"</div></div>" : "") +
        (item.korr ? "<div style='margin-top:4px;font-size:11px;color:#92400E'><b>Korrigering:</b> "+esc(item.korr)+"</div>" : "") +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:10px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>Nytta</div>" +
        nyttaHtml(item.nytta) +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:8px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>AI-relevans ("+aiT+"/18)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:2px'>"+scoreBadge(item.ai)+"</div>" +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:8px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>KCHD-relevans ("+kT+"/15)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:2px'>"+scoreBadge(item.kchd)+"</div>" +
        deepdiveHtml(dd) +
        "<div style='margin-top:8px;font-size:10.5px;line-height:1.5;color:#374151'>" +
        (item.ds && item.ds !== "Se nyckelkaraktäristik" ? "<div><b>Datastandarder:</b> "+esc(item.ds)+"</div>" : "") +
        (item.tek && item.tek !== "Se nyckelkaraktäristik" ? "<div><b>Teknisk milj&ouml;:</b> "+esc(item.tek)+"</div>" : "") +
        (item.akt && item.akt !== item.ans ? "<div><b>Akt&ouml;rer:</b> "+esc(item.akt)+"</div>" : "") +
        "</div>" +
        "<div style='margin-top:6px;display:flex;flex-wrap:wrap;gap:2px'>"+tagHtml(item.tags)+"</div>" +
        (item.dep ? "<div style='margin-top:6px;font-size:10.5px'><b>Beroenden:</b> "+esc(item.dep)+"</div>" : "") +
        (sug ? "<div style='margin-top:8px;padding:8px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:6px;font-size:10.5px'><b style='color:#B45309'>F&ouml;reslagna &auml;ndringar:</b> "+esc(sug)+"</div>" : "") +
        "</div>";
    }).join("");
    const fullHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Omv\u00e4rldsanalys - " + items.length + " initiativ</title>" +
      "<style>@page{margin:16mm 14mm;size:A4}body{font-family:Segoe UI,system-ui,-apple-system,sans-serif;color:#1B3A5C;font-size:11px;line-height:1.5;max-width:780px;margin:0 auto;padding:30px}" +
      "@media print{.no-print{display:none!important}}</style></head><body>" +
      "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:3px solid #1A56DB;padding-bottom:12px'>" +
      "<div><h1 style='font-size:20px;font-weight:800;color:#1B3A5C;margin:0 0 4px'>Omv\u00e4rldsanalys &mdash; " + items.length + " valda initiativ</h1>" +
      "<p style='font-size:12px;color:#6B7280;margin:0'>Utskriven " + new Date().toLocaleDateString("sv-SE") + " | KCHD / SKR</p></div>" +
      "<button class='no-print' onclick='window.print()' style='padding:8px 20px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid #4285F4;background:#4285F4;color:#fff;font-weight:600'>Skriv ut / Spara PDF</button></div>" +
      cards + "</body></html>";
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "initiativ_utskrift_" + new Date().toISOString().slice(0,10) + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }, [selected]);
  useEffect(() => {
    const handler = (e) => setDeepDiveItem(e.detail);
    document.addEventListener("openDeepDive", handler);
    return () => document.removeEventListener("openDeepDive", handler);
  }, []);
  const [viewMode, setViewMode] = useState("cards");
  const [ursprungFilter, setUrsprungFilter] = useState({ ursprunglig: false, ovriga: false });
  const [quickFilter, setQuickFilter] = useState({ kvalreg: false });
  const [deepdiveItem, setDeepDiveItem] = useState(null);
  const allSubs = useMemo(() => { const map = {}; DATA.forEach(i => { map[i.sub] = (map[i.sub] || 0) + 1; }); return Object.entries(map).sort((a, b) => { const order = ["A1","A2","A3","B","C1","C2","C3","D"]; return order.indexOf(a[0]) - order.indexOf(b[0]); }); }, []);
  const allTagsByCategory = useMemo(() => { const result = {}; TAG_CATS.forEach(cat => { const map = {}; DATA.forEach(i => getTagValues(i, cat).forEach(v => { map[v] = (map[v] || 0) + 1; })); result[cat] = Object.entries(map).sort((a, b) => b[1] - a[1]); }); return result; }, []);
  const filtered = useMemo(() => {
    let items = DATA;
    if (search.trim()) { const q = search.toLowerCase(); items = items.filter(i => i.n.toLowerCase().includes(q) || (i.nk && i.nk.toLowerCase().includes(q)) || (i.ans && i.ans.toLowerCase().includes(q)) || String(i.nr).includes(q)); }
    if (filters.del.length) items = items.filter(i => filters.del.includes(i.del));
    if (filters.sub.length) items = items.filter(i => filters.sub.includes(i.sub));
    if (filters.fk.length) items = items.filter(i => filters.fk.includes(i.fk));
    Object.entries(filters.tags).forEach(([cat, vals]) => { if (vals.length) { items = items.filter(i => { const tv = getTagValues(i, cat); return vals.some(v => tv.includes(v)); }); } });
    if (filters.maturity.length) items = items.filter(i => { const ov = overridesCache[i.nr]; const mat = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[i.st] || null); return mat && filters.maturity.includes(mat); });
    if (filters.jurisdictions.length) items = items.filter(i => { const ov = overridesCache[i.nr]; const juris = (ov && ov.jurisdictions) || []; return filters.jurisdictions.some(j => juris.includes(j)); });
    if (filters.arbetaVidere) items = items.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.arbetaVidere; });
    if (filters.qaApproved) items = items.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.qa && ov.qa.approved && ov.qa.approved.done; });
    if (ursprungFilter.ursprunglig !== ursprungFilter.ovriga) {
      if (ursprungFilter.ursprunglig) items = items.filter(i => { const tv = getTagValues(i, "Användning"); return tv.includes("ursprunglig"); });
      if (ursprungFilter.ovriga) items = items.filter(i => { const tv = getTagValues(i, "Användning"); return !tv.includes("ursprunglig"); });
    }
    if (quickFilter.kvalreg) items = items.filter(i => getTagValues(i, "Verksamhetstyp").includes("kvalitetsregister"));
    if (showOnlySelected) items = items.filter(i => selected.has(i.nr));
    return items;
  }, [search, filters, showOnlySelected, selected, ursprungFilter, quickFilter, overridesCache]);
  const sorted = useMemo(() => {
    let items = [...filtered];
    if (sortBy === "default") return items.sort((a, b) => a.nr - b.nr);
    if (sortBy === "name") return items.sort((a, b) => a.n.localeCompare(b.n, "sv"));
    if (sortBy === "ai_desc") return items.sort((a, b) => (b.ai.reduce((s, x) => s + x.score, 0) / (b.ai.length || 1)) - (a.ai.reduce((s, x) => s + x.score, 0) / (a.ai.length || 1)));
    if (sortBy === "kchd_desc") return items.sort((a, b) => (b.kchd.reduce((s, x) => s + x.score, 0) / (b.kchd.length || 1)) - (a.kchd.reduce((s, x) => s + x.score, 0) / (a.kchd.length || 1)));
    if (sortBy === "msek_desc") return items.sort((a, b) => parseMSEK(b.fin) - parseMSEK(a.fin));
    return items;
  }, [filtered, sortBy]);
  const stats = useMemo(() => { const msek = filtered.reduce((s, i) => s + parseMSEK(i.fin), 0); return { count: filtered.length, msek }; }, [filtered]);
  const activeFilterCount = useMemo(() => { let c = filters.del.length + filters.sub.length + filters.fk.length + filters.maturity.length + filters.jurisdictions.length + (filters.arbetaVidere ? 1 : 0) + (filters.qaApproved ? 1 : 0); Object.values(filters.tags).forEach(v => { c += v.length; }); if (search.trim()) c++; if (showOnlySelected) c++; if (ursprungFilter.ursprunglig !== ursprungFilter.ovriga) c++; if (quickFilter.kvalreg) c++; return c; }, [filters, search, showOnlySelected, ursprungFilter, quickFilter]);
  const toggleFilter = useCallback((key, value) => { setFilters(prev => { const arr = prev[key]; const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]; return { ...prev, [key]: next }; }); }, []);
  const toggleTagFilter = useCallback((cat, value) => { setFilters(prev => { const current = prev.tags[cat] || []; const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]; return { ...prev, tags: { ...prev.tags, [cat]: next } }; }); }, []);
  const clearFilters = useCallback(() => { setFilters({ del: [], sub: [], fk: [], maturity: [], jurisdictions: [], arbetaVidere: false, qaApproved: false, tags: {} }); setSearch(""); setShowOnlySelected(false); setUrsprungFilter({ ursprunglig: false, ovriga: false }); setQuickFilter({ kvalreg: false }); }, []);
  const toggleSelect = useCallback((nr) => { setSelected(prev => { const next = new Set(prev); if (next.has(nr)) next.delete(nr); else next.add(nr); return next; }); }, []);
  const activeChips = useMemo(() => {
    const chips = [];
    filters.del.forEach(v => chips.push({ label: `Del ${v}`, clear: () => toggleFilter("del", v) }));
    filters.sub.forEach(v => chips.push({ label: SUB_LABELS[v] || v, clear: () => toggleFilter("sub", v) }));
    filters.fk.forEach(v => chips.push({ label: FK_LABELS[v] || v, clear: () => toggleFilter("fk", v) }));
    Object.entries(filters.tags).forEach(([cat, vals]) => { vals.forEach(v => chips.push({ label: `${cat}: ${v}`, clear: () => toggleTagFilter(cat, v) })); });
    filters.maturity.forEach(v => { const ml = MATURITY_LEVELS.find(m => m.value === v); chips.push({ label: `Mognad: ${ml ? ml.label : v}`, clear: () => toggleFilter("maturity", v) }); });
    filters.jurisdictions.forEach(v => chips.push({ label: v, clear: () => toggleFilter("jurisdictions", v) }));
    if (filters.arbetaVidere) chips.push({ label: "Arbeta vidare", clear: () => setFilters(prev => ({ ...prev, arbetaVidere: false })) });
    if (filters.qaApproved) chips.push({ label: "QA-godkänd", clear: () => setFilters(prev => ({ ...prev, qaApproved: false })) });
    if (ursprungFilter.ursprunglig && !ursprungFilter.ovriga) chips.push({ label: "Ursprungliga 28", clear: () => setUrsprungFilter({ ursprunglig: false, ovriga: false }) });
    if (ursprungFilter.ovriga && !ursprungFilter.ursprunglig) chips.push({ label: "Övriga (ej ursprungliga)", clear: () => setUrsprungFilter({ ursprunglig: false, ovriga: false }) });
    if (quickFilter.kvalreg) chips.push({ label: "📋 Kvalitetsregister", clear: () => setQuickFilter({ kvalreg: false }) });
    if (showOnlySelected) chips.push({ label: `Visar ${selected.size} valda`, clear: () => setShowOnlySelected(false) });
    return chips;
  }, [filters, showOnlySelected, selected.size, toggleFilter, toggleTagFilter, ursprungFilter, quickFilter]);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>
      <div style={{ fontFamily: "'Source Sans 3', 'DM Sans', system-ui, sans-serif", background: "#F4F5F7", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOP HEADER */}
        <div style={{ background: "linear-gradient(135deg, #0F2942, #1B3A5C)", color: "#fff", padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.3 }}>Sveriges hälsodatainfrastruktur</h1>
              <p style={{ fontSize: 12, opacity: 0.7, margin: "2px 0 0" }}>97 initiativ — Interaktiv kartläggning</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", width: 280, border: "1px solid rgba(255,255,255,0.15)" }}>
              <Search size={15} style={{ opacity: 0.6, flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök initiativ…" style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, width: "100%" }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", opacity: 0.6, display: "flex", padding: 0 }}><X size={14} /></button>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Initiativ</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{stats.count}<span style={{ fontSize: 14, opacity: 0.5, fontWeight: 400 }}> / 97</span></div></div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Finansiering</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{stats.msek > 0 ? (stats.msek / 1000).toFixed(1) : "0"}<span style={{ fontSize: 14, opacity: 0.5, fontWeight: 400 }}> mdkr SEK</span></div></div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Valda</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{selected.size}</div></div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { const n = exportAllData(); alert(`Exporterade ${n} dataposter.`); }} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: 0.8 }} title="Exportera alla lokala data till fil"><Download size={13} />Export</button>
              <button onClick={async () => { const n = await importAllData(); if (n > 0) { alert(`Importerade ${n} dataposter. Sidan laddas om.`); window.location.reload(); } }} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: 0.8 }} title="Importera data från backup-fil"><Upload size={13} />Import</button>
            </div>
            {selected.size > 0 && <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowOnlySelected(!showOnlySelected)} style={{ background: showOnlySelected ? "#E8913A" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Filter size={13} />{showOnlySelected ? "Visa alla" : "Visa valda"}</button>
              <button onClick={printSelected} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Printer size={13} />Skriv ut ({selected.size})</button>
              {selected.size >= 2 && selected.size <= 5 && <button onClick={() => setShowCompare(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><GitCompare size={13} />Jämför ({selected.size})</button>}
              <button onClick={() => setSelected(new Set())} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "7px 10px", fontSize: 12, cursor: "pointer", opacity: 0.7, display: "flex" }}><XCircle size={14} /></button>
            </div>}
          </div>
          {activeChips.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, opacity: 0.5, marginRight: 2 }}>Filter:</span>
            {activeChips.map((chip, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>{chip.label}<button onClick={chip.clear} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button></span>)}
            <button onClick={clearFilters} style={{ fontSize: 11, color: "#fff", opacity: 0.6, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Rensa alla</button>
          </div>}
        </div>
        {/* MAIN LAYOUT */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* SIDEBAR */}
          <div style={{ width: sidebarOpen ? 260 : 44, transition: "width 0.25s ease", background: "#fff", borderRight: "1px solid #E5E7EB", overflow: "hidden", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#1B3A5C", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #F3F4F6" }}><Filter size={15} />{sidebarOpen && <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>}</button>
            {sidebarOpen && <div style={{ overflowY: "auto", flex: 1, padding: "8px 8px" }}>
              <div style={{ marginBottom: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Ursprung</div>
                <FilterCheck label="Ursprungliga 28" checked={ursprungFilter.ursprunglig} onChange={() => setUrsprungFilter(prev => ({ ...prev, ursprunglig: !prev.ursprunglig }))} count={DATA.filter(i => getTagValues(i, "Användning").includes("ursprunglig")).length} color="#0F2942" />
                <FilterCheck label="Övriga" checked={ursprungFilter.ovriga} onChange={() => setUrsprungFilter(prev => ({ ...prev, ovriga: !prev.ovriga }))} count={DATA.filter(i => !getTagValues(i, "Användning").includes("ursprunglig")).length} color="#6B7280" />
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "4px 12px 8px" }} />
              <div style={{ marginBottom: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Snabbfilter</div>
                <FilterCheck label="📋 Kvalitetsregister" checked={quickFilter.kvalreg} onChange={() => setQuickFilter(prev => ({ ...prev, kvalreg: !prev.kvalreg }))} count={DATA.filter(i => getTagValues(i, "Verksamhetstyp").includes("kvalitetsregister")).length} color="#0E7490" />
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "4px 12px 8px" }} />
              <FilterSection title="Finansieringskälla" icon={<Banknote size={13} />}>
                {["Regionerna", "Stat, inkl myndigheter och/eller privat", "EU"].map(fk => <FilterCheck key={fk} label={FK_LABELS[fk] || fk} checked={filters.fk.includes(fk)} onChange={() => toggleFilter("fk", fk)} count={DATA.filter(i => i.fk === fk).length} />)}
              </FilterSection>
              <FilterSection title="Mognadsgrad">
                {MATURITY_LEVELS.map(m => {
                  const count = DATA.filter(i => { const ov = overridesCache[i.nr]; const mat = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[i.st] || null); return mat === m.value; }).length;
                  return <FilterCheck key={m.value} label={m.label} checked={filters.maturity.includes(m.value)} onChange={() => toggleFilter("maturity", m.value)} count={count} color={m.color} />;
                })}
              </FilterSection>
              <FilterSection title="Jurisdiktioner">
                {JURISDICTIONS.map(j => {
                  const count = DATA.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.jurisdictions && ov.jurisdictions.includes(j); }).length;
                  return count > 0 ? <FilterCheck key={j} label={j.split(" — ")[0].split(" (")[0]} checked={filters.jurisdictions.includes(j)} onChange={() => toggleFilter("jurisdictions", j)} count={count} /> : null;
                })}
              </FilterSection>
              <FilterSection title="Arbetsstatus">
                <FilterCheck label="⭐ Arbeta vidare" checked={filters.arbetaVidere} onChange={() => setFilters(prev => ({ ...prev, arbetaVidere: !prev.arbetaVidere }))} count={Object.values(overridesCache).filter(ov => ov.arbetaVidere).length} color="#F59E0B" />
                <FilterCheck label="✅ QA-godkänd" checked={filters.qaApproved} onChange={() => setFilters(prev => ({ ...prev, qaApproved: !prev.qaApproved }))} count={Object.values(overridesCache).filter(ov => ov.qa && ov.qa.approved && ov.qa.approved.done).length} color="#22C55E" />
              </FilterSection>
              {TAG_CATS.map(cat => <FilterSection key={cat} title={cat} icon={<Tag size={13} />}>
                {(allTagsByCategory[cat] || []).map(([val, count]) => <FilterCheck key={val} label={val} checked={(filters.tags[cat] || []).includes(val)} onChange={() => toggleTagFilter(cat, val)} count={count} />)}
              </FilterSection>)}
            </div>}
          </div>
          {/* MAIN CONTENT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 8, padding: "4px 10px", border: "1px solid #E5E7EB", minWidth: 200 }}>
                <Search size={14} color="#9CA3AF" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök initiativ..." style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", width: "100%", color: "#374151" }} />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#9CA3AF" /></button>}
              </div>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{sorted.length} initiativ visas</span>
              <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
                <button onClick={() => setViewMode("cards")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "cards" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "cards" ? "#E8F0FE" : "#fff", color: viewMode === "cards" ? "#1A56DB" : "#6B7280" }}>Kort</button>
                <button onClick={() => setViewMode("matrix")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "matrix" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "matrix" ? "#E8F0FE" : "#fff", color: viewMode === "matrix" ? "#1A56DB" : "#6B7280" }}>Matris</button>
                <button onClick={() => setViewMode("network")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "network" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "network" ? "#E8F0FE" : "#fff", color: viewMode === "network" ? "#1A56DB" : "#6B7280" }}>Nätverk</button>
                <button onClick={() => setViewMode("map")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "map" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "map" ? "#E8F0FE" : "#fff", color: viewMode === "map" ? "#1A56DB" : "#6B7280" }}>Karta</button>
                <button onClick={() => setViewMode("prioritized")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "prioritized" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: viewMode === "prioritized" ? "#FFFBEB" : "#fff", color: viewMode === "prioritized" ? "#B45309" : "#6B7280" }}>⭐ Prioriterade</button>
                <button onClick={() => setViewMode("prionetwork")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "prionetwork" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: viewMode === "prionetwork" ? "#FFFBEB" : "#fff", color: viewMode === "prionetwork" ? "#B45309" : "#6B7280" }}>⭐ Prio-nätverk</button>
                <button onClick={() => setViewMode("continuity")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "continuity" ? "1px solid #0E7490" : "1px solid #E5E7EB", background: viewMode === "continuity" ? "#ECFEFF" : "#fff", color: viewMode === "continuity" ? "#0E7490" : "#6B7280" }}>🛡️ Kontinuitet</button>
                <button onClick={() => setViewMode("candidates")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "candidates" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "candidates" ? "#E8F0FE" : "#fff", color: viewMode === "candidates" ? "#1A56DB" : "#6B7280" }}>Kandidater</button>
                <button onClick={() => setViewMode("guide")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "guide" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "guide" ? "#E8F0FE" : "#fff", color: viewMode === "guide" ? "#1A56DB" : "#6B7280" }}>Lathund</button>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ArrowUpDown size={13} color="#9CA3AF" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}>
                  <option value="default">Rapportordning (Nr)</option>
                  <option value="name">Namn A–Ö</option>
                  <option value="ai_desc">AI-relevans (högst först)</option>
                  <option value="kchd_desc">KCHD-relevans (högst först)</option>
                  <option value="msek_desc">Finansiering (störst först)</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: (viewMode === "matrix" || viewMode === "network" || viewMode === "prionetwork" || viewMode === "map" || viewMode === "candidates" || viewMode === "guide" || viewMode === "prioritized" || viewMode === "continuity") ? 0 : 20 }}>
              {viewMode === "guide" ? (
                <GuideView />
              ) : viewMode === "prioritized" ? (
                <PrioritizedView data={sorted} overridesCache={overridesCache} onClickItem={item => setDetailItem(item)} refreshOverrides={async () => { const cache = await getAllOverrides(); setOverridesCache(cache); }} />
              ) : viewMode === "prionetwork" ? (
                <PrioNetworkView data={sorted} overridesCache={overridesCache} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "continuity" ? (
                <ContinuityView allData={DATA} />
              ) : viewMode === "candidates" ? (
                <CandidatesView />
              ) : viewMode === "map" ? (
                <MapView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "network" ? (
                <NetworkView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "matrix" ? (
                <MatrixView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : sorted.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
                  <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 15, fontWeight: 600 }}>Inga initiativ matchar filtren</p>
                  <p style={{ fontSize: 13 }}>Prova att ändra eller rensa filter</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {sorted.map(item => <InitCard key={item.nr} item={item} selected={selected.has(item.nr)} onSelect={() => toggleSelect(item.nr)} onClick={() => setDetailItem(item)} ov={overridesCache[item.nr]} />)}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* DEEPDIVE MODAL */}
        {deepdiveItem && <DataDeepDivePanel itemNr={deepdiveItem} onClose={() => setDeepDiveItem(null)} />}
        {/* MODALS */}
        {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} allItems={DATA}
          overridesCache={overridesCache}
          analysisObjects={analysisObjects}
          onCreateContinuityAnalysis={async (item) => {
            const o = newAnalysisObject();
            o.namn = item.n; o.typ = "Dataplattform"; o.linkedInitiatives = [item.nr];
            const next = [...analysisObjects, o];
            setAnalysisObjects(next);
            await saveAnalysisObjects(next);
            setDetailItem(null);
            setViewMode("continuity");
          }}
          refreshOverrides={async () => {
            try {
              const cache = {};
              for (const item of DATA) {
                try {
                  const ov = await getOverride(item.nr);
                  if (ov && (ov.arbetaVidere || (ov.qa && ov.qa.approved && ov.qa.approved.done) || ov.maturity || (ov.jurisdictions && ov.jurisdictions.length) || (ov.fields && Object.keys(ov.fields).length > 0))) {
                    cache[item.nr] = ov;
                  }
                } catch(e) {}
              }
              setOverridesCache(cache);
            } catch(e) {}
          }}
        />}
        {showCompare && selected.size >= 2 && <ComparePanel items={DATA.filter(i => selected.has(i.nr)).slice(0, 5)} onClose={() => setShowCompare(false)} />}
      </div>
    </>
  );
}