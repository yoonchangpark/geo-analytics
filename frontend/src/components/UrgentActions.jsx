import React from 'react';

export default function UrgentActions({ analysisData, brandName }) {
  if (!analysisData || !analysisData.urgent_actions) return null;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {analysisData.analysis_insight && (
        <div style={{ 
          marginBottom: '2rem', 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
          borderRadius: '16px', 
          padding: '2rem',
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '1rem', 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            color: '#F8FAFC',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '1rem'
          }}>
            <span style={{ fontSize: '1.8rem' }}>🎯</span> 
            Executive Summary : {brandName ? `${brandName} AI 검색 점유율 진단` : 'AI 마켓 셰어 분석 요약'}
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.7', 
            color: '#CBD5E1', 
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {analysisData.analysis_insight}
          </p>
        </div>
      )}

      <h3 style={{ marginBottom: '1.5rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🚨</span> 자사몰 긴급 개편 조치 (Top 3)
      </h3>
      
      <div className="grid grid-3" style={{ gap: '1.5rem' }}>
        {analysisData.urgent_actions.map((action, index) => (
          <div key={index} className="card" style={{ 
            borderTop: '5px solid #EF4444', 
            backgroundColor: '#FEF2F2',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ color: '#991B1B', marginBottom: '1rem', fontSize: '1.15rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{index + 1}</span>
              {action.title}
            </h4>
            <p style={{ color: '#7F1D1D', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
