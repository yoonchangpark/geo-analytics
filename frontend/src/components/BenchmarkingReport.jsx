import React from 'react';

export default function BenchmarkingReport({ benchmarkingData }) {
  if (!benchmarkingData) return null;

  return (
    <div style={{ marginTop: '3rem', marginBottom: '3rem', padding: '2rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.8rem' }}>🔍</span> 1위 경쟁사 역공학 (Reverse Engineering) 분석
      </h2>
      <p style={{ marginBottom: '2rem', color: '#475569', fontSize: '0.95rem' }}>
        AI가 실제로 인용한 경쟁사 웹페이지 구조와 패턴을 분석하여 자사 환경에 즉시 적용할 수 있는 가이드라인을 제공합니다.
      </p>

      <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #10B981', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#065F46', marginBottom: '1rem', fontSize: '1.1rem' }}>✅ Key Success Factor (경쟁사 인용 이유)</h3>
          <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', flexGrow: 1 }}>
            {benchmarkingData.key_success_factor}
          </p>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid #EF4444', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#991B1B', marginBottom: '1rem', fontSize: '1.1rem' }}>📉 Gap Analysis (자사와의 결정적 차이)</h3>
          <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', flexGrow: 1 }}>
            {benchmarkingData.gap_analysis}
          </p>
        </div>
      </div>

      <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.4rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          💡 벤치마킹을 통한 자사몰 역전 가이드 (Action Plan)
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '2rem' }}>
          개발자나 마케터가 <b>당장 오늘 자사몰(또는 스마트스토어)에 적용할 수 있는</b> 3단계의 구체적인 개선 가이드를 정리했습니다.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {benchmarkingData.action_plans && benchmarkingData.action_plans.map((plan, index) => (
            <div key={index} style={{ 
              backgroundColor: '#F8FAFC', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              borderLeft: '5px solid #3B82F6',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                     backgroundColor: '#DBEAFE', color: '#1D4ED8', minWidth: '40px', height: '40px', 
                     borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 
                 }}>
                 {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#1E293B', fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                  {plan.step_title}
                </h4>
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  {plan.description}
                </p>
                <div style={{ 
                  backgroundColor: '#EFF6FF', 
                  padding: '1.25rem', 
                  borderRadius: '8px',
                  color: '#1D4ED8',
                  border: '1px dashed #93C5FD'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>✏️</span>
                    <strong style={{ fontSize: '0.95rem' }}>이렇게 직접 수정해 보세요!</strong>
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.6', paddingLeft: '1.7rem', color: '#1E3A8A' }}>
                    {plan.example}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {benchmarkingData.winning_analysis && benchmarkingData.winning_analysis.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.4rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            👑 경쟁사 승리 공식 (Winning Formulas) 파해치기
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '2rem' }}>
             AI 모델이 경쟁사의 어떤 문구를 '진짜 근거'로 가져왔는지 분석하고, 자사 웹페이지에 삽입할 더 강력한 카운터 문구를 제안합니다.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             {benchmarkingData.winning_analysis.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  backgroundColor: '#FFFFFF', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}>
                  {/* Left: Competitor */}
                  <div style={{ border: '1px solid #FECACA', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#FEF2F2' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#991B1B', fontWeight: 'bold', margin: 0 }}>
                           🤜 경쟁사 ({item.competitor_name}) 승리 문구
                        </h4>
                     </div>
                     <p style={{ color: '#7F1D1D', fontSize: '1rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1rem' }}>
                        "{item.quoted_sentence}"
                     </p>
                     
                     <div style={{ borderTop: '1px solid #FCA5A5', paddingTop: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#991B1B', display: 'block', marginBottom: '0.5rem' }}>AI가 선택한 이유:</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                           {item.why_it_won.split(' ').map((tag, tIdx) => (
                             <span key={tIdx} style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                               {tag}
                             </span>
                           ))}
                        </div>
                     </div>
                     
                     {benchmarkingData.competitor_screenshot && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #FCA5A5', paddingTop: '1rem' }}>
                           <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#991B1B', display: 'block', marginBottom: '0.5rem' }}>📸 실제 데이터 출처 (경쟁사 스크린샷):</span>
                           <img src={benchmarkingData.competitor_screenshot} alt="경쟁사 사이트" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', objectPosition: 'top', borderRadius: '8px', border: '1px solid #FCA5A5' }} />
                        </div>
                     )}
                  </div>

                  {/* Right: Us (Counter Strategy) */}
                  <div style={{ border: '2px solid #10B981', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#ECFDF5', position: 'relative' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#065F46', fontWeight: 'bold', margin: 0 }}>
                           🛡️ 자사 역전 제안 (Counter Strategy)
                        </h4>
                        <button 
                           onClick={() => navigator.clipboard.writeText(item.our_counter_strategy)}
                           style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                           title="문구 복사하기"
                        >
                           <span>📋 복사</span>
                        </button>
                     </div>
                     
                     <p style={{ 
                       color: '#064E3B', 
                       fontSize: '1.1rem', 
                       lineHeight: '1.6', 
                       fontWeight: '600', 
                       backgroundColor: '#D1FAE5', 
                       padding: '1rem', 
                       borderRadius: '6px' 
                     }}>
                        {item.our_counter_strategy}
                     </p>
                     
                     <p style={{ color: '#047857', fontSize: '0.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💡</span> 이 문구를 웹사이트 본문 H2 태그 바로 아래에 넣으면 다음 진단 시 점유율 상승이 예측됩니다.
                     </p>

                     {benchmarkingData.our_screenshot && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #10B981', paddingTop: '1rem' }}>
                           <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#065F46', display: 'block', marginBottom: '0.5rem' }}>📸 현재 자사 사이트 (개선 전):</span>
                           <img src={benchmarkingData.our_screenshot} alt="자사 사이트" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', objectPosition: 'top', borderRadius: '8px', border: '1px solid #6EE7B7' }} />
                        </div>
                     )}
                  </div>
                </div>
             ))}
          </div>
        </div>
      )}

    </div>
  );
}
