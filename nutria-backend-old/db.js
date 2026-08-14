import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

export const poolPromise = sql.connect(config)
  .then(pool => {
    console.log(' Conectado a SQL Server - NutrIA');
    return pool;
  })
  .catch(err => {
    console.error(' Error al conectar a SQL Server:', err.message);
    process.exit(1);
  });