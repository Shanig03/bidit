import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import { useHomeTrendingAuctions } from '../hooks/useHomeTrendingAuctions';
import HomePageContent from '../components/pages/HomePageContent';

function HomePage() {
  const { trending, isLoadingTrending, errorMessage } = useHomeTrendingAuctions();

  return (
    <>
      <Navbar />
      <PageContainer className="home-page">
        <HomePageContent trending={trending} isLoadingTrending={isLoadingTrending} errorMessage={errorMessage} />
      </PageContainer>
    </>
  );
}

export default HomePage;
