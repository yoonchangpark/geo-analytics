import React, { useState } from 'react';
import CitationPieChart from './components/CitationPieChart';
import AnswerHeatmap from './components/AnswerHeatmap';
import GeoRadarChart from './components/GeoRadarChart';
import UrgentActions from './components/UrgentActions';
import SearchDominanceQuadrant from './components/SearchDominanceQuadrant';
import BrandMetricsTable from './components/BrandMetricsTable';
import BenchmarkingReport from './components/BenchmarkingReport';
import TopCompetitorHighlight from './components/TopCompetitorHighlight';
import html2pdf from 'html2pdf.js';

function App() {
  const [keyword, setKeyword] = useState('세정티슈 추천');
  const [targetUrl, setTargetUrl] = useState('https://example.com/snack');
  const [brandName, setBrandName] = useState('위칙');
  const [competitorsText, setCompetitorsText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const downloadPDF = () => {
    const element = document.getElementById('report-capture-area');
    const opt = {
      margin:       [10, 0, 10, 0],
      filename:     `GEO_Analytics_Report_${brandName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.card', '.recharts-wrapper', 'h3', 'img', 'table'] }
    };
    
    // 다운로드 중에는 버튼 숨기기 등을 할 수 있으나 그대로 진행
    html2pdf().set(opt).from(element).save();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setError('');
    setProgress(0);
    
    // 평균 소요 시간 계산 (최근 5회 기준)
    const pastDurationsStr = localStorage.getItem('geo_past_durations');
    const pastDurations = pastDurationsStr ? JSON.parse(pastDurationsStr) : [];
    const avgDuration = pastDurations.length > 0
      ? Math.floor(pastDurations.reduce((a, b) => a + b, 0) / pastDurations.length)
      : 120; // fallback default
    
    setTimeLeft(avgDuration);

    const timer = setInterval(() => {
      setProgress(old => {
        // 평균 기간 기반으로 프로그레스 99%까지 딱 맞게 차오르도록 설정
        const next = old + (100 / avgDuration);
        return next > 99 ? 99 : next;
      });
      setTimeLeft(old => (old > 0 ? old - 1 : 0));
    }, 1000);

    const startTime = Date.now();

    let naverRawData = null;
    
    // 1. 크롬 확장 프로그램(익스텐션)을 통한 네이버 백그라운드 크롤링 (우회 전략)
    const scrapeViaExtension = new Promise((resolve) => {
      let isResolved = false;
      
      // 익스텐션 미설치 혹은 타임아웃 대비 (12초)
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          window.removeEventListener('message', handleExtMsg);
          console.log('[App] 익스텐션 타이아웃 혹은 미설치 -> Fallback RAG 시뮬레이션으로 전환');
          resolve(null); 
        }
      }, 12000); 

      // 익스텐션 응답 리스너
      const handleExtMsg = (event) => {
        if (event.data?.type === 'GEO_SCRAPE_RESULT') {
          isResolved = true;
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleExtMsg);
          console.log('[App] 익스텐션으로부터 크롤링 원본 수신 성공!');
          resolve(event.data.data);
        } else if (event.data?.type === 'GEO_SCRAPE_ERROR') {
          isResolved = true;
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleExtMsg);
          resolve(null);
        }
      };
      
      window.addEventListener('message', handleExtMsg);
      
      // 사용자 브라우저에 네이버 스크래핑 의뢰
      window.postMessage({ type: 'GEO_START_SCRAPE', keyword }, '*');
    });

    try {
      naverRawData = await scrapeViaExtension;

      const compArray = competitorsText.split(',').map(c => c.trim()).filter(c => c !== '');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/analysis/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword,
          targetUrl,
          brandName,
          competitors: compArray,
          naverRawData // 백엔드로 브라우저가 직접 긁어온 텍스트 전송
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      
      setResults(json.data);
      
      // 성공적으로 끝났다면 실제 소요 시간을 기록
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      const newDurations = [...pastDurations, durationSec];
      if (newDurations.length > 5) newDurations.shift(); // 최근 5개만 유지
      localStorage.setItem('geo_past_durations', JSON.stringify(newDurations));
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      clearInterval(timer);
      setProgress(100);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '2.5rem', marginBottom: '0.5rem' }}>GEO Tool</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Generative Engine Optimization 트렌드 및 가시성 분석 SaaS</p>
      </header>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto 2rem auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(250px, 2fr) minmax(150px, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>목표 키워드</label>
              <input type="text" className="input-field" value={keyword} onChange={e => setKeyword(e.target.value)} required placeholder="예: 섬유유연제 추천" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>자사 브랜딩 URL (분석 대상)</label>
              <input type="url" className="input-field" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>자사 브랜드명</label>
              <input type="text" className="input-field" value={brandName} onChange={e => setBrandName(e.target.value)} required placeholder="예: 위칙" />
            </div>
          </div>
          
          <div className="flex-responsive" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>타겟 경쟁사 (콤마 구분, 미입력 시 AI가 연관 경쟁사 자동 추출)</label>
              <input type="text" className="input-field" value={competitorsText} onChange={e => setCompetitorsText(e.target.value)} placeholder="예: 쿼시, 홈스타, 랩신" />
            </div>
            <button type="submit" className="btn" disabled={loading} style={{ height: '46px', whiteSpace: 'nowrap', minWidth: '180px', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {loading ? '분석 중...' : '🚀 진단 시작'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '2rem' }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--primary)' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(79,70,229,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          
          <div style={{ maxWidth: '400px', margin: '2rem auto 0 auto', backgroundColor: '#E2E8F0', borderRadius: '8px', overflow: 'hidden', height: '8px' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 1s ease' }}></div>
          </div>
          
          <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: '#1E293B' }}>
            상위 노출 AI 모델 시뮬레이션 중... {Math.floor(progress)}%
          </p>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            예상 남은 시간: 약 {Math.floor(timeLeft / 60)}분 {timeLeft % 60}초
          </p>
          
          {timeLeft <= 90 && (
             <div style={{ marginTop: '1.5rem', animation: 'fadeIn 1s' }}>
                <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
                <p style={{ color: '#B45309', fontWeight: 'bold', backgroundColor: '#FEF3C7', display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '20px', margin: 0 }}>
                  ☕ 각 경쟁사 웹사이트를 1:1로 딥-크롤링 중입니다.<br/>분석이 완료 될 때까지 커피 한 잔 마시고 오세요!
                </p>
             </div>
          )}
        </div>
      )}

      {results && (
        <div className="dashboard-results" id="report-capture-area" style={{ backgroundColor: 'white', padding: '10px' }}>

          <UrgentActions analysisData={results.integratedAnalysis} />

          {/* Top Overview Cards */}
          <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Global AI Score</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0.5rem 0' }}>{results.global.scoring.averagePositionScore}점</h2>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Local AI (Naver) Score</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0.5rem 0' }}>{results.naver.scoring.averagePositionScore}점</h2>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>GEO Structural Score</p>
              <h2 style={{ fontSize: '2.5rem', color: results.diagnostics.geoScorePct > 70 ? 'var(--success)' : 'var(--warning)', margin: '0.5rem 0' }}>
                {results.diagnostics.geoScorePct}%
              </h2>
            </div>
          </div>

          <SearchDominanceQuadrant 
            searchMetrics={results.searchMetrics} 
            geoShareData={results.naver.shareAnalysis?.pieChartData} 
            brandName={brandName} 
          />

          <BrandMetricsTable 
            searchMetrics={results.searchMetrics}
            globalShareData={results.global.shareAnalysis?.pieChartData}
            naverShareData={results.naver.shareAnalysis?.pieChartData}
            brandName={brandName}
          />

          <TopCompetitorHighlight 
            data={results.naver.shareAnalysis?.aggregatedResult} 
            keyword={keyword} 
          />

          <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>엔진별 마켓 셰어 (Share of Voice) 비교</h3>
          <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
            <CitationPieChart 
               score={results.global.scoring.averagePositionScore} 
               brandName={brandName} 
               pieChartData={results.global.shareAnalysis?.pieChartData}
               title="Global AI (Google/GPT) 점유율"
            />
            <CitationPieChart 
               score={results.naver.scoring.averagePositionScore} 
               brandName={brandName} 
               pieChartData={results.naver.shareAnalysis?.pieChartData}
               title="Local AI (Naver Cue:) 점유율"
            />
          </div>

          <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>엔진별 시뮬레이터 히트맵</h3>
          <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
            <AnswerHeatmap simulationData={results.global.simulation} brandName={brandName} title="Global AI 답변" />
            <AnswerHeatmap simulationData={results.naver.simulation} brandName={brandName} title="Local AI 답변" />
          </div>

          <GeoRadarChart diagnosticsData={results.diagnostics} />

          <BenchmarkingReport benchmarkingData={results.benchmarking} />
          
          <div className="no-print" style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                더 이상 전통적인 SEO만으로는 브랜드를 방어할 수 없습니다.
              </h4>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#92400E', lineHeight: '1.7' }}>
                검색의 패러다임이 단순 '키워드 매칭'에서 <strong>'AI의 직접적인 답변 생성'</strong>으로 시대가 급변하고 있습니다. 아무리 상위 노출(SEO, 파워링크)에 막대한 예산을 쏟아부어도, 고객이 구글이나 네이버 AI에게 질문했을 때 <strong>AI가 우리 브랜드를 무시하고 경쟁사를 '정답'으로 뱉어낸다면</strong> 모든 홍보 노력은 무용지물이 됩니다. 이제 마케터의 핵심 미션은 AI가 우리 브랜드를 정확히 읽고, 논리적으로 이해하여 1순위 정답으로 채택하도록 만드는 것입니다. 이것이 바로 <strong>우리가 당장 GEO(Generative Engine Optimization, 생성형 엔진 최적화)를 시작해야 하는 이유</strong>입니다.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                왜 자체 개발한 '다차원 딥-시뮬레이션 엔진'을 사용하나요?
              </h4>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.7' }}>
                기존의 범용 AI 검색엔진들은 국내 시장의 트렌드 변화나 세밀한 브랜드 포지셔닝을 제대로 인지하지 못하는 한계가 있었습니다. 저희 GEO 플랫폼은 자체 구축한 <strong>'다차원 구조화 딥-시뮬레이터'</strong>를 통해 국내 소비자들의 실제 탐색 여정 및 최신 UGC 생태계를 실시간 연속성으로 재현해 냅니다. 이 고도화된 방식은 곧 상용화될 <strong>네이버(Cue:)와 구글(AI Overview)의 작동 알고리즘을 완벽히 미러링(Mirroring)</strong>하여, 경쟁사를 지능적으로 압도하기 위한 한 치의 오차도 없는 <strong>초정밀 역공학 지표(Gold Standard)</strong>를 제공합니다.
              </p>
            </div>
          </div>

          <div className="no-print" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={downloadPDF}
              className="btn" 
              style={{ padding: '1rem 3rem', fontSize: '1.2rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <span>📥</span> 보고서 원클릭 다운로드 (PDF)
            </button>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748B' }}>
              서식 깨짐 없이 보이는 그대로 리포트가 깔끔하게 다운로드 됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
