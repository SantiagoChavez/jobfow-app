import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import applicationRoutes from './routes/applicationRoutes.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'JobHunter API',
    timestamp: new Date(),
  });
});

// Rutas de la API
app.use('/api/applications', applicationRoutes);

// Conectar a la base de datos y arrancar servidor
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
};

startServer();
