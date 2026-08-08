import React, { useState, useEffect } from "react";

function CustomerDashboard() {
  const [grounds, setGrounds] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGround, setSelectedGround] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const getGroundPriceForDate = (ground, dateString) => {
    if (!ground) return 0;
    if (!dateString) return ground.price;
    try {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dateObj = new Date(dateString);
      const dayName = days[dateObj.getDay()];
      
      let dayPrice;
      if (ground.dayPrices) {
        dayPrice = ground.dayPrices[dayName];
      }
      
      if (dayPrice !== undefined && dayPrice !== null && dayPrice > 0) {
        return Number(dayPrice);
      }
    } catch (e) {
      console.error("Error calculating dynamic price:", e);
    }
    return ground.price;
  };

  useEffect(() => {
    fetchGrounds();
    fetchBookings();
  }, []);

  const fetchGrounds = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grounds");
      const data = await res.json();
      setGrounds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching grounds:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/bookings/customer", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // Fetch slot status for selected ground and date
  useEffect(() => {
    if (selectedGround && selectedDate) {
      fetchBookedSlots(selectedGround._id, selectedDate);
    }
  }, [selectedGround, selectedDate]);

  const fetchBookedSlots = async (groundId, dateStr) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/booked-slots/${groundId}/${dateStr}`);
      const data = await res.json();
      setBookedSlots(Array.isArray(data) ? data : []);
      setSelectedSlot(null); // Reset selected slot when date changes
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedGround || !selectedDate || !selectedSlot) {
      setError("Please select a date and time slot first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          groundId: selectedGround._id,
          date: selectedDate,
          slot: selectedSlot
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setSuccess(`Successfully booked slot ${selectedSlot} for ${selectedDate}!`);
      setSelectedGround(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      fetchBookings();
    } catch (err) {
      setError(err.message || "Failed to complete booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  // Custom Calendar Generator Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null, disabled: true });
    }
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= lastDay; d++) {
      const dayDate = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      
      days.push({
        day: d,
        dateStr: dateString,
        disabled: dayDate < today,
        isToday: dayDate.getTime() === today.getTime()
      });
    }
    return days;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    if (currentDate.getFullYear() > today.getFullYear() || currentDate.getMonth() > today.getMonth()) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const calendarDays = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredGrounds = grounds.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {success && <div className="alert alert-success" style={{ marginBottom: "20px" }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ marginBottom: "20px" }}>{error}</div>}

      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Explore Grounds</h2>
        <p style={{ marginBottom: "24px" }}>Search and book slots at premium grounds in your area.</p>

        {/* Search Bar */}
        <div style={{ maxWidth: "500px", marginBottom: "32px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search by ground name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grounds Grid */}
        <div className="grounds-grid">
          {filteredGrounds.map((ground) => (
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
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", minHeight: "60px" }}>
                    {ground.description || "No description provided."}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "16px" }}
                  onClick={() => {
                    setSelectedGround(ground);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                    setBookedSlots([]);
                  }}
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}

          {filteredGrounds.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              <p>No grounds found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Calendar Modal / Form */}
      {selectedGround && (() => {
        const allImages = [
          selectedGround.imageUrl,
          ...(selectedGround.images || [])
        ].filter(url => url && url.trim().length > 0);

        const currentPrice = getGroundPriceForDate(selectedGround, selectedDate);

        return (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ position: "relative", width: "90%", maxWidth: "900px", padding: "30px" }}>
              <button 
                className="modal-close"
                onClick={() => {
                  setSelectedGround(null);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setActiveImageIndex(0);
                }}
              >
                &times;
              </button>
              
              <h3 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{selectedGround.name}</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "20px" }}>📍 {selectedGround.location}</p>

              <div className="modal-body-grid">
                
                {/* Left Column: Details, Images, Rules, Contact */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Image Carousel */}
                  {allImages.length > 0 && (
                    <div style={{ position: "relative", width: "100%", height: "220px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                      <img 
                        src={allImages[activeImageIndex]} 
                        alt={`${selectedGround.name} view`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {allImages.length > 1 && (
                        <>
                          <button 
                            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => setActiveImageIndex((activeImageIndex - 1 + allImages.length) % allImages.length)}
                          >
                            &larr;
                          </button>
                          <button 
                            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => setActiveImageIndex((activeImageIndex + 1) % allImages.length)}
                          >
                            &rarr;
                          </button>
                          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
                            {allImages.map((_, i) => (
                              <span 
                                key={i}
                                style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: i === activeImageIndex ? "var(--primary)" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Description</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {selectedGround.description || "No description provided."}
                    </p>
                  </div>

                  {/* Services/Amenities */}
                  {selectedGround.services && selectedGround.services.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Amenities</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {selectedGround.services.map(service => (
                          <span 
                            key={service} 
                            style={{ fontSize: "0.75rem", background: "rgba(0, 0, 0, 0.06)", color: "var(--text-primary)", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rules & Instructions */}
                  {selectedGround.instructions && (
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid var(--panel-border)" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Ground Rules & Instructions</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "pre-line", lineHeight: "1.4" }}>
                        {selectedGround.instructions}
                      </p>
                    </div>
                  )}

                  {/* Contact Details */}
                  {(selectedGround.contactNumber || selectedGround.contactEmail) && (
                    <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--panel-border)" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Contact Details</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {selectedGround.contactNumber && <span>📞 {selectedGround.contactNumber}</span>}
                        {selectedGround.contactEmail && <span>✉️ {selectedGround.contactEmail}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Calendar and Slot Pickers */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "600" }}>Select Booking Date</h4>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      Rate: ₹{currentPrice} / Slot
                    </span>
                  </div>

                  {/* Custom Calendar view */}
                  <div className="calendar-container" style={{ margin: 0 }}>
                    <div className="calendar-header">
                      <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={prevMonth}>&larr;</button>
                      <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
                      <button className="btn btn-secondary" style={{ padding: "4px 10px" }} onClick={nextMonth}>&rarr;</button>
                    </div>

                    <div className="calendar-grid">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d} className="calendar-day-label" style={{ fontSize: "0.75rem", padding: "4px 0" }}>{d}</div>
                      ))}
                      {calendarDays.map((d, index) => (
                        <div
                          key={index}
                          className={`calendar-day ${d.disabled ? "disabled" : ""} ${d.isToday ? "today" : ""} ${selectedDate === d.dateStr ? "selected" : ""}`}
                          onClick={() => !d.disabled && setSelectedDate(d.dateStr)}
                          style={{ fontSize: "0.85rem", padding: "6px 0" }}
                        >
                          {d.day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slots selector */}
                  {selectedDate ? (
                    <div>
                      <h4 style={{ marginBottom: "12px", fontSize: "0.95rem" }}>Available Slots for {selectedDate}:</h4>
                      <div className="slots-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                        {selectedGround.slots.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              className={`slot-btn ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(slot)}
                              style={{ padding: "8px 4px", fontSize: "0.75rem" }}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSlot && (
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--panel-border)", paddingTop: "12px" }}>
                          <div>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Selected slot:</p>
                            <p style={{ fontWeight: "600", fontSize: "0.95rem" }}>{selectedSlot}</p>
                          </div>
                          <button 
                            className="btn btn-accent" 
                            onClick={handleBookSlot}
                            disabled={loading}
                          >
                            {loading ? "Confirming..." : `Pay & Book (₹${currentPrice})`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px", background: "rgba(0,0,0,0.15)", borderRadius: "10px", marginTop: "10px" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Please select a date from the calendar to view available slots.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Customer Bookings list */}
      <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "40px", marginTop: "40px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>My Bookings</h2>
        <p>View your upcoming games and booking receipt history.</p>

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
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{booking.ground?.name || "Ground Details Unavailable"}</h4>
                  <p style={{ fontSize: "0.9rem" }}>📍 {booking.ground?.location || "N/A"}</p>
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
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="glass-panel" style={{ padding: "30px", textAlign: "center" }}>
              <p>You have not made any bookings yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
