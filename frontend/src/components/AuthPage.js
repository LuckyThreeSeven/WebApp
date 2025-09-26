import React, { useState } from 'react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

function AuthPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' 또는 'signup'

  // 로그인 화면을 보여줄 때
  if (authMode === 'login') {
    return (
      <LoginPage
        onLoginSuccess={onLoginSuccess}
        onSwitchToSignup={() => setAuthMode('signup')}
      />
    );
  }

  // 회원가입 화면을 보여줄 때
  return (
    <SignupPage
      onSwitchToLogin={() => setAuthMode('login')}
    />
  );
}

export default AuthPage;

