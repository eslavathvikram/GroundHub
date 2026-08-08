import React, { useState, useEffect } from "react";

function ProviderDashboard() {
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add/Edit Ground Form State
  const [editingGroundId, setEditingGroundId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [groundType, setGroundType] = useState("Other");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [primaryImageUploading, setPrimaryImageUploading] = useState(false);
  // Each entry: { url: string, uploading: boolean }
  const [additionalImageInputs, setAdditionalImageInputs] = useState([{ url: "", uploading: false }]);
  const [selectedSlots, setSelectedSlots] = useState([
    "06:00 - 10:00",
    "10:00 - 14:00",
    "14:00 - 18:00"
  ]);
  const [instructions, setInstructions] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [services, setServices] = useState([]);
  const [dayPrices, setDayPrices] = useState({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: ""
  });
  const [contactNumber, setContactNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const groundTypeOptions = [
    "Open Cricket Ground",
    "Cricket Nets",
    "Box Cricket",
    "Football Turf",
    "Badminton Court",
    "Tennis Court",
    "Pickle Ball Court",
    "Basketball Court",
    "Volleyball Court",
    "Swimming Pool",
    "Multi-Sport Arena",
    "Other"
  ];

  const defaultSlotOptions = [
    "06:00 - 10:00",
    "10:00 - 14:00",
    "14:00 - 18:00"
  ];

  const availableServices = [
    "Parking",
    "Changing Rooms",
    "Washrooms",
    "Drinking Water",
    "First Aid Kit",
    "Floodlights",
    "Equipment Rental",
    "WiFi"
  ];

  useEffect(() => {
    fetchProviderGrounds();
    fetchReceivedBookings();
  }, []);

  const fetchProviderGrounds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/grounds/provider/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGrounds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching provider grounds:", err);
    }
  };

  const fetchReceivedBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/bookings/provider", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching provider bookings:", err);
    }
  };

  const handleSlotToggle = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSubmitGround = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (selectedSlots.length === 0) {
      setError("Please select at least one active slot.");
      setLoading(false);
      return;
    }

    const images = additionalImageInputs.map(item => item.url.trim()).filter(u => u.length > 0);

    const cleanedDayPrices = {};
    Object.keys(dayPrices).forEach(day => {
      const val = dayPrices[day];
      if (val !== "" && val !== null && val !== undefined) {
        cleanedDayPrices[day] = Number(val);
      }
    });

    const payload = {
      name,
      groundType,
      location,
      price: Number(price),
      description,
      imageUrl,
      slots: selectedSlots,
      instructions,
      images,
      services,
      dayPrices: cleanedDayPrices,
      contactNumber,
      contactEmail
    };

    try {
      const token = localStorage.getItem("token");
      const url = editingGroundId
        ? `http://localhost:5000/api/grounds/${editingGroundId}`
        : "http://localhost:5000/api/grounds";

      const method = editingGroundId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save ground");

      setSuccess(editingGroundId ? "Ground updated successfully!" : "Ground added successfully!");
      resetForm();
      fetchProviderGrounds();
    } catch (err) {
      setError(err.message || "Failed to save ground");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setGroundType("Other");
    setLocation("");
    setPrice("");
    setDescription("");
    setImageUrl("");
    setPrimaryImageUploading(false);
    setAdditionalImageInputs([{ url: "", uploading: false }]);
    setSelectedSlots([
      "06:00 - 10:00",
      "10:00 - 14:00",
      "14:00 - 18:00"
    ]);
    setInstructions("");
    setImagesText(""); // kept for compatibility
    setServices([]);
    setDayPrices({
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: ""
    });
    setContactNumber("");
    setContactEmail("");
    setEditingGroundId(null);
    setShowForm(false);
  };

  const handleEditGround = (ground) => {
    setName(ground.name);
    setGroundType(ground.groundType || "Other");
    setLocation(ground.location);
    setPrice(ground.price);
    setDescription(ground.description || "");
    setImageUrl(ground.imageUrl || "");
    setPrimaryImageUploading(false);
    setSelectedSlots(ground.slots || []);
    setInstructions(ground.instructions || "");
    setImagesText(ground.images ? ground.images.join("\n") : "");
    setAdditionalImageInputs(
      ground.images && ground.images.length > 0
        ? [...ground.images.map(u => ({ url: u, uploading: false })), { url: "", uploading: false }]
        : [{ url: "", uploading: false }]
    );
    setServices(ground.services || []);

    let parsedDayPrices = {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: ""
    };
    if (ground.dayPrices) {
      Object.keys(parsedDayPrices).forEach(day => {
        const val = typeof ground.dayPrices.get === "function"
          ? ground.dayPrices.get(day)
          : ground.dayPrices[day];
        if (val !== undefined && val !== null) {
          parsedDayPrices[day] = val;
        }
      });
    }
    setDayPrices(parsedDayPrices);
    setContactNumber(ground.contactNumber || "");
    setContactEmail(ground.contactEmail || "");

    setEditingGroundId(ground._id);
    setShowForm(true);
  };

  const handleDeleteGround = async (groundId) => {
    if (!window.confirm("Are you sure you want to delete this ground? All associated bookings will be affected.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/grounds/${groundId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete ground");

      setSuccess("Ground deleted successfully.");
      fetchProviderGrounds();
      fetchReceivedBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      fetchReceivedBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculations
  const activeBookingsCount = bookings.filter(b => b.status === "confirmed").length;
  const totalRevenue = bookings
    .filter(b => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="dashboard-layout">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Total Grounds Hosted</p>
          <span className="stat-value">{grounds.length}</span>
        </div>
        <div className="glass-panel stat-card">
          <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Bookings Received</p>
          <span className="stat-value" style={{ color: "var(--text-primary)" }}>{activeBookingsCount}</span>
        </div>
        <div className="glass-panel stat-card">
          <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Total Revenue Generated</p>
          <span className="stat-value" style={{ color: "var(--text-primary)" }}>₹{totalRevenue}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "4px" }}>Your Grounds</h2>
          <p>Configure pricing, slot availability, and ground details.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add New Ground
          </button>
        )}
      </div>

      {/* Add/Edit Form Panel */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: "32px", border: "1px solid #e0e0e0" }}>
          <h3 style={{ fontSize: "1.4rem", marginBottom: "20px" }}>
            {editingGroundId ? "🔧 Edit Ground Configuration" : "✨ Create New Ground"}
          </h3>
          <form onSubmit={handleSubmitGround}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="ground-name">Ground Name</label>
                <input
                  id="ground-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Arena Turf 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ground-type">Type of Ground</label>
                <select
                  id="ground-type"
                  className="form-input"
                  value={groundType}
                  onChange={(e) => setGroundType(e.target.value)}
                >
                  {groundTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="ground-price">Price Per Slot (₹)</label>
                <input
                  id="ground-price"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 800"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ground-location">Location / Address</label>
              <input
                id="ground-location"
                type="text"
                className="form-input"
                placeholder="e.g. Jubilee Hills, Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ground-desc">Description</label>
              <textarea
                id="ground-desc"
                className="form-input"
                style={{ height: "80px", resize: "none" }}
                placeholder="Describe facilities, turf quality, lights, parking..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ground-instructions">Instructions & Rules</label>
              <textarea
                id="ground-instructions"
                className="form-input"
                style={{ height: "80px", resize: "none" }}
                placeholder="Rules, guidelines, cancellation policy, or entry instructions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            {/* Primary Image */}
            <div className="form-group">
              <label>Primary Image</label>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Device file picker only */}
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(0,0,0,0.04)", border: "1px dashed #cccccc", borderRadius: "8px", padding: "10px 18px", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: "600", opacity: primaryImageUploading ? 0.6 : 1 }}>
                  {primaryImageUploading ? "⏳ Uploading..." : "📁 Choose from Device"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={primaryImageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPrimaryImageUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("images", file);
                        const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: fd });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Upload failed");
                        setImageUrl(data.urls[0]);
                      } catch (err) {
                        alert("Upload failed: " + err.message);
                      } finally {
                        setPrimaryImageUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                {/* Preview */}
                {imageUrl && (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={imageUrl}
                      alt="Primary preview"
                      style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e0e0e0" }}
                    />
                    <button type="button" onClick={() => setImageUrl("")}
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--danger)", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Images — device upload only */}
            <div className="form-group">
              <label>Additional Images</label>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "10px" }}>Upload gallery images from your device.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {additionalImageInputs.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--panel-border)" }}>
                    {/* Device upload for this slot */}
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "rgba(0,0,0,0.04)", border: "1px dashed #cccccc", borderRadius: "7px", padding: "7px 14px", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "600", opacity: item.uploading ? 0.6 : 1 }}>
                      {item.uploading ? "⏳ Uploading..." : "📁 Choose File"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={item.uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const updated = [...additionalImageInputs];
                          updated[idx] = { ...updated[idx], uploading: true };
                          setAdditionalImageInputs(updated);
                          try {
                            const fd = new FormData();
                            fd.append("images", file);
                            const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: fd });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Upload failed");
                            const next = [...additionalImageInputs];
                            next[idx] = { url: data.urls[0], uploading: false };
                            setAdditionalImageInputs(next);
                          } catch (err) {
                            alert("Upload failed: " + err.message);
                            const next = [...additionalImageInputs];
                            next[idx] = { ...next[idx], uploading: false };
                            setAdditionalImageInputs(next);
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    {/* Thumbnail preview */}
                    {item.url && (
                      <img
                        src={item.url}
                        alt={`Image ${idx + 1}`}
                        style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "2px solid #e0e0e0" }}
                      />
                    )}
                    {/* Remove row */}
                    {additionalImageInputs.length > 1 && (
                      <button type="button"
                        onClick={() => setAdditionalImageInputs(additionalImageInputs.filter((_, i) => i !== idx))}
                        style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#f87171", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontSize: "1rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Remove"
                      >✕</button>
                    )}
                  </div>
                ))}
                <button type="button"
                  onClick={() => setAdditionalImageInputs([...additionalImageInputs, { url: "", uploading: false }])}
                  style={{ alignSelf: "flex-start", background: "rgba(0,0,0,0.04)", border: "1px dashed #cccccc", color: "var(--text-primary)", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600" }}
                >+ Add Another Image</button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ground-contact-phone">Contact Phone</label>
              <input
                id="ground-contact-phone"
                type="text"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            {/* Basic Services / Amenities selection */}
            <div className="form-group">
              <label>Basic Services / Amenities</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginTop: "8px" }}>
                {availableServices.map(service => {
                  const isChecked = services.includes(service);
                  return (
                    <label key={service} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setServices(services.filter(s => s !== service));
                          } else {
                            setServices([...services, service]);
                          }
                        }}
                      />
                      {service}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Day specific pricing configuration */}
            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Day-Specific Slot Price (₹) <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "var(--text-secondary)" }}>(Leaves blank to fall back to Base Price)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px", marginTop: "10px" }}>
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                  <div key={day} style={{ textAlign: "center" }}>
                    <label htmlFor={`price-${day}`} style={{ fontSize: "0.75rem", textTransform: "capitalize", display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>{day.slice(0, 3)}</label>
                    <input
                      id={`price-${day}`}
                      type="number"
                      className="form-input"
                      style={{ padding: "8px 4px", fontSize: "0.85rem", textAlign: "center" }}
                      placeholder={price || "Base"}
                      value={dayPrices[day]}
                      onChange={(e) => setDayPrices({ ...dayPrices, [day]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Configurable Slots */}
            <div className="form-group" style={{ marginTop: "20px" }}>
              <label>Select Active Booking Slots</label>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Toggle which time slots can be booked by customers:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {defaultSlotOptions.map(slot => {
                  const isChecked = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`btn ${isChecked ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "8px 12px", fontSize: "0.8rem", borderRadius: "8px" }}
                      onClick={() => handleSlotToggle(slot)}
                    >
                      {isChecked ? `✓ ${slot}` : slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="btn btn-accent" disabled={loading}>
                {loading ? "Saving..." : editingGroundId ? "Update Configuration" : "Publish Ground"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ground Cards Grid */}
      <div className="grounds-grid" style={{ marginBottom: "50px" }}>
        {grounds.map((ground) => (
          <div key={ground._id} className="glass-panel ground-card">
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
                {ground.groundType && ground.groundType !== "Other" && (
                  <span style={{ display: "inline-block", fontSize: "0.75rem", backgroundColor: "#111", color: "#fff", padding: "3px 10px", borderRadius: "20px", marginBottom: "8px", fontWeight: "600" }}>
                    {ground.groundType}
                  </span>
                )}
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>📍 {ground.location}</p>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", minHeight: "50px" }}>
                  {ground.description || "No description provided."}
                </p>
                <div style={{ margin: "12px 0" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Active Slots ({ground.slots?.length || 0})</p>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {ground.slots?.slice(0, 3).join(", ")} {ground.slots?.length > 3 ? "..." : ""}
                  </span>
                </div>
                {ground.services && ground.services.length > 0 && (
                  <div style={{ margin: "12px 0" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Amenities</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {ground.services.map(s => (
                        <span key={s} style={{ fontSize: "0.75rem", backgroundColor: "rgba(0, 0, 0, 0.06)", color: "var(--text-primary)", padding: "2px 6px", borderRadius: "4px" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(ground.contactNumber || ground.contactEmail) && (
                  <div style={{ margin: "12px 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <p style={{ color: "var(--text-muted)", fontWeight: "600", marginBottom: "2px" }}>Contact</p>
                    {ground.contactNumber && <div>📞 {ground.contactNumber}</div>}
                    {ground.contactEmail && <div>✉️ {ground.contactEmail}</div>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "8px" }}
                  onClick={() => handleEditGround(ground)}
                >
                  Configure
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: "8px 12px" }}
                  onClick={() => handleDeleteGround(ground._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {grounds.length === 0 && !showForm && (
          <div className="glass-panel" style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center" }}>
            <p style={{ marginBottom: "16px" }}>You are not hosting any grounds yet.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              List Your First Ground
            </button>
          </div>
        )}
      </div>

      {/* Bookings received */}
      <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "40px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Bookings Received</h2>
        <p>Manage customer reservations for your ground slots.</p>

        <div className="booking-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-panel booking-item">
              <div className="booking-item-with-img">
                <img
                  className="booking-thumb"
                  src={booking.ground?.imageUrl || "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=200&auto=format&fit=crop"}
                  alt={booking.ground?.name || "Ground"}
                />
                <div>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{booking.ground?.name || "Ground Removed"}</h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    👤 <strong>Customer:</strong> {booking.customer?.name} ({booking.customer?.email})
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    📅 <strong>Date:</strong> {booking.date} &nbsp;|&nbsp; ⏰ <strong>Time:</strong> {booking.slot}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <span style={{ fontWeight: "700" }}>₹{booking.price}</span>
                <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                {booking.status === "confirmed" && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: "8px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="glass-panel" style={{ padding: "30px", textAlign: "center" }}>
              <p>No bookings received yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderDashboard;