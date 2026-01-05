const User = require("../models/User");
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary");

// @desc    Upload user avatar
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarUrl) {
      const oldPublicId = getPublicIdFromUrl(user.avatarUrl);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
          console.log(`✅ Deleted old avatar: ${oldPublicId}`);
        } catch (deleteError) {
          console.error("⚠️ Failed to delete old avatar:", deleteError);
          // Continue with update even if delete fails
        }
      }
    }

    // Get the new avatar URL from Cloudinary
    const avatarUrl = req.file.path;

    // Update user's avatar URL in database
    user.avatarUrl = avatarUrl;
    await user.save();

    console.log(`✅ Avatar uploaded for user ${user._id}: ${avatarUrl}`);

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl,
    });
  } catch (error) {
    console.error("❌ Error uploading avatar:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar",
    });
  }
};

// @desc    Delete user avatar
// @route   DELETE /api/upload/avatar
// @access  Private
exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has an avatar to delete
    if (!user.avatarUrl) {
      return res.status(400).json({
        success: false,
        message: "No avatar to delete",
      });
    }

    // Delete avatar from Cloudinary
    const publicId = getPublicIdFromUrl(user.avatarUrl);
    if (publicId) {
      try {
        await deleteImage(publicId);
        console.log(`✅ Deleted avatar from Cloudinary: ${publicId}`);
      } catch (deleteError) {
        console.error(
          "⚠️ Failed to delete avatar from Cloudinary:",
          deleteError
        );
      }
    }

    // Remove avatar URL from user profile
    user.avatarUrl = null;
    await user.save();

    console.log(`✅ Avatar removed for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting avatar:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete avatar",
    });
  }
};
