import React, { useState } from 'react';

// API 기본 URL
const API_URL = 'http://localhost:8000';

const loginUser = async (email, password) => {
  // TODO: 나중에 이 API 주소를 실제 주소로 변경하세요.
  const response = await fetch(`${API_URL}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response;
};


function LoginPage({ onLoginSuccess, onSwitchToSignup }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(loginEmail, loginPassword);
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        onLoginSuccess();
      } else {
        alert('로그인 실패. 이메일과 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      alert(`로그인 중 오류 발생: ${error}`);
    }
  };

  return (
    <div className="login-container">
      {/* --- 왼쪽 이미지 섹션 --- */}
      <div className="login-image-section">
        <div className="login-image-content">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h1>클라우드 블랙박스</h1>
          <p>서비스를 이용하시려면 로그인해주세요.</p>
        </div>
      </div>

      {/* --- 오른쪽 로그인 폼 섹션 --- */}
      <div className="login-form-section">
        <div className="auth-wrapper">
          <h2>로그인</h2>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <input
                className="auth-input"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="이메일"
                required
              />
            </div>
            <div className="input-group">
              <input
                className="auth-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="비밀번호"
                required
              />
            </div>
            <button type="submit" className="auth-button">
              로그인
            </button>
          </form>
          <div className="toggle-auth-section">
            <span>계정이 없으신가요? </span>
            <button onClick={onSwitchToSignup} className="toggle-auth-button">
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

