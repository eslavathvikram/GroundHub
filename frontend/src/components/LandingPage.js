import React, { useState, useEffect } from "react";
import Auth from "./Auth";

function LandingPage({ onLoginClick, onLoginSuccess }) {
  const [grounds, setGrounds] = useState([]);
  const [stats, setStats] = useState({
    groundsCount: 0,
    bookingsCount: 0,
    citiesCount: 0,
    cities: []
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/grounds")
      .then((res) => res.json())
      .then((data) => setGrounds(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch("http://localhost:5000/api/public/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStats({
            groundsCount: data.groundsCount || 0,
            bookingsCount: data.bookingsCount || 0,
            citiesCount: data.citiesCount || 0,
            cities: data.cities || []
          });
        }
      })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: "✔",
      title: "Verified Grounds",
      desc: "All grounds are verified for quality and safety.",
    },
    {
      icon: "🕐",
      title: "Easy Booking",
      desc: "Book your favorite ground in just a few clicks.",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      desc: "Safe and secure payment options available.",
    },
    {
      icon: "🎧",
      title: "24/7 Support",
      desc: "We're here to help you anytime, anywhere.",
    },
  ];

  const howItWorks = [
    { step: "01", title: "Search", desc: "Find grounds near your location with available slots.", icon: "🔍" },
    { step: "02", title: "Select", desc: "Pick your preferred date, time slot, and ground.", icon: "📅" },
    { step: "03", title: "Book", desc: "Confirm your booking with secure payment options.", icon: "✅" },
    { step: "04", title: "Play", desc: "Show up at the ground and enjoy your game!", icon: "🏏" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/featured-grounds-bg.jpg)` }}
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 className="hero-headline">
            Book Cricket Grounds
            <span className="hero-headline-green">Anytime, Anywhere</span>
          </h1>
          <p className="hero-subtext">
            Find and book the best cricket grounds near you.
            <br />
            Hassle-free booking in just a few clicks!
          </p>

          <Auth isModal={false} inline={true} onLoginSuccess={onLoginSuccess} />
        </div>

        {/* Feature Strip */}
        <div className="feature-strip">
          <div className="feature-strip-inner">
            {features.map((f) => (
              <div className="feature-item" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-text">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Featured Grounds Section ===== */}
      <section
        id="grounds"
        className="landing-section grounds-section-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.88), rgba(9, 9, 11, 0.88)), url(${process.env.PUBLIC_URL}/featured-grounds-bg.jpg)`
        }}
      >
        <div className="landing-section-inner">
          <div className="section-heading">
            <h2>Featured Grounds</h2>
            <p>Explore top-rated grounds ready for your next game</p>
          </div>

          <div className="grounds-grid">
            {grounds.slice(0, 6).map((ground) => (
              <div key={ground._id} className="glass-panel ground-card glass-card-interactive">
                <div className="ground-img-container">
                  <img
                    className="ground-img"
                    src={ground.imageUrl || "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600&auto=format&fit=crop"}
                    alt={ground.name}
                  />
                  <span className="ground-badge">₹{ground.price} / Slot</span>
                </div>
                <div className="ground-info">
                  <div>
                    <h3 style={{ fontSize: "1.25rem", margin: "12px 0 6px 0" }}>{ground.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                      📍 {ground.location}
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", minHeight: "50px" }}>
                      {ground.description || "No description provided."}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "16px" }}
                    onClick={onLoginClick}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {grounds.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>No grounds available at the moment. Check back soon!</p>
            </div>
          )}

          {grounds.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "36px" }}>
              <button className="btn btn-primary" style={{ padding: "12px 32px", fontSize: "0.95rem" }} onClick={onLoginClick}>
                View All Grounds →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section
        id="bookings"
        className="landing-section grounds-section-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.88), rgba(9, 9, 11, 0.88)), url(${process.env.PUBLIC_URL}/featured-grounds-bg.jpg)`
        }}
      >
        <div className="landing-section-inner">
          <div className="section-heading">
            <h2>How Booking Works</h2>
            <p>Get on the field in just 4 simple steps</p>
          </div>

          <div className="how-it-works-grid">
            {howItWorks.map((item) => (
              <div key={item.step} className="how-step-card glass-panel">
                <div className="how-step-number">{item.step}</div>
                <div className="how-step-icon">{item.icon}</div>
                <h4 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>{item.title}</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "36px" }}>
            <button className="btn btn-primary" style={{ padding: "13px 36px", fontSize: "1rem" }} onClick={onLoginClick}>
              Start Booking Now
            </button>
          </div>
        </div>
      </section>

      {/* ===== About Us Section ===== */}
      <section
        id="about"
        className="landing-section grounds-section-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.88), rgba(9, 9, 11, 0.88)), url(${process.env.PUBLIC_URL}/featured-grounds-bg.jpg)`
        }}
      >
        <div className="landing-section-inner">
          <div className="section-heading">
            <h2>About GroundHub</h2>
            <p>India's trusted platform for sports ground bookings</p>
          </div>

          <div className="about-grid">
            <div className="about-content">
              <h3 style={{ fontSize: "1.5rem", marginBottom: "16px", fontWeight: "800" }}>
                We Make Playing Sports Easier
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "16px" }}>
                GroundHub was born from a simple frustration — finding a good cricket ground shouldn't be hard. 
                We connect sports enthusiasts with verified ground owners, making it effortless to discover, 
                compare, and book playing fields across India.
              </p>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "24px" }}>
                Whether you're organizing a weekend match with friends or need a professional-grade pitch for 
                your tournament, GroundHub has you covered with real-time availability, transparent pricing, 
                and instant confirmations.
              </p>

              <div className="about-stats">
                <div className="about-stat-item">
                  <span className="about-stat-value">{stats.groundsCount}</span>
                  <span className="about-stat-label">Grounds Listed</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-value">{stats.bookingsCount}</span>
                  <span className="about-stat-label">Bookings Made</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-value">{stats.citiesCount}</span>
                  <span className="about-stat-label">Cities Covered</span>
                </div>
              </div>

              {stats.cities && stats.cities.length > 0 && (
                <div className="cities-breakdown-container">
                  <h4 className="cities-breakdown-title">📍 Respective Cities Stats</h4>
                  <div className="cities-breakdown-grid">
                    {stats.cities.map((cityData) => (
                      <div key={cityData.city} className="city-stat-card glass-panel">
                        <div className="city-stat-header">
                          <span className="city-name">{cityData.city}</span>
                        </div>
                        <div className="city-stat-body">
                          <div className="city-stat-metric">
                            <span className="metric-icon">🏏</span>
                            <span className="metric-label">Grounds</span>
                            <span className="metric-val">{cityData.groundsCount}</span>
                          </div>
                          <div className="city-stat-metric">
                            <span className="metric-icon">📅</span>
                            <span className="metric-label">Bookings</span>
                            <span className="metric-val">{cityData.bookingsCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="about-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop"
                alt="Cricket match in action"
                className="about-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Contact Section ===== */}
      <section
        id="contact"
        className="landing-section grounds-section-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.88), rgba(9, 9, 11, 0.88)), url(${process.env.PUBLIC_URL}/featured-grounds-bg.jpg)`
        }}
      >
        <div className="landing-section-inner">
          <div className="section-heading">
            <h2>Get In Touch</h2>
            <p>Have questions or need help? We'd love to hear from you</p>
          </div>

          <div className="contact-centered-wrapper">
            <div className="glass-panel contact-info-card">
              <h4 style={{ fontSize: "1.2rem", marginBottom: "20px", fontWeight: "700", textAlign: "center" }}>Contact Information</h4>

              <div className="contact-info-item">
                <span className="contact-info-icon">📞</span>
                <div>
                  <strong>Phone</strong>
                  <p style={{ fontSize: "0.88rem" }}>+91 982XXXXXXXX</p>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-icon">✉️</span>
                <div>
                  <strong>Email</strong>
                  <p style={{ fontSize: "0.88rem" }}>support@groundhub.in</p>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-icon">🕐</span>
                <div>
                  <strong>Working Hours</strong>
                  <p style={{ fontSize: "0.88rem" }}>Mon - Sat: 9:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="landing-footer">
        <div className="landing-section-inner">
          <div className="footer-grid">
            <div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px", marginBottom: "12px" }}>
                <img
                  src={`${process.env.PUBLIC_URL}/groundhub-logo.jpg`}
                  alt="GroundHub"
                  style={{ width: "160px", height: "160px", borderRadius: "16px", objectFit: "cover" }}
                />
                <span style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ffffff" }}>Ground<span style={{ color: "#cccccc" }}>Hub</span></span>
              </div>
            </div>
            <div>
              <h5 style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "12px", fontWeight: "700" }}>Quick Links</h5>
              <ul className="footer-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#grounds">Grounds</a></li>
                <li><a href="#bookings">How It Works</a></li>
                <li><a href="#about">About Us</a></li>
              </ul>
            </div>
            <div>
              <h5 style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "12px", fontWeight: "700" }}>Support</h5>
              <ul className="footer-links">
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#contact">FAQ</a></li>
                <li><a href="#contact">Terms of Service</a></li>
                <li><a href="#contact">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h5 style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "12px", fontWeight: "700" }}>Connect</h5>
              <ul className="footer-links">
                <li><a href="#contact">Instagram</a></li>
                <li><a href="#contact">Twitter / X</a></li>
                <li><a href="#contact">Facebook</a></li>
                <li><a href="#contact">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 GroundHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
