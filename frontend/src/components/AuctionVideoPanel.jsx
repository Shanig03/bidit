import './AuctionVideoPanel.css';
import { LocalUser, RemoteUser } from 'agora-rtc-react';
import { useAuctionVideo } from '../hooks/useAuctionVideo';

// 1. Add liveViewers to the props
function AuctionVideoPanel({ auction, currentUserId, liveViewers }) {
  const {
    isJoined,
    setIsJoined,
    videoProfile,
    setVideoProfile,
    isHost,
    localCameraTrack,
    localMicrophoneTrack,
    hostUser
  } = useAuctionVideo(auction, currentUserId);

  const displaySellerName = auction?.sellerName || auction?.sellerEmail || auction?.sellerId || 'Unknown seller';

  return (
    <section className="avp card">
      <div className="avp-media" style={{ background: isJoined ? '#000' : undefined }}>
        
        {isJoined ? (
          <div className="avp-video-wrapper">
            {isHost ? (
              <LocalUser
                cameraOn={true}
                micOn={true}
                videoTrack={localCameraTrack}
                audioTrack={localMicrophoneTrack}
                className="avp-video-canvas"
              />
            ) : hostUser ? (
              <RemoteUser user={hostUser} className="avp-video-canvas" />
            ) : (
              <div className="avp-placeholder-fallback">
                <p>📡 Syncing feed... Waiting for host broadcast initialization.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="avp-connect-overlay">
            <button 
              type="button" 
              className="avp-connect-btn" 
              onClick={() => setIsJoined(true)}
            >
              {isHost ? '⚡ Start Live Broadcast' : '📺 Connect to Video Feed'}
            </button>
          </div>
        )}

        <div className="avp-top" style={{ zIndex: 12 }}>
          <span className="avp-live" style={{ background: isJoined ? '#ff3b70' : '#5a6388' }}>
            {isJoined ? 'LIVE' : 'READY'}
          </span>
          <span className="avp-watch">
            {/* 2. Display liveViewers, falling back to static watchers if necessary */}
            {isJoined && isHost ? `⚙️ ${videoProfile === '1080p_1' ? '1080p HD' : '720p HD'}` : `👁 ${liveViewers || auction?.watchers || 0} watching`}
          </span>
        </div>

        {/* --- ACTIONS TOOLBAR --- */}
        <div className="avp-actions" style={{ zIndex: 12 }}>
          {isHost && (
            <select 
              className="avp-res-dropdown"
              value={videoProfile}
              onChange={(e) => setVideoProfile(e.target.value)}
              title="Select Stream Resolution"
            >
              <option value="720p_1">720p Standard</option>
              <option value="1080p_1">1080p High-Def</option>
            </select>
          )}

          {/* ADDED: End Stream Button displays only when the host is actively streaming */}
          {isHost && isJoined && (
            <button 
              type="button" 
              className="avp-end-btn"
              onClick={() => setIsJoined(false)}
              style={{
                backgroundColor: '#ff3b3b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginRight: '8px',
                fontSize: '0.85rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff3b3b'}
            >
              🛑 End Stream
            </button>
          )}

          <button type="button">🔊</button>
          <button type="button">⛶</button>
        </div>

        <div className="avp-seller" style={{ zIndex: 12 }}>
          <div className="avp-avatar">👩</div>
          <div>
            <p>
              Seller <span>{isHost ? 'You' : 'Host'}</span>
            </p>
            <small>{displaySellerName}</small>
          </div>
        </div>
      </div>

      <h2>{auction?.title || 'Auction item'}</h2>
    </section>
  );
}

export default AuctionVideoPanel;