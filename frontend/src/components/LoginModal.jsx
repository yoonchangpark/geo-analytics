import React, { useState } from 'react';

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      setLoading(false);
      // Secret backdoor for testing
      if (email.trim() === 'yoonchang.park@gmail.com') {
        onSuccess(email);
      } else {
        setError('존재하지 않는 계정이거나 비밀번호가 일치하지 않습니다.');
      }
    }, 800);
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
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease-out',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#0F172A', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
          에이전시 로그인
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          가입하신 계정으로 로그인해주세요.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#334155' }}>이메일</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@company.com" 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#334155' }}>비밀번호</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              padding: '0.85rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <button 
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: 'none',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
