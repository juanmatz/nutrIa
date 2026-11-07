import { useState } from "react";

const G = {
  green:  "#198754",
  green2: "#146c43",
  brown:  "#6F4E37",
  cream:  "#faf7f2",
  gray:   "#6b7280",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  .input-field {
    width: 100%;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1.5px solid #e5e7eb;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border 0.2s, box-shadow 0.2s;
    background: #fff;
  }
  .input-field:focus {
    border-color: ${G.green};
    box-shadow: 0 0 0 3px rgba(25,135,84,0.1);
  }
  .input-field.error {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
  }
  .btn-primary {
    background: ${G.green};
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 13px 28px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    width: 100%;
  }
  .btn-primary:hover:not(:disabled) {
    background: ${G.green2};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(25,135,84,0.35);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function InputField({ label, name, type = "text", placeholder, value, onChange, error, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? "error" : ""}`}
      />
      {error && <span style={{ fontSize:12, color:"#dc2626" }}>⚠️ {error}</span>}
      {hint && !error && <span style={{ fontSize:12, color:G.gray }}>{hint}</span>}
    </div>
  );
}

export default function Registro({ onVolver }) {
  const [form, setForm] = useState({
    nombre:    "",
    email:     "",
    password:  "",
    confirmar: "",
    edad:      "",
    peso:      "",
    altura:    "",
  });

  const [errores,  setErrores]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [exito,    setExito]    = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Limpia el error del campo al escribir
    if (errores[name]) setErrores(er => ({ ...er, [name]: "" }));
  }

  function validar() {
    const e = {};
    if (!form.nombre.trim())          e.nombre    = "El nombre es requerido";
    if (!form.email.trim())           e.email     = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "El email no es válido";
    if (!form.password)               e.password  = "La contraseña es requerida";
    else if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirmar) e.confirmar = "Las contraseñas no coinciden";
    if (form.edad && (isNaN(form.edad) || form.edad < 1 || form.edad > 120))
      e.edad = "Edad inválida";
    if (form.peso && (isNaN(form.peso) || form.peso < 1))
      e.peso = "Peso inválido";
    if (form.altura && (isNaN(form.altura) || form.altura < 1))
      e.altura = "Altura inválida";
    return e;
  }

  async function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:          form.nombre,
          email:           form.email,
          contrasena:      form.password,
          contrasena_hash: form.password,
          edad:            form.edad   ? parseInt(form.edad)     : null,
          peso:            form.peso   ? parseFloat(form.peso)   : null,
          altura:          form.altura ? parseFloat(form.altura) : null,
          id_rol:          2,  // rol Usuario por defecto
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrores({ general: data.error || "Error al registrar usuario" });
      } else {
        setExito(true);
      }
    } catch {
      setErrores({ general: "No se pudo conectar con el servidor" });
    } finally {
      setLoading(false);
    }
  }

  // ── PANTALLA DE ÉXITO ──
  if (exito) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${G.green} 0%, ${G.green2} 55%, ${G.brown} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"48px 40px", maxWidth:420, width:"100%", textAlign:"center", animation:"fadeUp 0.5s ease both" }}>
            <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:700, color:"#111", marginBottom:10 }}>
              ¡Registro exitoso!
            </h2>
            <p style={{ color:G.gray, fontSize:15, marginBottom:28, lineHeight:1.6 }}>
              Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.
            </p>
            <button className="btn-primary" onClick={onVolver}>
              Ir al login
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── FORMULARIO DE REGISTRO ──
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${G.green} 0%, ${G.green2} 55%, ${G.brown} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px", position:"relative", overflow:"hidden" }}>

        {/* Decoración de fondo */}
        <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize:"36px 36px" }} />
        <div style={{ position:"absolute", top:-120, right:-120, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute", bottom:-80, left:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

        <div style={{ width:"100%", maxWidth:480, animation:"fadeUp 0.6s ease both", position:"relative" }}>

          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:44, marginBottom:6 }}>🥗</div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:700, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>NutrIA</h1>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:14, marginTop:6 }}>Crea tu cuenta y comienza tu camino</p>
          </div>

          {/* Card del formulario */}
          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:"#111", marginBottom:4 }}>Crear cuenta</h2>
            <p style={{ fontSize:13, color:G.gray, marginBottom:28 }}>Completa tus datos para registrarte</p>

            {/* Error general */}
            {errores.general && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#dc2626" }}>
                ⚠️ {errores.general}
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Datos personales */}
              <div style={{ background:"#f9fafb", borderRadius:14, padding:"18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:G.gray }}>Datos personales</p>
                <InputField label="Nombre completo" name="nombre" placeholder="Juan Andrés López" value={form.nombre} onChange={handleChange} error={errores.nombre} />
                <InputField label="Correo electrónico" name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} error={errores.email} />
              </div>

              {/* Contraseña */}
              <div style={{ background:"#f9fafb", borderRadius:14, padding:"18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:G.gray }}>Contraseña</p>
                <InputField label="Contraseña" name="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} error={errores.password} hint="Usa letras, números y símbolos para mayor seguridad" />
                <InputField label="Confirmar contraseña" name="confirmar" type="password" placeholder="Repite tu contraseña" value={form.confirmar} onChange={handleChange} error={errores.confirmar} />
              </div>

              {/* Datos físicos (opcionales) */}
              <div style={{ background:"#f9fafb", borderRadius:14, padding:"18px 16px", display:"flex", flexDirection:"column", gap:14 }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:G.gray }}>Datos físicos <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(opcionales)</span></p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <InputField label="Edad" name="edad" placeholder="25" value={form.edad} onChange={handleChange} error={errores.edad} />
                  <InputField label="Peso (kg)" name="peso" placeholder="70" value={form.peso} onChange={handleChange} error={errores.peso} />
                  <InputField label="Altura (cm)" name="altura" placeholder="175" value={form.altura} onChange={handleChange} error={errores.altura} />
                </div>
              </div>

              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>

              <p style={{ textAlign:"center", fontSize:13, color:G.gray }}>
                ¿Ya tienes cuenta?{" "}
                <span onClick={onVolver} style={{ color:G.green, fontWeight:600, cursor:"pointer" }}>
                  Inicia sesión
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
