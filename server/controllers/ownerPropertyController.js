import { nanoid } from "nanoid";
import RealEstate from "../models/RealEstate.js";
import {
  BadRequestError,
  ForbiddenRequestError,
  NotFoundError,
} from "../request-errors/index.js";
import {
  cloudinaryDeleteImage,
  cloudinaryMultipleUpload,
} from "../utils/cloudinaryUpload.js";

/**
 * @description Post Real Estate
 * @returns {object} realEstate
 */
// const postRealEstate = async (req, res) => {
//   const streetName = req.body.streetName;
//   const city = req.body.city;
//   const state = req.body.state;
//   const country = req.body.country;

//   req.body.address = { streetName, city, state, country };
//   req.body.propertyOwner = req.user.userId;
//   req.body.propertyId = nanoid(7);
//   req.body.rooms = {
//     bedrooms: req.body.bedrooms || 0,
//     bathrooms: req.body.bathrooms || 0,
//     kitchens: req.body.kitchens || 1,
//   };

//   // Handle amenities (ensure fallback defaults if missing)
//   req.body.amenities = {
//     furnished: req.body.amenities?.furnished || false,
//     parking: req.body.amenities?.parking || false,
//     petFriendly: req.body.amenities?.petFriendly || false,
//     wifi: req.body.amenities?.wifi || false,
//     waterSupply: req.body.amenities?.waterSupply ?? true, // default true
//     balcony: req.body.amenities?.balcony || false,
//     airConditioning: req.body.amenities?.airConditioning || false,
//   };

//   const realEstate = await RealEstate.create(req.body);

//   const realEstateImages = await cloudinaryMultipleUpload(req);
//   realEstate.realEstateImages = realEstateImages;
//   await realEstate.save();

//   res.status(201).json({ realEstate });
// };

const postRealEstate = async (req, res) => {
  const streetName = req.body.streetName;
  const city = req.body.city;
  const state = req.body.state;
  const country = req.body.country;

  req.body.address = { streetName, city, state, country };
  req.body.propertyOwner = req.user.userId;
  req.body.propertyId = nanoid(7);

  req.body.rooms = {
    bedrooms: req.body.bedrooms || 0,
    bathrooms: req.body.bathrooms || 0,
    kitchens: req.body.kitchens || 1,
  };

  // Helper function to convert array or string to boolean
  const convertToBoolean = (value) => {
    if (Array.isArray(value)) {
      // Take the last value if it's an array
      value = value[value.length - 1];
    }
    if (typeof value === "string") {
      return (
        value.toLowerCase() === "true" ||
        value.toLowerCase() === "on" ||
        value === "1"
      );
    }
    return Boolean(value);
  };

  // Handle amenities from request body
  req.body.amenities = {
    furnished: req.body.furnished
      ? convertToBoolean(req.body.furnished)
      : false,
    parking: req.body.parking ? convertToBoolean(req.body.parking) : false,
    petFriendly: req.body.petFriendly
      ? convertToBoolean(req.body.petFriendly)
      : false,
    wifi: req.body.wifi ? convertToBoolean(req.body.wifi) : false,
    waterSupply:
      req.body.waterSupply !== undefined
        ? convertToBoolean(req.body.waterSupply)
        : true,
    balcony: req.body.balcony ? convertToBoolean(req.body.balcony) : false,
    airConditioning: req.body.airConditioning
      ? convertToBoolean(req.body.airConditioning)
      : false,
  };

  const realEstate = await RealEstate.create(req.body);
  const realEstateImages = await cloudinaryMultipleUpload(req);
  realEstate.realEstateImages = realEstateImages;
  await realEstate.save();

  res.status(201).json({ realEstate });
};

/**
 * @description Get Owner's Real Estates
 * @returns {object} realEstate
 */
const getOwnerRealEstates = async (req, res) => {
  let realEstateResults = RealEstate.find({
    propertyOwner: req.user.userId,
  }).sort("-createdAt");

  const page = Number(req.query.page) || 1; //page number from query string
  const limit = 5; //limit of items per response
  const skip = (page - 1) * limit; //calculate the number of documents to skip

  realEstateResults = realEstateResults.skip(skip).limit(limit);
  const realEstates = await realEstateResults; //execute the query

  //get total documents in the RealEstate collection
  const totalRealEstates = await RealEstate.countDocuments({
    propertyOwner: req.user.userId,
  });

  //calculate total pages
  const numberOfPages = Math.ceil(totalRealEstates / limit);

  res.json({ realEstates, numberOfPages, totalRealEstates });
};

/**
 * @description Get single property
 * @returns {object} realEstate
 */
const getSingleProperty = async (req, res) => {
  const { slug } = req.params;
  const realEstate = await RealEstate.findOne({ slug });
  if (!realEstate) {
    throw new NotFoundError(`Property not found`);
  }
  res.json({ realEstate });
};

/**
 * @description Update Property Details
 * @returns {object} realEstate
 */
const updatePropertyDetails = async (req, res) => {
  const {
    price,
    streetName,
    city,
    state,
    country,
    description,
    area,
    floors,
    facing,
    category,
  } = req.body;

  if (
    !price ||
    !streetName ||
    !city ||
    !state ||
    !country ||
    !description ||
    !area ||
    !floors ||
    !facing ||
    !category
  ) {
    throw new BadRequestError("All fields are required");
  }

  const { slug } = req.params;
  const realEstate = await RealEstate.findOne({ slug });

  if (!realEstate) {
    throw new NotFoundError(`Property not found`);
  }

  if (realEstate.propertyOwner.toString() !== req.user.userId) {
    throw new ForbiddenRequestError(
      "You are not authorized to update this property"
    );
  }

  const updatedRealEstate = await RealEstate.findOneAndUpdate(
    { slug },
    {
      price,
      description,
      area,
      floors,
      facing,
      category,
      address: { streetName, city, state, country },
    },
    { new: true, runValidators: true }
  );

  res.json({ updatedRealEstate });
};

/**
 * @description Update Property Details
 * @returns message
 */
const deleteProperty = async (req, res) => {
  const { slug } = req.params;
  const realEstate = await RealEstate.findOne({ slug });

  if (!realEstate) {
    throw new NotFoundError(`Property not found`);
  }

  // check if user is authorized to delete property
  if (realEstate.propertyOwner.toString() !== req.user.userId) {
    throw new ForbiddenRequestError(
      "You are not authorized to delete this property"
    );
  }

  // check if property is okay to delete
  if (realEstate.status === false) {
    throw new BadRequestError(
      "Property cannot be deleted, it has active tenant"
    );
  }

  await RealEstate.findOneAndDelete({
    slug,
    propertyOwner: req.user.userId,
    status: true,
  });

  const realEstateImages = realEstate.realEstateImages;
  const publicIds = realEstateImages
    .map((imageURL) => {
      const parts = imageURL.split("real-estate-system");
      if (parts.length > 1) {
        return "real-estate-system" + parts[1].split(".")[0];
      }
      return null;
    })
    .filter(Boolean);

  for (const publicId of publicIds) {
    await cloudinaryDeleteImage(publicId);
  }

  res.json({ success: true, message: "Property deleted successfully" });
};

export {
  deleteProperty,
  getOwnerRealEstates,
  getSingleProperty,
  postRealEstate,
  updatePropertyDetails,
};
