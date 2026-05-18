import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import DashboardTabs from '../components/DashboardTabs';
import DashboardLiveStreamItem from '../components/DashboardLiveStreamItem';
import DashboardBidItem from '../components/DashboardBidItem';
import DashboardWonItem from '../components/DashboardWonItem';
import { getDashboardItems } from '../data/mockDashboard';
import { getAuctions } from '../api/auctionsApi';
import './DashboardPage.css';

const tabs = [
  { id: 'live', label: 'Live Auctions' },
  { id: 'bids', label: 'My Bids' },
  { id: 'won', label: 'Won Auctions' },
];

function mapAuctionToDashboardItem(auction) {
  return {
    id: auction.auctionId,
    title: auction.title,
    description: auction.description,
    status: auction.status,
    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,
    bids: auction.bidCount || 0,
    bidCount: auction.bidCount || 0,
    endsAt: auction.endsAt,
    category: auction.category,
    imageUrl: auction.imageUrl,
    sellerId: auction.sellerId,
  };
}

function DashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('live');
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoadingLiveAuctions, setIsLoadingLiveAuctions] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const myBids = getDashboardItems('myBids');
  const wonAuctions = getDashboardItems('wonAuctions');

  useEffect(() => {
    async function loadLiveAuctions() {
      try {
        setIsLoadingLiveAuctions(true);
        setErrorMessage('');

        const auctions = await getAuctions();
        const mappedAuctions = auctions.map(mapAuctionToDashboardItem);

        setLiveStreams(mappedAuctions);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load auctions');
      } finally {
        setIsLoadingLiveAuctions(false);
      }
    }

    loadLiveAuctions();
  }, []);

  function handleCreateAuction() {
    navigate('/create-auction');
  }

  function handleViewAuction(auctionId) {
    navigate(`/auction/${auctionId}`);
  }

  function renderLiveAuctions() {
    if (isLoadingLiveAuctions) {
      return <p className="dashboard-message">Loading live auctions...</p>;
    }

    if (errorMessage) {
      return <p className="dashboard-message dashboard-error">{errorMessage}</p>;
    }

    if (liveStreams.length === 0) {
      return <p className="dashboard-message">No live auctions yet.</p>;
    }

    return liveStreams.map((item, index) => (
      <DashboardLiveStreamItem
        key={item.id}
        item={item}
        imageVariant={index + 1}
        onViewStream={() => handleViewAuction(item.id)}
        onManage={() => handleViewAuction(item.id)}
      />
    ));
  }

  return (
    <>
      <Navbar />
      <PageContainer className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>
              My <span>Dashboard</span>
            </h1>
            <p>Manage your live auctions, bids, and winnings</p>
          </div>

          <Button className="dashboard-cta" onClick={handleCreateAuction}>
            Start New Live Auction
          </Button>
        </header>

        <section className="dashboard-card card">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="dashboard-content">
            {activeTab === 'live'
              ? renderLiveAuctions()
              : activeTab === 'bids'
                ? myBids.map((item, index) => (
                    <DashboardBidItem
                      key={item.id}
                      item={item}
                      imageVariant={index + 1}
                    />
                  ))
                : wonAuctions.map((item, index) => (
                    <DashboardWonItem
                      key={item.id}
                      item={item}
                      imageVariant={index + 1}
                    />
                  ))}
          </div>
        </section>
      </PageContainer>
    </>
  );
}

export default DashboardPage;