import Registro from './Registro';
import { useEffect, useState } from "react";

/* ─── PALETA Y FUENTES ─────────────────────────────────── */
const G = {
  green:  "#198754",
  green2: "#146c43",
  brown:  "#6F4E37",
  brown2: "#5a3e2b",
  cream:  "#faf7f2",
  white:  "#ffffff",
  gray:   "#6b7280",
  light:  "#f0faf5",
};

/* ─── DATOS MOCK ────────────────────────────────────────── */
const mockUser = {
  nombre: "David ",
  objetivo: "Bajar de peso",
  calorias_diarias: 1800,
  peso: 82,
  altura: 175,
  edad: 24,
};

const mockProgreso = [
  { semana: "Sem 1", peso: 84, calorias: 2100 },
  { semana: "Sem 2", peso: 83.2, calorias: 1950 },
  { semana: "Sem 3", peso: 82.5, calorias: 1850 },
  { semana: "Sem 4", peso: 82,   calorias: 1820 },
];

const rutinas = [
  { dia: "Lun", nombre: "Cardio + Core", duracion: "40 min", icono: "🏃", completado: true },
  { dia: "Mar", nombre: "Fuerza Superior", duracion: "50 min", icono: "💪", completado: true },
  { dia: "Mié", nombre: "Descanso activo", duracion: "20 min", icono: "🧘", completado: true },
  { dia: "Jue", nombre: "Fuerza Inferior", duracion: "50 min", icono: "🦵", completado: false },
  { dia: "Vie", nombre: "HIIT", duracion: "30 min", icono: "⚡", completado: false },
  { dia: "Sáb", nombre: "Caminata larga", duracion: "60 min", icono: "🚶", completado: false },
  { dia: "Dom", nombre: "Descanso", duracion: "—", icono: "😴", completado: false },
];

const categoryIcons  = { "Proteínas": "🥩", "Carbohidratos": "🌾", "Grasas": "🥑", "Bebidas": "🥤" };
const categoryColors = {
  "Proteínas":     "#dc2626",
  "Carbohidratos": "#ca8a04",
  "Grasas":        "#16a34a",
  "Bebidas":       "#2563eb",
};

