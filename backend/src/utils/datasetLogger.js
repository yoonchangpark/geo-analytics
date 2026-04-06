import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATASET_FILE = path.join(DATA_DIR, 'geo_finetune_dataset.jsonl');

/**
 * AI의 정상 응답(Ground-Truth)을 jsonl 포맷으로 로깅합니다.
 * @param {string} systemPrompt - AI에게 주입된 시스템 프롬프트
 * @param {string} userPrompt - 유저의 실제 프롬프트/제공데이터
 * @param {string} assistantResponse - 파싱에 성공한 완벽한 JSON 문자열
 */
export async function appendDatasetLog(systemPrompt, userPrompt, assistantResponse) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }

    const logEntry = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: assistantResponse }
      ]
    };

    const jsonlString = JSON.stringify(logEntry) + '\n';

    // 비동기로 append (블로킹 방지)
    await fs.promises.appendFile(DATASET_FILE, jsonlString, 'utf8');
    
    // 너무 잦은 로그 방지용 (필요시 활성화)
    // console.log(`[Dataset Logger] Successfully logged 1 sample for Fine-tuning.`);
  } catch (error) {
    console.error(`[Dataset Logger Error] Failed to append log:`, error.message);
  }
}
