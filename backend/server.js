import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import watermarkRoutes from './routes/watermarkRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureWatermarkDir } from './services/watermarkService.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, 'wat-img');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/wat-img', express.static(outputDir));

app.use('/api', watermarkRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

ensureWatermarkDir()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Watermark server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server due to watermark directory issue:', error);
    process.exit(1);
  });

