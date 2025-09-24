import React, { useState, useEffect } from 'react';

// API 기본 URL
const API_URL = 'http://localhost:8000';
const TEST_API_URL = 'http://localhost:4242';
const PLAY_API_URL = 'http://localhost:8003';

// 회원가입/로그인 페이지 컴포넌트
function AuthPage({ onLoginSuccess }) {
  const [uiMode, setUiMode] = useState('auth'); // 'auth' or 'verify'

  // 회원가입 폼 상태
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 로그인 폼 상태
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 회원가입 처리
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
        }),
      });
      if (response.ok) {
        alert('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
        setUiMode('verify'); // Switch to verification UI
      } else {
        const errorData = await response.json();
        alert(`회원가입 실패: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`회원가입 중 오류 발생: ${error}`);
    }
  };

  // 이메일 인증 처리
  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupEmail,
          code: verificationCode,
        }),
      });
      if (response.ok) {
        alert('계정 인증 성공! 이제 로그인해주세요.');
        setUiMode('auth'); // Switch back to auth UI
        setSignupEmail('');
        setSignupPassword('');
        setVerificationCode('');
      } else {
        const errorData = await response.json();
        alert(`인증 실패: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`인증 중 오류 발생: ${error}`);
    }
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

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

  if (uiMode === 'verify') {
    return (
      <div>
        <h2>이메일 인증</h2>
        <p>{signupEmail}으로 전송된 인증 코드를 입력해주세요.</p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="인증 코드 5자리"
            required
          />
          <br />
          <button type="submit">계정 인증</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2>회원가입</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            placeholder="이메일"
            required
          />
          <br />
          <input
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            placeholder="비밀번호"
            required
          />
          <br />
          <button type="submit">회원가입</button>
        </form>
      </div>
      <hr />
      <div>
        <h2>로그인</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="이메일"
            required
          />
          <br />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="비밀번호"
            required
          />
          <br />
          <button type="submit">로그인</button>
        </form>
      </div>
    </div>
  );
}

// 로그인 후 보여줄 유저 페이지
function UserPage({ onLogout }) {
    const [username, setUsername] = useState('');
    const [uuid, setUuid] = useState('');
    const [nickname, setNickname] = useState('');
    const [blackboxes, setBlackboxes] = useState([]);
    const [selectedBlackboxId, setSelectedBlackboxId] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [videoMetadata, setVideoMetadata] = useState([]);
    const [signedUrls, setSignedUrls] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const fetchBlackboxes = async () => {
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
                // Handle error, maybe logout
                console.error("Failed to fetch blackboxes");
                onLogout();
            }
        } catch (error) {
            console.error("Error fetching blackboxes:", error);
            onLogout();
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                onLogout();
                return;
            }
            setUsername("사용자"); // Placeholder for username
            fetchBlackboxes(); // Fetch blackboxes after setting user
        };

        fetchUserData();
    }, [onLogout, fetchBlackboxes]);

    const handleRegisterBlackbox = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        if (!uuid || !nickname) {
            alert('UUID와 닉네임을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`${TEST_API_URL}/api/status/blackboxes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    uuid: uuid,
                    nickname: nickname,
                }),
            });

            if (response.ok) {
                alert('블랙박스가 성공적으로 등록되었습니다.');
                setUuid('');
                setNickname('');
                fetchBlackboxes(); // Refresh the list after registration
            } else {
                const errorData = await response.json();
                alert(`블랙박스 등록 실패: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            alert(`블랙박스 등록 중 오류 발생: ${error}`);
        }
    };

    const handleBlackboxClick = (blackboxUuid) => {
        setSelectedBlackboxId(blackboxUuid);
        setSelectedDate(''); // Reset date when new blackbox is selected
        setVideoMetadata([]); // Clear previous metadata
        setSignedUrls([]); // Clear signed URLs when new blackbox is selected
    };

    const handleFetchMetadata = async () => {
        if (!selectedBlackboxId || !selectedDate) {
            alert("블랙박스와 날짜를 선택해주세요.");
            return;
        }

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`${TEST_API_URL}/api/status/metadata?blackbox_id=${selectedBlackboxId}&date=${selectedDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setVideoMetadata(data);
                setSignedUrls([]); // Clear signed URLs when fetching new metadata
            } else {
                const errorData = await response.json();
                alert(`메타데이터 조회 실패: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            alert(`메타데이터 조회 중 오류 발생: ${error}`);
        }
    };

    const handleFetchAllUrls = async () => {
        if (videoMetadata.length === 0) {
            alert("먼저 영상 메타데이터를 조회해주세요.");
            return;
        }

        const objectKeys = videoMetadata.map(meta => meta.object_key);

        try {
            const response = await fetch(`${PLAY_API_URL}/get-urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ object_keys: objectKeys }),
            });

            if (response.ok) {
                const data = await response.json();
                setSignedUrls(data.signed_urls);
                setCurrentVideoIndex(0);
            } else {
                const errorData = await response.json();
                alert(`Signed URL 조회 실패: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            alert(`Signed URL 조회 중 오류 발생: ${error}`);
        }
    };

    const handleVideoEnded = () => {
        if (currentVideoIndex < signedUrls.length - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };


  return (
    <div>
      <h1>환영합니다, {username}님!</h1>
      <p>로그인 되었습니다.</p>
      <button onClick={onLogout}>로그아웃</button>

      <hr />

      <div>
        <h2>내 블랙박스 목록</h2>
        {blackboxes.length > 0 ? (
          <>
            <ul>
              {blackboxes.map((box) => (
                <li key={box.uuid} onClick={() => handleBlackboxClick(box.uuid)} style={{ cursor: 'pointer', fontWeight: selectedBlackboxId === box.uuid ? 'bold' : 'normal' }}>
                  <strong>{box.nickname}</strong> ({box.uuid})
                  <ul>
                    <li>상태: {box.health_status}</li>
                    <li>등록일: {new Date(box.created_at).toLocaleString()}</li>
                    <li>마지막 접속: {box.last_connected_at ? new Date(box.last_connected_at).toLocaleString() : 'N/A'}</li>
                  </ul>
                </li>
              ))}
            </ul>

            {selectedBlackboxId && (
                <div>
                    <h3>선택된 블랙박스: {blackboxes.find(b => b.uuid === selectedBlackboxId)?.nickname || selectedBlackboxId}</h3>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button onClick={handleFetchMetadata}>영상 메타데이터 조회</button>

                    {videoMetadata.length > 0 && (
                        <div>
                            <button onClick={handleFetchAllUrls}>모든 URL 가져오기</button>
                            <h4>영상 메타데이터</h4>
                            <ul>
                                {videoMetadata.map((meta) => (
                                    <li key={meta.id}>
                                        Object Key: {meta.object_key}
                                        <br/>
                                        Duration: {meta.duration} seconds<br/>
                                        Recorded At: {new Date(meta.recorded_at).toLocaleString()}<br/>
                                        File Size: {meta.file_size} bytes<br/>
                                        File Type: {meta.file_type}
                                    </li>
                                ))}
                            </ul>
                            {signedUrls.length > 0 && (
                                <div>
                                    <h4>영상 재생</h4>
                                    <video
                                        controls
                                        autoPlay
                                        src={signedUrls[currentVideoIndex]}
                                        onEnded={handleVideoEnded}
                                        style={{ width: '100%', maxWidth: '600px' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {videoMetadata.length === 0 && selectedDate && <p>선택된 날짜에 영상 메타데이터가 없습니다.</p>}
                </div>
            )}
          </>
        ) : (
          <p>등록된 블랙박스가 없습니다.</p>
        )}
      </div>

      <hr />

      <div>
        <h2>블랙박스 등록</h2>
        <form onSubmit={handleRegisterBlackbox}>
          <input
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            placeholder="블랙박스 UUID"
            required
          />
          <br />
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            required
          />
          <br />
          <button type="submit">블랙박스 등록</button>
        </form>
      </div>
    </div>
  );
}


// 메인 앱 컴포넌트
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // 여기서는 토큰의 유효성 검사를 위해 API를 호출하는 것이 가장 좋지만,
    // 우선 간단하게 토큰 존재 유무로만 판단합니다.
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        <UserPage onLogout={handleLogout} />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
