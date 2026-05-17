import { useEffect, useState } from 'react'; // 1. Import React hooks
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import StatusBadge from '../components/ui/StatusBadge';
import CategoryChip from '../components/ui/CategoryChip';
import AuctionCard from '../components/ui/AuctionCard';
import { getAuctions } from '../api/auctionsApi';
import './LiveAuctionsPage.css';

const categories = ['All', 'Photography', 'Fashion', 'Music', 'Collectibles', 'Books', 'Electronics'];

// Helper function to map API database naming to what your AuctionCard expectations look like
function mapApiToCardStructure(apiAuction) {
  return {
    id: apiAuction.auctionId, // maps the DynamoDB partition key to 'id' for React Router links
    title: apiAuction.title,
    seller: apiAuction.sellerId || 'Anonymous Seller',
    category: apiAuction.category || 'General',
    currentBid: apiAuction.currentPrice || apiAuction.startingPrice || 0,
    watchers: apiAuction.watchers || 0,
    status: apiAuction.status || 'LIVE'
  };
}

function LiveAuctionsPage() {
  // 3. Define local loading and tracking states
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLiveFeed() {
      try {
        setIsLoading(true);
        setError('');
        
        // Call your exact API function name
        const targetAuctions = await getAuctions(); 
        
        // Since your API file already returns 'data.auctions', it's already a clean array!
        const mappedAuctions = targetAuctions.map(mapApiToCardStructure);
        
        setAuctions(mappedAuctions);
      } catch (err) {
        setError(err.message || 'Failed to sync with live stream network.');
      } finally {
        setIsLoading(false);
      }
    }

    loadLiveFeed();
  }, []);

  return (
    <>
      <Navbar />
      <PageContainer className="live-page">
        <section className="live-hero card">
          <StatusBadge tone="urgent">{auctions.length} Live Streams</StatusBadge>
          <h1>
            Live Video <span>Auctions</span>
          </h1>
          <p>Watch sellers showcase products on live video and place your bids in real-time</p>
        </section>

        <section className="live-filter card">
          <div className="live-search-row">
            <input placeholder="Search products, categories, or sellers" />
            <button>Filters</button>
          </div>
          <div className="live-chip-row">
            {categories.map((category, index) => (
              <CategoryChip key={category} label={category} active={index === 0} />
            ))}
          </div>
        </section>

        {/* 4. Handle State Rendering Gating */}
        {isLoading && <p style={{ padding: '2rem', textAlign: 'center' }}>Syncing cloud records...</p>}
        {error && <p style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</p>}
        
        {!isLoading && !error && auctions.length === 0 && (
          <p style={{ padding: '3rem', textAlign: 'center', color: '#5a6388' }}>
            No live streams right now. Go to the "Go Live" tab to launch one!
          </p>
        )}

        <section className="live-grid">
          {!isLoading && !error && auctions.map((auction, index) => (
            <AuctionCard key={auction.id} auction={auction} endingSoon={index === 1} />
          ))}
        </section>
      </PageContainer>
    </>
  );
}

export default LiveAuctionsPage;