import  { useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import AdminAuctionsComp from '../components/AdminAuctionsComp';


export default function AdminAuctionsPage() {
  const { 
    auctions, 
    loading, 
    error, 
    loadAuctions, 
    handleDeleteAuction 
  } = useAdmin();


  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  if (loading) return <div className="admin-page">Loading auctions...</div>;
  if (error) return <div className="admin-page error">{error}</div>;

  return (
    <div className="admin-page">
      <h1>Manage Auctions</h1>
      <AdminAuctionsComp 
        auctions={auctions} 
        onDelete={handleDeleteAuction} 
      />
    </div>
  );
}