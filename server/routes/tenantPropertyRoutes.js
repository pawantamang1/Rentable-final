import express from "express";
import {
  getAllProperties,
  getAllSavedProperties,
  getCollaborativeRecommendations,
  getPropertyRecommendations,
  getSingleProperty,
  savePropertyToggle,
} from "../controllers/tenantPropertyControllers.js";

const router = express.Router();

/**
 * @description Get all properties
 * @route GET /api/tenant/real-estate
 */
router.get("/", getAllProperties);

/**
 * @description Get property recommendations
 * @route GET /api/tenant/real-estate/recommendations
 */
router.get("/recommendations", getPropertyRecommendations);

/**
 * @description Get collaborative recommendations
 * @route GET /api/tenant/real-estate/collaborative-recommendations/:propertyId
 */
router.get(
  "/collaborative-recommendations/:propertyId",
  getCollaborativeRecommendations
);

/**
 * @description Get all saved properties
 * @route GET /api/tenant/real-estate/saved/all
 */
router.get("/saved/all", getAllSavedProperties);

/**
 * @description Toggle save property for tenant user
 * @route PATCH /api/tenant/real-estate/save/:id
 */
router.patch("/save/:id", savePropertyToggle);

/**
 * @description Get single property (MUST be last among GET routes)
 * @route GET /api/tenant/real-estate/:slug
 */
router.get("/:slug", getSingleProperty);

export default router;
