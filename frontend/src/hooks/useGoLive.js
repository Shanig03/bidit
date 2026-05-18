
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAuction } from '../api/auctionsApi'; 

export const durationOptions = [
  { label: '24 hours', hours: 24 },
  { label: '12 hours', hours: 12 },
  { label: '6 hours', hours: 6 },
  { label: '3 hours', hours: 3 },
];

const resolutionMap = {
  '720p Standard Definition': '720p_1',
  '1080p High Definition': '1080p_1'
};

function calculateEndsAt(durationLabel) {
  const selectedDuration = durationOptions.find((duration) => duration.label === durationLabel);
  const hoursToAdd = selectedDuration ? selectedDuration.hours : 24;

  const endDate = new Date();
  endDate.setHours(endDate.getHours() + hoursToAdd);

  return endDate.toISOString();
}

export function useGoLive() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Photography');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('24 hours');
  const [streamQuality, setStreamQuality] = useState('720p Standard Definition');
  
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStartAuction(event) {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!title.trim()) {
      setServerError('Product title is required.');
      return;
    }

    if (!startingPrice || Number(startingPrice) <= 0) {
      setServerError('Starting price must be greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedAgoraProfile = resolutionMap[streamQuality] || '720p_1';

      const result = await createAuction({
        sellerId: 'firebase-user-123', // Swap out for real Firebase user session variable later
        title: title.trim(),
        description: description.trim(),
        category,
        startingPrice: Number(startingPrice),
        endsAt: calculateEndsAt(duration),
        imageUrl: '',
        agoraChannelName: `auction-${Date.now()}`,
        videoProfile: selectedAgoraProfile 
      });

      setSuccessMessage('Auction created successfully.');
      navigate(`/auction/${result.auction.auctionId}`);
    } catch (error) {
      setServerError(error.message || 'Failed to create auction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  return {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    startingPrice, setStartingPrice,
    duration, setDuration,
    streamQuality, setStreamQuality,
    serverError,
    successMessage,
    isSubmitting,
    handleStartAuction,
    handleCancel
  };
}