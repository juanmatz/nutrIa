import { Router } from 'express';
import sql from 'mssql';
import { poolPromise } from '../db.js';

const router = Router();


// 1. LOGIN de usuario
//    POST /api/auth/login
//    Body: { email, password }

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar(100), email)
      .execute('spLoginUsuario');

    const usuario = result.recordset[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Correo no registrado' });
    }

    // NOTA: Aquí deberías comparar con bcrypt cuando implementes el hash
    // Ejemplo: const match = await bcrypt.compare(password, usuario.contrasena_hash);
    // Por ahora comparamos directo para desarrollo
    if (password !== usuario.contrasena_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // No retornar el hash al frontend
    const { contrasena_hash, ...usuarioSinHash } = usuario;
    res.json({ mensaje: 'Login exitoso', usuario: usuarioSinHash });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2. LISTAR todos los alimentos
//    GET /api/alimentos
// ============================================================
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request().execute('spListarAlimentos');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 3. INSERTAR un alimento
//    POST /api/alimentos
//    Body: { nombre, calorias, proteinas, carbohidratos, grasas, id_categoria }
// ============================================================
router.post('/', async (req, res) => {
  const { nombre, calorias, proteinas, carbohidratos, grasas, id_categoria } = req.body;

  if (!nombre || !calorias || !id_categoria) {
    return res.status(400).json({ error: 'nombre, calorias e id_categoria son requeridos' });
  }

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('nombre',        sql.VarChar(100), nombre)
      .input('calorias',      sql.Int,          calorias)
      .input('proteinas',     sql.Decimal(5,2), proteinas     ?? 0)
      .input('carbohidratos', sql.Decimal(5,2), carbohidratos ?? 0)
      .input('grasas',        sql.Decimal(5,2), grasas        ?? 0)
      .input('id_categoria',  sql.Int,          id_categoria)
      .execute('spInsertarAlimento');

    res.status(201).json({
      mensaje:  'Alimento creado correctamente',
      alimento: result.recordset[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 4. ACTUALIZAR un alimento
//    PUT /api/alimentos/:id
//    Body: { nombre, calorias, proteinas, carbohidratos, grasas, id_categoria }
// ============================================================
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, calorias, proteinas, carbohidratos, grasas, id_categoria } = req.body;

  if (!nombre || !calorias || !id_categoria) {
    return res.status(400).json({ error: 'nombre, calorias e id_categoria son requeridos' });
  }

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id_alimento',   sql.Int,          id)
      .input('nombre',        sql.VarChar(100), nombre)
      .input('calorias',      sql.Int,          calorias)
      .input('proteinas',     sql.Decimal(5,2), proteinas     ?? 0)
      .input('carbohidratos', sql.Decimal(5,2), carbohidratos ?? 0)
      .input('grasas',        sql.Decimal(5,2), grasas        ?? 0)
      .input('id_categoria',  sql.Int,          id_categoria)
      .execute('spActualizarAlimento');

    res.json({
      mensaje:  'Alimento actualizado correctamente',
      alimento: result.recordset[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 5. ELIMINAR un alimento
//    DELETE /api/alimentos/:id
// ============================================================
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id_alimento', sql.Int, id)
      .execute('spEliminarAlimento');

    res.json({ mensaje: 'Alimento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
