import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function GeoRadarChart({ diagnosticsData }) {
  if (!diagnosticsData || !diagnosticsData.diagnostics) return null;

  const { diagnostics, geoScorePct, warnings } = diagnosticsData;
  const metrics = [
    { subject: '수치 통계 (Statistics)', A: diagnostics.numericalData ? 10 : 0, fullMark: 10 },
    { subject: '외부 출처 인용 (Sources)', A: diagnostics.citeSources ? 10 : 0, fullMark: 10 },
    { subject: '전문가 인용구 (Quotes)', A: diagnostics.quotationAddition ? 10 : 0, fullMark: 10 },
    { subject: '유창성/평이체 (Fluency)', A: diagnostics.fluencyAndEasyToUnderstand ? 10 : 0, fullMark: 10 },
    { subject: '스팸/광고 배제 (No Stuffing)', A: diagnostics.keywordStuffingPenalty ? 0 : 10, fullMark: 10 },
    { subject: 'Q&A 구조화 (H2/FAQ)', A: (diagnostics.h2QuestionMatch || diagnostics.faqSection) ? 10 : 0, fullMark: 10 },
    { subject: '비교표/결론 (Table)', A: (diagnostics.tableWithSummary || diagnostics.bottomSummary) ? 10 : 0, fullMark: 10 },
  ];

  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>GEO 웹사이트 구조 달성률</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748B' }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} display="none" />
              <Radar name="진단 점수" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>총합 GEO 스코어: </span>
          <span style={{ fontSize: '1.5rem', color: geoScorePct >= 70 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
            {geoScorePct}%
          </span>
        </div>
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>⚠️ 즉각 조치 필요 (Action Items)</h3>
        {warnings && warnings.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {warnings.map((warn, i) => (
              <li key={i} style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', marginBottom: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', color: '#7F1D1D' }}>
                {warn}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '8px' }}>
            훌륭합니다! AI가 인용하기 아주 좋은 구조를 갖추고 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
