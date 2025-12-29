const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  uploadAvatar,
  deleteAvatar,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

// Upload avatar - POST /api/upload/avatar
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

// Delete avatar - DELETE /api/upload/avatar
router.delete("/avatar", protect, deleteAvatar);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds 5MB limit",
    });
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;
