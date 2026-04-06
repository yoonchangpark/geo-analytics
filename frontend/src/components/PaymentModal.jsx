import React, { useState } from 'react';

export default function PaymentModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('엔터프라이즈 결제 모듈 연동 준비 중입니다. 현재는 테스트 기간이 만료되었습니다.');
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2.5rem',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.4s ease-out',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
        <h2 style={{ color: '#0F172A', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
          무료 진단 한도 초과
        </h2>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          현재 디바이스에 제공된 <strong>무료 AI 진단(5회)</strong>이 모두 소진되었습니다. 무제한 딥 크롤링 및 맞춤형 컨설팅 리포트를 원하시면 프리미엄 플랜으로 업그레이드 해주세요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={handlePayment}
            disabled={loading}
            style={{
              backgroundColor: '#1E293B',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                결제 처리 중...
              </>
            ) : (
              '프리미엄 플랜 결제하기'
            )}
          </button>
          
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: '#64748B',
              border: 'none',
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
