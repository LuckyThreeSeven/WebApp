import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/custom-datepicker.css';
import '../css/video-player-layout.css'; // Import the new layout CSS
import { JWT_TOKEN_KEY, JWT_TOKEN_HEADER } from '../constants';
import { STATUS_SERVER_URL, PLAY_SERVER_URL } from '../variables';

// Date object to 'YYYY-MM-DD' string
const dateToYYYYMMDD = (date) => {
  const offset = date.getTimezoneOffset();
  const dateWithOffset = new Date(date.getTime() - (offset * 60 * 1000));
  return dateWithOffset.toISOString().split('T')[0];
};

// ... (fetch API functions remain the same) ...
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

const fetchSignedVideoUrl = async (objectKey) => {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token) throw new Error('인증 토큰이 없습니다.');
  const response = await fetch(`${PLAY_SERVER_URL}/url`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      [JWT_TOKEN_HEADER]: token,
    },
    body: JSON.stringify({ object_key: objectKey }),
  });
  if (!response.ok) throw new Error(`영상 URL 로딩 실패 (에러: ${response.status})`);
  return response.json();
};


function VideoMetadataPage({ blackboxId, blackboxNickname }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [metadata, setMetadata] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [activeObjectKey, setActiveObjectKey] = useState(null);

  useEffect(() => {
    setCurrentVideoUrl(null);
    setMetadata([]);
    setSelectedDate(new Date());
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
    setActiveObjectKey(null); // Reset active key
    try {
      const dateString = dateToYYYYMMDD(selectedDate);
      const data = await fetchVideoMetadata(blackboxId, dateString);
      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayClick = async (objectKey) => {
    // Prevent re-fetching if the same video is clicked
    if (objectKey === activeObjectKey && currentVideoUrl) return;

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

  // Auto-play next video logic
  const handleVideoEnded = () => {
    const currentIndex = metadata.findIndex(item => item.object_key === activeObjectKey);
    const nextIndex = currentIndex + 1;

    if (nextIndex < metadata.length) {
      const nextVideo = metadata[nextIndex];
      handlePlayClick(nextVideo.object_key);
    } else {
      // Optional: handle when the playlist ends
      console.log("Playlist finished.");
    }
  };

  return (
    <div className="metadata-page-container">
      <div className="section-header">
        <h2>{blackboxNickname || '블랙박스'} 영상 조회</h2>
        <form onSubmit={handleFetchMetadata} className="date-selector-form">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="date-input-custom"
            required
          />
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '조회 중...' : '메타데이터 조회'}
          </button>
        </form>
      </div>

      {error && <p className="error-message main-error-text">{error}</p>}

      <div className="video-section-container">
        {/* Left Column: Video Player */}
        <div className="video-player-main">
          {currentVideoUrl ? (
            <div className="video-player-wrapper">
              <video 
                src={currentVideoUrl} 
                controls 
                autoPlay 
                muted 
                playsInline 
                key={currentVideoUrl}
                onEnded={handleVideoEnded} // Attach the onEnded event handler
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="welcome-view" style={{minHeight: '400px'}}>
              <p>재생할 영상을 목록에서 선택해주세요.</p>
            </div>
          )}
        </div>

        {/* Right Column: Video Playlist */}
        {metadata.length > 0 && (
          <aside className="video-playlist-sidebar">
            <h3>'{dateToYYYYMMDD(selectedDate)}' 영상 목록</h3>
            <ul className="metadata-list">
              {metadata.map((item) => (
                <li 
                  key={item.object_key} 
                  className={`metadata-item ${item.object_key === activeObjectKey ? 'active' : ''} ${isFetchingUrl ? 'disabled' : ''}`}
                  onClick={() => isFetchingUrl ? null : handlePlayClick(item.object_key)}
                >
                  <span className="record-time">{new Date(item.created_at).toLocaleTimeString('ko-KR')}</span>
                  {/* The play button is now hidden via CSS, the whole item is clickable */}
                  <button className="play-button">재생</button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {!isLoading && metadata.length === 0 && selectedDate && !error && (
         <p className="empty-metadata-message">해당 날짜에 조회된 영상이 없습니다.</p>
      )}
    </div>
  );
}

export default VideoMetadataPage;
