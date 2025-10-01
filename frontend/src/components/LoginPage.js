import React, { useState } from 'react';

// API 기본 URL
const API_URL = 'http://localhost:8000';

/**
 * [1단계] 이메일과 비밀번호를 전송하여 2단계 인증 코드를 요청합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Response>}
 */
const submitCredentials = async (email, password) => {
  const response = await fetch(`${API_URL}/api/users/signin/password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  return response;
};

/**
 * [2단계] 이메일과 인증 코드로 최종 로그인을 요청하고 토큰을 발급받습니다.
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증 코드
 * @returns {Promise<Response>}
 */
const submitVerificationCode = async (email, code) => {
    const response = await fetch(`${API_URL}/api/users/signin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
    credentials: 'include',
  });
  return response;
};


function LoginPage({ onLoginSuccess, onSwitchToSignup }) {
  const [uiMode, setUiMode] = useState('enterCredentials'); // 'enterCredentials', 'enterCode'
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 1. 이메일/비밀번호 제출 핸들러
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    // 사용자 경험을 위해 UI를 먼저 인증 코드 입력 단계로 전환합니다.
    setUiMode('enterCode');

    try {
      // API 호출은 백그라운드에서 실행합니다.
      const response = await submitCredentials(loginEmail, loginPassword);
      
      // 만약 API 호출이 실패하면, 사용자에게 알리고 이전 단계로 되돌립니다.
      if (!response.ok) {
        alert('이메일 또는 비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
        setUiMode('enterCredentials'); // 실패 시 UI 되돌리기
      }
      // 성공 시에는 별도 알림 없이 사용자가 다음 단계를 진행하도록 둡니다.

    } catch (error) {
      alert(`로그인 중 오류 발생: ${error}`);
      setUiMode('enterCredentials'); // 에러 발생 시 UI 되돌리기
    }
  };

  // 2. 인증 코드 제출 핸들러
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await submitVerificationCode(loginEmail, verificationCode);

      if (response.ok) {
        const data = await response.json();

        if (data.token) {
          localStorage.setItem('token', data.token);

          onLoginSuccess();
        } else {
          alert('토큰이 응답에 포함되지 않았습니다.');
        }
      } else {
        alert('인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      alert(`인증 중 오류 발생: ${error}`);
    }
  };

  return (
    <div className="login-container">
      {/* --- 왼쪽 이미지 섹션 --- */}
      <div className="login-image-section">
        <div className="login-image-content">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1>클라우드 블랙박스</h1>
          <p>서비스를 이용하시려면 로그인해주세요.</p>
        </div>
      </div>

      {/* --- 오른쪽 로그인 폼 섹션 --- */}
      <div className="login-form-section">
        <div className="auth-wrapper">
          {uiMode === 'enterCredentials' ? (
            <>
              <h2>로그인</h2>
              <form onSubmit={handleCredentialsSubmit} className="auth-form">
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
                  다음
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>2단계 인증</h2>
              <form onSubmit={handleCodeSubmit} className="auth-form">
                <p>{loginEmail}(으)로 전송된<br/>인증 코드를 입력해주세요.</p>
                <div className="input-group">
                  <input
                    className="auth-input"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="인증 코드"
                    required
                  />
                </div>
                <button type="submit" className="auth-button">
                  로그인
                </button>
              </form>
            </>
          )}

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

