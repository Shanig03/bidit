import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction } from '../api/auctionsService';

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


function calculateEndsAt(startTimeString, durationLabel) {
  const selectedDuration = durationOptions.find((d) => d.label === durationLabel);
  const hoursToAdd = selectedDuration ? selectedDuration.hours : 24;

  const baseDate = startTimeString ? new Date(startTimeString) : new Date();
  baseDate.setHours(baseDate.getHours() + hoursToAdd);

  return baseDate.toISOString();
}

export function useGoLive() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Photography');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('24 hours');
  const [startTime, setStartTime] = useState(''); // 👈 New state for date/time
  const [streamQuality, setStreamQuality] = useState('720p Standard Definition');
  
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStartAuction(event) {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!user) {
      return setServerError('You must be logged in to create an auction.');
    }
    if (!title.trim()) {
      return setServerError('Product title is required.');
    }
    if (!startingPrice || Number(startingPrice) <= 0) {
      return setServerError('Starting price must be greater than 0.');
    }
    if (!startTime) {
      return setServerError('Please select a start date and time.');
    }

    try {
      setIsSubmitting(true);
      const selectedAgoraProfile = resolutionMap[streamQuality] || '720p_1';
      
      const startDateTime = new Date(startTime);
      const isScheduled = startDateTime > new Date();

      const result = await createAuction({
        sellerId: user.uid, 
        sellerName: user.displayName || 'Unknown Seller',
        title: title.trim(),
        description: description.trim(),
        category,
        startingPrice: Number(startingPrice),
        startsAt: new Date(startTime).toISOString(), 
        endsAt: calculateEndsAt(startTime, duration), 
        imageUrl: '',
        agoraChannelName: `auction-${Date.now()}`,
        videoProfile: selectedAgoraProfile,
        status: isScheduled ? 'scheduled' : 'active'
      });

      setSuccessMessage('Auction scheduled successfully.');
      if (isScheduled) {
        navigate('/dashboard');
      } else {
        navigate(`/auction/${result.auction.auctionId}`); 
      }
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
    startTime, setStartTime, 
    streamQuality, setStreamQuality,
    serverError, successMessage, isSubmitting,
    handleStartAuction, handleCancel
  };
}