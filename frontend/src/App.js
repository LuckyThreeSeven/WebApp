import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import UserPage from './components/UserPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 앱 시작 시 로컬 스토리지에 토큰이 있는지 확인
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // 로컬 스토리지에서 토큰 삭제
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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

