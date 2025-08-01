import RealEstate from "../models/RealEstate.js";
import TenantUser from "../models/TenantUser.js";
import { NotFoundError } from "../request-errors/index.js";

/**
 * @description Get all properties
 * @returns {object} realEstate array
 */
const getAllProperties = async (req, res) => {
  const { search, category, priceFilter } = req.query;

  const queryObject = {
    status: true, //only show properties that are available
  };

  if (search) {
    queryObject.title = { $regex: search, $options: "i" };
  }

  if (category !== "all") {
    queryObject.category = category;
  }

  if (priceFilter) {
    const [minPrice, maxPrice] = priceFilter.split("-");
    queryObject.price = { $gte: minPrice, $lte: maxPrice };
  }

  let realEstateResult = RealEstate.find(queryObject)
    .populate({
      path: "propertyOwner",
      select: "-password -createdAt -updatedAt -__v -contacts",
    })
    .sort({ createdAt: -1 });

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  realEstateResult = realEstateResult.skip(skip).limit(limit);
  const allRealEstate = await realEstateResult;

  const totalRealEstates = await RealEstate.countDocuments(queryObject);
  const numberOfPages = Math.ceil(totalRealEstates / limit);

  res.json({ allRealEstate, numberOfPages, totalRealEstates });
};

/**
 * @description Get single property
 * @returns {object} realEstate
 */
const getSingleProperty = async (req, res) => {
  const { slug } = req.params;
  const { userId } = req.user;

  const realEstate = await RealEstate.findOne({ slug }).populate({
    path: "propertyOwner",
    select: "-password -createdAt -updatedAt -__v -contacts",
  });

  if (!realEstate) {
    throw new NotFoundError(`Property was not found`);
  }

  const { _id: id } = realEstate;

  //check if property is saved by user
  const currentTenantUser = await TenantUser.findById(userId);
  const isSaved = currentTenantUser.savedProperties.includes(id.toString());

  res.json({ realEstate, isSaved });
};

/**
 * @description Save property if not saved otherwise remove from saved list
 * @returns {object} TenantUser
 */
const savePropertyToggle = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const toSaveProperty = await RealEstate.findById(id);

  if (!toSaveProperty) {
    throw new NotFoundError(`Property with id: ${id} not found`);
  }
  const currentTenantUser = await TenantUser.findById(userId);

  //check if property is already saved by user and remove it from saved properties
  if (currentTenantUser.savedProperties.includes(id)) {
    currentTenantUser.savedProperties =
      currentTenantUser.savedProperties.filter(
        (propertyId) => propertyId.toString() !== id
      );
    const updatedUser = await TenantUser.findOneAndUpdate(
      { _id: userId },
      {
        savedProperties: currentTenantUser.savedProperties,
      },
      { new: true, runValidators: true }
    );

    res.json({
      updatedUser,
      message: "Property removed from saved properties",
      isSaved: false,
    });
  } else {
    //add property to saved properties
    const updatedUser = await TenantUser.findOneAndUpdate(
      { _id: userId },
      {
        $push: { savedProperties: id },
      },
      { new: true, runValidators: true }
    );

    res.json({
      updatedUser,
      message: "Property saved successfully",
      isSaved: true,
    });
  }
};

/**
 * @description Get all properties
 * @returns {object} realEstate array
 */
const getAllSavedProperties = async (req, res) => {
  const { userId } = req.user;

  const currentTenantUser = await TenantUser.findById(userId).populate({
    path: "savedProperties",
    select: "-createdAt -updatedAt -__v",

    populate: {
      path: "propertyOwner",
      model: "OwnerUser",
      select: "-createdAt -updatedAt -__v -contacts",
    },
  });

  if (!currentTenantUser) {
    throw new NotFoundError(`User with id: ${userId} not found`);
  }

  // reverse the saved properties array to show the latest saved property first
  currentTenantUser.savedProperties.reverse();

  res.json({ savedProperties: currentTenantUser.savedProperties });
};

/**
 * @description Get property recommendations based on user's saved properties
 * @route GET /api/tenant/real-estate/recommendations
 * @returns {object} recommendations array
 */
// const getPropertyRecommendations = async (req, res) => {
//   const { userId } = req.user;
//   const { limit = 10 } = req.query;