/* ─── ESTILOS GLOBALES ──────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.cream}; font-family: 'Plus Jakarta Sans', sans-serif; color: #1a1a1a; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${G.cream}; }
  ::-webkit-scrollbar-thumb { background: ${G.green}; border-radius: 99px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes pulse    { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
  @keyframes slideIn  { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
  .nav-link { color: rgba(255,255,255,0.8); text-decoration:none; font-size:14px; font-weight:500; transition: color 0.2s; cursor:pointer; }
  .nav-link:hover { color:#fff; }
  .card { background:#fff; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.04); }
  .btn-primary { background:${G.green}; color:#fff; border:none; border-radius:12px; padding:12px 28px; font-size:15px; font-weight:700; cursor:pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
  .btn-primary:hover { background:${G.green2}; transform:translateY(-2px); box-shadow:0 8px 20px rgba(25,135,84,0.35); }
  .section-title { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:700; color:#111; letter-spacing:-0.5px; margin-bottom:6px; }
  .section-sub   { font-size:14px; color:${G.gray}; margin-bottom:28px; }
`;

/* ─── COMPONENTES PEQUEÑOS ──────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid #d1fae5`, borderTopColor:G.green, animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

function StatCard({ icon, label, value, unit, color = G.green, delay = 0 }) {
  return (
    <div className="card" style={{ padding:"20px 24px", animation:`fadeUp 0.5s ease both`, animationDelay:`${delay}ms`, display:"flex", alignItems:"center", gap:"16px" }}>
      <div style={{ width:48, height:48, borderRadius:"14px", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>{icon}</div>
      <div>
        <div style={{ fontSize:"22px", fontWeight:800, color:"#111", lineHeight:1 }}>{value}<span style={{ fontSize:"13px", fontWeight:500, color:G.gray, marginLeft:3 }}>{unit}</span></div>
        <div style={{ fontSize:"12px", color:G.gray, marginTop:3 }}>{label}</div>
      </div>
    </div>
  );
}

/* ─── SECCIÓN: HERO / LOGIN ─────────────────────────────── */
function HeroLogin({ onLogin }) {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [form, setForm]   = useState({ email:"", password:"" });
  const [error, setError] = useState("");

async function handleSubmit() {
  if (!form.email || !form.password) { setError("Completa todos los campos"); return; }

  try {
    const res  = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Credenciales incorrectas");
      return;
    }

    onLogin(data.usuario);

  } catch {
    setError("No se pudo conectar con el servidor");
  }
}
  if (mostrarRegistro) return <Registro onVolver={() => setMostrarRegistro(false)} />;

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${G.green} 0%, ${G.green2} 55%, ${G.brown} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden" }}>
      {/* Patrón de fondo */}
      <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize:"36px 36px" }} />
      {/* Círculos decorativos */}
      <div style={{ position:"absolute", top:-120, right:-120, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-80,  width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

      <div style={{ width:"100%", maxWidth:420, animation:"fadeUp 0.6s ease both", position:"relative" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🥗</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:44, fontWeight:700, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>NutrIA</h1>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:15, marginTop:8 }}>Tu asistente de nutrición inteligente</p>
        </div>

        {/* Card de login */}
        <div className="card" style={{ padding:"36px 32px" }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:"#111", marginBottom:6 }}>Bienvenido de vuelta</h2>
          <p style={{ fontSize:13, color:G.gray, marginBottom:28 }}>Ingresa a tu cuenta para continuar</p>

          <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Correo electrónico</label>
          <input
            type="email" placeholder="tu@email.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:14, fontFamily:"inherit", marginBottom:16, outline:"none", transition:"border 0.2s" }}
            onFocus={e => e.target.style.borderColor = G.green}
            onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
          />

          <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Contraseña</label>
          <input
            type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:14, fontFamily:"inherit", marginBottom:8, outline:"none", transition:"border 0.2s" }}
            onFocus={e => e.target.style.borderColor = G.green}
            onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
          />

          {error && <p style={{ color:"#dc2626", fontSize:13, marginBottom:12 }}>⚠️ {error}</p>}

          <button className="btn-primary" onClick={handleSubmit} style={{ width:"100%", marginTop:8, padding:"13px" }}>
            Iniciar sesión
          </button>

          <p style={{ textAlign:"center", fontSize:13, color:G.gray, marginTop:20 }}>
            ¿No tienes cuenta?{" "}
            <span onClick={() => setMostrarRegistro(true)}
             style={{ color:G.green, fontWeight:600, cursor:"pointer" }}> Regístrate</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SECCIÓN: CHAT IA ──────────────────────────────────── */
function ChatIA({ onClose }) {
  const [msgs, setMsgs]   = useState([{ role:"ia", text:"¡Hola! Soy tu asistente nutricional. ¿En qué puedo ayudarte hoy? Puedo orientarte sobre alimentación, calorías o tu plan de objetivos. 🥗" }]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    setMsgs(m => [...m, { role:"user", text: input }, { role:"ia", text:"Estoy procesando tu consulta... (la IA se integrará próximamente)" }]);
    setInput("");
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:"20px", animation:"fadeIn 0.2s ease" }}>
      <div className="card" style={{ width:"100%", maxWidth:420, height:"75vh", display:"flex", flexDirection:"column", animation:"slideIn 0.3s ease" }}>
        {/* Header chat */}
        <div style={{ background:`linear-gradient(135deg, ${G.green}, ${G.green2})`, borderRadius:"20px 20px 0 0", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
            <div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>NutrIA Asistente</div>
              <div style={{ color:"rgba(255,255,255,0.75)", fontSize:12 }}>En línea</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", width:32, height:32, borderRadius:"50%", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Mensajes */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth:"80%", padding:"10px 14px", borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? G.green : "#f3f4f6",
                color: m.role==="user" ? "#fff" : "#111",
                fontSize:14, lineHeight:1.5
              }}>{m.text}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid #f3f4f6", display:"flex", gap:8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Escribe tu consulta..."
            style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:14, fontFamily:"inherit", outline:"none" }}
          />
          <button className="btn-primary" onClick={send} style={{ padding:"10px 16px", borderRadius:10 }}>→</button>
        </div>
      </div>
    </div>
  );
}

