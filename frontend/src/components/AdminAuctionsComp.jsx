import './AdminPanel.css';

export default function AdminAuctionsComp({ auctions, onDelete }) {
  if (auctions.length === 0) return <p>No active auctions found.</p>;

  return (
    <div className="admin-grid">
      {auctions.map(auction => (
        <div key={auction.auctionId} className="card admin-auction-card">
          <h3>{auction.title}</h3>
          <p>Seller ID: {auction.sellerId}</p>
          <p>Current Price: ${auction.currentPrice}</p>
          <p>Status: <strong>{auction.status}</strong></p>
          
          <button 
            className="admin-action-btn delete"
            onClick={() => onDelete(auction.auctionId)}
          >
            Delete Auction
          </button>
        </div>
      ))}
    </div>
  );
}