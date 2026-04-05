import React from 'react';

export default function BrandMetricsTable({ searchMetrics, globalShareData, naverShareData, brandName }) {
  if (!searchMetrics || !naverShareData) return null;

  // Combine data by brand
  const tableData = naverShareData.map(item => {
    const brand = item.name;
    const sMetrics = searchMetrics[brand] || { searchVolume: 0 };
    const globalItem = globalShareData?.find(g => g.name === brand) || { mentions: 0, value: 0 };
    
    return {
      brand,
      searchVolume: sMetrics.searchVolume,
      globalMentions: globalItem.pawc_score,
      globalShare: globalItem.value,
      naverMentions: item.pawc_score,
      naverShare: item.value,
      isMain: brand === brandName
    };
  });

  // Sort by Naver Share (Target Engine Priority) descending
  tableData.sort((a, b) => b.naverShare - a.naverShare);

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>브랜드별 통합 지표 상세 표</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
        * 연관검색어 AI 추출을 통해 선정된 경쟁사 리스트입니다. (대명사 제외 완료)
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600' }}>브랜드명</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>월간 검색량 (검색 수요)</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>글로벌 AI 노출 강도</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>네이버 AI 노출 강도</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>최종 점유율 가중점 (Naver)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: row.isMain ? '#FEF2F2' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: row.isMain ? 'bold' : 'normal', color: row.isMain ? '#EF4444' : '#1E293B' }}>
                  {row.brand} {row.isMain && '(자사)'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                  {row.searchVolume.toLocaleString()} 건
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748B' }}>
                  {row.globalMentions.toFixed(1)} 점
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#0F172A', fontWeight: '500' }}>
                  {row.naverMentions.toFixed(1)} 점
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: row.isMain ? '#EF4444' : '#3B82F6' }}>
                  {row.naverShare.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
