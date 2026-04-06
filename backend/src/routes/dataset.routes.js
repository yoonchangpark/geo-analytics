import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_FILE = path.join(__dirname, '..', '..', 'data', 'geo_finetune_dataset.jsonl');

// 다운로드 비밀번호 (환경변수 또는 폴백)
const SECRET_KEY = process.env.DATASET_SECRET || 'ceo1234';

/**
 * 누적된 데이터의 개수(Line) 조회
 */
router.get('/status', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!fs.existsSync(DATASET_FILE)) {
    return res.json({ count: 0, message: 'Dataset is empty' });
  }

  try {
    const data = await fs.promises.readFile(DATASET_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim().length > 0);
    res.json({ count: lines.length, message: `Successfully loaded dataset status` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 데이터셋 jsonl 파일 강제 다운로드
 */
router.get('/download', (req, res) => {
  const secret = req.query.secret;
  if (secret !== SECRET_KEY) {
    return res.status(403).send('Forbidden: Incorrect Secret Key');
  }

  if (!fs.existsSync(DATASET_FILE)) {
    return res.status(404).send('Dataset file not found (0 items recorded).');
  }

  // 브라우저에서 즉시 .jsonl 파일 다운로드 실행
  res.download(DATASET_FILE, `geo_finetune_${Date.now()}.jsonl`, (err) => {
    if (err) {
      console.error("Error downloading dataset:", err);
    }
  });
});

export default router;
