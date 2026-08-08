import React, { useState, useEffect } from "react";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ totalUsers: 0, totalGrounds: 0, totalBookings: 0 });
  const [users, setUsers] = useState([]);
  const [grounds, setGrounds] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState({ stats: true, users: true, grounds: true });
  
  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [groundSearch, setGroundSearch] = useState("");
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type: 'user' | 'ground' }
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchGrounds();
  }, []);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats({
        totalUsers: data.totalUsers || 0,
        totalGrounds: data.totalGrounds || 0,
        totalBookings: data.totalBookings || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("error", "Could not fetch user accounts.");
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchGrounds = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grounds");
      if (!res.ok) throw new Error("Failed to load grounds");
      const data = await res.json();
      setGrounds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching grounds:", err);
      showToast("error", "Could not fetch sports grounds.");
    } finally {
      setLoading((prev) => ({ ...prev, grounds: false }));
    }
  };

  const triggerDeleteConfirm = (id, name, type) => {
    setDeleteTarget({ id, name, type });
    setShowDeleteModal(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteTarget) return;
    
    const { id, name, type } = deleteTarget;
    setShowDeleteModal(false);
    setDeleteTarget(null);

    try {
      if (type === "user") {
        const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to delete user");
        }
        showToast("success", `User "${name}" and associated records deleted.`);
      } else if (type === "ground") {
        const res = await fetch(`http://localhost:5000/api/admin/grounds/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to delete ground");
        }
        showToast("success", `Ground "${name}" deleted.`);
      }
      
      // Refresh database records
      fetchStats();
      fetchUsers();
      fetchGrounds();
    } catch (err) {
      showToast("error", err.message || "An error occurred during deletion.");
    }
  };

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const searchMatch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    
    const roleMatch = userRoleFilter === "all" || u.role === userRoleFilter;
    return searchMatch && roleMatch;
  });

  const filteredGrounds = grounds.filter((g) => {
    return (
      g.name?.toLowerCase().includes(groundSearch.toLowerCase()) ||
      g.location?.toLowerCase().includes(groundSearch.toLowerCase()) ||
      g.groundType?.toLowerCase().includes(groundSearch.toLowerCase())
    );
  });

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <span className="brand-logo">🏏</span>
          <span className="brand-title">GroundHub</span>
        </div>
        
        <ul className="nav-menu">
          <li>
            <div
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="fa-solid fa-chart-pie"></i>
              Overview
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <i className="fa-solid fa-users"></i>
              Manage Users
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${activeTab === "grounds" ? "active" : ""}`}
              onClick={() => setActiveTab("grounds")}
            >
              <i className="fa-solid fa-tree"></i>
              Manage Grounds
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>© 2026 GroundHub Admin</p>
          <p style={{ marginTop: "4px", fontSize: "0.7rem" }}>V1.0.4 Developer Mode</p>
        </div>
      </aside>

      {/* Main content page area */}
      <main className="main-content">
        {activeTab === "overview" && (
          <div>
            <div className="header-section">
              <div>
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">Real-time system usage analytics and core metrics.</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <div className="stat-value">
                    {loading.stats ? <i className="fa-solid fa-spinner fa-spin"></i> : stats.totalUsers}
                  </div>
                </div>
                <div className="stat-icon">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Sports Grounds</h3>
                  <div className="stat-value">
                    {loading.stats ? <i className="fa-solid fa-spinner fa-spin"></i> : stats.totalGrounds}
                  </div>
                </div>
                <div className="stat-icon">
                  <i className="fa-solid fa-futbol"></i>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Bookings</h3>
                  <div className="stat-value">
                    {loading.stats ? <i className="fa-solid fa-spinner fa-spin"></i> : stats.totalBookings}
                  </div>
                </div>
                <div className="stat-icon">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
              </div>
            </div>

            <div className="panel" style={{ padding: "30px" }}>
              <h2 style={{ marginBottom: "16px", color: "var(--primary)" }}>Welcome to Admin Panel</h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>
                As an administrator, you have complete oversight of the GroundHub booking ecosystem. 
                Use the side menu navigation to view lists of registered user accounts and sports grounds. 
                You can search or filter records and delete spam, inactive, or invalid entries. 
                Deleting a service provider automatically cleans up their listed grounds and bookings.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn btn-primary" onClick={() => setActiveTab("users")}>
                  <i className="fa-solid fa-users-gear" style={{ marginRight: "4px" }}></i> Manage Users
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab("grounds")}>
                  <i className="fa-solid fa-map-location-dot" style={{ marginRight: "4px" }}></i> Manage Grounds
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="header-section">
              <div>
                <h1 className="page-title">Manage Users</h1>
                <p className="page-subtitle">Inspect registered customers and providers, or cancel their accounts.</p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Registered Accounts ({filteredUsers.length})</div>
                <div className="controls-row">
                  <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="filter-select"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customers Only</option>
                    <option value="provider">Service Providers Only</option>
                  </select>
                </div>
              </div>

              {loading.users ? (
                <div className="empty-state">
                  <i className="fa-solid fa-circle-notch fa-spin empty-icon" style={{ color: "var(--primary)" }}></i>
                  <p className="empty-text">Loading user records from database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-user-slash empty-icon"></i>
                  <p className="empty-text">No user accounts found matching your filters.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User Details</th>
                        <th>Role</th>
                        <th>Registered Date</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
                              {u.email}
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${u.role}`}>
                              <i className={`fa-solid ${u.role === "provider" ? "fa-shield-halved" : "fa-user"}`}></i>
                              {u.role === "provider" ? "Service Provider" : "Customer"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {formatDate(u.createdAt)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn-action delete"
                              title="Delete user account"
                              onClick={() => triggerDeleteConfirm(u._id, u.name, "user")}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "grounds" && (
          <div>
            <div className="header-section">
              <div>
                <h1 className="page-title">Manage Grounds</h1>
                <p className="page-subtitle">Inspect registered sports facilities and manage their active listing.</p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Listed Grounds ({filteredGrounds.length})</div>
                <div className="controls-row">
                  <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search name, location, type..."
                      value={groundSearch}
                      onChange={(e) => setGroundSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading.grounds ? (
                <div className="empty-state">
                  <i className="fa-solid fa-circle-notch fa-spin empty-icon" style={{ color: "var(--primary)" }}></i>
                  <p className="empty-text">Loading sports grounds...</p>
                </div>
              ) : filteredGrounds.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-map-location-dot empty-icon"></i>
                  <p className="empty-text">No sports grounds found matching your search term.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ground Facility</th>
                        <th>Location</th>
                        <th>Price (Hourly / Slot)</th>
                        <th>Owner Info</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrounds.map((g) => (
                        <tr key={g._id}>
                          <td>
                            <div className="ground-info-wrapper">
                              <img
                                src={g.imageUrl || "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=100"}
                                alt={g.name}
                                className="ground-thumb"
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=100";
                                }}
                              />
                              <div>
                                <div className="ground-meta-title">{g.name}</div>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    color: "var(--primary)",
                                    marginTop: "4px",
                                    display: "inline-block",
                                  }}
                                >
                                  {g.groundType || "Other"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.9rem" }}>{g.location}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--primary)" }}>
                              ₹{g.price}
                            </div>
                          </td>
                          <td>
                            {g.owner && typeof g.owner === "object" ? (
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{g.owner.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{g.owner.email}</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                Provider ID: {g.owner || "N/A"}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn-action delete"
                              title="Delete ground listing"
                              onClick={() => triggerDeleteConfirm(g._id, g.name, "ground")}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-warning-icon">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="modal-title">Confirm Deletion</h3>
            </div>
            
            <div className="modal-body">
              {deleteTarget.type === "user" ? (
                <p>
                  Are you sure you want to permanently delete the user account <strong>"{deleteTarget.name}"</strong>? 
                  <br />
                  <span style={{ color: "var(--danger)", display: "block", marginTop: "8px", fontWeight: "600" }}>
                    ⚠️ Warning: This will automatically delete all listings and bookings associated with this user. This action cannot be undone.
                  </span>
                </p>
              ) : (
                <p>
                  Are you sure you want to permanently delete the ground listing <strong>"{deleteTarget.name}"</strong>? 
                  <br />
                  <span style={{ color: "var(--danger)", display: "block", marginTop: "8px", fontWeight: "600" }}>
                    ⚠️ Warning: This will delete all active bookings scheduled for this ground.
                  </span>
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteExecute}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Popups */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`fa-solid ${t.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
