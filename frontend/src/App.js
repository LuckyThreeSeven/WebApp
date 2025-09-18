import React, { useState, useEffect } from 'react';

// API 기본 URL
const API_URL = 'http://localhost:8000';

// 회원가입/로그인 페이지 컴포넌트
function AuthPage({ onLoginSuccess }) {
  // 회원가입 폼 상태
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

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
        alert('회원가입 성공! 이제 로그인해주세요.');
        setSignupEmail('');
        setSignupPassword('');
      } else {
        const errorData = await response.json();
        alert(`회원가입 실패: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`회원가입 중 오류 발생: ${error}`);
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

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                onLogout();
                return;
            }

            try {
                // 실제 사용자 정보를 가져오는 API가 있다면 여기에서 호출합니다.
                // 예: /api/users/me/
                // 우선은 간단히 토큰 유무로만 판단하고, 사용자 이름은 localStorage에서 가져오거나 임의로 설정합니다.
                // 여기서는 간단하게 "사용자"라고 표시합니다.
                setUsername("사용자");

            } catch (error) {
                console.error("Failed to fetch user data", error);
                // 토큰이 유효하지 않을 경우 로그아웃 처리
                onLogout();
            }
        };

        fetchUserData();
    }, [onLogout]);

    const handleRegisterBlackbox = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        if (!uuid || !nickname) {
            alert('UUID와 닉네임을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/status/blackboxes`, {
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
            } else {
                const errorData = await response.json();
                alert(`블랙박스 등록 실패: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            alert(`블랙박스 등록 중 오류 발생: ${error}`);
        }
    };


  return (
    <div>
      <h1>환영합니다, {username}님!</h1>
      <p>로그인 되었습니다.</p>
      <button onClick={onLogout}>로그아웃</button>

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