import { useRef, useState } from 'react';
import './ProductImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ProductImageUploader({
  selectedFile,
  previewUrl,
  onFileSelect,
  onRemove,
  disabled = false,
  errorMessage = '',
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  function validateAndSelect(file) {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onFileSelect(null, 'Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    onFileSelect(file, '');
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (disabled) return;
    setIsDragActive(true);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    if (disabled) return;
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    if (disabled) return;
    setIsDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    if (disabled) return;

    setIsDragActive(false);

    const file = event.dataTransfer?.files?.[0];
    validateAndSelect(file);
  }

  function handleInputChange(event) {
    if (disabled) return;

    const file = event.target.files?.[0];
    validateAndSelect(file);
    event.target.value = '';
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <section className="product-image-uploader card">
      <h3>Upload product image</h3>

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
        {previewUrl ? (
          <img src={previewUrl} alt="Selected product preview" className="product-image-preview" />
        ) : (
          <>
            <p className="product-image-title">Drag and drop an image here, or click to choose a file.</p>
            <small>JPG, PNG, WEBP</small>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled}
        className="product-image-input"
      />

      {selectedFile && (
        <div className="product-image-meta">
          <span>{selectedFile.name}</span>
          <button type="button" onClick={onRemove} disabled={disabled}>
            Remove image
          </button>
        </div>
      )}

      {errorMessage && <p className="product-image-error">{errorMessage}</p>}
    </section>
  );
}

export default ProductImageUploader;
