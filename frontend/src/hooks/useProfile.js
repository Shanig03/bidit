import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../api/usersApi';

function getDisplayName(user) {
  if (!user) return 'User';
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

function getInitialProfile(user) {
  const displayName = getDisplayName(user);
  const email = user?.email || 'No email available';

  return {
    displayName,
    email,
    bio: 'No bio added yet.',
    photoURL: user?.photoURL || '',
    imageFile: null,
  };
}

export function useProfile() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profile, setProfile] = useState(() => getInitialProfile(user));
  const [formData, setFormData] = useState(() => getInitialProfile(user));

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        const fallbackProfile = getInitialProfile(user);

        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        setErrorMessage('');

        const dbUser = await getUserProfile(user.uid);
        const fallbackProfile = getInitialProfile(user);

        const loadedProfile = {
          displayName: dbUser.displayName || fallbackProfile.displayName,
          email: dbUser.email || fallbackProfile.email,
          bio: dbUser.bio || 'No bio added yet.',
          photoURL: dbUser.photoURL || fallbackProfile.photoURL,
          imageFile: null,
        };

        setProfile(loadedProfile);
        setFormData(loadedProfile);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load profile.');

        const fallbackProfile = getInitialProfile(user);
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user?.uid]);

  function handleStartEdit() {
    setFormData(profile);
    setStatusMessage('');
    setErrorMessage('');
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setFormData(profile);
    setStatusMessage('');
    setErrorMessage('');
    setIsEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((currentData) => ({
      ...currentData,
      imageFile: file,
      photoURL: previewUrl,
    }));
  }

  function handleRemoveImage() {
    setFormData((currentData) => ({
      ...currentData,
      imageFile: null,
      photoURL: '',
    }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!user?.uid) {
      setErrorMessage('You must be logged in to update your profile.');
      return;
    }

    const cleanName = formData.displayName.trim();
    const cleanBio = formData.bio.trim();

    if (!cleanName) {
      setErrorMessage('Full name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage('');
      setErrorMessage('');

      /*
        Image note:
        If imageFile exists, photoURL is currently only a local preview URL.
        We should not save this preview URL to DynamoDB.
        Later, with S3 Presigned URL, we will upload imageFile to S3
        and save the permanent S3/CloudFront URL in DynamoDB.
      */
      const photoURLToSave = formData.imageFile ? profile.photoURL : formData.photoURL;

      const updatedProfile = await updateUserProfile(user.uid, {
        displayName: cleanName,
        email: profile.email,
        bio: cleanBio,
        photoURL: photoURLToSave || '',
      });

      const nextProfile = {
        displayName: updatedProfile.displayName || cleanName,
        email: updatedProfile.email || profile.email,
        bio: updatedProfile.bio || 'No bio added yet.',
        photoURL: updatedProfile.photoURL || '',
        imageFile: null,
      };

      setProfile(nextProfile);
      setFormData(nextProfile);
      setIsEditing(false);
      setStatusMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return {
    user,
    profile,
    formData,
    isEditing,
    isLoadingProfile,
    isSaving,
    statusMessage,
    errorMessage,
    handleStartEdit,
    handleCancelEdit,
    handleChange,
    handleImageChange,
    handleRemoveImage,
    handleSaveProfile,
  };
}