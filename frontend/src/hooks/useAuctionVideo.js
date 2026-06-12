import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import { useRTCClient, useRemoteUsers } from 'agora-rtc-react';
import { getAgoraToken } from '../api/agoraApi'; // 1. Import your new API function

export function useAuctionVideo(auction, currentUserId) {
  const client = useRTCClient(); 
  const [isJoined, setIsJoined] = useState(false);
  const [videoProfile, setVideoProfile] = useState("720p_1");
  const [localCameraTrack, setLocalCameraTrack] = useState(null);
  const [localMicrophoneTrack, setLocalMicrophoneTrack] = useState(null);

  const isHost = auction?.sellerId === currentUserId; 
  const remoteUsers = useRemoteUsers();
  const hostUser = remoteUsers.length > 0 ? remoteUsers[0] : null;

  useEffect(() => {
    let ignore = false;
    let camTrack = null;
    let micTrack = null;
    let hasJoined = false;

    async function initStream() {
      if (!isJoined) return;

      try {
        const uid = Math.floor(Math.random() * 50000) + 1;

        // 2. Dynamically set the channel name based on the current auction
        const channelName = auction?.agoraChannelName || auction?.id || auction?.auctionId;
        
        if (!channelName) {
          console.error("Stream connection failed: No channel name available.");
          return;
        }

        if (ignore) return;

        // 3. Fetch the secure token from your AWS Lambda
        const token = await getAgoraToken(channelName, uid, isHost);

        if (ignore) return;

        // 4. Get your App ID from your environment variables
        const appId = import.meta.env.VITE_AGORA_APP_ID;

        // 5. Join the channel dynamically
        await client.join(appId, channelName, token, uid);
        hasJoined = true;

        if (ignore) {
          await client.leave();
          hasJoined = false;
          return;
        }

        if (isHost) {
          micTrack = await AgoraRTC.createMicrophoneAudioTrack();
          if (ignore) { micTrack.stop(); micTrack.close(); return; }

          camTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: videoProfile });
          if (ignore) { 
            micTrack.stop(); micTrack.close(); 
            camTrack.stop(); camTrack.close(); 
            return; 
          }

          setLocalMicrophoneTrack(micTrack);
          setLocalCameraTrack(camTrack);

          await client.publish([micTrack, camTrack]);
          
          if (ignore) {
            await client.unpublish([micTrack, camTrack]);
            micTrack.stop(); micTrack.close();
            camTrack.stop(); camTrack.close();
            setLocalMicrophoneTrack(null);
            setLocalCameraTrack(null);
          }
        }
      } catch (err) {
        console.error("Agora Stream Engine Failure:", err);
        if (camTrack) { camTrack.stop(); camTrack.close(); setLocalCameraTrack(null); }
        if (micTrack) { micTrack.stop(); micTrack.close(); setLocalMicrophoneTrack(null); }
        if (hasJoined) { try { await client.leave(); } catch (e) {} }
      }
    }

    initStream();

    return () => {
      ignore = true;
      if (camTrack) {
        camTrack.stop();
        camTrack.close();
        setLocalCameraTrack(null);
      }
      if (micTrack) {
        micTrack.stop();
        micTrack.close();
        setLocalMicrophoneTrack(null);
      }
      if (hasJoined) {
        client.leave().catch(() => {});
      }
    };
  }, [isJoined, client, isHost, videoProfile, auction]); // Make sure auction is in the dependency array

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