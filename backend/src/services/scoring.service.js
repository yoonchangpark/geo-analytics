import { OpenAI } from 'openai';

// Metric 1: Position-Adjusted Word Count
function calculatePositionAdjustedScore(text, brandName) {
  const lowerText = text.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  
  const firstIndex = lowerText.indexOf(lowerBrand);
  if (firstIndex === -1) return { score: 0, mentions: 0 };

  const mentions = (lowerText.match(new RegExp(lowerBrand, 'g')) || []).length;
  
  // Base visibility decreases as position gets further (simulate attention drop off)
  const totalLength = text.length;
  const positionWeight = Math.max(0, 1 - (firstIndex / totalLength));
  
  // Simulated word count weight, can be improved to actual sentences describing the brand
  const wordCountWeight = Math.min(1.0, mentions * 0.1); 

  // Score out of 100
  const score = (positionWeight * 0.7 + wordCountWeight * 0.3) * 100;
  
  return {
    score: Math.min(100, Math.round(score)),
    mentions,
    firstAppearanceIndex: firstIndex
  };
}

// Metric 2: Context / Sentiment Analysis (Hybrid Approach: JS Filtering + LLM Deep Analysis)
async function evaluateContextLLM(extractedText, brandName, keyword) {
  if (!process.env.OPENAI_API_KEY) {
    // Mock response
    return { contextScore: 8, reasoning: '[Mock] 1차 추출 완료. 2차 LLM 분석(긍정) 완료되었습니다.' };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `You are evaluating a text snippet containing a recommendation for a brand.
Text Snippet: "${extractedText}"
Brand: "${brandName}"
Keyword: "${keyword}"
Evaluate if this snippet recommends the brand positively, negatively, or neutrally on a scale from 1 to 10. Consider sarcasm and nuanced context.
Return ONLY a JSON object with keys: "contextScore" (number) and "reasoning" (string in Korean, max 1 sentence).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 100, // 토큰 제한으로 비용 절약 및 응답 속도 극대화
      response_format: { type: "json_object" },
      messages: [{ role: 'user', content: prompt }]
    });
    
    const resultText = response.choices[0].message.content;
    try {
        const jsonStr = resultText.substring(resultText.indexOf('{'), resultText.lastIndexOf('}') + 1);
        return JSON.parse(jsonStr);
    } catch (parseErr) {
        console.error("Hybrid G-Eval JSON parse error:", parseErr.message, "Response was:", resultText);
        return { contextScore: 5, reasoning: "분석 형식이 올바르지 않아 중립 점수로 처리되었습니다." };
    }
  } catch (error) {
    console.error("Hybrid G-Eval network/API error:", error.message);
    return { contextScore: 5, reasoning: "LLM 평가 지연으로 인해 중립 점수로 처리되었습니다." };
  }
}

async function evaluateContext(text, brandName, keyword) {
  const lowerText = text.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  
  if (!lowerText.includes(lowerBrand)) {
    return { contextScore: 0, reasoning: "브랜드가 텍스트에 포함되어 있지 않습니다." };
  }

  // 1단계 (JS 필터링): 브랜드 언급 주변 문맥 추출 (토큰 대폭 절감)
  const brandIndex = lowerText.indexOf(lowerBrand);
  const contextRadius = 100;
  const startIdx = Math.max(0, brandIndex - contextRadius);
  const endIdx = Math.min(text.length, brandIndex + brandName.length + contextRadius);
  
  // 원본 텍스트의 대소문자와 형태를 그대로 보존해야 LLM이 뉘앙스를 정확히 파악함
  const localContext = text.substring(startIdx, endIdx);

  // 2단계 (LLM 정밀 분석): 추출된 핵심 문맥만 LLM으로 전송하여 감성/뉘앙스 평가
  return await evaluateContextLLM(localContext, brandName, keyword);
}

export async function calculateScoring(textsArray, brandName, keyword) {
  let totalPositionScore = 0;
  let totalContextScore = 0;
  
  const detailedScores = await Promise.all(textsArray.map(async (text, i) => {
    const posScore = calculatePositionAdjustedScore(text, brandName);
    const evalScore = await evaluateContext(text, brandName, keyword);
    
    totalPositionScore += posScore.score;
    totalContextScore += evalScore.contextScore;
    
    return { iter: i + 1, text, ...posScore, ...evalScore };
  }));

  return {
    averagePositionScore: Math.round(totalPositionScore / textsArray.length),
    averageContextScore: +(totalContextScore / textsArray.length).toFixed(1),
    detailedScores
  };
}
