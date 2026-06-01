import { useEffect, useState } from 'react';
import { getImageViewUrl } from '../api/uploadService';

export function useImageViewUrl(imageKey) {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadImageUrl() {
      if (!imageKey) {
        setImageUrl('');
        setImageError('');
        return;
      }

      try {
        setIsLoadingImage(true);
        setImageError('');

        const viewUrl = await getImageViewUrl(imageKey);

        if (isMounted) {
          setImageUrl(viewUrl);
        }
      } catch (error) {
        console.error('Failed to load image view URL:', error);

        if (isMounted) {
          setImageUrl('');
          setImageError('Failed to load image.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingImage(false);
        }
      }
    }

    loadImageUrl();

    return () => {
      isMounted = false;
    };
  }, [imageKey]);

  return {
    imageUrl,
    isLoadingImage,
    imageError,
  };
}