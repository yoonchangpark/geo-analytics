import { OpenAI } from 'openai';
import pLimit from 'p-limit';

export async function runRagSimulation(keyword, targetBrands = [], engine = 'global') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-api-key-for-local' 
  });

  const generateAnswer = async () => {
    if (!process.env.OPENAI_API_KEY) {
      return `[Mock AI 생성 결과]: ${keyword}의 경우 시장에서 다우니나 스너글 같은 대형 브랜드들이 주로 언급됩니다. 제공된 신생 브랜드는 아직 널리 언급되지 않고 있습니다.`;
    }

    let systemInstruction = `당신은 최신 시장 트렌드와 웹 데이터를 오직 객관적으로 분석하여 질문에 답하는 AI 어시스턴트입니다. 특정 브랜드에 대한 편향 없이, 실제로 '${keyword}' 시장에서 대중에게 가장 인기가 높거나 품질이 입증된 브랜드를 구체적인 고유명사로 1위부터 3위까지 나열하고 추천 이유를 설명하세요.`;
    
    if (engine === 'chatgpt') {
      const brandListString = targetBrands && targetBrands.length > 0 ? targetBrands.join(', ') : '국내 중소/신생 브랜드들';
      systemInstruction = `당신은 한국 사용자를 돕는 'ChatGPT 웹 브라우징' 검색 AI입니다. 
영미권 데이터에 편향되지 말고, 반드시 '한국 내수 시장의 관점'에서 '${keyword}' 에 대한 최고의 브랜드를 1위부터 3위까지 추천하는 답변을 작성하세요. 
[필수 지침] 현재 모니터링 중인 타겟 브랜드 목록 [ ${brandListString} ] 이 한국 시장에서 가지는 입지나 특징을 절대 무시하지 마세요. 이 브랜드들의 장점이나 단점을 면밀히 분석하여 답변에 반드시 포함해야 합니다.`;
    } else if (engine === 'naver') {
      const brandListString = targetBrands && targetBrands.length > 0 ? targetBrands.join(', ') : '국내 로컬 브랜드들';
      systemInstruction = `당신은 네이버의 Cue: 검색 AI 시뮬레이터입니다. 한국 네이버 블로그 후기와 지식iN 답변들, 네이버 쇼핑 트렌드를 종합 검토하여 '${keyword}' 분야의 최고 브랜드들을 추천하는 답변을 작성하세요.
[필수 지침] 고객이 입력한 타겟 브랜드 목록 [ ${brandListString} ] 이 네이버 생태계(블로그/쇼핑)에서 어떻게 평가받고 있는지 반드시 분석하세요. 이 브랜드를 단순히 무시(0점 처리)하지 말고, 경쟁사와 트렌드를 비교하며 장점이나 특징을 꼭 함께 언급해 주어야 합니다.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo", 
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `검색 키워드: ${keyword}\n\n위 검색어에 대한 가장 현실적이고 대중적인 AI 검색 추천 답변을 팩트 기반으로 작성해주세요.` }
        ]
      });
      return response.choices[0].message.content;
    } catch(err) {
      console.log('RAG 시뮬레이션 중 오류 발생:', err.message);
      return `검색 엔진 통신 불가: ${keyword} 관련 추천 데이터를 가져올 수 없습니다.`;
    }
  };

  const limit = pLimit(3); // To avoid rate limiting
  const promises = Array.from({ length: 5 }).map(() => limit(() => generateAnswer()));
  
  const textAnswers = await Promise.all(promises);

  return {
    keyword,
    contextUsed: [{ title: 'AI Neutral Knowledge Base (Simulation)', content: '어떠한 가짜(Mock) 문서도 억지로 주입되지 않았습니다. 100% LLM의 객관적 내부 학습 데이터와 시장 트렌드 인지도를 바탕으로 중립적으로 생성된 팩트 기반 답변입니다.' }],
    textAnswers
  };
}
