export const mockBidsByAuctionId = {
  'auc-101': [
    { id: 'bid-101-1', auctionId: 'auc-101', userId: 'usr-3', username: 'lens_hunter', amount: 1650, placedAt: '2026-05-14T14:01:11.000Z' },
    { id: 'bid-101-2', auctionId: 'auc-101', userId: 'usr-8', username: 'filmframe88', amount: 1710, placedAt: '2026-05-14T14:02:19.000Z' },
    { id: 'bid-101-3', auctionId: 'auc-101', userId: 'usr-5', username: 'aperture_addict', amount: 1820, placedAt: '2026-05-14T14:03:36.000Z' },
  ],
  'auc-102': [
    { id: 'bid-102-1', auctionId: 'auc-102', userId: 'usr-11', username: 'goatcollector', amount: 6050, placedAt: '2026-05-14T11:39:00.000Z' },
    { id: 'bid-102-2', auctionId: 'auc-102', userId: 'usr-2', username: 'cardcapitol', amount: 6200, placedAt: '2026-05-14T11:40:24.000Z' },
    { id: 'bid-102-3', auctionId: 'auc-102', userId: 'usr-7', username: 'mambamemories', amount: 6400, placedAt: '2026-05-14T11:41:09.000Z' },
  ],
  'auc-104': [
    { id: 'bid-104-1', auctionId: 'auc-104', userId: 'usr-4', username: 'retroconsolekid', amount: 490, placedAt: '2026-05-14T15:20:12.000Z' },
    { id: 'bid-104-2', auctionId: 'auc-104', userId: 'usr-12', username: 'pixelmerchant', amount: 520, placedAt: '2026-05-14T15:21:01.000Z' },
    { id: 'bid-104-3', auctionId: 'auc-104', userId: 'usr-1', username: 'joypad_legend', amount: 540, placedAt: '2026-05-14T15:21:48.000Z' },
  ],
};

export const getBidsForAuction = (auctionId) => mockBidsByAuctionId[auctionId] ?? [];

export const getCurrentBid = (auctionId) => {
  const bids = getBidsForAuction(auctionId);
  return bids.length ? bids[bids.length - 1] : null;
};
