import React, { useState, useEffect, useCallback } from 'react';
import BlackboxListPage from './BlackboxListPage';
import RegisterBlackboxPage from './RegisterBlackboxPage';

const TEST_API_URL = 'http://localhost:4242';

function UserPage({ onLogout }) {
  const [blackboxes, setBlackboxes] = useState([]);
  const [selectedBlackboxId, setSelectedBlackboxId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  const fetchBlackboxes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${TEST_API_URL}/api/status/blackboxes`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            const data = await response.json();
            setBlackboxes(data);
        } else {
            // 로그아웃 대신 에러 메시지 설정
            console.error("Failed to fetch blackboxes");
            setError('블랙박스 목록을 불러오는 데 실패했습니다.');
        }
    } catch (error) {
        // 로그아웃 대신 에러 메시지 설정
        console.error("Error fetching blackboxes:", error);
        setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlackboxes();
  }, [fetchBlackboxes]);

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    fetchBlackboxes();
  };

  // 로딩, 에러, 콘텐츠 상태에 따라 다른 UI를 렌더링하는 함수
  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-container"><p>목록을 불러오는 중입니다...</p></div>;
    }
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchBlackboxes} className="retry-button">다시 시도</button>
        </div>
      );
    }
    if (showRegister) {
      return (
        <div className="register-section">
           <div className="section-header">
              <h2>새 블랙박스 등록</h2>
              <button onClick={() => setShowRegister(false)} className="cancel-button">취소</button>
          </div>
          <RegisterBlackboxPage onRegisterSuccess={handleRegisterSuccess} />
        </div>
      );
    }
    return (
      <div className="list-section">
        <BlackboxListPage
          blackboxes={blackboxes}
          selectedBlackboxId={selectedBlackboxId}
          onBlackboxClick={(id) => setSelectedBlackboxId(id)}
          onAddClick={() => setShowRegister(true)}
        />
      </div>
    );
  };

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <h1>클라우드 블랙박스</h1>
        <button onClick={onLogout} className="logout-button">로그아웃</button>
      </header>
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default UserPage;

