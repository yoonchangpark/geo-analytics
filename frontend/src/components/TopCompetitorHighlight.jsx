import React from 'react';

export default function TopCompetitorHighlight({ data, keyword }) {
  if (!data || !data.top_competitor) return null;

  return (
    <div className="card" style={{ 
      marginBottom: '3rem', 
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      borderLeft: '4px solid #3B82F6',
      borderRight: '1px solid #BFDBFE',
      borderTop: '1px solid #BFDBFE',
      borderBottom: '1px solid #BFDBFE',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ 
          backgroundColor: '#3B82F6', 
          color: '#FFF', 
          padding: '8px 16px', 
          borderRadius: '20px', 
          fontSize: '0.9rem', 
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🏆</span> '{keyword}' AI 검색 1위
        </div>
        <h3 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {data.top_competitor}
        </h3>
      </div>
      
      <p style={{ color: '#1E40AF', fontWeight: '600', marginBottom: '1rem', fontSize: '1.05rem' }}>
        AI 모델이 <strong>{data.top_competitor}</strong> 브랜드를 가장 많이 언급하고 추천한 핵심 이유는 다음과 같습니다:
      </p>

      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem' 
      }}>
        {data.top_reasons && data.top_reasons.map((reason, idx) => (
          <li key={idx} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.75rem', 
            color: '#1E3A8A',
            fontSize: '1rem',
            lineHeight: '1.5',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#60A5FA', 
              color: 'white', 
              borderRadius: '50%', 
              width: '24px', 
              height: '24px', 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              {idx + 1}
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      
      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#3B82F6', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>↓</span> 이처럼 매력적인 추천 사유를 만들어낸 {data.top_competitor}의 웹문서 구조를 아래에서 낱낱이 파헤칩니다.
      </p>
    </div>
  );
}
