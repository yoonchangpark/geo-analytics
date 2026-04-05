import React from 'react';

export default function UrgentActions({ analysisData }) {
  if (!analysisData || !analysisData.urgent_actions) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🚨</span> 오늘의 긴급 조치 3가지
      </h3>
      
      {analysisData.analysis_insight && (
        <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #3B82F6', marginBottom: '1.5rem', color: '#334155', fontWeight: '500', lineHeight: '1.6' }}>
          💡 AI 인사이트: {analysisData.analysis_insight}
        </div>
      )}

      <div className="grid grid-3" style={{ gap: '1rem' }}>
        {analysisData.urgent_actions.map((action, index) => (
          <div key={index} className="card" style={{ borderTop: '4px solid #EF4444', backgroundColor: '#FEF2F2' }}>
            <h4 style={{ color: '#991B1B', marginBottom: '0.75rem', fontSize: '1.1rem' }}>{index + 1}. {action.title}</h4>
            <p style={{ color: '#7F1D1D', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
