import React from 'react';

function BlackboxListPage({ blackboxes, selectedBlackboxId, onBlackboxClick }) {
  return (
    <div>
      <h2>내 블랙박스 목록</h2>
      {blackboxes.length > 0 ? (
        <ul>
          {blackboxes.map((box) => (
            <li 
              key={box.uuid} 
              onClick={() => onBlackboxClick(box.uuid)} 
              style={{ cursor: 'pointer', fontWeight: selectedBlackboxId === box.uuid ? 'bold' : 'normal' }}
            >
              <strong>{box.nickname}</strong> ({box.uuid})
              <ul>
                <li>상태: {box.health_status}</li>
                <li>등록일: {new Date(box.created_at).toLocaleString()}</li>
                <li>마지막 접속: {box.last_connected_at ? new Date(box.last_connected_at).toLocaleString() : 'N/A'}</li>
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>등록된 블랙박스가 없습니다.</p>
      )}
    </div>
  );
}

export default BlackboxListPage;
