import React, { useEffect, useState } from "react";
import { RouterProvider, useRouter } from "./router.jsx";
import { fetchOverrides } from "./api.js";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Explorer from "./components/Explorer.jsx";
import Detail from "./components/Detail.jsx";
import Matrix from "./components/Matrix.jsx";
import Network from "./components/Network.jsx";
import { CandidateForm, ReviewerForm } from "./components/Forms.jsx";
import About from "./components/About.jsx";

function Routes({ overrides }) {
  const { path } = useRouter();

  const initiativMatch = path.match(/^\/initiativ\/(\d+)$/);
  if (initiativMatch) return <Detail nr={Number(initiativMatch[1])} overrides={overrides} />;
  if (path === "/matris") return <Matrix overrides={overrides} />;
  if (path === "/natverk") return <Network overrides={overrides} />;
  if (path === "/foresla") return <CandidateForm />;
  if (path === "/kvalitetssakrare") return <ReviewerForm />;
  if (path === "/om") return <About />;
  return <Explorer overrides={overrides} />;
}

export default function App() {
  const [overrides, setOverrides] = useState(null);

  useEffect(() => {
    fetchOverrides().then(setOverrides);
  }, []);

  return (
    <RouterProvider>
      <a href="#main" className="skip-link">
        Hoppa till innehållet
      </a>
      <Nav />
      <main id="main">
        {overrides === null ? (
          <div className="container" style={{ padding: "64px 20px", color: "#6b7280" }}>
            Läser in Hälsodatakartan …
          </div>
        ) : (
          <Routes overrides={overrides} />
        )}
      </main>
      <Footer />
    </RouterProvider>
  );
}
