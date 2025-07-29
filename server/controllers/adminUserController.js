import RealEstate from "../models/RealEstate.js";
import TenantUser from "../models/TenantUser.js";
import {
  NotFoundError,
  ForbiddenRequestError,
  BadRequestError,
} from "../request-errors/index.js";
import { cloudinaryDeleteImage } from "../utils/cloudinaryUpload.js";

/**
 * @description Get all saved properties across all tenant users
 * @returns {Array} savedProperties
 */
const getAllSavedPropertiesAdmin = async (req, res) => {
  const tenants = await TenantUser.find({})
    .populate({
      path: "savedProperties",
      select: "-__v -createdAt -updatedAt",
      populate: {
        path: "propertyOwner",
        model: "OwnerUser",
        select: "firstName lastName email",
      },
    })
    .select("firstName lastName email savedProperties");

  const allSavedProperties = tenants.flatMap((tenant) =>
    tenant.savedProperties.map((property) => ({
      ...property.toObject(),
      savedBy: {
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
      },
    }))
  );

  res.status(200).json({ count: allSavedProperties.length, allSavedProperties });
};

/**
 * @description Admin deletes a real estate property (fraudulent / invalid)
 * @param {string} req.params.slug
 * @returns {string} message
 */
const adminDeleteProperty = async (req, res) => {
  const { slug } = req.params;

  const realEstate = await RealEstate.findOne({ slug });

  if (!realEstate) {
    throw new NotFoundError(`Property with slug '${slug}' not found`);
  }

  // Delete the real estate document
  await RealEstate.findOneAndDelete({ slug });

  // Delete from Cloudinary
  const realEstateImages = realEstate.realEstateImages || [];
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

  res.json({ success: true, message: "Property deleted by admin successfully" });
};

export { getAllSavedPropertiesAdmin, adminDeleteProperty };