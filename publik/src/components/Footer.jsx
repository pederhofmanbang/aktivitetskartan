import React from "react";
import { Link } from "../router.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <h2>Hälsodatakartan</h2>
            <p>
              En kartläggning av svenska hälsodatainitiativ — infrastruktur,
              kvalitetsregister, samverkan, superdatorcentra och lagstiftning.
              En tjänst från Kompetenscentrum hälsodata (KCHD), regionernas
              gemensamma resurs för vårddatahantering inom Nationellt system
              för kunskapsstyrning.
            </p>
          </div>
          <div>
            <h2>Utforska</h2>
            <ul>
              <li><Link to="/">Alla initiativ</Link></li>
              <li><Link to="/matris">Matrisvyn</Link></li>
              <li><Link to="/natverk">Nätverkskartan (beta)</Link></li>
              <li><Link to="/om">Om kartan och märkningen</Link></li>
            </ul>
          </div>
          <div>
            <h2>Bidra</h2>
            <ul>
              <li><Link to="/foresla">Föreslå ett nytt initiativ</Link></li>
              <li><Link to="/kvalitetssakrare">Bli kvalitetssäkrare</Link></li>
              <li><a href="https://kchd.se">kchd.se</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          Kompetenscentrum hälsodata · Uppgifterna på kartan kan innehålla fel —
          se märkningen på varje initiativ och föreslå gärna rättelser.
        </div>
      </div>
    </footer>
  );
}
