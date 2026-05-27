import PageContainer from './PageContainer';
import StatusBadge from './StatusBadge';
import CategoryChip from './CategoryChip';
import AuctionCard from './AuctionCard';
import { useLiveAuctions } from '../hooks/useLiveAuctions';
import './LiveAuctionsComp.css';

const categories = ['All', 'Photography', 'Fashion', 'Music', 'Collectibles', 'Books', 'Electronics'];

export default function LiveAuctionsComp() {
  const {
    filteredAuctions,
    liveAuctionsCount,
    totalAuctions,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    errorMessage
  } = useLiveAuctions();

  // 1. Filter out ENDED, then sort LIVE to the top
  const displayAuctions = filteredAuctions
    .filter((auction) => {
      // Keep only LIVE and Upcoming (checking for both spellings just in case)
      const status = auction.status?.toUpperCase();
      return status === 'LIVE' || status === 'UPCOMING' || status === 'UPCOMMING';
    })
    .sort((a, b) => {
      const statusA = a.status?.toUpperCase();
      const statusB = b.status?.toUpperCase();

      // If A is LIVE and B is not, A moves up
      if (statusA === 'LIVE' && statusB !== 'LIVE') return -1;
      // If B is LIVE and A is not, B moves up
      if (statusA !== 'LIVE' && statusB === 'LIVE') return 1;
      
      // Optional: If they have the same status, you could sort by start time here
      return 0; 
    });

  return (
    <PageContainer className="live-page">
      <section className="live-hero card">
        <StatusBadge tone="urgent">
          {liveAuctionsCount} Live {liveAuctionsCount === 1 ? 'Auction' : 'Auctions'}
        </StatusBadge>

        <h1>
          Live Video <span>Auctions</span>
        </h1>

        <p>Watch sellers showcase products on live video and place your bids in real-time</p>
      </section>

      <section className="live-filter card">
        <div className="live-search-row">
          <input
            placeholder="Search products, categories, or sellers"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="button">Filters</button>
        </div>

        <div className="live-chip-row">
          {categories.map((category) => (
            <CategoryChip
              key={category}      
              label={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </section>

      {isLoading && <p className="live-message">Loading live auctions...</p>}
      
      {errorMessage && <p className="live-message live-error">{errorMessage}</p>}
      
      {!isLoading && !errorMessage && displayAuctions.length === 0 && (
        <p className="live-message">No live or upcoming auctions found.</p>
      )}

      {/* 2. Map over your new displayAuctions array */}
      {!isLoading && !errorMessage && displayAuctions.length > 0 && (
        <section className="live-grid">
          {displayAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
            />
          ))}
        </section>
      )}
    </PageContainer>
  );
}