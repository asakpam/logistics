import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PRODUCTS = {
  1: { id:1, title:"Heavy-Duty Moving Boxes (Pack of 10)", category:"Packaging", price:35, rating:4.7, reviews:128, icon:"📦", badge:"Best Seller", badgeColor:"badge-primary", description:"Durable double-walled boxes for all your shipping needs. Designed to handle heavy loads and protect your valuable goods during transit. Ideal for home moves, online shipping, and commercial logistics. Each box measures 40×30×30 cm and supports up to 20 kg.", seller:{ name:"Ghana Pack Co.", location:"Accra, Ghana", joined:"Jan 2024", rating:4.8 }, stock:85, sku:"GPK-BOX-001" },
  2: { id:2, title:"Fragile Item Bubble Wrap (5m Roll)", category:"Packaging", price:18, rating:4.5, reviews:87,  icon:"🫧", badge:null,            badgeColor:null,            description:"Premium bubble wrap to protect delicate items in transit. The 5-metre roll provides ample coverage for electronics, glassware, ceramics, and other breakables. Each air bubble is 10mm in diameter for maximum cushioning.",                                                                  seller:{ name:"SafeShip Supplies", location:"Kumasi, Ghana", joined:"Mar 2024", rating:4.6 }, stock:200, sku:"SSS-BUB-002" },
  3: { id:3, title:"Waterproof Courier Bag", category:"Delivery", price:12, rating:4.8, reviews:214, icon:"🎒", badge:"Top Rated", badgeColor:"badge-success", description:"Lightweight waterproof bag, ideal for document delivery and parcel courier. Features a tamper-evident seal, internal divider, and ergonomic handle for easy carrying.", seller:{ name:"LogiGear GH", location:"Takoradi, Ghana", joined:"Jun 2023", rating:4.9 }, stock:155, sku:"LGG-BAG-003" },
  4: { id:4, title:"GPS Tracker Device", category:"Electronics", price:180, rating:4.6, reviews:45, icon:"📡", badge:"New", badgeColor:"badge-warning", description:"Real-time GPS tracker compatible with our platform for live shipment monitoring. Supports 4G LTE, with 30-day standby battery. Waterproof IP67 rated. Easy magnetic mount.", seller:{ name:"TechTrack GH", location:"Accra, Ghana", joined:"Nov 2024", rating:4.7 }, stock:32, sku:"TTG-GPS-004" },
  5: { id:5, title:"Packing Tape (6 Rolls)", category:"Packaging", price:8, rating:4.3, reviews:302, icon:"🖊️", badge:null, badgeColor:null, description:"Strong adhesive tape for sealing boxes securely. Each roll is 48mm wide and 50m long. Suitable for cardboard boxes, envelopes, and poly bags. Clear, low-noise unrolling.", seller:{ name:"Ghana Pack Co.", location:"Accra, Ghana", joined:"Jan 2024", rating:4.8 }, stock:500, sku:"GPK-TAPE-005" },
  6: { id:6, title:"Delivery Driver Safety Vest", category:"Safety", price:25, rating:4.4, reviews:66, icon:"🦺", badge:null, badgeColor:null, description:"High-visibility safety vest for drivers — ANSI/ISEA compliant. Bright orange with reflective strips for maximum visibility in all conditions. One size fits most. Machine washable.", seller:{ name:"SafeWork GH", location:"Tema, Ghana", joined:"Sep 2023", rating:4.5 }, stock:78, sku:"SWG-VEST-006" },
};

