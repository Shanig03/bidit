// src/hooks/useLiveAuctions.js
import { useEffect, useState } from 'react';
import { getAuctions } from '../api/auctionsApi'; 


function mapAuctionToCardAuction(auction) {
  return {
    id: auction.auctionId,
    auctionId: auction.auctionId,
    title: auction.title,
    name: auction.title,
    description: auction.description,
    category: auction.category,
    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,
    bidCount: auction.bidCount || 0,
    totalBids: auction.bidCount || 0,
    bids: auction.bidCount || 0,
    status: auction.status,
    endsAt: auction.endsAt,
    timeLeft: auction.endsAt,
    imageUrl: auction.imageUrl,
    sellerId: auction.sellerId,
    viewers: auction.viewers || 0,
    watchers: auction.watchers || 0,
  };
}

export function useLiveAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAuctions() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const apiAuctions = await getAuctions();
        const mappedAuctions = apiAuctions.map(mapAuctionToCardAuction);
        setAuctions(mappedAuctions);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load live auctions.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAuctions();
  }, []);

  const filteredAuctions = auctions.filter((auction) => {
    const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    const matchesSearch =
      normalizedSearch === '' ||
      auction.title?.toLowerCase().includes(normalizedSearch) ||
      auction.description?.toLowerCase().includes(normalizedSearch) ||
      auction.category?.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  return {
    filteredAuctions,
    totalAuctions: auctions.length,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    errorMessage
  };
}