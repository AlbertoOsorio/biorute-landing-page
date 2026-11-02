import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import Layout from "./components/Layout";
import HomePage from "./page/HomePage";
import Vision from "./page/Vision";
import Contact from "./page/Contact";

// El simulador carga su librería de gráficos solo cuando se visita la página
const Simulator = lazy(() => import("./page/Simulator"));


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/equipo" element={
          <Layout>
            <Vision />
          </Layout>
        } />
        <Route path="/simulador" element={
          <Layout>
            <Suspense fallback={<div className="min-h-screen bg-[#F9F3E7]" />}>
              <Simulator />
            </Suspense>
          </Layout>
        } />
        <Route path="/contacto" element={
          <Layout>
            <Contact />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;