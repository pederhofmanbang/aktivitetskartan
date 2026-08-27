import React, { useState } from "react";
import { Link, useRouter } from "../router.jsx";

const LINKS = [
  { to: "/", label: "Kartan" },
  { to: "/matris", label: "Matris" },
  { to: "/natverk", label: "Nätverk", beta: true },
  { to: "/foresla", label: "Föreslå initiativ" },
  { to: "/kvalitetssakrare", label: "Bli kvalitetssäkrare" },
  { to: "/om", label: "Om" },
];

export default function Nav() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav" aria-label="Huvudmeny">
      <div className="container nav__inner">
        <Link to="/" className="nav__brand" aria-label="Hälsodatakartan — till startsidan">
          <span className="nav__mark" aria-hidden="true" />
          <span>
            <span className="nav__title">Hälsodatakartan</span>
            <br />
            <span className="nav__tagline">hälsodatainitiativ i Sverige</span>
          </span>
        </Link>
        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-label="Visa menyn"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <ul className={"nav__links" + (open ? " open" : "")}>
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                aria-current={path === l.to ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
                {l.beta && <span className="nav__beta">Beta</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
