import { useState, useEffect } from 'react';
// Import AgoraRTC directly alongside the React hooks
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  LocalUser,
  RemoteUser
} from 'agora-rtc-react';
import './AuctionVideoPanel.css';

function AuctionVideoPanel({ auction, currentUserId }) {
  const [isJoined, setIsJoined] = useState(false);
  
  // 1. Add state to track the active video profile selection
  // Defaulting to "720p_1" ensures great performance out of the box
  const [videoProfile, setVideoProfile] = useState("720p_1");

  const isHost = auction?.sellerId === currentUserId; 

  const { localCameraTrack } = useLocalCameraTrack(isHost);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost);

  // 2. The Stream Settings Configuration Effect
  // This watches your camera track and the selected resolution profile.
  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setVideoEncoderConfiguration({
        profile: videoProfile,
        frameRate: 30, // Maintains a smooth 30fps broadcast layout
        bitrateMin: 600,
        bitrateMax: videoProfile === "1080p_1" ? 3000 : 1500, // Allocates bandwidth based on selection
      })
      .then(() => {
        console.log(`Video encoder successfully optimized for: ${videoProfile}`);
      })
      .catch((error) => {
        console.error("Failed to update video encoder configuration:", error);
      });
    }
  }, [localCameraTrack, videoProfile]);

  useJoin({
    appid: 'YOUR_AGORA_APP_ID', 
    channel: auction?.agoraChannelName || `auction-${auction?.id}`,
    token: null, 
  }, isJoined);

  usePublish([localMicrophoneTrack, localCameraTrack], isJoined && isHost);

  const remoteUsers = useRemoteUsers();
  const hostUser = remoteUsers.find((user) => user.hasVideo || user.hasAudio);

  useEffect(() => {
    return () => setIsJoined(false);
  }, []);

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
            {/* Dynamic label showing current broadcasting status text info */}
            {isJoined && isHost ? `⚙️ ${videoProfile === '1080p_1' ? '1080p HD' : '720p HD'}` : `👁 ${auction?.watchers ?? 0} watching`}
          </span>
        </div>

        <div className="avp-actions" style={{ zIndex: 12 }}>
          {/* 3. The Resolution Picker: Only rendered if the current user is the host */}
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
          <button type="button">🔊</button>
          <button type="button">⛶</button>
        </div>

        <div className="avp-seller" style={{ zIndex: 12 }}>
          <div className="avp-avatar">👩</div>
          <div>
            <p>
              Seller <span>{isHost ? 'You' : 'Host'}</span>
            </p>
            <small>{auction?.sellerId || 'Unknown seller'}</small>
          </div>
        </div>
      </div>

      <h2>{auction?.title || 'Auction item'}</h2>
    </section>
  );
}

export default AuctionVideoPanel;