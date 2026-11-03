import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SanityLive from "@/components/layout/SanityLive";
import { Toaster } from "react-hot-toast";
import HomePage from "@/pages/HomePage";
import CartPage from "@/pages/CartPage";
import CategoryPage from "@/pages/CategoryPage";
import ProductPage from "@/pages/ProductPage";
import OrdersPage from "@/pages/OrdersPage";
import SuccessPage from "@/pages/SuccessPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FaqsPage from "@/pages/FaqsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import NotFoundPage from "@/pages/NotFoundPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SanityLive />
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#000000",
            color: "#ffffff",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="success" element={<SuccessPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faqs" element={<FaqsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
