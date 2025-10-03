import React, { useState } from 'react';

const STATUS_SERVER_URL = process.env.REACT_APP_STATUS_SERVER_URL || 'http://ec2-43-202-76-207.ap-northeast-2.compute.amazonaws.com';

function RegisterBlackboxPage({ onRegisterSuccess }) {
  const [uuid, setUuid] = useState('');
  const [nickname, setNickname] = useState('');

  const handleRegisterBlackbox = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!uuid || !nickname) {
      alert('UUID와 닉네임을 모두 입력해주세요.');
      return;
    }
    if (!token) {
      alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      const response = await fetch(`${STATUS_SERVER_URL}/blackboxes`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'WWW-Authorization': token,
          'Content-Type': 'application/json',
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
        alert(`블랙박스 등록 실패: ${errorData.detail || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`블랙박스 등록 중 오류 발생: ${error}`);
    }
  };

  return (
    <div className="register-page-container">
      <div className="section-header">
        <h2>새 블랙박스 등록</h2>
      </div>
      <div className="form-wrapper">
        <form onSubmit={handleRegisterBlackbox} className="desktop-form">
          <div className="form-row">
            <label htmlFor="uuid-input" className="form-label">블랙박스 UUID</label>
            <div className="input-group">
              <input
                id="uuid-input"
                className="auth-input"
                type="text"
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                placeholder="기기에서 확인된 UUID를 입력하세요"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="nickname-input" className="form-label">닉네임</label>
            <div className="input-group">
              <input
                id="nickname-input"
                className="auth-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="관리하기 쉬운 닉네임을 지정하세요 (예: 아빠차)"
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
              <button type="submit" className="auth-button">등록하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterBlackboxPage;