function StarRating({ rating, large }) {
  const size = large ? "1.3rem" : "0.85rem";
  return (
    <span style={{ color:"#f59e0b", fontSize:size }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = PRODUCTS[parseInt(productId)] || PRODUCTS[1];

  const [qty, setQty]       = useState(1);
  const [added, setAdded]   = useState(false);

  function addToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // Related products (same category, different id)
  const related = Object.values(PRODUCTS).filter(p => p.category === product.category && p.id !== product.id);

  return (
    <div className="dashboard-page">
      {/* Breadcrumb */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.5rem", fontSize:"0.85rem", color:"var(--clr-text-muted)" }}>
        <button className="btn btn-ghost btn-sm" style={{ padding:"0.2rem 0.5rem" }} onClick={() => navigate("/marketplace")}>
          ← Marketplace
        </button>
        <span>/</span>
        <span style={{ color:"var(--clr-text-faint)" }}>{product.category}</span>
        <span>/</span>
        <span style={{ color:"var(--clr-text)", fontWeight:500 }}>{product.title.slice(0, 30)}…</span>
      </div>

      <div className="dash-grid-2">
        {/* Left — product display */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--sp-lg)" }}>
          {/* Hero card */}
          <div className="card" style={{ textAlign:"center", padding:"3rem 2rem" }}>
            {product.badge && (
              <span className={`badge ${product.badgeColor}`} style={{ marginBottom:"1rem", display:"inline-block" }}>{product.badge}</span>
            )}
            <div style={{ fontSize:"6rem", marginBottom:"1rem" }}>{product.icon}</div>
            <span style={{ background:"var(--clr-surface-2)", border:"1px solid var(--clr-border)", borderRadius:"var(--r-full)", padding:"0.3rem 1rem", fontSize:"0.8rem", color:"var(--clr-text-muted)" }}>
              {product.category}
            </span>
          </div>

          {/* Seller info */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Seller Information</h2></div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--clr-primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", fontWeight:700, color:"#fff" }}>
                {product.seller.name[0]}
              </div>
              <div>
                <p style={{ fontWeight:700 }}>{product.seller.name}</p>
                <p className="text-xs text-faint">{product.seller.location}</p>
              </div>
            </div>
            {[
              { label:"Location",     val:product.seller.location },
              { label:"Member Since", val:product.seller.joined },
              { label:"Seller Rating",val:<StarRating rating={product.seller.rating} /> },
            ].map(item => (
              <div className="detail-row" key={item.label}>
                <span className="detail-label">{item.label}</span>
                <span className="detail-val">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — product info + actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--sp-lg)" }}>
          <div className="card">
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.4rem", marginBottom:"0.75rem", lineHeight:1.3 }}>
              {product.title}
            </h1>

            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
              <StarRating rating={product.rating} large />
              <span style={{ fontWeight:700, fontSize:"1rem" }}>{product.rating}</span>
              <span className="text-muted text-sm">({product.reviews} reviews)</span>
            </div>

            <p style={{ fontSize:"2.2rem", fontWeight:800, color:"var(--clr-primary)", marginBottom:"1.25rem" }}>
              GHS {product.price}
            </p>

            <p style={{ fontSize:"0.9rem", lineHeight:1.7, color:"var(--clr-text-muted)", marginBottom:"1.5rem" }}>
              {product.description}
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.5rem" }}>
              {[
                { label:"SKU",   val:product.sku },
                { label:"Stock", val:`${product.stock} units available`, color:product.stock > 50 ? "var(--clr-success)" : "var(--clr-warning)" },
              ].map(item => (
                <div className="detail-row" key={item.label}>
                  <span className="detail-label">{item.label}</span>
                  <span className="detail-val" style={item.color ? { color:item.color, fontWeight:600 } : {}}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Qty + Add to cart */}
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--clr-border)", borderRadius:"var(--r-md)", overflow:"hidden" }}>
                <button className="btn btn-ghost" style={{ borderRadius:0, padding:"0.5rem 0.9rem", fontSize:"1.1rem" }} onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                <span style={{ padding:"0 1rem", fontWeight:700, minWidth:40, textAlign:"center" }}>{qty}</span>
                <button className="btn btn-ghost" style={{ borderRadius:0, padding:"0.5rem 0.9rem", fontSize:"1.1rem" }} onClick={() => setQty(q => q+1)}>+</button>
              </div>
              <button
                id={`add-to-cart-${product.id}`}
                className={`btn ${added ? "btn-success" : "btn-primary"}`}
                style={{ flex:1 }}
                onClick={addToCart}
              >
                {added ? "✅ Added to Cart!" : "🛒 Add to Cart"}
              </button>
            </div>
            <button className="btn btn-ghost" style={{ width:"100%" }}>♡ Save for Later</button>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Related Products</h2></div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {related.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    style={{ display:"flex", gap:"0.75rem", alignItems:"center", cursor:"pointer", padding:"0.5rem", borderRadius:"var(--r-md)", transition:"background 0.2s" }}
                    onClick={() => navigate(`/marketplace/${p.id}`)}
                  >
                    <span style={{ fontSize:"2rem" }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:"0.85rem" }}>{p.title}</p>
                      <p className="text-xs text-faint">{p.category}</p>
                    </div>
                    <span style={{ fontWeight:800, color:"var(--clr-primary)", fontSize:"0.9rem" }}>GHS {p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
