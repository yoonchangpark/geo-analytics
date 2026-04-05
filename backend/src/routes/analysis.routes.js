import { Router } from 'express';
import { runRagSimulation } from '../services/ragSimulation.service.js';
import { calculateScoring } from '../services/scoring.service.js';
import { runGeoDiagnostics } from '../services/geoDiagnostics.service.js';
import { runGeoShareAnalysis, findTrueWinnerBrand } from '../services/geoAnalyzer.service.js';
import { getRealSearchMetrics } from '../services/searchMetrics.service.js';
import { analyzeSearchDominance } from '../services/integratedAnalysis.service.js';
import { autoExtractCompetitors } from '../services/autoExtract.service.js';
import { generateBenchmarkingReport } from '../services/benchmarking.service.js';
import { crawlPerplexity } from '../services/realCrawler.service.js';

const router = Router();

router.post('/run', async (req, res) => {
  try {
    const { keyword, targetUrl, brandName, competitors, naverRawData } = req.body;

    if (!keyword || !targetUrl || !brandName) {
      return res.status(400).json({ error: 'Missing required parameters: keyword, targetUrl, brandName' });
    }
    
    // 타겟 브랜드 리스트 동적 구성 (비어있으면 AI 연관검색어 추출)
    let targetBrands = [brandName];
    if (competitors && Array.isArray(competitors) && competitors.length > 0) {
      targetBrands.push(...competitors);
    } else {
      const autoComps = await autoExtractCompetitors(keyword, brandName);
      targetBrands.push(...autoComps);
    }

    // 1. Run AI Simulation (ChatGPT & Naver Parallel)
    // 상용화 및 국내 브랜드 최적화를 위해 Perplexity 크롤링 폐기 -> ChatGPT 시뮬레이션으로 전면 교체
    let globalSimulation;
    let naverSimulation;

    // ChatGPT 환경 시뮬레이터 실행 (Target Brands 인지 강제화 적용)
    globalSimulation = await runRagSimulation(keyword, targetBrands, 'chatgpt');
    console.log("[Route] Using ChatGPT simulation instead of Perplexity.");

    if (naverRawData) {
       console.log("[Route] Using Extracted Chrome Extension 'Raw Data' for Naver bypass!");
       naverSimulation = {
           engine: 'naver_extension_live',
           keyword: keyword,
           contextUsed: [{ title: 'Chrome Extension UGC', content: '고객 로컬 브라우저 크롤링 세션' }],
           textAnswers: [
               "### 분석 모드: 로컬 브라우저 기반 네이버 익스텐션 스크래핑 ###\n" + naverRawData
           ]
       };
    } else {
       naverSimulation = await runRagSimulation(keyword, targetBrands, 'naver');
    }

    // 1.5 항상 시장 내 숨겨진 1위(True Winner)를 색출하여 타겟 브랜드 배열에 강제 편입 (사용자 입력 외 AI 선호 브랜드 발견 기능)
    let trueWinnerName = null;
    if (naverSimulation.textAnswers && naverSimulation.textAnswers.length > 0) {
        console.log("[Route] Extracting Absolute True Winner from text...");
        trueWinnerName = await findTrueWinnerBrand(naverSimulation.textAnswers[0]);
        if (trueWinnerName) {
            console.log(`[Route] True Winner extracted: ${trueWinnerName}`);
            // 배열에 없으면 즉시 편입하여 이후 모든 PAWC 분석과 검색량 조회 대상에 포함시킴
            if (!targetBrands.includes(trueWinnerName)) {
                console.log(`[Route] Injecting True Winner '${trueWinnerName}' into targetBrands array.`);
                targetBrands.push(trueWinnerName);
            }
        }
    }

    // 2. Calculate AI Visibility & Citation Score for both
    const [globalScoring, naverScoring] = await Promise.all([
      calculateScoring(globalSimulation.textAnswers, brandName, keyword),
      calculateScoring(naverSimulation.textAnswers, brandName, keyword)
    ]);

    // 3. GEO Website Structure Diagnostics (Crawler)
    const geoDiagnostics = await runGeoDiagnostics(targetUrl, keyword);

    // 4. 브랜드 점유율 분석 엔진 & 오차 제거 (PAWC & Loop Average) for both
    const [globalShareAnalysis, naverShareAnalysis] = await Promise.all([
      runGeoShareAnalysis(globalSimulation.textAnswers, targetBrands, keyword, 'global'),
      runGeoShareAnalysis(naverSimulation.textAnswers, targetBrands, keyword, 'naver')
    ]);

    // 5. Traditional Search Metrics & Integrated Dominance Analysis
    const searchMetrics = await getRealSearchMetrics(keyword, targetBrands);
    
    // 6. Benchmarking & Structure Analysis Node (Competitor vs Brand)

    // 무조건 수학적 통계(PAWC 점유율) 기반으로 1위를 한 경쟁사를 벤치마킹 타겟으로 삼아 모든 컴포넌트 간 논리적 모순 방지.
    let topCompetitorName = '경쟁사';
    const sortedCompetitors = naverShareAnalysis?.pieChartData
        ?.filter(item => item.name !== brandName && item.value > 0)
        .sort((a,b) => b.value - a.value);
    
    if (sortedCompetitors && sortedCompetitors.length > 0) {
        topCompetitorName = sortedCompetitors[0].name; // 수학적 1위 경쟁사 강제 할당
    } else if (trueWinnerName && trueWinnerName !== brandName) {
        topCompetitorName = trueWinnerName; // 최후의 보루 (점유율 계산 실패시)
    } else {
        topCompetitorName = targetBrands.find(b => b !== brandName) || '경쟁사A';
    }

    // We will use Naver Share analysis for the Dominance Analysis, as it's the Local market context
    const integratedAnalysisResult = await analyzeSearchDominance(
      keyword, 
      searchMetrics, 
      naverShareAnalysis?.pieChartData || [],
      trueWinnerName
    );
    const benchmarkingReport = await generateBenchmarkingReport(
      keyword,
      targetUrl,
      brandName,
      topCompetitorName
    );

    res.json({
      success: true,
      data: {
        global: {
          simulation: globalSimulation,
          scoring: globalScoring,
          shareAnalysis: globalShareAnalysis
        },
        naver: {
          simulation: naverSimulation,
          scoring: naverScoring,
          shareAnalysis: naverShareAnalysis
        },
        diagnostics: geoDiagnostics,
        searchMetrics,
        integratedAnalysis: integratedAnalysisResult,
        benchmarking: benchmarkingReport
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to run analysis', details: error.message });
  }
});

export default router;
