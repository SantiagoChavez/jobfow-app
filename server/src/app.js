import express from 'express';
import cors from 'cors';
import applicationRoutes from './routes/applicationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/match', matchRoutes);

export default app;
