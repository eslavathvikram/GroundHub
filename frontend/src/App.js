import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import CustomerDashboard from "./components/CustomerDashboard";
import ProviderDashboard from "./components/ProviderDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) handleLogout();
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  // Scroll-spy: observe which section is in view
  useEffect(() => {
    if (user) return; // Only on landing page

    const sectionIds = ["home", "grounds", "bookings", "about", "contact"];
    const observers = [];

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    // Small delay to let DOM render
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: "-40% 0px -55% 0px",
            threshold: 0,
          });
          observer.observe(el);
          observers.push(observer);
        }
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      observers.forEach((obs) => obs.disconnect());
    };
  }, [user]);

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setActiveSection("home");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "var(--text-primary)",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>🏏</div>
        <h2 style={{ fontWeight: 700 }}>Loading GroundHub...</h2>
      </div>
    );
  }

  return (
    <div>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        activePage={!user ? activeSection : user.role === "provider" ? "grounds" : "bookings"}
      />

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <Auth
          isModal={true}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Pages */}
      {!user ? (
        <LandingPage
          onLoginClick={() => setShowAuthModal(true)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : user.role === "provider" ? (
        <ProviderDashboard />
      ) : (
        <CustomerDashboard />
      )}
    </div>
  );
}

export default App;