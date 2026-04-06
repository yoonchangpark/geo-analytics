import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import analysisRoutes from './src/routes/analysis.routes.js';
import datasetRoutes from './src/routes/dataset.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:3000', 'https://geo-analytics-sage.vercel.app', 'https://geo-analytics-fqlaw68bz-yoonchangparks-projects.vercel.app'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// С크린샷 정적 파일 서빙
app.use('/screenshots', express.static(path.join(__dirname, 'public', 'screenshots')));

// Main analysis route
app.use('/api/analysis', analysisRoutes);
app.use('/api/dataset', datasetRoutes); // 파인튜닝 데이터셋 라우터


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GEO SaaS Backend is running.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
