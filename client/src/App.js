import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
const GoToTop = lazy(() => import("./components/GoToTop"));
const WhatsAppButton = lazy(() => import("./components/WhatsAppButton"));
const StructuredData = lazy(() => import("./components/StructuredData"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const GalleryDetail = lazy(() => import("./pages/GalleryDetail"));
const Team = lazy(() => import("./pages/Team"));
const Contact = lazy(() => import("./pages/Contact"));
const Join = lazy(() => import("./pages/Join"));
const Donate = lazy(() => import("./pages/Donate"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const VerifyDonation = lazy(() => import("./pages/VerifyDonation"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));

const PageLoader = React.memo(function PageLoader() {
  return (
    <div className="min-vh-50 d-flex align-items-center justify-content-center py-5" aria-hidden="true">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
});

const ScrollToTop = React.memo(function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
});

function App() {
  useEffect(() => {
    // Apply lazy-loading to non-critical images that do not explicitly set loading.
    const imgs = document.querySelectorAll("img:not([loading])");
    imgs.forEach((img) => {
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <StructuredData />
      </Suspense>
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:slug" element={<GalleryDetail />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/join" element={<Join />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/verify/donation/:receiptNumber" element={<VerifyDonation />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <GoToTop />
        <WhatsAppButton />
      </Suspense>
    </>
  );
}

export default App;
