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

  // DEBUGGING EFFECT: Open your developer console (F12) to make sure you and your friend match!
  useEffect(() => {
    if (isJoined) {
      console.log("=== AGORA NETWORK DEBUGGING ===");
      console.log("App ID Active:", "8c90d46469d644e8bf65467f745862f7");
      console.log("Target Channel String:", auction?.agoraChannelName || `auction-${auction?.id}`);
      console.log("Am I recognized as Host/Seller?:", isHost);
      console.log("My User ID:", currentUserId);
      console.log("Auction Database Seller ID:", auction?.sellerId);
      console.log("===============================");
    }
  }, [isJoined, auction, isHost, currentUserId]);

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
    appid: '8c90d46469d644e8bf65467f745862f7', 
    channel: auction?.agoraChannelName || `auction-${auction?.id}`,
    token: null, 
  }, isJoined);

  // FIXED: Filter out uninitialized tracks. 
  // Passing empty/null tracks to usePublish instantly breaks its broadcast state machine.
  const activeTracks = [localMicrophoneTrack, localCameraTrack].filter(Boolean);
  usePublish(activeTracks, isJoined && isHost && activeTracks.length > 0);

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