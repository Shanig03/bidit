const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getPresignedUploadUrl({
  uploadType,
  file,
  userId,
  auctionId,
}) {
  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadType,
      contentType: file.type,
      fileName: file.name,
      userId,
      auctionId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get upload URL: ${errorText}`);
  }

  return response.json();
}

export async function uploadFileToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file to S3: ${errorText}`);
  }
}

export async function uploadImage({
  uploadType,
  file,
  userId,
  auctionId,
}) {
  if (!file) return null;

  const { uploadUrl, imageKey } = await getPresignedUploadUrl({
    uploadType,
    file,
    userId,
    auctionId,
  });

  await uploadFileToS3(uploadUrl, file);

  return imageKey;
}

export async function getImageViewUrl(imageKey) {
  if (!imageKey) return '';

  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get',
      imageKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get image view URL: ${errorText}`);
  }

  const data = await response.json();
  return data.viewUrl;
}