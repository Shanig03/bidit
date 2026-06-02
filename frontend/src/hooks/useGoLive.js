import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction, updateAuction } from '../api/auctionsService';
import { uploadImage } from '../api/uploadService';

export const durationOptions = [
  { label: '24 hours', hours: 24 },
  { label: '12 hours', hours: 12 },
  { label: '6 hours', hours: 6 },
  { label: '3 hours', hours: 3 },
];

const resolutionMap = {
  '720p Standard Definition': '720p_1',
  '1080p High Definition': '1080p_1',
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
  const [startTime, setStartTime] = useState('');
  const [streamQuality, setStreamQuality] = useState('720p Standard Definition');

  const [productImageFiles, setProductImageFiles] = useState([]);
  const [productImagePreviewUrls, setProductImagePreviewUrls] = useState([]);
  const [productImageError, setProductImageError] = useState('');

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
        sellerName: user.displayName || user.email?.split('@')[0] || 'Unknown Seller',
        sellerEmail: user.email || '',
        title: title.trim(),
        description: description.trim(),
        category,
        startingPrice: Number(startingPrice),
        startsAt: new Date(startTime).toISOString(),
        endsAt: calculateEndsAt(startTime, duration),
        imageUrl: '',
        imageKey: '',
        imageKeys: [],
        agoraChannelName: `auction-${Date.now()}`,
        videoProfile: selectedAgoraProfile,
        status: isScheduled ? 'UPCOMING' : 'LIVE',
      });

      const createdAuctionId = result?.auction?.auctionId;

      if (productImageFiles.length > 0 && createdAuctionId) {
        const uploadedImageKeys = [];

        for (const file of productImageFiles) {
          const uploadedImageKey = await uploadImage({
            uploadType: 'auction',
            file,
            userId: user.uid,
            auctionId: createdAuctionId,
          });

          if (!uploadedImageKey) {
            throw new Error('Image upload failed. Please try again.');
          }

          uploadedImageKeys.push(uploadedImageKey);
        }

        await updateAuction(createdAuctionId, {
          imageKey: uploadedImageKeys[0],
          imageKeys: uploadedImageKeys,
        });
      }

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

  function handleProductImageSelect(files, validationError = '') {
    setProductImageError(validationError);

    if (validationError || !files || files.length === 0) {
      productImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setProductImageFiles([]);
      setProductImagePreviewUrls([]);
      return;
    }

    const fileList = Array.isArray(files) ? files : Array.from(files);
    const nextFiles = fileList.slice(0, 6);

    productImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

    const nextPreviewUrls = nextFiles.map((file) => URL.createObjectURL(file));

    setProductImageFiles(nextFiles);
    setProductImagePreviewUrls(nextPreviewUrls);

    if (fileList.length > 6) {
      setProductImageError('You can upload up to 6 images.');
    }
  }

  function handleRemoveProductImage(indexToRemove) {
    const removedPreviewUrl = productImagePreviewUrls[indexToRemove];

    if (removedPreviewUrl) {
      URL.revokeObjectURL(removedPreviewUrl);
    }

    setProductImageFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );

    setProductImagePreviewUrls((currentUrls) =>
      currentUrls.filter((_, index) => index !== indexToRemove)
    );

    setProductImageError('');
  }

  useEffect(() => {
    return () => {
      productImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [productImagePreviewUrls]);

  function handleCancel() {
    navigate('/dashboard');
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    startingPrice,
    setStartingPrice,
    duration,
    setDuration,
    startTime,
    setStartTime,
    streamQuality,
    setStreamQuality,
    productImageFiles,
    productImagePreviewUrls,
    productImageError,
    serverError,
    successMessage,
    isSubmitting,
    handleProductImageSelect,
    handleRemoveProductImage,
    handleStartAuction,
    handleCancel,
  };
}