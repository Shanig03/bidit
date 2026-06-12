import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase/firebaseConfig';

// UC-09: Counts page presence only, not Agora video watchers.
export function useLiveViewerCount(auctionId, fallbackCount = 0) {
  const [viewerCount, setViewerCount] = useState(fallbackCount);

  useEffect(() => {
    if (!auctionId) return;

    // UC-09: Listens to auction page viewers in Firebase presence data.
    // Listen directly to the viewers node
    const viewersRef = ref(realtimeDb, `auctions/${auctionId}/viewers`);
    
    const unsubscribe = onValue(viewersRef, (snapshot) => {
      // Instantly count the active users in the room
      setViewerCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [auctionId]);

  return viewerCount;
}