import { useMemo, useState } from 'react';
import { useImageViewUrl } from '../hooks/useImageViewUrl';
import './ProductImageGallery.css';

function GalleryImage({ imageKey, index, onOpen }) {
  const { imageUrl, isLoadingImage } = useImageViewUrl(imageKey);

  if (isLoadingImage) {
    return (
      <div className="product-gallery__thumb product-gallery__thumb--loading">
        Loading...
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <button
      type="button"
      className="product-gallery__thumb"
      onClick={() => onOpen(index)}
      aria-label={`Open product image ${index + 1}`}
    >
      <img src={imageUrl} alt={`Product ${index + 1}`} />
    </button>
  );
}

function GalleryModalImage({ imageKey }) {
  const { imageUrl, isLoadingImage } = useImageViewUrl(imageKey);

  if (isLoadingImage) {
    return <div className="product-gallery__modal-loading">Loading image...</div>;
  }

  if (!imageUrl) {
    return <div className="product-gallery__modal-loading">Image unavailable</div>;
  }

  return <img src={imageUrl} alt="Selected product" />;
}

export default function ProductImageGallery({ auction }) {
  const imageKeys = useMemo(() => {
    const keysFromList = Array.isArray(auction?.imageKeys)
      ? auction.imageKeys.filter(Boolean)
      : [];

    if (keysFromList.length > 0) {
      return keysFromList;
    }

    return auction?.imageKey ? [auction.imageKey] : [];
  }, [auction?.imageKeys, auction?.imageKey]);

  const [selectedIndex, setSelectedIndex] = useState(null);

  if (imageKeys.length === 0) {
    return null;
  }

  const selectedImageKey = selectedIndex !== null ? imageKeys[selectedIndex] : null;

  function openImage(index) {
    setSelectedIndex(index);
  }

  function closeImage() {
    setSelectedIndex(null);
  }

  function showPreviousImage() {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) return 0;
      return currentIndex === 0 ? imageKeys.length - 1 : currentIndex - 1;
    });
  }

  function showNextImage() {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) return 0;
      return currentIndex === imageKeys.length - 1 ? 0 : currentIndex + 1;
    });
  }

  return (
    <section className="product-gallery card">
      <div className="product-gallery__header">
        <h3>Product Images</h3>
        <span>{imageKeys.length} {imageKeys.length === 1 ? 'image' : 'images'}</span>
      </div>

      <div className="product-gallery__grid">
        {imageKeys.map((imageKey, index) => (
          <GalleryImage
            key={`${imageKey}-${index}`}
            imageKey={imageKey}
            index={index}
            onOpen={openImage}
          />
        ))}
      </div>

      {selectedImageKey && (
        <div className="product-gallery__modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="product-gallery__backdrop"
            onClick={closeImage}
            aria-label="Close gallery"
          />

          <div className="product-gallery__modal-content">
            <button
              type="button"
              className="product-gallery__close"
              onClick={closeImage}
              aria-label="Close image"
            >
              ×
            </button>

            {imageKeys.length > 1 && (
              <button
                type="button"
                className="product-gallery__nav product-gallery__nav--prev"
                onClick={showPreviousImage}
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            <GalleryModalImage imageKey={selectedImageKey} />

            {imageKeys.length > 1 && (
              <button
                type="button"
                className="product-gallery__nav product-gallery__nav--next"
                onClick={showNextImage}
                aria-label="Next image"
              >
                ›
              </button>
            )}

            <div className="product-gallery__counter">
              {selectedIndex + 1} / {imageKeys.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}