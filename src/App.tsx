import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import Layout from "./components/Layout";
import HomePage from "./page/HomePage";
import Vision from "./page/Vision";
import Contact from "./page/Contact";


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