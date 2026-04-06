import React, { useState } from 'react';

export default function FeedbackBox({ brandName, keyword }) {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    try {
      const BE_URL = import.meta.env.VITE_BACKEND_URL || 'https://geo-analytics-1geo-backend.onrender.com';
      const response = await fetch(`${BE_URL}/api/dataset/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          keyword,
          feedbackText: feedback
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFeedback('');
      } else {
        alert('피드백 전송에 실패했습니다.');
      }
    } catch(err) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }} className="no-print">
      <h3 style={{ margin: '0 0 1rem 0', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🎓</span> AI 분석 수정 및 개선 요청 (Machine Learning)
      </h3>
      
      {submitted ? (
        <div style={{ padding: '1.5rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '8px', textAlign: 'center', fontWeight: '500' }}>
          소중한 피드백이 전송되었습니다. AI 모델 학습에 즉시 반영됩니다! 🚀
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
            현재 출력된 분석 리포트 중 동의하지 않거나, 더 나은 마케팅 관점(Insight)이 있다면 아래에 작성해주세요. 입력해주신 데이터는 다음 버닝 튜닝 모델(Fine-tuning)의 [정답지]로 학습됩니다.
          </p>
          <textarea 
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="예: 이 키워드에서 드롱기 브랜드의 진짜 경쟁 우위는 가격이 아니라 '디자인 감성'입니다. 디자인을 강조하여 역공학 제안을 재작성하는 편이 좋습니다."
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontFamily: 'inherit',
              resize: 'vertical',
              fontSize: '0.95rem'
            }}
            required
          />
          <button 
            type="submit" 
            disabled={loading || !feedback.trim()}
            style={{
              alignSelf: 'flex-end',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: loading || !feedback.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !feedback.trim() ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? '학습 데이터 전송 중...' : '💡 AI 모델 학습시키기'}
          </button>
        </form>
      )}
    </div>
  );
}
