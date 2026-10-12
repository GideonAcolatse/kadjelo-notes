import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', async (_req, res) => {
  const status = await initializeDatabase();
  res.json({
    app: 'Kadjelo Notes API',
    version: '1.0.0',
    ...status,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Kadjelo Notes Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
