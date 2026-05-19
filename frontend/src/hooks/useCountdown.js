import { useState, useEffect } from 'react';

export function useCountdown(endsAt, isUpcoming) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Don't run the live countdown if it hasn't started or has no end date
    if (isUpcoming || !endsAt) return;

    function calculateTimeRemaining() {
      const difference = new Date(endsAt) - new Date();

      if (difference <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeLeft(`${days}d ${remainingHours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }

    calculateTimeRemaining();
    const timerInterval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(timerInterval);
  }, [endsAt, isUpcoming]);

  return timeLeft;
}