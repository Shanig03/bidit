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

  // Force isHost to true for testing if you want both sides to be able to broadcast,
  // or leave it as database-driven:
  const isHost = auction?.sellerId === currentUserId; 

  const { localCameraTrack } = useLocalCameraTrack(isHost && isJoined);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost && isJoined);

  // Debugging logs to verify state transitions in the F12 console
  useEffect(() => {
    if (isJoined) {
      console.log("=== AGORA TESTING CONFIG ===");
      console.log("App ID:", "8c90d46469d644e8bf65467f745862f7");
      console.log("Channel Name:", "test");
      console.log("Is Host/Publisher?:", isHost);
      console.log("============================");
    }
  }, [isJoined, isHost]);

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

   // useJoin({
  //   appid: '8c90d46469d644e8bf65467f745862f7', 
  //   channel: auction?.agoraChannelName || `auction-${auction?.id}`,
  //   token: null, 
  // }, isJoined);

  // Joining the explicit test room with your verified token
  useJoin({
    appid: '8c90d46469d644e8bf65467f745862f7', 
    channel: 'test',
    token: '007eJxTYEiInHDSvbpXuFZ6ZX4pc7lgvJ6C44SVEs2X2IXYe8ILLikwWCRbGqSYmJmYWaaYmZikWiSlmZmamJmnmZuYWpgZpZl3PFbPaghkZOiR2sXKyACBID4LQ0lqcQkDAwAJCRs2', 
  }, isJoined);

  // Safely publish streams only when tracks are physically ready
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