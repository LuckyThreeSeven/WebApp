import React, { useState, useEffect, useCallback } from 'react';
import RegisterBlackboxPage from './RegisterBlackboxPage';
import BlackboxListPage from './BlackboxListPage';
import VideoPlayerPage from './VideoPlayerPage';

const TEST_API_URL = 'http://localhost:4242';

function UserPage({ onLogout }) {
  const [username, setUsername] = useState('사용자');
  const [blackboxes, setBlackboxes] = useState([]);
  const [selectedBlackboxId, setSelectedBlackboxId] = useState(null);

  const fetchBlackboxes = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${TEST_API_URL}/api/status/blackboxes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBlackboxes(data);
      } else {
        console.error("Failed to fetch blackboxes");
        onLogout();
      }
    } catch (error) {
      console.error("Error fetching blackboxes:", error);
      onLogout();
    }
  }, [onLogout]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      onLogout();
      return;
    }
    fetchBlackboxes();
  }, [onLogout, fetchBlackboxes]);

  const handleBlackboxClick = (blackboxUuid) => {
    setSelectedBlackboxId(blackboxUuid);
  };

  const selectedBlackbox = blackboxes.find(b => b.uuid === selectedBlackboxId);

  return (
    <div>
      <h1>환영합니다, {username}님!</h1>
      <p>로그인 되었습니다.</p>
      <button onClick={onLogout}>로그아웃</button>

      <hr />
      
      <RegisterBlackboxPage onRegisterSuccess={fetchBlackboxes} />

      <hr />

      <BlackboxListPage
        blackboxes={blackboxes}
        selectedBlackboxId={selectedBlackboxId}
        onBlackboxClick={handleBlackboxClick}
      />

      {selectedBlackboxId && (
        <VideoPlayerPage
          selectedBlackboxId={selectedBlackboxId}
          blackboxNickname={selectedBlackbox?.nickname || ''}
        />
      )}
    </div>
  );
}

export default UserPage;

