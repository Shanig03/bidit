import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageViewUrl } from '../hooks/useImageViewUrl';
import './AdminPanel.css';

function formatPrice(value) {
  const numericValue = Number(value || 0);

  return numericValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatDateTime(value) {
  if (!value) return 'No date';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getStatusLabel(status) {
  const normalizedStatus = (status || 'UNKNOWN').toUpperCase();

  if (normalizedStatus === 'UPCOMMING') return 'UPCOMING';

  return normalizedStatus;
}

function getMainImageKey(auction) {
  if (auction?.imageKey) {
    return auction.imageKey;
  }

  if (Array.isArray(auction?.imageKeys) && auction.imageKeys.length > 0) {
    return auction.imageKeys[0];
  }

  return '';
}

// UC-22: One admin auction card with view and delete actions.
function AdminAuctionCard({ auction, onDelete, onView }) {
  const status = getStatusLabel(auction.status);
  const displayPrice = auction.currentPrice ?? auction.startingPrice ?? 0;
  const seller =
    auction.sellerName ||
    auction.sellerEmail ||
    auction.sellerId ||
    'Unknown Seller';

  const mainImageKey = getMainImageKey(auction);
  const imageResult = useImageViewUrl(mainImageKey);

  const imageUrl =
    typeof imageResult === 'string'
      ? imageResult
      : imageResult?.imageUrl || imageResult?.url || '';

  return (
    <article className="admin-live-auction-card">
      <div className="admin-live-auction-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={auction.title || 'Auction item'}
            className="admin-live-auction-card__photo"
          />
        ) : (
          <div className="admin-live-auction-card__placeholder">
          </div>
        )}

        <div className="admin-live-auction-card__top">
          <span className={`admin-live-status ${status.toLowerCase()}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="admin-live-auction-card__body">
        <p className="admin-live-auction-card__host">
          Hosted by {seller}
        </p>

        <p className="admin-live-auction-card__category">
          {auction.category || 'Other'}
        </p>

        <h3>{auction.title || 'Untitled Auction'}</h3>

        <p className="admin-live-auction-card__desc">
          {auction.description || 'No description provided.'}
        </p>

        <div className="admin-live-auction-card__meta">
          <div>
            <span>Current Price</span>
            <strong>{formatPrice(displayPrice)}</strong>
          </div>

          <div>
            <span>Ends At</span>
            <strong>{formatDateTime(auction.endsAt)}</strong>
          </div>
        </div>

        <div className="admin-live-card-actions">
          <button
            type="button"
            className="admin-live-view-btn"
            onClick={() => onView(auction.auctionId)}
          >
            View Auction
          </button>

          <button
            type="button"
            className="admin-live-delete-btn"
            onClick={() => onDelete(auction.auctionId)}
          >
            Delete Auction
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminAuctionsComp({ auctions = [], onDelete }) {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // UC-22: Filters auctions by the searched title prefix.
  const filteredAuctions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return auctions;
    }

    return auctions.filter((auction) => {
      const title = (auction.title || '').trim().toLowerCase();
      return title.startsWith(normalizedSearch);
    });
  }, [auctions, searchTerm]);

  // UC-22: Applies the admin auction search term.
  function handleSearch(event) {
    event.preventDefault();
    setSearchTerm(searchInput);
  }

  // UC-22: Opens the selected auction page from admin.
  function handleViewAuction(auctionId) {
    if (!auctionId) return;
    navigate(`/auction/${auctionId}`);
  }

  if (auctions.length === 0) {
    return (
      <section className="admin-empty-card card">
        <h3>No auctions found</h3>
        <p>There are no auctions to manage right now.</p>
      </section>
    );
  }

  return (
    <section className="admin-auctions-page">
      <section className="admin-auctions-filter card">
        <div className="admin-auctions-filter__header">
          <div>
            <h2>Auctions Management</h2>
            <p>Search auctions by title prefix and manage active marketplace listings.</p>
          </div>

          <span className="admin-count-badge">
            {filteredAuctions.length} / {auctions.length} auctions
          </span>
        </div>

        <form className="admin-live-search-row" onSubmit={handleSearch}>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);

              if (!event.target.value.trim()) {
                setSearchTerm('');
              }
            }}
            placeholder="Search auctions by title"
          />

          <button type="submit">Search</button>
        </form>
      </section>

      {filteredAuctions.length === 0 ? (
        <p className="admin-inline-message">No auctions match your search.</p>
      ) : (
        <section className="admin-auctions-live-grid">
          {filteredAuctions.map((auction) => (
            <AdminAuctionCard
              key={auction.auctionId}
              auction={auction}
              onDelete={onDelete}
              onView={handleViewAuction}
            />
          ))}
        </section>
      )}
    </section>
  );
}