//   try {
//     // Get current tenant user with saved properties
//     const currentTenantUser = await TenantUser.findById(userId).populate({
//       path: "savedProperties",
//       select: "category price area rooms address amenities",
//     });

//     if (!currentTenantUser) {
//       throw new NotFoundError(`User with id: ${userId} not found`);
//     }

//     const savedProperties = currentTenantUser.savedProperties;

//     // If user has no saved properties, return popular properties
//     if (savedProperties.length === 0) {
//       const popularProperties = await RealEstate.find({ status: true })
//         .populate({
//           path: "propertyOwner",
//           select: "-password -createdAt -updatedAt -__v -contacts",
//         })
//         .sort({ createdAt: -1 })
//         .limit(parseInt(limit));

//       return res.json({
//         recommendations: popularProperties,
//         message: "Popular properties (no saved properties found)",
//         recommendationType: "popular",
//       });
//     }

//     // Calculate user preferences based on saved properties
//     const userPreferences = calculateUserPreferences(savedProperties);

//     // Get all available properties (excluding already saved ones)
//     const savedPropertyIds = savedProperties.map((prop) => prop._id.toString());
//     const availableProperties = await RealEstate.find({
//       status: true,
//       _id: { $nin: savedPropertyIds },
//     }).populate({
//       path: "propertyOwner",
//       select: "-password -createdAt -updatedAt -__v -contacts",
//     });

//     // Calculate similarity scores and sort by relevance
//     const recommendations = availableProperties
//       .map((property) => ({
//         ...property.toObject(),
//         similarityScore: calculateSimilarityScore(property, userPreferences),
//       }))
//       .sort((a, b) => b.similarityScore - a.similarityScore)
//       .slice(0, parseInt(limit));

//     res.json({
//       recommendations,
//       userPreferences,
//       message: "Content-based recommendations",
//       recommendationType: "content-based",
//     });
//   } catch (error) {
//     throw error;
//   }
// };

// controllers/tenantPropertyControllers.js

/**
 * @description Recommend properties similar to a currently viewed one
 * @route GET /api/tenant/real-estate/recommendations/:propertyId
 * @returns {object} recommendations array
 */
