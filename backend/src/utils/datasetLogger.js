import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATASET_FILE = path.join(DATA_DIR, 'geo_finetune_dataset.jsonl');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * AI의 정상 응답(Ground-Truth)을 jsonl 포맷으로 로깅합니다.
 * @param {string} systemPrompt - AI에게 주입된 시스템 프롬프트
 * @param {string} userPrompt - 유저의 실제 프롬프트/제공데이터
 * @param {string} assistantResponse - 파싱에 성공한 완벽한 JSON 문자열
 */
export async function appendDatasetLog(systemPrompt, userPrompt, assistantResponse) {
  try {
    // 1. Local Fallback Backup (JSONL)
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
    await fs.promises.appendFile(DATASET_FILE, jsonlString, 'utf8');
    
    // 2. Cloud DB Permanent Storage (Supabase)
    if (supabase) {
        const { error } = await supabase
            .from('ml_dataset_logs')
            .insert([
                {
                    system_prompt: systemPrompt,
                    user_prompt: userPrompt,
                    assistant_response: assistantResponse
                }
            ]);
            
        if (error) {
            console.error(`[Supabase Error] Failed to upload dataset log:`, error.message);
        } else {
            console.log(`[Dataset Logger] Successfully backed up 1 sample to Supabase.`);
        }
    }

  } catch (error) {
    console.error(`[Dataset Logger Error] Failed to append log:`, error.message);
  }
}
