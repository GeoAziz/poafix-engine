import { User } from '../models/User.js';
import { uploadImage, deleteImage } from '../services/storageService.js';

export const updateProfile = async (userId, updateData) => {
  try {
    // Handle profile picture
    if (updateData.profilePicture) {
      // Get current user to check if they have an existing profile picture
      const currentUser = await User.findById(userId);
      if (currentUser.profilePicUrl) {
        await deleteImage(currentUser.profilePicUrl);
      }
      
      const imageUrl = await uploadImage(updateData.profilePicture);
      updateData.profilePicUrl = imageUrl;
      delete updateData.profilePicture;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    return user;
  } catch (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

export const getProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw new Error(`Failed to get profile: ${error.message}`);
  }
};
