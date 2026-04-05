import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell, ZAxis } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#E2E8F0'];

export default function SearchDominanceQuadrant({ searchMetrics, geoShareData, brandName }) {
  if (!searchMetrics || !geoShareData) return null;

  // Data processing: Combining Search Volume with GEO Share
  const data = geoShareData.map(item => {
    const metrics = searchMetrics[item.name];
    if (!metrics) return null;

    return {
      name: item.name,
      x: metrics.searchVolume, // 네이버 검생략
      y: item.value,          // GEO 점유율
      z: metrics.searchVolume // 점 크기도 검색량 비례
    };
  }).filter(Boolean);

  if (data.length === 0) return null;

  // x와 y의 평균값을 구해 십자선의 기준으로 삼음 (사분면)
  const avgX = data.reduce((sum, item) => sum + item.x, 0) / data.length;
  const avgY = data.reduce((sum, item) => sum + item.y, 0) / data.length;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{point.name}</p>
          <p style={{ margin: '0 0 2px 0' }}>검색량: {point.x.toLocaleString()} 건</p>
          <p style={{ margin: '0' }}>AI 점유율: {point.y.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>통합 검색 점유율 (Search Dominance Quadrant)</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem' }}>
        X축: 네이버 월간 총 검색량 (수요/인지도) | Y축: 네이버 AI (Cue:/에어서치) 점유율 (공급/노출)
      </p>
      
      <div style={{ height: '400px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="검색량" 
              tickFormatter={(value) => (value > 1000 ? `${(value/1000).toFixed(0)}k` : value)}
              label={{ value: "← 검색 수요 낮음  |  검색 수요 높음 →", position: "bottom", offset: 0, fill: "#64748B", fontSize: 13 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="AI 점유율" 
              unit="%" 
              label={{ value: "AI 가시성", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 13 }}
            />
            <ZAxis type="number" dataKey="z" range={[100, 600]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {/* Quadrant Lines lines */}
            <ReferenceLine x={avgX} stroke="#94A3B8" strokeDasharray="3 3" />
            <ReferenceLine y={20} stroke="#94A3B8" strokeDasharray="3 3" /> {/* Fixed Y average or 20% for visibility */}

            <Scatter name="Brands" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell 
                   key={`cell-${index}`} 
                   fill={entry.name === brandName ? '#EF4444' : COLORS[index % COLORS.length]} 
                   opacity={entry.name === brandName ? 1 : 0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.name === brandName ? '#EF4444' : COLORS[index % COLORS.length] }}></div>
            <span style={{ fontWeight: item.name === brandName ? 'bold' : 'normal' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
