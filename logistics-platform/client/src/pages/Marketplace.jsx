import { useState } from "react";

const CATEGORIES = ["All", "Packaging", "Delivery", "Electronics", "Safety"];

const PRODUCTS = [
  {
    id: 1,
    title: "Heavy-Duty Moving Boxes (Pack of 10)",
    category: "Packaging",
    price: 35,
    rating: 4.7,
    reviews: 128,
    icon: "📦",
    badge: "Best Seller",
    badgeColor: "badge-primary",
    description: "Durable double-walled boxes for all your shipping needs.",
  },
  {
    id: 2,
    title: "Fragile Item Bubble Wrap (5m Roll)",
    category: "Packaging",
    price: 18,
    rating: 4.5,
    reviews: 87,
    icon: "🫧",
    badge: null,
    description: "Premium bubble wrap to protect delicate items in transit.",
  },
  {
    id: 3,
    title: "Waterproof Courier Bag",
    category: "Delivery",
    price: 12,
    rating: 4.8,
    reviews: 214,
    icon: "🎒",
    badge: "Top Rated",
    badgeColor: "badge-success",
    description: "Lightweight waterproof bag, ideal for document delivery.",
  },
  {
    id: 4,
    title: "GPS Tracker Device",
    category: "Electronics",
    price: 180,
    rating: 4.6,
    reviews: 45,
    icon: "📡",
    badge: "New",
    badgeColor: "badge-warning",
    description: "Real-time GPS tracker compatible with our platform for live shipment monitoring.",
  },
  {
    id: 5,
    title: "Packing Tape (6 Rolls)",
    category: "Packaging",
    price: 8,
    rating: 4.3,
    reviews: 302,
    icon: "🖊️",
    badge: null,
    description: "Strong adhesive tape for sealing boxes securely.",
  },
  {
    id: 6,
    title: "Delivery Driver Safety Vest",
    category: "Safety",
    price: 25,
    rating: 4.4,
    reviews: 66,
    icon: "🦺",
    badge: null,
    description: "High-visibility safety vest for drivers — ANSI/ISEA compliant.",
  },
];

function StarRating({ rating }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState({});

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function addToCart(product) {
    setCart((prev) =>
      prev.find((c) => c.id === product.id)
        ? prev.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...product, qty: 1 }]
    );
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1200);
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <div className="marketplace-page">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <span className="gradient-text">Marketplace</span> 🛒
          </h1>
          <p className="text-muted" style={{ marginTop: "0.25rem" }}>
            Browse packaging, delivery tools, and logistics accessories.
          </p>
        </div>
        {cart.length > 0 && (
          <div className="cart-badge-btn">
            <span>🛒</span>
            <span>Cart ({cart.reduce((s, c) => s + c.qty, 0)})</span>
            <span className="text-sm text-muted">· GHS {cartTotal}</span>
          </div>
        )}
      </div>

      {/* ── Search + Filters ── */}
      <div className="marketplace-filters">
        <input
          id="marketplace-search"
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="tab-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tab-pill${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <p style={{ fontSize: "2rem" }}>🔍</p>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>No products found for "{search}".</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <article className="product-card" key={product.id}>
              {product.badge && (
                <span className={`product-badge badge ${product.badgeColor}`}>{product.badge}</span>
              )}
              <div className="product-icon">{product.icon}</div>
              <div className="product-category">{product.category}</div>
              <h3 className="product-title">{product.title}</h3>
              <p className="product-desc text-muted">{product.description}</p>
              <div className="product-rating">
                <StarRating rating={product.rating} />
                <span className="text-xs text-faint">({product.reviews})</span>
              </div>
              <div className="product-footer">
                <span className="product-price">GHS {product.price}</span>
                <button
                  id={`add-to-cart-${product.id}`}
                  className={`btn btn-sm ${added[product.id] ? "btn-success" : "btn-primary"}`}
                  onClick={() => addToCart(product)}
                >
                  {added[product.id] ? "✅ Added" : "Add to Cart"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