/* ─── APP PRINCIPAL ─────────────────────────────────────── */
export default function App() {
  const [user, setUser]           = useState(null);
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);
  const [filtro, setFiltro]       = useState("Todos");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/alimentos")
      .then(r => r.json())
      .then(d => { setAlimentos(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior:"smooth" }); }

  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <HeroLogin onLogin={setUser} />
    </>
  );

  const categorias = ["Todos", ...new Set(alimentos.map(a => a.categoria))];
  const filtrados  = filtro === "Todos" ? alimentos : alimentos.filter(a => a.categoria === filtro);
  const pesoInicial = mockProgreso[0].peso;
  const pesoActual  = mockProgreso[mockProgreso.length - 1].peso;
  const bajado      = (pesoInicial - pesoActual).toFixed(1);
  const rutinasCompletadas = rutinas.filter(r => r.completado).length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:G.green, padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:`0 2px 16px rgba(25,135,84,0.3)` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>🥗</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", color:"#fff", fontWeight:700, fontSize:22, letterSpacing:"-0.3px" }}>NutrIA</span>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {[["inicio","Inicio"],["objetivo","Objetivo"],["progreso","Progreso"],["rutinas","Rutinas"],["alimentos","Alimentos"]].map(([id, label]) => (
            <span key={id} className="nav-link" onClick={() => scrollTo(id)}>{label}</span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"rgba(255,255,255,0.85)", fontSize:14 }}>👋 {user.nombre.split(" ")[0]}</span>
          <button onClick={() => setUser(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", padding:"6px 14px", borderRadius:8, fontSize:13, cursor:"pointer" }}>Salir</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px" }}>

        {/* ── INICIO ── */}
        <section id="inicio" style={{ padding:"56px 0 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"center" }}>
            <div style={{ animation:"fadeUp 0.6s ease both" }}>
              <div style={{ display:"inline-block", background:`${G.green}18`, color:G.green, fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 14px", borderRadius:99, marginBottom:16 }}>
                Dashboard personal
              </div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, fontWeight:700, color:"#111", lineHeight:1.1, letterSpacing:"-1px", marginBottom:16 }}>
                Hola, {user.nombre.split(" ")[0]} 👋<br />
                <span style={{ color:G.green }}>¿Listo para hoy?</span>
              </h1>
              <p style={{ color:G.gray, fontSize:16, lineHeight:1.7, marginBottom:28 }}>
                Llevas <strong style={{ color:G.green }}>{bajado} kg menos</strong> desde que empezaste. Sigue así, vas por buen camino.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn-primary" onClick={() => setChatOpen(true)} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span>🤖</span> Hablar con la IA
                </button>
                <button onClick={() => scrollTo("objetivo")} style={{ background:"transparent", border:`1.5px solid ${G.green}`, color:G.green, borderRadius:12, padding:"12px 24px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
                  Ver objetivo
                </button>
              </div>
            </div>

            {/* Stats rápidas */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, animation:"fadeUp 0.6s ease 0.15s both" }}>
              <StatCard icon="⚖️"  label="Peso actual"     value={user.peso}            unit="kg"   color={G.green}  delay={0}   />
              <StatCard icon="📏"  label="Altura"          value={user.altura}          unit="cm"   color={G.brown}  delay={80}  />
              <StatCard icon="🔥"  label="Meta calórica"   value={user.calorias_diarias} unit="kcal" color="#dc2626"  delay={160} />
              <StatCard icon="🎂"  label="Edad"            value={user.edad}            unit="años" color="#2563eb"  delay={240} />
            </div>
          </div>
        </section>

        {/* ── OBJETIVO ── */}
        <section id="objetivo" style={{ padding:"48px 0" }}>
          <h2 className="section-title">Mi Objetivo</h2>
          <p className="section-sub">Tu meta actual y progreso hacia ella</p>

          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
            <div className="card" style={{ padding:"32px", animation:"fadeUp 0.5s ease both" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:13, color:G.gray, marginBottom:6, fontWeight:500 }}>Objetivo actual</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:"#111" }}>{user.objetivo}</div>
                </div>
                <div style={{ background:`${G.green}15`, borderRadius:16, padding:"10px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:G.green }}>{bajado}</div>
                  <div style={{ fontSize:11, color:G.gray }}>kg bajados</div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:G.gray, marginBottom:8 }}>
                  <span>Progreso hacia meta (84 → 75 kg)</span>
                  <span style={{ fontWeight:700, color:G.green }}>{Math.round(((84 - pesoActual) / (84 - 75)) * 100)}%</span>
                </div>
                <div style={{ height:10, borderRadius:99, background:"#e5e7eb", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round(((84 - pesoActual) / (84 - 75)) * 100)}%`, background:`linear-gradient(90deg, ${G.green}, ${G.green2})`, borderRadius:99, transition:"width 1s ease" }} />
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { label:"Proteínas diarias", value:"90g", color:"#dc2626" },
                  { label:"Carbohidratos",     value:"180g", color:"#ca8a04" },
                  { label:"Grasas",            value:"60g", color:G.green },
                ].map(m => (
                  <div key={m.label} style={{ background:"#f9fafb", borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:m.color }}>{m.value}</div>
                    <div style={{ fontSize:11, color:G.gray, marginTop:2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding:"28px", animation:"fadeUp 0.5s ease 0.1s both", display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#111" }}>Resumen semanal</div>
              {mockProgreso.map((s, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i < mockProgreso.length-1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{s.semana}</span>
                  <span style={{ fontSize:13, color:G.gray }}>{s.calorias} kcal</span>
                  <span style={{ fontSize:13, fontWeight:700, color: i === mockProgreso.length-1 ? G.green : "#374151" }}>{s.peso} kg</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROGRESO ── */}
        <section id="progreso" style={{ padding:"48px 0" }}>
          <h2 className="section-title">Mi Progreso</h2>
          <p className="section-sub">Evolución de peso y calorías semana a semana</p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            {mockProgreso.map((s, i) => {
              const isLast = i === mockProgreso.length - 1;
              const diff   = i > 0 ? (s.peso - mockProgreso[i-1].peso).toFixed(1) : null;
              return (
                <div key={i} className="card" style={{ padding:"22px", animation:`fadeUp 0.5s ease ${i*80}ms both`, border: isLast ? `2px solid ${G.green}` : "2px solid transparent" }}>
                  {isLast && <div style={{ fontSize:11, fontWeight:700, color:G.green, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Actual</div>}
                  <div style={{ fontSize:13, color:G.gray, marginBottom:4 }}>{s.semana}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:"#111", lineHeight:1 }}>{s.peso}<span style={{ fontSize:14, color:G.gray }}> kg</span></div>
                  {diff && (
                    <div style={{ fontSize:13, marginTop:6, fontWeight:600, color: parseFloat(diff) < 0 ? G.green : "#dc2626" }}>
                      {parseFloat(diff) < 0 ? "▼" : "▲"} {Math.abs(diff)} kg
                    </div>
                  )}
                  <div style={{ marginTop:12, fontSize:12, color:G.gray }}>{s.calorias} kcal/día</div>
                </div>
              );
            })}
          </div>

          {/* Barra visual de calorías */}
          <div className="card" style={{ padding:"28px", animation:"fadeUp 0.5s ease 0.3s both" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#111", marginBottom:20 }}>Calorías por semana</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:16, height:100 }}>
              {mockProgreso.map((s, i) => {
                const maxCal = Math.max(...mockProgreso.map(x => x.calorias));
                const h = Math.round((s.calorias / maxCal) * 100);
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{s.calorias}</div>
                    <div style={{ width:"100%", height:`${h}%`, background: i === mockProgreso.length-1 ? `linear-gradient(180deg, ${G.green}, ${G.green2})` : "#d1fae5", borderRadius:"6px 6px 0 0", transition:"height 1s ease" }} />
                    <div style={{ fontSize:12, color:G.gray }}>{s.semana}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── RUTINAS ── */}
        <section id="rutinas" style={{ padding:"48px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
            <div>
              <h2 className="section-title">Rutinas de Ejercicio</h2>
              <p className="section-sub" style={{ marginBottom:0 }}>Semana actual — {rutinasCompletadas}/7 días completados</p>
            </div>
            <div style={{ background:`${G.green}15`, borderRadius:12, padding:"8px 18px", fontSize:13, fontWeight:700, color:G.green }}>
              {Math.round((rutinasCompletadas/7)*100)}% completado
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:12 }}>
            {rutinas.map((r, i) => (
              <div key={i} className="card" style={{
                padding:"18px 12px", textAlign:"center",
                animation:`fadeUp 0.5s ease ${i*60}ms both`,
                border: r.completado ? `2px solid ${G.green}` : "2px solid transparent",
                background: r.completado ? `${G.green}08` : "#fff",
                opacity: r.completado ? 1 : 0.75
              }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{r.icono}</div>
                <div style={{ fontSize:12, fontWeight:800, color: r.completado ? G.green : "#374151", marginBottom:4 }}>{r.dia}</div>
                <div style={{ fontSize:11, color:"#374151", fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{r.nombre}</div>
                <div style={{ fontSize:11, color:G.gray }}>{r.duracion}</div>
                {r.completado && <div style={{ fontSize:16, marginTop:8 }}>✅</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ── ALIMENTOS ── */}
        <section id="alimentos" style={{ padding:"48px 0 64px" }}>
          <h2 className="section-title">Biblioteca de Alimentos</h2>
          <p className="section-sub">Información nutricional para tus planes</p>

          {/* Filtros */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setFiltro(cat)} style={{
                padding:"7px 18px", borderRadius:99, fontSize:13, fontWeight:600,
                border: filtro === cat ? "none" : `1.5px solid #d1fae5`,
                background: filtro === cat ? G.green : "#fff",
                color: filtro === cat ? "#fff" : G.green,
                cursor:"pointer", transition:"all 0.18s ease",
                boxShadow: filtro === cat ? `0 4px 12px rgba(25,135,84,0.3)` : "none"
              }}>
                {categoryIcons[cat] || "🍽️"} {cat}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:18 }}>
              {filtrados.map((a, i) => (
                <div key={a.id_alimento} className="card" style={{ overflow:"hidden", animation:`fadeUp 0.5s ease ${i*80}ms both` }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";  e.currentTarget.style.boxShadow=""; }}
                >
                  <div style={{ background:`${categoryColors[a.categoria] || G.green}12`, padding:"16px 18px 12px", borderBottom:`1px solid ${categoryColors[a.categoria] || G.green}20` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color: categoryColors[a.categoria] || G.green, background:`${categoryColors[a.categoria] || G.green}20`, padding:"2px 10px", borderRadius:99 }}>{a.categoria}</span>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#111", marginTop:6 }}>{a.nombre}</div>
                      </div>
                      <span style={{ fontSize:30 }}>{categoryIcons[a.categoria] || "🍽️"}</span>
                    </div>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ background:G.green, color:"#fff", borderRadius:10, padding:"6px 14px", textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, lineHeight:1 }}>{a.calorias}</div>
                        <div style={{ fontSize:10, opacity:0.85 }}>kcal</div>
                      </div>
                      <span style={{ fontSize:12, color:G.gray }}>por 100g de porción</span>
                    </div>
                    {[["Proteínas", a.proteinas, "#dc2626"], ["Carbohidratos", a.carbohidratos, "#ca8a04"], ["Grasas", a.grasas, G.green]].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ marginBottom:6 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:G.gray, marginBottom:3 }}>
                          <span>{lbl}</span><span style={{ fontWeight:700, color:"#374151" }}>{val}g</span>
                        </div>
                        <div style={{ height:4, borderRadius:99, background:"#e5e7eb", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min((val/30)*100,100)}%`, background:col, borderRadius:99 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer style={{ background:G.brown, color:"rgba(255,255,255,0.7)", textAlign:"center", padding:"24px", fontSize:13 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", color:"#fff", fontSize:18, fontWeight:700 }}>NutrIA</span>
        <span style={{ margin:"0 12px" }}>·</span>
        © 2026 — Inteligencia nutricional a tu alcance
      </footer>

      {/* Botón flotante IA */}
      <button onClick={() => setChatOpen(true)} style={{
        position:"fixed", bottom:28, right:28, zIndex:200,
        width:58, height:58, borderRadius:"50%",
        background:`linear-gradient(135deg, ${G.green}, ${G.green2})`,
        border:"none", cursor:"pointer", fontSize:24,
        boxShadow:`0 8px 24px rgba(25,135,84,0.45)`,
        animation:"pulse 2.5s ease infinite",
        display:"flex", alignItems:"center", justifyContent:"center"
      }}>🤖</button>

      {/* Chat modal */}
      {chatOpen && <ChatIA onClose={() => setChatOpen(false)} />}
    </>
  );
}
