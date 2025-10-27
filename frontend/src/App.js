import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import UserPage from './components/UserPage';
import { JWT_TOKEN_KEY } from './constants';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 앱 시작 시 로컬 스토리지에 토큰이 있는지 확인
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      document.body.classList.remove('auth-layout');
    } else {
      document.body.classList.add('auth-layout');
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // 로컬 스토리지에서 토큰 삭제
    localStorage.removeItem(JWT_TOKEN_KEY);
    setIsLoggedIn(false);
  };

  return (
    <div className="app-container">
      {isLoggedIn ? (
        <UserPage onLogout={handleLogout} />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;

