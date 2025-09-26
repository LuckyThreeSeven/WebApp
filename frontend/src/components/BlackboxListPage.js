import React from 'react';

function BlackboxListPage({ blackboxes, selectedBlackboxId, onBlackboxClick, onAddClick }) {
  return (
    <div className="blackbox-list-container">
      <div className="section-header">
        <h2>내 블랙박스 목록</h2>
        <button onClick={onAddClick} className="add-button">+ 새 블랙박스 등록</button>
      </div>
      {blackboxes.length > 0 ? (
        <ul className="blackbox-list">
          {blackboxes.map((box) => (
            <li 
              key={box.uuid} 
              onClick={() => onBlackboxClick(box.uuid)} 
              className={`blackbox-item ${selectedBlackboxId === box.uuid ? 'selected' : ''}`}
            >
              <strong>{box.nickname}</strong>
              <span className="item-uuid">({box.uuid})</span>
              <ul className="item-details">
                <li>상태: {box.health_status}</li>
                <li>등록일: {new Date(box.created_at).toLocaleString()}</li>
                <li>마지막 접속: {box.last_connected_at ? new Date(box.last_connected_at).toLocaleString() : 'N/A'}</li>
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-list">
          <p>등록된 블랙박스가 없습니다.</p>
          <p>오른쪽 상단의 버튼을 눌러 새 블랙박스를 등록해주세요.</p>
        </div>
      )}
    </div>
  );
}

export default BlackboxListPage;

