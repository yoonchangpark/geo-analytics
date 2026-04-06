import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appendDatasetLog } from '../utils/datasetLogger.js';

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
 * User manual feedback (Correction)
 * Sent from Frontend FeedbackBox to improve ML model
 */
router.post('/feedback', async (req, res) => {
  const { keyword, brandName, feedbackText } = req.body;
  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  try {
    const sysPrompt = 'You are an elite B2B SEO/GEO Growth Hacker parsing data.';
    const usrPrompt = `[Human Correction Feedback]\nKeyword: ${keyword || 'Unknown'}\nBrand: ${brandName || 'Unknown'}\nContext: The AI previously generated an insight for this data.\nHuman Expert instructs you to learn the following correction pattern or insight:\n${feedbackText}`;
    const asstResponse = JSON.stringify({
      analysis_insight: feedbackText,
      urgent_actions: [
        { title: "User Feedback Driven Action", description: feedbackText }
      ]
    });

    await appendDatasetLog(sysPrompt, usrPrompt, asstResponse);
    res.json({ message: 'Feedback logged successfully!' });
  } catch(e) {
    res.status(500).json({ error: e.message });
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
