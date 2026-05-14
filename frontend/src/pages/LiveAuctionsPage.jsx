import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import StatusBadge from '../components/ui/StatusBadge';
import CategoryChip from '../components/ui/CategoryChip';
import AuctionCard from '../components/ui/AuctionCard';
import { mockAuctions } from '../data/mockAuctions';
import './LiveAuctionsPage.css';

const categories = ['All', 'Photography', 'Fashion', 'Music', 'Collectibles', 'Books', 'Electronics'];

function LiveAuctionsPage() {
  const auctions = mockAuctions.slice(0, 4);

  return (
    <>
      <Navbar />
      <PageContainer className="live-page">
        <section className="live-hero card">
          <StatusBadge tone="urgent">8 Live Streams</StatusBadge>
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

        <section className="live-grid">
          {auctions.map((auction, index) => (
            <AuctionCard key={auction.id} auction={auction} endingSoon={index === 1} />
          ))}
        </section>
      </PageContainer>
    </>
  );
}

export default LiveAuctionsPage;
