import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Importar rutas
import usuariosRouter  from './routes/usuarios.js';
import alimentosRouter from './routes/alimentos.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/usuarios',  usuariosRouter);
app.use('/api/alimentos', alimentosRouter);
app.use('/api/auth', alimentosRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'NutrIA Backend funcionando ' });
});

// Iniciar servidor
app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});
