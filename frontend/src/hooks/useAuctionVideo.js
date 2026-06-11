import { useState, useEffect } from 'react';
// FIX: Import the exact same core class reference used to build your client
import AgoraRTC from 'agora-rtc-sdk-ng'; 
import { useRTCClient, useRemoteUsers } from 'agora-rtc-react';

export function useAuctionVideo(auction, currentUserId) {
  const client = useRTCClient(); 
  const [isJoined, setIsJoined] = useState(false);
  const [videoProfile, setVideoProfile] = useState("720p_1");
  const [localCameraTrack, setLocalCameraTrack] = useState(null);
  const [localMicrophoneTrack, setLocalMicrophoneTrack] = useState(null);

  // UC-08/UC-10: Decides whether this user is the host or a viewer.
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

        if (ignore) return;

        // UC-08/UC-10: Joins the Agora auction channel before publishing or watching video.
        // 1. Join channel securely
        await client.join(
          '8c90d46469d644e8bf65467f745862f7', 
          'test',                            
          '007eJxTYOgNUnnlaxW9RoynpX0u16ds8ztZp3lZ1bzu3HiZfGT9LA4FBotkS4MUEzMTM8sUMxOTVIukNDNTEzPzNHMTUwszozTztlTNrIZARgatem1WRgYIBPFZGEpSi0sYGACt9hy6', 
          uid
        );
        hasJoined = true;

        if (ignore) {
          await client.leave();
          hasJoined = false;
          return;
        }

        // UC-08: Host creates microphone/camera tracks and publishes the live broadcast.
        if (isHost) {
          // 2. Build local media tracks using aligned core prototype references
          micTrack = await AgoraRTC.createMicrophoneAudioTrack();
          if (ignore) { micTrack.stop(); micTrack.close(); return; }

          // UC-08: Uses the selected stream quality when creating the camera track.
          camTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: videoProfile });
          if (ignore) { 
            micTrack.stop(); micTrack.close(); 
            camTrack.stop(); camTrack.close(); 
            return; 
          }

          setLocalMicrophoneTrack(micTrack);
          setLocalCameraTrack(camTrack);

          // 3. Publish directly to stream connection without wrapper interference
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
  }, [isJoined, client, isHost, videoProfile]);

  // UC-10: Remote users come from Agora and are used to show the host stream.
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