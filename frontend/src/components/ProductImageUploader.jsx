import { useRef, useState } from 'react';
import './ProductImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ProductImageUploader({
  selectedFiles = [],
  previewUrls = [],
  maxFiles = 6,
  onFilesSelect,
  onRemove,
  disabled = false,
  errorMessage = '',
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  function validateAndSelect(files) {
    const fileList = Array.from(files || []);

    if (fileList.length === 0) {
      return;
    }

    const invalidFile = fileList.find((file) => !ACCEPTED_TYPES.includes(file.type));

    if (invalidFile) {
      onFilesSelect([], 'Please upload only JPG, PNG, or WEBP images.');
      return;
    }

    if (fileList.length > maxFiles) {
      onFilesSelect(
        fileList.slice(0, maxFiles),
        `You can upload up to ${maxFiles} images. Only the first ${maxFiles} were selected.`
      );
      return;
    }

    onFilesSelect(fileList, '');
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsDragActive(true);
  }

  function handleDragEnter(event) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsDragActive(false);
    validateAndSelect(event.dataTransfer?.files);
  }

  function handleInputChange(event) {
    if (disabled) {
      return;
    }

    validateAndSelect(event.target.files);
    event.target.value = '';
  }

  function openPicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  return (
    <section className="product-image-uploader card">
      <div className="product-image-uploader__header">
        <h3>Upload product images</h3>
        <p>The first image will appear on the auction card. You can upload up to {maxFiles} images.</p>
      </div>

      <div
        className={`product-image-dropzone ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        aria-disabled={disabled}
      >
        <p className="product-image-title">
          Drag and drop images here, or click to choose files.
        </p>
        <small>JPG, PNG, WEBP · Up to {maxFiles} images</small>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        disabled={disabled}
        className="product-image-input"
      />

      {previewUrls.length > 0 && (
        <div className="product-image-preview-grid">
          {previewUrls.map((previewUrl, index) => (
            <div className="product-image-preview-card" key={previewUrl}>
              <img
                src={previewUrl}
                alt={`Selected product preview ${index + 1}`}
                className="product-image-preview"
              />

              {index === 0 && (
                <span className="product-image-main-badge">Main</span>
              )}

              <button
                type="button"
                className="product-image-remove-btn"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>

              {selectedFiles[index] && (
                <span className="product-image-file-name">
                  {selectedFiles[index].name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <p className="product-image-count">
          {selectedFiles.length} / {maxFiles} images selected
        </p>
      )}

      {errorMessage && <p className="product-image-error">{errorMessage}</p>}
    </section>
  );
}

export default ProductImageUploader;