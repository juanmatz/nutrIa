import { useEffect, useState } from "react";

const categoryIcons = {
  "Proteínas": "🥩",
  "Carbohidratos": "🌾",
  "Grasas": "🥑",
  "Bebidas": "🥤",
};

const categoryColors = {
  "Proteínas":     { bg: "#fef2f2", accent: "#dc2626", light: "#fee2e2" },
  "Carbohidratos": { bg: "#fefce8", accent: "#ca8a04", light: "#fef9c3" },
  "Grasas":        { bg: "#f0fdf4", accent: "#16a34a", light: "#dcfce7" },
  "Bebidas":       { bg: "#eff6ff", accent: "#2563eb", light: "#dbeafe" },
};

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginBottom: "3px" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: "#374151" }}>{value}g</span>
      </div>
      <div style={{ height: "5px", borderRadius: "99px", background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "99px",
          width: `${pct}%`, background: color,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

function AlimentoCard({ alimento, index }) {
  const cat = categoryColors[alimento.categoria] || { bg: "#f9fafb", accent: "#6b7280", light: "#f3f4f6" };
  const icon = categoryIcons[alimento.categoria] || "🍽️";
  const maxMacro = Math.max(alimento.proteinas, alimento.carbohidratos, alimento.grasas, 1);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.05)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      animation: `fadeUp 0.5s ease both`,
      animationDelay: `${index * 80}ms`,
      cursor: "default",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.1)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.05)";
    }}>

      {/* Header de la card */}
      <div style={{ background: cat.bg, padding: "20px 20px 16px", borderBottom: `1px solid ${cat.light}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: cat.accent,
              background: cat.light, padding: "3px 10px", borderRadius: "99px"
            }}>
              {alimento.categoria}
            </span>
            <h3 style={{
              margin: "10px 0 0", fontSize: "20px", fontWeight: 700,
              color: "#111827", fontFamily: "'Playfair Display', Georgia, serif"
            }}>
              {alimento.nombre}
            </h3>
          </div>
          <span style={{ fontSize: "36px", lineHeight: 1 }}>{icon}</span>
        </div>
      </div>

      {/* Calorías destacadas */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          background: "#198754", color: "#fff",
          borderRadius: "12px", padding: "8px 16px",
          display: "flex", flexDirection: "column", alignItems: "center", minWidth: "72px"
        }}>
          <span style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{alimento.calorias}</span>
          <span style={{ fontSize: "10px", opacity: 0.85, marginTop: "2px" }}>kcal</span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: 1.4 }}>
          Energía por<br /><strong style={{ color: "#374151" }}>100g de porción</strong>
        </p>
      </div>

      {/* Macros */}
      <div style={{ padding: "16px 20px" }}>
        <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
          Macronutrientes
        </p>
        <MacroBar label="Proteínas"     value={alimento.proteinas}     max={maxMacro} color="#dc2626" />
        <MacroBar label="Carbohidratos" value={alimento.carbohidratos} max={maxMacro} color="#ca8a04" />
        <MacroBar label="Grasas"        value={alimento.grasas}        max={maxMacro} color="#16a34a" />
      </div>
    </div>
  );
}

export default function Alimentos() {
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filtro, setFiltro]       = useState("Todos");

  useEffect(() => {
    fetch("/api/alimentos")
      .then(r => r.json())
      .then(data => { setAlimentos(data); setLoading(false); })
      .catch(() => { setError("No se pudo cargar los alimentos."); setLoading(false); });
  }, []);

  const categorias = ["Todos", ...new Set(alimentos.map(a => a.categoria))];
  const filtrados  = filtro === "Todos" ? alimentos : alimentos.filter(a => a.categoria === filtro);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background: "#198754", padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(25,135,84,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🥗</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "20px", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.3px" }}>
            NutrIA
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Base de alimentos</span>
      </nav>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #198754 0%, #146c43 60%, #6F4E37 100%)",
        padding: "48px 32px 56px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07,
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }} />
        <h1 style={{
          margin: "0 0 12px", color: "#fff", fontSize: "36px", fontWeight: 700,
          fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px", position: "relative"
        }}>
          Biblioteca de Alimentos
        </h1>
        <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.8)", fontSize: "16px", position: "relative" }}>
          Información nutricional detallada para tus planes de alimentación
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", position: "relative" }}>
          {[
            { label: "Alimentos", value: alimentos.length },
            { label: "Categorías", value: categorias.length - 1 },
            { label: "Macros", value: 3 },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: "24px 32px 0", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} style={{
            padding: "8px 20px", borderRadius: "99px", fontSize: "13px", fontWeight: 600,
            border: filtro === cat ? "none" : "1.5px solid #d1fae5",
            background: filtro === cat ? "#198754" : "#fff",
            color: filtro === cat ? "#fff" : "#198754",
            cursor: "pointer", transition: "all 0.18s ease",
            boxShadow: filtro === cat ? "0 4px 12px rgba(25,135,84,0.3)" : "none"
          }}>
            {categoryIcons[cat] || "🍽️"} {cat}
          </button>
        ))}
      </div>

      {/* Grid de alimentos */}
      <main style={{ padding: "28px 32px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: "3px solid #d1fae5", borderTopColor: "#198754",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
            }} />
            <p style={{ color: "#6b7280" }}>Cargando alimentos...</p>
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: "60px", color: "#dc2626", background: "#fef2f2", borderRadius: "16px" }}>
            ⚠️ {error}
          </div>
        )}
        {!loading && !error && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "20px"
          }}>
            {filtrados.map((a, i) => <AlimentoCard key={a.id_alimento} alimento={a} index={i} />)}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: "#6F4E37", color: "rgba(255,255,255,0.7)",
        textAlign: "center", padding: "20px",
        fontSize: "13px"
      }}>
        © 2026 NutrIA — Inteligencia nutricional a tu alcance
      </footer>
    </div>
  );
}
