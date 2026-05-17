import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import LiveAuctionsContent from '../components/pages/LiveAuctionsContent';
import { LIVE_AUCTION_CATEGORIES, useLiveAuctions } from '../hooks/useLiveAuctions';

function LiveAuctionsPage() {
  const state = useLiveAuctions();

  return (
    <>
      <Navbar />
      <PageContainer className="live-page">
        <LiveAuctionsContent {...state} categories={LIVE_AUCTION_CATEGORIES} />
      </PageContainer>
    </>
  );
}

export default LiveAuctionsPage;
