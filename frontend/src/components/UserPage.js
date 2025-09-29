import React, { useState, useEffect, useCallback } from 'react';
import BlackboxListPage from './BlackboxListPage';
import RegisterBlackboxPage from './RegisterBlackboxPage';
import VideoMetadataPage from './VideoMetadataPage'; // 새 컴포넌트 임포트

const BLACKBOX_API_URL = 'http://ec2-43-202-76-207.ap-northeast-2.compute.amazonaws.com';

function UserPage({ onLogout }) {
  const [blackboxes, setBlackboxes] = useState([]);
  const [selectedBlackboxId, setSelectedBlackboxId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlackboxes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
        setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch(`${BLACKBOX_API_URL}/blackboxes`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'WWW-Authorization': token,
            },
            mode: 'cors', 
        });
        if (response.ok) {
            const data = await response.json();
            setBlackboxes(data);
        } else {
            setError('목록을 불러오는 데 실패했습니다. (에러: ' + response.status + ')');
        }
    } catch (error) {
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

  const handleSelectBlackbox = (id) => {
    setSelectedBlackboxId(id);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setSelectedBlackboxId(null);
    setShowRegister(true);
  };

  // 선택된 블랙박스의 닉네임을 찾기 위한 로직
  const selectedBlackbox = blackboxes.find(box => box.uuid === selectedBlackboxId);

  return (
    <div className="desktop-layout">
      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>클라우드 블랙박스</h3>
        </div>
        <div className="sidebar-content">
          <BlackboxListPage
            blackboxes={blackboxes}
            selectedBlackboxId={selectedBlackboxId}
            onBlackboxClick={handleSelectBlackbox}
            onAddClick={handleShowRegister}
            isLoading={isLoading}
          />
        </div>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-button">로그아웃</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="main-content">
        {error && (
          <div className="error-container main-error">
            <p>{error}</p>
            <button onClick={fetchBlackboxes} className="retry-button">다시 시도</button>
          </div>
        )}
        {!error && showRegister && (
          <RegisterBlackboxPage 
            onRegisterSuccess={handleRegisterSuccess} 
          />
        )}
        {/* 선택된 블랙박스가 있을 때 VideoMetadataPage를 렌더링 */}
        {!error && !showRegister && selectedBlackboxId && (
          <VideoMetadataPage 
            blackboxId={selectedBlackboxId}
            blackboxNickname={selectedBlackbox?.nickname}
          />
        )}
        {!error && !showRegister && !selectedBlackboxId && (
          <div className="welcome-view">
            <h2>환영합니다</h2>
            <p>왼쪽 사이드바에서 블랙박스를 선택하거나,<br/>'새 블랙박스 추가' 버튼을 눌러 시작하세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserPage;

