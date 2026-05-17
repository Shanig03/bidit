import './FormFields.css';

function UploadBox() {
  return (
    <div className="upload-box">
      <p className="upload-icon">⇪</p>
      <strong>Click to upload or drag and drop</strong>
      <small>PNG, JPG or WEBP (max. 5MB per image)</small>
    </div>
  );
}

export default UploadBox;
