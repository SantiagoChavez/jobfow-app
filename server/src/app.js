import express from 'express';
import cors from 'cors';
import applicationRoutes from './routes/applicationRoutes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Jobflow API',
    timestamp: new Date(),
  });
});

// Rutas de la API
app.use('/api/applications', applicationRoutes);

export default app;
