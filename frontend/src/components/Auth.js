import React, { useState, useEffect } from "react";
import axios from "axios";

function Auth({ onLoginSuccess, onClose, isModal = false, inline = false }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const baseUrl = "http://localhost:5000/api/auth";

    try {
      if (isLogin) {
        const payload = { email, password, role };
        const response = await axios.post(`${baseUrl}/login`, payload);
        const { token, user } = response.data;

        setSuccess("Logged in successfully!");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setTimeout(() => {
          onLoginSuccess(user, token);
        }, 800);
      } else {
        const payload = { name, email, password, role };
        const response = await axios.post(`${baseUrl}/register`, payload);
        const { token, user } = response.data;

        setSuccess("Account registered successfully!");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setTimeout(() => {
          onLoginSuccess(user, token);
        }, 800);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div
      className="glass-panel auth-card"
      style={{ position: "relative", maxWidth: isModal ? "440px" : "450px", width: "100%" }}
    >
      {/* Close button when modal */}
      {isModal && onClose && (
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "2.2rem", marginBottom: "4px" }}>🏏</div>
        <h2 style={{ fontSize: "1.7rem", marginBottom: "6px" }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {role === "customer"
            ? isLogin
              ? "Sign in to book your favorite sports grounds"
              : "Sign up to find and book grounds instantly"
            : isLogin
            ? "Sign in to manage your hosted grounds"
            : "Register to host your grounds and receive bookings"}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Role Switcher */}
      <div className="role-switch" style={{ marginBottom: "22px" }}>
        <div
          className={`role-tab ${role === "customer" ? "active" : ""}`}
          onClick={() => setRole("customer")}
        >
          👤 Customer
        </div>
        <div
          className={`role-tab ${role === "provider" ? "active" : ""}`}
          onClick={() => setRole("provider")}
        >
          🏟️ Service Provider
        </div>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "16px", padding: "13px" }}
            disabled={loading}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </form>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            style={{
              color: "var(--primary)",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );

  if (inline) {
    return card;
  }

  if (isModal) {
    return (
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        {card}
      </div>
    );
  }

  return (
    <div className="auth-container">
      {card}
    </div>
  );
}

export default Auth;
