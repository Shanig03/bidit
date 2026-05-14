import { useState } from 'react';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import DashboardTabs from '../components/ui/DashboardTabs';
import DashboardLiveStreamItem from '../components/ui/DashboardLiveStreamItem';
import DashboardBidItem from '../components/ui/DashboardBidItem';
import DashboardWonItem from '../components/ui/DashboardWonItem';
import { getDashboardItems } from '../data/mockDashboard';
import './DashboardPage.css';

const tabs = [
  { id: 'live', label: 'My Live Streams' },
  { id: 'bids', label: 'My Bids' },
  { id: 'won', label: 'Won Auctions' },
];

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('live');
  const liveStreams = getDashboardItems('myLiveStreams');
  const myBids = getDashboardItems('myBids');
  const wonAuctions = getDashboardItems('wonAuctions');

  return (
    <>
      <Navbar />
      <PageContainer className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>
              My <span>Dashboard</span>
            </h1>
            <p>Manage your live streams, bids, and winnings</p>
          </div>
          <Button className="dashboard-cta">Start New Live Auction</Button>
        </header>

        <section className="dashboard-card card">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="dashboard-content">
            {activeTab === 'live'
              ? liveStreams.map((item, index) => (
                  <DashboardLiveStreamItem key={item.id} item={item} imageVariant={index + 1} />
                ))
              : activeTab === 'bids'
                ? myBids.map((item, index) => <DashboardBidItem key={item.id} item={item} imageVariant={index + 1} />)
                : wonAuctions.map((item, index) => <DashboardWonItem key={item.id} item={item} imageVariant={index + 1} />)}
          </div>
        </section>
      </PageContainer>
    </>
  );
}

export default DashboardPage;
