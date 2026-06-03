
import { useState } from 'react';
import { formatNumberWithCommas, formatNumericInput, parseFormattedNumber } from '../utils/numberFormat';

export function useBidPanel(auction, currentBid, watchers, onPlaceBid) {
  const displayCurrentBid = currentBid ?? auction?.currentPrice ?? 0;
  const displayStartingPrice = auction?.startingPrice ?? 0;
  const displayBidCount = auction?.bidCount ?? 0;
  const displayWatchers = watchers ?? auction?.watchers ?? 0;

  const [bidAmount, setBidAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitBid() {
    setErrorMessage('');
    setSuccessMessage('');

    const numericBid = parseFormattedNumber(bidAmount);

    if (!bidAmount || Number.isNaN(numericBid)) {
      setErrorMessage('Please enter a valid bid amount.');
      return;
    }

    if (numericBid <= Number(displayCurrentBid)) {
      setErrorMessage(`Your bid must be higher than $${formatNumberWithCommas(displayCurrentBid)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onPlaceBid(numericBid);
      
      setSuccessMessage('Bid placed successfully.');
      setBidAmount('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to place bid.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    displayCurrentBid,
    displayStartingPrice,
    displayBidCount,
    displayWatchers,
    bidAmount,
    setBidAmount: (value) => setBidAmount(formatNumericInput(value)),
    errorMessage,
    successMessage,
    isSubmitting,
    handleSubmitBid,
  };
}
