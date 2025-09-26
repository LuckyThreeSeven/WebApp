import React, { useState } from 'react';

const TEST_API_URL = 'http://localhost:4242';

function RegisterBlackboxPage({ onRegisterSuccess }) {
  const [uuid, setUuid] = useState('');
  const [nickname, setNickname] = useState('');

  const handleRegisterBlackbox = async (e) => {
    e.preventDefault();
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('access_token');

    if (!uuid || !nickname) {
      alert('UUID와 닉네임을 모두 입력해주세요.');
      return;
    }
    if (!token) {
      alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
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
        onRegisterSuccess();
      } else {
        const errorData = await response.json();
        alert(`블랙박스 등록 실패: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`블랙박스 등록 중 오류 발생: ${error}`);
    }
  };

  return (
    <div className="register-form-container">
      <form onSubmit={handleRegisterBlackbox} className="register-form">
        <div className="input-group">
          <input
            className="auth-input"
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            placeholder="블랙박스 UUID"
            required
          />
        </div>
        <div className="input-group">
          <input
            className="auth-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            required
          />
        </div>
        <button type="submit" className="auth-button">등록하기</button>
      </form>
    </div>
  );
}

export default RegisterBlackboxPage;

