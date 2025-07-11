import express from "express";
import {
  getAllProperties,
  getAllSavedProperties,
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

router.get("/recommendations", getPropertyRecommendations);

/**
 * @description Get single property
 * @route GET /api/tenant/real-estate/:slug
 */
router.get("/:slug", getSingleProperty);

/**
 * @description Toggle save property for tenant user
 * @route PATCH /api/tenant/real-estate/save/:id
 */
router.patch("/save/:id", savePropertyToggle);

/**
 * @description Get all saved properties
 * @route GET /api/tenant/real-estate/save/all
 */
router.get("/saved/all", getAllSavedProperties);



export default router;
