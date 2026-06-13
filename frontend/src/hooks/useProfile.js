import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  getUserNotifications,
} from '../api/usersApi';
import { uploadImage, getImageViewUrl } from '../api/uploadService';

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
    profileImageKey: '',
    wonAuctions: [],
    imageFile: null,
  };
}

export function useProfile() {
  const { user, updateLocalUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profile, setProfile] = useState(() => getInitialProfile(user));
  const [formData, setFormData] = useState(() => getInitialProfile(user));
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // UC-19/UC-20: Loads profile details, auctions won, and notifications.
    async function loadProfile() {
      if (!user?.uid) {
        const fallbackProfile = getInitialProfile(user);

        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setNotifications([]);
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        setErrorMessage('');

        // UC-20: Notifications are loaded for display only in this version.
        const [dbUser, userNotifications] = await Promise.all([
          getUserProfile(user.uid),
          getUserNotifications(user.uid),
        ]);

        const fallbackProfile = getInitialProfile(user);

        const profileImageKey = dbUser.profileImageKey || '';
        let photoURL = dbUser.photoURL || fallbackProfile.photoURL || '';

        if (profileImageKey) {
          photoURL = await getImageViewUrl(profileImageKey);
        }

        const loadedProfile = {
          displayName: dbUser.displayName || fallbackProfile.displayName,
          email: dbUser.email || fallbackProfile.email,
          bio: dbUser.bio || 'No bio added yet.',
          photoURL,
          profileImageKey,
          wonAuctions: Array.isArray(dbUser.wonAuctions) ? dbUser.wonAuctions : [],
          imageFile: null,
        };

        setProfile(loadedProfile);
        setFormData(loadedProfile);
        setNotifications(Array.isArray(userNotifications) ? userNotifications : []);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load profile.');

        const fallbackProfile = getInitialProfile(user);
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setNotifications([]);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user?.uid]);

  // UC-19: Opens edit mode with the current profile values.
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

  // UC-19: Previews the selected profile image before saving.
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
      profileImageKey: '',
    }));
  }

  // UC-19: Saves edited profile fields and optional image upload.
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

      let profileImageKeyToSave = formData.profileImageKey || '';
      let photoURLToShow = formData.photoURL || '';

      if (formData.imageFile) {
        // UC-19: Uploads the profile image to S3 and saves the returned key.
        const uploadedImageKey = await uploadImage({
          uploadType: 'profile',
          file: formData.imageFile,
          userId: user.uid,
        });

        profileImageKeyToSave = uploadedImageKey;
        photoURLToShow = await getImageViewUrl(uploadedImageKey);
      }

      const updatedProfile = await updateUserProfile(user.uid, {
        displayName: cleanName,
        email: profile.email,
        bio: cleanBio,
        profileImageKey: profileImageKeyToSave,
        photoURL: '',
      });

      if (updateLocalUser) {
        updateLocalUser({
          displayName: cleanName,
          photoURL: photoURLToShow,
        });
      }

      const nextProfile = {
        displayName: updatedProfile.displayName || cleanName,
        email: updatedProfile.email || profile.email,
        bio: updatedProfile.bio || 'No bio added yet.',
        photoURL: photoURLToShow,
        profileImageKey: updatedProfile.profileImageKey || profileImageKeyToSave,
        wonAuctions: Array.isArray(updatedProfile.wonAuctions)
          ? updatedProfile.wonAuctions
          : profile.wonAuctions || [],
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
    notifications,
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