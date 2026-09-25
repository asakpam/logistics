import { useState } from "react";
import { Link } from "react-router-dom";

const INITIAL_PRODUCTS = [
  { id:1, title:"Heavy-Duty Moving Boxes (Pack of 10)", category:"Packaging",   price:35,  icon:"📦", badge:"Best Seller", status:"Active",   stock:85,  reviews:128 },
  { id:2, title:"Fragile Item Bubble Wrap (5m Roll)",   category:"Packaging",   price:18,  icon:"🫧", badge:null,          status:"Active",   stock:200, reviews:87  },
  { id:3, title:"Waterproof Courier Bag",               category:"Delivery",    price:12,  icon:"🎒", badge:"Top Rated",   status:"Active",   stock:155, reviews:214 },
  { id:4, title:"GPS Tracker Device",                   category:"Electronics", price:180, icon:"📡", badge:"New",         status:"Active",   stock:32,  reviews:45  },
  { id:5, title:"Packing Tape (6 Rolls)",               category:"Packaging",   price:8,   icon:"🖊️", badge:null,          status:"Active",   stock:500, reviews:302 },
  { id:6, title:"Delivery Driver Safety Vest",          category:"Safety",      price:25,  icon:"🦺", badge:null,          status:"Inactive", stock:78,  reviews:66  },
];

const CATEGORIES = ["Packaging","Delivery","Electronics","Safety"];

export function ProductManagement() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ title:"", category:"Packaging", price:"", icon:"📦", badge:"", status:"Active", stock:"" });

  const filtered = products.filter(p => {
    const matchFilter = filter === "All" || p.category === filter || (filter === "Active" ? p.status === "Active" : p.status === "Inactive");
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function openAdd() { setEditProduct(null); setForm({ title:"", category:"Packaging", price:"", icon:"📦", badge:"", status:"Active", stock:"" }); setShowModal(true); }
  function openEdit(p) { setEditProduct(p); setForm({ title:p.title, category:p.category, price:String(p.price), icon:p.icon, badge:p.badge||"", status:p.status, stock:String(p.stock) }); setShowModal(true); }

  function handleSave() {
    if (!form.title || !form.price) return;
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...form, price:Number(form.price), stock:Number(form.stock) } : p));
    } else {
      const newId = Math.max(...products.map(p => p.id)) + 1;
      setProducts(prev => [...prev, { id:newId, ...form, price:Number(form.price), stock:Number(form.stock), reviews:0 }]);
    }
    setShowModal(false);
  }

  function deleteProduct(id) {
    if (window.confirm("Delete this product?")) setProducts(prev => prev.filter(p => p.id !== id));
  }

  function toggleStatus(id) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p));
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Product <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted" style={{ marginTop:"0.25rem" }}>
            Add, edit, and manage marketplace product listings.
          </p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">← Admin</Link>
          <button id="add-product-btn" className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:"Total Products", value:products.length,                                   icon:"📦", color:"var(--clr-primary)" },
          { label:"Active",         value:products.filter(p => p.status === "Active").length, icon:"✅", color:"var(--clr-success)" },
          { label:"Inactive",       value:products.filter(p => p.status === "Inactive").length,icon:"🚫",color:"var(--clr-warning)" },
          { label:"Categories",     value:CATEGORIES.length,                                  icon:"📂", color:"#6366f1" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background:`${s.color}22`, color:s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1.25rem", alignItems:"center" }}>
        {["All","Active","Inactive",...CATEGORIES].map(f => (
          <button key={f} className={`tab-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)} style={{ fontSize:"0.78rem" }}>{f}</button>
        ))}
        <input
          id="product-search"
          className="form-control search-sm"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft:"auto", maxWidth:260 }}
        />
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Icon</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Reviews</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:"center", padding:"2rem", color:"var(--clr-text-faint)" }}>No products found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontSize:"1.5rem" }}>{p.icon}</td>
                  <td>
                    <p style={{ fontWeight:600, fontSize:"0.88rem" }}>{p.title}</p>
                    {p.badge && <span className="badge badge-primary" style={{ fontSize:"0.68rem" }}>{p.badge}</span>}
                  </td>
                  <td><span className="badge badge-muted" style={{ fontSize:"0.72rem" }}>{p.category}</span></td>
                  <td style={{ fontWeight:700, color:"var(--clr-primary)" }}>GHS {p.price}</td>
                  <td style={{ fontWeight:600 }}>{p.stock}</td>
                  <td className="text-muted text-sm">{p.reviews}</td>
                  <td>
                    <button
                      className={`badge ${p.status === "Active" ? "badge-success" : "badge-muted"}`}
                      style={{ cursor:"pointer", border:"none", background:"none" }}
                      onClick={() => toggleStatus(p.id)}
                      id={`toggle-product-${p.id}`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:"0.3rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} id={`edit-product-${p.id}`}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)} id={`delete-product-${p.id}`}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width:"100%", maxWidth:500, padding:"1.5rem" }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom:"1rem" }}>
              <h2 className="card-title">{editProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="dash-grid-2" style={{ gap:"0.75rem" }}>
              <div className="form-group" style={{ gridColumn:"span 2" }}>
                <label className="form-label">Product Title</label>
                <input className="form-control" placeholder="Enter product name" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (GHS)</label>
                <input className="form-control" type="number" min="0" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price:e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-control" type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock:e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Icon (emoji)</label>
                <input className="form-control" placeholder="📦" value={form.icon} onChange={e => setForm(f => ({ ...f, icon:e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Badge (optional)</label>
                <input className="form-control" placeholder="e.g. Best Seller" value={form.badge} onChange={e => setForm(f => ({ ...f, badge:e.target.value }))} />
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-product-btn" className="btn btn-primary" style={{ flex:1 }} onClick={handleSave}>
                {editProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
