
import { useState, useEffect } from 'react';
import {
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers
} from 'agora-rtc-react';

export function useAuctionVideo(auction, currentUserId) {
  const [isJoined, setIsJoined] = useState(false);
  const [videoProfile, setVideoProfile] = useState("720p_1");

  const isHost = auction?.sellerId === currentUserId; 

  const { localCameraTrack } = useLocalCameraTrack(isHost && isJoined);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost && isJoined);

  // Video encoder configuration effect
  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setEncoderConfiguration({
        profile: videoProfile,
        frameRate: 30, 
        bitrateMin: 600,
        bitrateMax: videoProfile === "1080p_1" ? 3000 : 1500, 
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

  // Cleanup on unmount
  useEffect(() => {
    return () => setIsJoined(false);
  }, []);

  return {
    isJoined,
    setIsJoined,
    videoProfile,
    setVideoProfile,
    isHost,
    localCameraTrack,
    localMicrophoneTrack,
    hostUser
  };
}