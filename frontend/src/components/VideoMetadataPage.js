import React, { useState, useEffect } from 'react';
import { JWT_TOKEN_KEY, JWT_TOKEN_HEADER } from '../constants';

const STATUS_SERVER_URL = process.env.REACT_APP_STATUS_SERVER_URL || 'http://ec2-43-202-76-207.ap-northeast-2.compute.amazonaws.com';
const PLAY_SERVER_URL = process.env.REACT_APP_PLAY_SERVER_URL || 'http://ec2-3-36-44-212.ap-northeast-2.compute.amazonaws.com:8002';


// 오늘 날짜를 'YYYY-MM-DD' 형식의 문자열로 반환하는 헬퍼 함수
const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const todayWithOffset = new Date(today.getTime() - (offset * 60 * 1000));
  return todayWithOffset.toISOString().split('T')[0];
};

// 메타데이터를 가져오는 API 호출 함수
const fetchVideoMetadata = async (blackboxId, date) => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token) throw new Error('인증 토큰이 없습니다.');
  
  const formattedDate = `${date}T00:00:00`;
  const url = `${STATUS_SERVER_URL}/metadata?blackboxId=${blackboxId}&date=${formattedDate}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'accept': '*/*', [JWT_TOKEN_HEADER]: token },
    mode: 'cors',
  });
  if (!response.ok) throw new Error(`메타데이터 로딩 실패 (에러: ${response.status})`);
  return response.json();
};

// Signed URL을 가져오는 API 호출 함수
const fetchSignedVideoUrl = async (objectKey) => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(`${PLAY_SERVER_URL}/api/videos/url`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      [JWT_TOKEN_HEADER]: token, // 헤더에 토큰 추가
    },
    body: JSON.stringify({ object_key: objectKey }),
  });
  if (!response.ok) throw new Error(`영상 URL 로딩 실패 (에러: ${response.status})`);
  return response.json();
};

function VideoMetadataPage({ blackboxId, blackboxNickname }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [metadata, setMetadata] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 영상 재생 관련 상태
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [activeObjectKey, setActiveObjectKey] = useState(null);

  // 블랙박스 ID가 변경될 때마다 비디오 플레이어 초기화
  useEffect(() => {
    setCurrentVideoUrl(null);
    setMetadata([]);
    setSelectedDate(getTodayDateString());
  }, [blackboxId]);
  
  const handleFetchMetadata = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      alert('조회할 날짜를 선택해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMetadata([]);
    setCurrentVideoUrl(null);

    try {
      const data = await fetchVideoMetadata(blackboxId, selectedDate);
      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 재생 버튼 클릭 핸들러
  const handlePlayClick = async (objectKey) => {
    setIsFetchingUrl(true);
    setActiveObjectKey(objectKey);
    setCurrentVideoUrl(null);
    setError(null);
    try {
      const data = await fetchSignedVideoUrl(objectKey);
      if (data.signed_url) {
        setCurrentVideoUrl(data.signed_url);
      } else {
        throw new Error('응답에 signed_url이 없습니다.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="metadata-page-container">
      <div className="section-header">
        <h2>{blackboxNickname || '블랙박스'} 영상 조회</h2>
      </div>
      <div className="form-wrapper">
        <form onSubmit={handleFetchMetadata} className="date-selector-form">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
            required
          />
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '조회 중...' : '메타데이터 조회'}
          </button>
        </form>
      </div>

      {/* --- 비디오 플레이어 섹션 --- */}
      {currentVideoUrl && (
        <div className="video-player-wrapper">
            <video src={currentVideoUrl} controls autoPlay muted playsInline key={currentVideoUrl}>
                Your browser does not support the video tag.
            </video>
        </div>
      )}

      {error && <p className="error-message main-error-text">{error}</p>}
      
      {metadata.length > 0 && (
        <div className="metadata-list-container">
          <h3>'{selectedDate}' 영상 목록</h3>
          <ul className="metadata-list">
            {metadata.map((item) => (
              <li key={item.object_key} className="metadata-item">
                <span className="record-time">{new Date(item.created_at).toLocaleTimeString('ko-KR')}</span>
                <button 
                    onClick={() => handlePlayClick(item.object_key)}
                    className="play-button"
                    disabled={isFetchingUrl && activeObjectKey === item.object_key}
                >
                  {isFetchingUrl && activeObjectKey === item.object_key ? '로딩중' : '재생'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && metadata.length === 0 && selectedDate && !error && (
         <p className="empty-metadata-message">해당 날짜에 조회된 영상이 없습니다.</p>
      )}
    </div>
  );
}

export default VideoMetadataPage;

