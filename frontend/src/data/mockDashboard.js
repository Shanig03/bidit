export const mockDashboardData = {
  myLiveStreams: [
    { id: 'ls-1', auctionId: 'auc-101', title: 'Limited Edition Sneakers', status: 'live', viewers: 234, currentBid: 425, totalBids: 12, timeLeft: '1h 5m' },
    { id: 'ls-2', auctionId: 'auc-104', title: 'Mechanical Keyboard', status: 'live', viewers: 89, currentBid: 180, totalBids: 8, timeLeft: '5h 30m' },
  ],
  myBids: [
    { id: 'mb-1', auctionId: 'auc-101', title: 'Vintage Camera Lens', myBid: 245, currentBid: 245, status: 'winning', viewers: 342, timeLeft: '2h 14m' },
    { id: 'mb-2', auctionId: 'auc-105', title: 'Vintage Vinyl Collection', myBid: 300, currentBid: 320, status: 'outbid', viewers: 156, timeLeft: '5h 20m' },
  ],
  wonAuctions: [
    { id: 'wa-1', title: 'Designer Sunglasses', finalPrice: 215, wonAgo: 'Won 3 days ago', status: 'paid' },
    { id: 'wa-2', title: 'Wireless Headphones', finalPrice: 145, wonAgo: 'Won 1 week ago', status: 'delivered' },
  ],
};

export const getDashboardItems = (tabKey) => mockDashboardData[tabKey] ?? [];
