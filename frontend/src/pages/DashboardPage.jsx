import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import DashboardContent from '../components/pages/DashboardContent';
import { useDashboard } from '../hooks/useDashboard';

function DashboardPage() {
  const navigate = useNavigate();
  const state = useDashboard();

  return (
    <>
      <Navbar />
      <PageContainer className="dashboard-page">
        <DashboardContent
          {...state}
          onCreateAuction={() => navigate('/create-auction')}
          onViewAuction={(id) => navigate(`/auction/${id}`)}
        />
      </PageContainer>
    </>
  );
}

export default DashboardPage;
