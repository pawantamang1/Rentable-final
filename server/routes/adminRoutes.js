import express from "express";
import {
  adminDeleteProperty,
  getAllSavedPropertiesAdmin,
  getPropertyDetailAdmin,
} from "../controllers/adminUserController.js";
import {
  loginAdmin,
  refreshAdmin,
  registerAdmin,
} from "../controllers/authController.js";
import { verifyAdminAccount } from "../middleware/authMiddleware.js"; // Ensure you have middleware for admin

const router = express.Router();

// Admin-only routes
router.get("/saved-properties", getAllSavedPropertiesAdmin);

// Get single property detail for admin view
router.get("/property/:slug", getPropertyDetailAdmin);

// Delete property by admin
router.delete("/delete-property/:slug", adminDeleteProperty);
router.post("/register-admin", registerAdmin);
router.post("/login-admin", loginAdmin);
router.post("/verify-account/admin", verifyAdminAccount);
router.get("/refresh-admin", refreshAdmin);

export default router;
