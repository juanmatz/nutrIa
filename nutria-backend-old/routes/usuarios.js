import { Router } from 'express';
import sql from 'mssql';
import { poolPromise } from '../db.js';

const router = Router();

// GET /api/usuarios - Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('spListarUsuarios');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios - Insertar un usuario
router.post('/', async (req, res) => {
  const { nombre, email, contrasena_hash, edad, peso, altura, id_rol } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('nombre',          sql.VarChar(100), nombre)
      .input('email',           sql.VarChar(100), email)
      .input('contrasena_hash', sql.VarChar(255), contrasena_hash)
      .input('edad',            sql.Int,          edad)
      .input('peso',            sql.Decimal(5,2), peso)
      .input('altura',          sql.Decimal(5,2), altura)
      .input('id_rol',          sql.Int,          id_rol)
      .execute('spInsertarUsuario');
    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
