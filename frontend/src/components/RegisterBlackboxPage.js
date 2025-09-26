import React, { useState } from 'react';

const TEST_API_URL = 'http://localhost:4242';

function RegisterBlackboxPage({ onRegisterSuccess }) {
  const [uuid, setUuid] = useState('');
  const [nickname, setNickname] = useState('');

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
        onRegisterSuccess(); // 등록 성공 시 부모 컴포넌트에 알림
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
  );
}

export default RegisterBlackboxPage;
