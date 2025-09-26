import React, { useState } from 'react';

const TEST_API_URL = 'http://localhost:4242';
const PLAY_API_URL = 'http://localhost:8003';

function VideoPlayerPage({ selectedBlackboxId, blackboxNickname }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [videoMetadata, setVideoMetadata] = useState([]);
  const [signedUrls, setSignedUrls] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleFetchMetadata = async () => {
    if (!selectedBlackboxId || !selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${TEST_API_URL}/api/status/metadata?blackbox_id=${selectedBlackboxId}&date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVideoMetadata(data);
        setSignedUrls([]);
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
        headers: { 'Content-Type': 'application/json' },
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
      <h3>선택된 블랙박스: {blackboxNickname}</h3>
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
                <br />
                Duration: {meta.duration} seconds<br />
                Recorded At: {new Date(meta.recorded_at).toLocaleString()}<br />
                File Size: {meta.file_size} bytes<br />
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
  );
}

export default VideoPlayerPage;
