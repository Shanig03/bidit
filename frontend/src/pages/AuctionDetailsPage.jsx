import { useParams } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import AuctionVideoPanel from '../components/ui/AuctionVideoPanel';
import BidPanel from '../components/ui/BidPanel';
import RecentBids from '../components/ui/RecentBids';
import LiveChat from '../components/ui/LiveChat';
import ProductDescription from '../components/ui/ProductDescription';
import { getAuctionById } from '../data/mockAuctions';
import { getBidsForAuction } from '../data/mockBids';
import { getChatMessagesForAuction } from '../data/mockChatMessages';
import './AuctionDetailsPage.css';

function AuctionDetailsPage() {
  const { id } = useParams();
  const auction = getAuctionById(id) ?? getAuctionById('auc-101');
  const bids = getBidsForAuction(auction.id);
  const chat = getChatMessagesForAuction(auction.id);

  return (
    <>
      <Navbar />
      <PageContainer className="auction-details-page">
        <div className="ad-grid">
          <div className="ad-left">
            <AuctionVideoPanel auction={auction} />
            <LiveChat messages={chat} />
            <ProductDescription />
          </div>
          <div className="ad-right">
            <BidPanel currentBid={auction.currentBid} watchers={auction.watchers} />
            <RecentBids bids={bids} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default AuctionDetailsPage;
