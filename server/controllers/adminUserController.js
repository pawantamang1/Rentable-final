import RealEstate from "../models/RealEstate.js";
import TenantUser from "../models/TenantUser.js";
import { NotFoundError } from "../request-errors/index.js";
import { cloudinaryDeleteImage } from "../utils/cloudinaryUpload.js";

/**
 * @description Get all saved properties across all tenant users
 * @returns {Array} savedProperties
 */
const getAllSavedPropertiesAdmin = async (req, res) => {
  try {
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

    res
      .status(200)
      .json({ count: allSavedProperties.length, allSavedProperties });
  } catch (error) {
    console.error("Error in getAllSavedPropertiesAdmin:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @description Get single property for admin view (with owner details populated)
 * @param {string} req.params.slug - Property slug
 * @returns {object} realEstate
 */
const getPropertyDetailAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const realEstate = await RealEstate.findOne({ slug }).populate({
      path: "propertyOwner",
      model: "OwnerUser",
      select: "firstName lastName email profileImage",
    });

    if (!realEstate) {
      throw new NotFoundError(`Property with slug '${slug}' not found`);
    }

    res.json({ realEstate });
  } catch (error) {
    console.error("Error in getPropertyDetailAdmin:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @description Admin deletes a real estate property (fraudulent / invalid)
 * @param {string} req.params.slug
 * @returns {string} message
 */
const adminDeleteProperty = async (req, res) => {
  try {
    const { slug } = req.params;
    const realEstate = await RealEstate.findOne({ slug });

    if (!realEstate) {
      throw new NotFoundError(`Property with slug '${slug}' not found`);
    }

    // Remove property from all tenant users' saved properties
    await TenantUser.updateMany(
      { savedProperties: realEstate._id },
      { $pull: { savedProperties: realEstate._id } }
    );

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

    res.json({
      success: true,
      message: "Property deleted by admin successfully",
    });
  } catch (error) {
    console.error("Error in adminDeleteProperty:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @description Get all properties for admin dashboard (not just saved ones)
 * @returns {Array} properties
 */
const getAllPropertiesAdmin = async (req, res) => {
  try {
    const properties = await RealEstate.find({})
      .populate({
        path: "propertyOwner",
        model: "OwnerUser",
        select: "firstName lastName email",
      })
      .select("-__v")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: properties.length, properties });
  } catch (error) {
    console.error("Error in getAllPropertiesAdmin:", error);
    res.status(500).json({ error: error.message });
  }
};

export {
  adminDeleteProperty,
  getAllPropertiesAdmin,
  getAllSavedPropertiesAdmin,
  getPropertyDetailAdmin,
};
