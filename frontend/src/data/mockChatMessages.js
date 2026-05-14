export const mockChatMessagesByAuctionId = {
  'auc-101': [
    { id: 'chat-101-1', auctionId: 'auc-101', userId: 'usr-9', username: 'shutterbug', message: 'Condition on the rangefinder looks excellent.', sentAt: '2026-05-14T14:00:09.000Z' },
    { id: 'chat-101-2', auctionId: 'auc-101', userId: 'usr-6', username: 'grainmaster', message: 'Does it include the original case?', sentAt: '2026-05-14T14:01:41.000Z' },
    { id: 'chat-101-3', auctionId: 'auc-101', userId: 'seller-101', username: 'RetroOptics', message: 'Yes, original case and strap included.', sentAt: '2026-05-14T14:02:03.000Z' },
  ],
  'auc-102': [
    { id: 'chat-102-1', auctionId: 'auc-102', userId: 'usr-14', username: 'slabcards', message: 'Corners are super sharp.', sentAt: '2026-05-14T11:37:15.000Z' },
    { id: 'chat-102-2', auctionId: 'auc-102', userId: 'usr-10', username: 'legendarypulls', message: 'Any PSA verification close-ups?', sentAt: '2026-05-14T11:38:42.000Z' },
    { id: 'chat-102-3', auctionId: 'auc-102', userId: 'seller-102', username: 'PrimeCardsVault', message: 'Uploading them in the stream now.', sentAt: '2026-05-14T11:39:22.000Z' },
  ],
};

export const getChatMessagesForAuction = (auctionId) => mockChatMessagesByAuctionId[auctionId] ?? [];
