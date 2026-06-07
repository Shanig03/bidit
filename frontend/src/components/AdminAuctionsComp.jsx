import { useMemo, useState } from 'react';
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

export default function AdminAuctionsComp({ auctions = [], onDelete }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  function handleSearch(event) {
    event.preventDefault();
    setSearchTerm(searchInput);
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
          {filteredAuctions.map((auction) => {
            const status = getStatusLabel(auction.status);
            const displayPrice = auction.currentPrice ?? auction.startingPrice ?? 0;
            const seller =
              auction.sellerName ||
              auction.sellerEmail ||
              auction.sellerId ||
              'Unknown Seller';

            return (
              <article key={auction.auctionId} className="admin-live-auction-card">
                <div className="admin-live-auction-card__image">
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

                  <button
                    type="button"
                    className="admin-live-delete-btn"
                    onClick={() => onDelete(auction.auctionId)}
                  >
                    Delete Auction
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}