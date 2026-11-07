/**
 * NutrIA - Utilidades de Validación Defensiva de Formularios
 * Cumple con estándares clínicos y de seguridad OWASP:
 * - Sanitización de scripts/HTML
 * - RFC 5322 para correos electrónicos
 * - Complejidad criptográfica de contraseñas
 * - Rangos biológicos y fisiológicamente plausibles
 */

// Regex estricto RFC 5322 para emails
export const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Caracteres sospechosos de inyección de scripts o tags
const SCRIPT_INJECTION_REGEX = /<[^>]*>|[<>\\`]/;

/**
 * Valida nombre de persona o alimento
 */
export function validateName(name, minLen = 3, maxLen = 100) {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'El nombre debe ser una cadena de texto válida.' };
  }
  const clean = name.trim();
  if (clean.length < minLen) {
    return { isValid: false, error: `El nombre debe tener al menos ${minLen} caracteres.` };
  }
  if (clean.length > maxLen) {
    return { isValid: false, error: `El nombre no puede exceder ${maxLen} caracteres.` };
  }
  if (SCRIPT_INJECTION_REGEX.test(clean)) {
    return { isValid: false, error: 'El nombre contiene caracteres especiales o etiquetas no permitidas.' };
  }
  return { isValid: true, value: clean };
}

/**
 * Valida correo electrónico estrictamente
 */
export function validateEmail(email) {
  if (typeof email !== 'string') {
    return { isValid: false, error: 'El correo electrónico es requerido.' };
  }
  const clean = email.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, error: 'El correo electrónico no puede estar vacío.' };
  }
  if (!RFC5322_EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'Formato de correo inválido (ejemplo: usuario@dominio.com).' };
  }
  return { isValid: true, value: clean };
}

/**
 * Valida contraseñas con reglas de seguridad estrictas:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos un dígito numérico
 * - Al menos un carácter especial
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || !password) {
    return { isValid: false, error: 'La contraseña es requerida.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe incluir al menos un número.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*).' };
  }
  return { isValid: true, value: password };
}

/**
 * Valida rango de edad o fecha de nacimiento
 */
export function validateAge(age) {
  const num = parseInt(age, 10);
  if (isNaN(num)) {
    return { isValid: false, error: 'La edad debe ser un número entero.' };
  }
  if (num < 12 || num > 120) {
    return { isValid: false, error: 'La edad debe encontrarse en un rango fisiológico plausible (12 a 120 años).' };
  }
  return { isValid: true, value: num };
}

/**
 * Convierte coma a punto y valida peso corporal (30kg a 300kg)
 */
export function validateWeight(rawWeight) {
  if (rawWeight === undefined || rawWeight === null || rawWeight === '') {
    return { isValid: false, error: 'El peso corporal es requerido.' };
  }
  const cleanStr = String(rawWeight).replace(',', '.').trim();
  const num = parseFloat(cleanStr);
  if (isNaN(num)) {
    return { isValid: false, error: 'El peso ingresado no es un número válido.' };
  }
  if (num < 30 || num > 300) {
    return { isValid: false, error: 'El peso debe situarse dentro de límites clínicos plausibles (30 kg a 300 kg).' };
  }
  return { isValid: true, value: Number(num.toFixed(2)) };
}

/**
 * Convierte coma a punto y valida estatura (100cm a 250cm)
 */
export function validateHeight(rawHeight) {
  if (rawHeight === undefined || rawHeight === null || rawHeight === '') {
    return { isValid: false, error: 'La estatura es requerida.' };
  }
  const cleanStr = String(rawHeight).replace(',', '.').trim();
  let num = parseFloat(cleanStr);
  if (isNaN(num)) {
    return { isValid: false, error: 'La estatura ingresada no es un número válido.' };
  }
  // Si se ingresó en metros (ej. 1.68) convertir a centímetros (168)
  if (num < 3.0) {
    num = num * 100;
  }
  if (num < 100 || num > 250) {
    return { isValid: false, error: 'La estatura debe situarse entre 100 cm y 250 cm.' };
  }
  return { isValid: true, value: Math.round(num) };
}

/**
 * Valida datos nutricionales de un alimento
 */
export function validateFoodData({ nombre, calorias, proteinas, carbohidratos, grasas, id_categoria }) {
  const nameCheck = validateName(nombre, 2, 80);
  if (!nameCheck.isValid) return nameCheck;

  const p = parseFloat(String(proteinas).replace(',', '.'));
  if (isNaN(p) || p < 0 || p > 500) {
    return { isValid: false, error: 'Las proteínas deben estar entre 0g y 500g.' };
  }

  const c = parseFloat(String(carbohidratos).replace(',', '.'));
  if (isNaN(c) || c < 0 || c > 500) {
    return { isValid: false, error: 'Los carbohidratos deben estar entre 0g y 500g.' };
  }

  const g = parseFloat(String(grasas).replace(',', '.'));
  if (isNaN(g) || g < 0 || g > 500) {
    return { isValid: false, error: 'Las grasas deben estar entre 0g y 500g.' };
  }

  let cal = parseInt(calorias, 10);
  if (isNaN(cal)) {
    cal = Math.round((p * 4) + (c * 4) + (g * 9));
  }
  if (cal < 0 || cal > 10000) {
    return { isValid: false, error: 'Las calorías deben ser un valor entre 0 y 10,000 kcal.' };
  }

  const catId = parseInt(id_categoria, 10);
  if (isNaN(catId) || catId <= 0) {
    return { isValid: false, error: 'Selecciona una categoría nutricional válida.' };
  }

  return {
    isValid: true,
    value: {
      nombre: nameCheck.value,
      calorias: cal,
      proteinas: Number(p.toFixed(1)),
      carbohidratos: Number(c.toFixed(1)),
      grasas: Number(g.toFixed(1)),
      id_categoria: catId
    }
  };
}

