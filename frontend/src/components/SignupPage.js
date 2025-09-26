import React, { useState, useEffect } from 'react';

// API 기본 URL
const API_URL = 'http://localhost:8000';

// --- API 호출 함수들 ---

/**
 * [1단계] 입력된 이메일로 인증 코드를 발송하는 API를 호출합니다.
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Response>} - fetch API의 Response 객체
 */
const requestVerificationCode = async (email) => {
  const response = await fetch(`${API_URL}/api/signup/verify-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  return response;
};

/**
 * [2단계] 이메일과 인증 코드를 전송하여 유효성을 검증하는 API를 호출합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증 코드
 * @returns {Promise<Response>} - fetch API의 Response 객체
 */
const submitVerificationCode = async (email, code) => {
  const response = await fetch(`${API_URL}/api/signup/confirm-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
    credentials: 'include',
  });
  return response;
};

/**
 * [3단계] 인증된 이메일과 비밀번호로 최종 회원가입을 요청하는 API를 호출합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Response>} - fetch API의 Response 객체
 */
const completeSignUp = async (email, password) => {
  const response = await fetch(`${API_URL}/api/signup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  return response;
};


function SignupPage({ onSwitchToLogin }) {
  const [uiMode, setUiMode] = useState('enterEmail'); // 'enterEmail', 'enterCode', 'enterPassword'
  
  const [signupEmail, setSignupEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');

  // 유효성 검사 및 오류 메시지 상태
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // 이메일 유효성 실시간 검사
  useEffect(() => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (signupEmail && !regex.test(signupEmail)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
    } else {
      setEmailError('');
    }
  }, [signupEmail]);

  // 비밀번호 일치 여부 실시간 검사
  useEffect(() => {
    if (signupPasswordConfirm && signupPassword !== signupPasswordConfirm) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordError('');
    }
  }, [signupPassword, signupPasswordConfirm]);

  // 1. 인증 코드 발송 처리
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (emailError || !signupEmail) {
      alert('올바른 이메일을 입력해주세요.');
      return;
    }
    try {
      const response = await requestVerificationCode(signupEmail);
      if (response.ok) {
        alert('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
        setUiMode('enterCode');
      } else {
        alert('인증 코드 발송에 실패했습니다.');
      }
    } catch (error) {
      alert(`오류 발생: ${error}`);
    }
  };

  // 2. 인증 코드 확인 처리
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const response = await submitVerificationCode(signupEmail, verificationCode);
      if (response.ok) {
        alert('이메일 인증에 성공했습니다.');
        setIsEmailVerified(true);
        setUiMode('enterPassword');
      } else {
        alert('인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      alert(`오류 발생: ${error}`);
    }
  };
  
  // 3. 최종 회원가입 처리
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (passwordError || signupPassword !== signupPasswordConfirm) {
      alert('비밀번호를 확인해주세요.');
      return;
    }
    try {
      const response = await completeSignUp(signupEmail, signupPassword);
      if (response.ok) {
        alert('회원가입 성공! 이제 로그인해주세요.');
        onSwitchToLogin();
      } else {
        const errorData = await response.json();
        alert(`회원가입 실패: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`회원가입 중 오류 발생: ${error}`);
    }
  };
  
  const isPasswordFormInvalid = !signupPassword || !signupPasswordConfirm || passwordError;

  return (
    <div className="auth-wrapper">
      <h2>회원가입</h2>

      {/* --- 1단계: 이메일 입력 --- */}
      <form onSubmit={handleSendCode} className="auth-form">
        <div className="input-group">
          <input
            className="auth-input"
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            placeholder="이메일"
            required
            disabled={uiMode !== 'enterEmail'} // 코드 발송 후 비활성화
          />
          {emailError && <p className="error-message">{emailError}</p>}
        </div>
        {uiMode === 'enterEmail' && (
          <button type="submit" className="auth-button" disabled={!signupEmail || emailError}>
            인증 코드 발송
          </button>
        )}
      </form>
      
      {/* --- 2단계: 인증 코드 입력 --- */}
      {uiMode === 'enterCode' && (
        <form onSubmit={handleVerifyCode} className="auth-form" style={{ marginTop: '1rem' }}>
          <div className="input-group">
            <input
              className="auth-input"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="인증 코드 입력"
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={!verificationCode}>
            인증 코드 확인
          </button>
        </form>
      )}

      {/* --- 3단계: 비밀번호 입력 --- */}
      {uiMode === 'enterPassword' && isEmailVerified && (
        <form onSubmit={handleSignUp} className="auth-form" style={{ marginTop: '1rem' }}>
           <div className="input-group">
            <input
              className="auth-input"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="비밀번호"
              required
            />
          </div>
          <div className="input-group">
            <input
              className="auth-input"
              type="password"
              value={signupPasswordConfirm}
              onChange={(e) => setSignupPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              required
            />
            {passwordError && <p className="error-message">{passwordError}</p>}
          </div>
          <button type="submit" className="auth-button" disabled={isPasswordFormInvalid}>
            회원가입
          </button>
        </form>
      )}
      
      <div className="toggle-auth-section">
        <span>이미 계정이 있으신가요? </span>
        <button onClick={onSwitchToLogin} className="toggle-auth-button">
          로그인
        </button>
      </div>
    </div>
  );
}

export default SignupPage;

