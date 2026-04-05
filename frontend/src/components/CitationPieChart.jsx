import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#E2E8F0'];

export default function CitationPieChart({ score, brandName, pieChartData, title }) {
  const data = pieChartData && pieChartData.length > 0 
    ? pieChartData 
    : [
        { name: brandName, value: score },
        { name: '기타 (경쟁사 등)', value: 100 - score },
      ];

  // Helper to find main brand's score for display
  const mainScore = pieChartData && pieChartData.length > 0
    ? pieChartData.find(d => d.name === brandName)?.value || 0
    : score;

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1rem', color: '#1E293B' }}>{title || '브랜드 점유율 분석 (PAWC 기반 Share of Voice)'}</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
        * 위치 가중치 및 글자 수(단어 빈도)가 반영된 Position-Adjusted 스코어입니다.
      </p>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>자사 점유율: {mainScore}%</strong>
      </div>
    </div>
  );
}
