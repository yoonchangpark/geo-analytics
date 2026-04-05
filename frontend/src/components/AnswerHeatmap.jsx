import React from 'react';

export default function AnswerHeatmap({ simulationData, brandName, title }) {
  const highlightText = (text) => {
    if (!text) return null;
    const regex = new RegExp(`(${brandName})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      // If it matches the brand name
      if (part.toLowerCase() === brandName.toLowerCase()) {
         // Using a green highlight for positive mention
        return <mark key={i} style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0 4px', borderRadius: '4px', fontWeight: 'bold' }}>{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!simulationData || !simulationData.textAnswers) return null;

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>{title || 'AI 답변 텍스트 히트맵 시뮬레이터'}</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {simulationData.textAnswers.map((answer, index) => (
          <div key={index} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>생성 시도 #{index + 1}</h4>
            <p style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
              {highlightText(answer)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
