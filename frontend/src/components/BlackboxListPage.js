import React from 'react';

// Health status에 따라 클래스를 반환하는 헬퍼 함수
const getStatusClass = (status) => {
  if (status === 'HEALTHY') return 'status-healthy';
  if (status === 'UNHEALTHY') return 'status-unhealthy';
  return 'status-unknown';
};


function BlackboxListPage({ blackboxes, selectedBlackboxId, onBlackboxClick, onAddClick, isLoading }) {
  return (
    <div className="sidebar-list-container">
      <button onClick={onAddClick} className="add-button-sidebar">+ 새 블랙박스 추가</button>
      
      {isLoading && <p className="sidebar-loading">목록 로딩 중...</p>}

      {!isLoading && (
        <nav className="blackbox-nav-list">
          {blackboxes.map((box) => (
            <a 
              key={box.uuid} 
              href="#"
              onClick={(e) => { e.preventDefault(); onBlackboxClick(box.uuid); }} 
              className={`nav-item ${selectedBlackboxId === box.uuid ? 'selected' : ''}`}
            >
              <span className="nav-item-nickname">{box.nickname}</span>
              <span className={`status-badge ${getStatusClass(box.health_status)}`}>
                {box.health_status || 'UNKNOWN'}
              </span>
            </a>
          ))}
        </nav>
      )}

      {!isLoading && blackboxes.length === 0 && (
        <p className="empty-sidebar-list">등록된 블랙박스가 없습니다.</p>
      )}
    </div>
  );
}

export default BlackboxListPage;