const getCollaborativeRecommendations = async (req, res) => {
  const { propertyId } = req.params; // this is your custom propertyId field
  const { limit = 4 } = req.query;

  try {
    // Find property by custom propertyId
    const currentProperty = await RealEstate.findOne({ propertyId }).lean();

    if (!currentProperty) {
      return res
        .status(404)
        .json({
          message: `Property with propertyId "${propertyId}" not found`,
        });
    }

    const otherProperties = await RealEstate.find({
      propertyId: { $ne: propertyId },
      status: true,
    })
      .populate({
        path: "propertyOwner",
        select: "-password -createdAt -updatedAt -__v -contacts",
      })
      .lean();

    const similarProperties = otherProperties
      .map((property) => ({
        property,
        similarity: calculatePropertySimilarity(currentProperty, property),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit))
      .map((item) => item.property);

    return res.json({
      recommendations: similarProperties,
      message: "Recommended similar properties",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

function calculatePropertySimilarity(prop1, prop2) {
  let score = 0;

  // Category match
  if (prop1.category === prop2.category) score += 2;

  // Facing direction
  if (prop1.facing === prop2.facing) score += 1;

  // Price similarity (smaller difference = higher score)
  const priceDiff = Math.abs(prop1.price - prop2.price);
  score += Math.max(0, 2 - priceDiff / 50000); // Max score 2

  // Area similarity
  const areaDiff = Math.abs(prop1.area - prop2.area);
  score += Math.max(0, 1.5 - areaDiff / 200); // Max score 1.5

  // Rooms match (safely)
  const roomScore = (r1 = 0, r2 = 0, weight = 0.5) =>
    1 - Math.min(1, Math.abs(r1 - r2) / 5) * weight;

  const rooms1 = prop1.rooms || {};
  const rooms2 = prop2.rooms || {};

  score += roomScore(rooms1.bedrooms, rooms2.bedrooms);
  score += roomScore(rooms1.bathrooms, rooms2.bathrooms);
  score += roomScore(rooms1.kitchens, rooms2.kitchens);

  // Amenities match (boolean overlap, safely)
  const amenities1 = prop1.amenities || {};
  const amenities2 = prop2.amenities || {};
  const amenityKeys = Object.keys(amenities1);
  let sharedAmenities = 0;

  for (const key of amenityKeys) {
    if (amenities1[key] && amenities2[key]) {
      sharedAmenities += 1;
    }
  }

  score += sharedAmenities * 0.2;

  return score;
}

/**
 * @description Get property recommendations based on user's saved properties
 * @route GET /api/tenant/real-estate/recommendations
 * @returns {object} recommendations array
 */

const getPropertyRecommendations = async (req, res) => {
  const { userId } = req.user;
  const { limit = 6 } = req.query;

  try {
    // Get current tenant user with saved properties
    const currentTenantUser = await TenantUser.findById(userId).populate({
      path: "savedProperties",
      // Include realEstateImages and other necessary fields
      select:
        "category price area rooms address amenities realEstateImages title slug status",
      populate: {
        path: "propertyOwner",
        select: "-password -createdAt -updatedAt -__v -contacts",
      },
    });

    if (!currentTenantUser) {
      throw new NotFoundError(`User with id: ${userId} not found`);
    }

    const savedProperties = currentTenantUser.savedProperties;

    // If user has no saved properties, return empty array
    if (savedProperties.length === 0) {
      return res.json({
        recommendations: [],
        message: "No saved properties found",
      });
    }

    // Get all available properties (excluding saved ones)
    const savedPropertyIds = savedProperties.map((prop) => prop._id.toString());
    const availableProperties = await RealEstate.find({
      status: true,
      _id: { $nin: savedPropertyIds },
    }).populate({
      path: "propertyOwner",
      select: "-password -createdAt -updatedAt -__v -contacts",
    });

    // For each saved property, find the most similar property
    let similarProperties = [];
    const maxSimilarPerSaved = 2; // Only get 1 similar property per saved property

    for (const savedProp of savedProperties) {
      const similar = availableProperties
        .map((prop) => ({
          property: prop,
          similarity: calculateSimpleSimilarity(savedProp, prop),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxSimilarPerSaved)
        .map((item) => item.property);

      similarProperties.push(...similar);
    }

    // Remove duplicates from similar properties
    const uniqueSimilarProperties = similarProperties.filter(
      (property, index, self) =>
        index ===
        self.findIndex((p) => p._id.toString() === property._id.toString())
    );

    // Convert both to plain objects to ensure consistency
    const savedPropsObjects = savedProperties.map((prop) => prop.toObject());
    const similarPropsObjects = uniqueSimilarProperties.map((prop) =>
      prop.toObject()
    );

    // Combine saved properties and similar properties
    // Saved properties come first
    //const recommendations = [...savedPropsObjects, ...similarPropsObjects];
    const recommendations = [...similarPropsObjects];

    // Limit results while preserving order (saved properties first)
    const finalRecommendations = recommendations.slice(0, parseInt(limit));

    res.json({
      recommendations: finalRecommendations,
      message: "Your saved properties and similar suggestions",
    });
  } catch (error) {
    throw error;
  }
};
/**
 * Simplified similarity calculation between two properties
 */
const calculateSimpleSimilarity = (propertyA, propertyB) => {
  let score = 0;

  // Category match
  if (propertyA.category === propertyB.category) score += 0.4;

  // Price similarity (within 20% range)
  const priceDiff = Math.abs(propertyA.price - propertyB.price);
  const priceRange = propertyA.price * 0.2;
  if (priceDiff <= priceRange) score += 0.3;

  // Location match (city)
  if (propertyA.address.city === propertyB.address.city) score += 0.2;

  // Bedroom count match
  if (propertyA.rooms.bedrooms === propertyB.rooms.bedrooms) score += 0.1;

  return score;
};

/**
 * Calculate user preferences based on saved properties
 */
const calculateUserPreferences = (savedProperties) => {
  const preferences = {
    categories: {},
    priceRange: { min: Infinity, max: 0 },
    areaRange: { min: Infinity, max: 0 },
    bedroomRange: { min: Infinity, max: 0 },
    cities: {},
    amenities: {},
  };

  savedProperties.forEach((property) => {
    // Category preferences
    preferences.categories[property.category] =
      (preferences.categories[property.category] || 0) + 1;

    // Price range
    preferences.priceRange.min = Math.min(
      preferences.priceRange.min,
      property.price
    );
    preferences.priceRange.max = Math.max(
      preferences.priceRange.max,
      property.price
    );

    // Area range
    preferences.areaRange.min = Math.min(
      preferences.areaRange.min,
      property.area
    );
    preferences.areaRange.max = Math.max(
      preferences.areaRange.max,
      property.area
    );

    // Bedroom range
    preferences.bedroomRange.min = Math.min(
      preferences.bedroomRange.min,
      property.rooms.bedrooms
    );
    preferences.bedroomRange.max = Math.max(
      preferences.bedroomRange.max,
      property.rooms.bedrooms
    );

    // City preferences
    preferences.cities[property.address.city] =
      (preferences.cities[property.address.city] || 0) + 1;

    // Amenity preferences
    Object.keys(property.amenities).forEach((amenity) => {
      if (property.amenities[amenity]) {
        preferences.amenities[amenity] =
          (preferences.amenities[amenity] || 0) + 1;
      }
    });
  });

  // Calculate averages and normalize
  const totalProperties = savedProperties.length;
  preferences.avgPrice =
    (preferences.priceRange.min + preferences.priceRange.max) / 2;
  preferences.avgArea =
    (preferences.areaRange.min + preferences.areaRange.max) / 2;
  preferences.avgBedrooms =
    (preferences.bedroomRange.min + preferences.bedroomRange.max) / 2;

  // Convert counts to percentages
  Object.keys(preferences.categories).forEach((category) => {
    preferences.categories[category] /= totalProperties;
  });

  Object.keys(preferences.cities).forEach((city) => {
    preferences.cities[city] /= totalProperties;
  });

  Object.keys(preferences.amenities).forEach((amenity) => {
    preferences.amenities[amenity] /= totalProperties;
  });

  return preferences;
};

/**
 * Calculate similarity score between a property and user preferences
 */
const calculateSimilarityScore = (property, preferences) => {
  let score = 0;
  let maxScore = 0;

  // Category similarity (weight: 25%)
  const categoryWeight = 0.25;
  const categoryScore = preferences.categories[property.category] || 0;
  score += categoryScore * categoryWeight;
  maxScore += categoryWeight;

  // Price similarity (weight: 20%)
  const priceWeight = 0.2;
  const priceScore = calculateRangeScore(
    property.price,
    preferences.priceRange.min,
    preferences.priceRange.max
  );
  score += priceScore * priceWeight;
  maxScore += priceWeight;

  // Area similarity (weight: 15%)
  const areaWeight = 0.15;
  const areaScore = calculateRangeScore(
    property.area,
    preferences.areaRange.min,
    preferences.areaRange.max
  );
  score += areaScore * areaWeight;
  maxScore += areaWeight;

  // Bedroom similarity (weight: 15%)
  const bedroomWeight = 0.15;
  const bedroomScore = calculateRangeScore(
    property.rooms.bedrooms,
    preferences.bedroomRange.min,
    preferences.bedroomRange.max
  );
  score += bedroomScore * bedroomWeight;
  maxScore += bedroomWeight;

  // City similarity (weight: 10%)
  const cityWeight = 0.1;
  const cityScore = preferences.cities[property.address.city] || 0;
  score += cityScore * cityWeight;
  maxScore += cityWeight;

  // Amenity similarity (weight: 15%)
  const amenityWeight = 0.15;
  let amenityScore = 0;
  let amenityCount = 0;
  Object.keys(property.amenities).forEach((amenity) => {
    if (property.amenities[amenity] && preferences.amenities[amenity]) {
      amenityScore += preferences.amenities[amenity];
      amenityCount++;
    }
  });
  if (amenityCount > 0) {
    amenityScore /= amenityCount;
  }
  score += amenityScore * amenityWeight;
  maxScore += amenityWeight;

  // Normalize score to 0-1 range
  return maxScore > 0 ? score / maxScore : 0;
};

/**
 * Calculate score for numeric ranges
 */
const calculateRangeScore = (value, min, max) => {
  if (min === max) return 1; // Perfect match
  if (value < min || value > max) {
    // Calculate how far outside the range
    const distanceFromRange = Math.min(
      Math.abs(value - min),
      Math.abs(value - max)
    );
    const rangeSize = max - min;
    return Math.max(0, 1 - distanceFromRange / rangeSize);
  }
  return 1; // Within range
};

export {
  getAllProperties,
  getAllSavedProperties,
  getCollaborativeRecommendations,
  getPropertyRecommendations,
  getSingleProperty,
  savePropertyToggle,
};
