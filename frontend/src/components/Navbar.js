import React from "react";

function Navbar({ user, onLogout, onLoginClick, activePage, onNavClick }) {
  // All nav links for landing page (not signed in)
  const allNavLinks = [
    { label: "Home", key: "home" },
    { label: "Grounds", key: "grounds" },
    { label: "Bookings", key: "bookings" },
    { label: "About Us", key: "about" },
    { label: "Contact", key: "contact" },
  ];

  // When signed in, hide landing-page-only sections
  const navLinks = user
    ? [] // No nav links when signed in — dashboard handles its own navigation
    : allNavLinks;

  const handleNavLinkClick = (e, key) => {
    e.preventDefault();

    if (onNavClick) {
      onNavClick(key);
      return;
    }

    // For landing page: scroll to section
    const section = document.getElementById(key);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            handleNavLinkClick(e, "home");
          }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/groundhub-logo.jpg`}
            alt="GroundHub"
            className="brand-logo-img"
          />
        </a>

        {/* Nav Links (center) */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={`#${link.key}`}
              className={`nav-link${activePage === link.key ? " active" : ""}`}
              onClick={(e) => handleNavLinkClick(e, link.key)}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="nav-actions">
          {user ? (
            <>
              <div className="nav-user-info">
                <span className="nav-user-dot" />
                {user.name}
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#cccccc",
                    fontWeight: 400,
                  }}
                >
                  ({user.role === "provider" ? "Provider" : "Customer"})
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-outline"
                style={{ padding: "7px 16px", fontSize: "0.82rem" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                onClick={onLoginClick}
              >
                List Your Ground
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", background: "var(--primary)", color: "var(--text-dark)" }}
                onClick={onLoginClick}
              >
                🔒 Login / Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
