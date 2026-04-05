import { OpenAI } from 'openai';

export async function autoExtractCompetitors(keyword, brandName) {
  if (!process.env.OPENAI_API_KEY) {
     // Mock fallback: Return hardcoded competitors if targeting '세정티슈' or fallback
     if (keyword.includes('세정') || keyword.includes('티슈')) {
        return ['쿼시', '스카트', '윗클', '다이소', '클레바'].filter(b => b !== brandName);
     }
     return ['경쟁사A', '경쟁사B', '경쟁사C'];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userPrompt = `
지금 네이버나 구글의 검색창에 '${keyword}'를 입력했다고 가정하고, 자동완성이나 연관검색어로 함께 뜨는 '브랜드명' 들을 추려내려고 합니다.

[작업 지시]
1. '${keyword}' 시장에서 실제로 경쟁하고 있는 타겟 브랜드 명칭을 최대 5개 추출하세요.
2. 단, '유리', '눈꺼풀', '다용도' 와 같은 형태소(일반 대명사/수식어)는 절대 포함하지 마세요. (오직 고유명사 브랜드명만 허용)
3. 추출된 배열에서 '${brandName}'이 있다면 제외하세요.

[출력 포맷]
반드시 아래 JSON 형식으로 반환하세요.
{
  "competitors": ["브랜드1", "브랜드2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'You are an SEO keyword researcher. Extract strictly brand entities only.' },
        { role: 'user', content: userPrompt }
      ]
    });
    
    const data = JSON.parse(response.choices[0].message.content);
    return data.competitors || ['경쟁사A', '경쟁사B'];
  } catch (error) {
    console.error("autoExtractCompetitors error:", error);
    return ['경쟁사A', '경쟁사B'];
  }
}
