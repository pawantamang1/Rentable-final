import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import countryToCurrency from "country-to-currency";
import { AlertToast, ConfirmModal, PageLoading } from "../../components";
import { countries } from "../../utils/countryList";
import { createNumberFormatter, dateFormatter } from "../../utils/valueFormatter";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: "", msg: "" });
  const [viewType, setViewType] = useState("saved"); // "saved" or "all"

  const fetchSavedProperties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/v1/admin/saved-properties");
      setProperties(response.data.allSavedProperties);
    } catch (error) {
      console.error("Error fetching saved properties:", error);
      setAlert({
        open: true,
        type: "error",
        msg: "Failed to fetch saved properties",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProperties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/v1/admin/properties");
      setProperties(response.data.properties);
    } catch (error) {
      console.error("Error fetching all properties:", error);
      setAlert({
        open: true,
        type: "error",
        msg: "Failed to fetch properties",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewType === "saved") {
      fetchSavedProperties();
    } else {
      fetchAllProperties();
    }
  }, [viewType]);

  const handleDeleteConfirm = async () => {
    if (!deleteSlug) return;
    setIsProcessing(true);
    try {
      await axios.delete(`/api/v1/admin/delete-property/${deleteSlug}`);
      setProperties((prev) =>
        prev.filter((property) => property.slug !== deleteSlug)
      );
      setAlert({
        open: true,
        type: "success",
        msg: "Property deleted successfully",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      setAlert({
        open: true,
        type: "error",
        msg: "Delete failed. Please try again.",
      });
    } finally {
      setDeleteSlug(null);
      setIsProcessing(false);
    }
  };

  const handleAlertClose = () => {
    setAlert({ open: false, msg: "", type: "" });
  };

  const handlePropertyClick = (slug) => {
    navigate(`/admin/property/${slug}`);
  };

  const getFormattedPrice = (property) => {
    const currentCountry = countries.find(
      (country) => country.label === property?.address?.country
    );
    if (!currentCountry) return property?.price;
    
    const format = createNumberFormatter(currentCountry?.code);
    return `${countryToCurrency[currentCountry.code]} ${format(property?.price)}`;
  };

  if (isLoading) return <PageLoading />;

  return (
    <main className="mx-4 mt-10 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Admin Dashboard</h2>
        
        {/* Toggle between saved and all properties */}
        <div className="flex gap-2">
          <Button
            variant={viewType === "saved" ? "contained" : "outlined"}
            onClick={() => setViewType("saved")}
            size="small"
          >
            Saved Properties ({viewType === "saved" ? properties.length : "..."})
          </Button>
          <Button
            variant={viewType === "all" ? "contained" : "outlined"}
            onClick={() => setViewType("all")}
            size="small"
          >
            All Properties ({viewType === "all" ? properties.length : "..."})
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {viewType === "saved" ? "No saved properties found." : "No properties found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <Card
              key={property._id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Property Image */}
              <CardMedia
                component="img"
                sx={{ height: 200, objectFit: "cover" }}
                image={
                  property.realEstateImages?.[0] || 
                  "/placeholder-property-image.jpg"
                }
                alt={property.title}
                onClick={() => handlePropertyClick(property.slug)}
              />

              <CardContent
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                onClick={() => handlePropertyClick(property.slug)}
              >
                {/* Title and Category */}
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                  {property.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">{property.category}</span>
                  <Chip 
                    label={property.status ? "Available" : "Rented"} 
                    color={property.status ? "success" : "error"}
                    size="small"
                  />
                </div>

                {/* Price */}
                <p className="font-semibold text-lg text-primary mb-2">
                  {getFormattedPrice(property)} / month
                </p>

                {/* Location */}
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <LocationOnOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  {property?.address?.city}, {property?.address?.country}
                </p>

                {/* Owner Info */}
                <div className="mb-2 flex-grow">
                  <p className="text-xs text-gray-500">
                    Owner: {property.propertyOwner?.firstName}{" "}
                    {property.propertyOwner?.lastName}
                  </p>
                  
                  {/* Show savedBy info only for saved properties view */}
                  {viewType === "saved" && property.savedBy && (
                    <p className="text-xs text-gray-500">
                      Saved By: {property.savedBy.name} ({property.savedBy.email})
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-1">
                    Posted: {dateFormatter(property?.createdAt)}
                  </p>
                </div>
              </CardContent>

              {/* Action Buttons */}
              <div className="flex justify-between items-center p-3 pt-0">
                <Tooltip title="View Details">
                  <IconButton
                    onClick={() => handlePropertyClick(property.slug)}
                    color="primary"
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Property">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteSlug(property.slug);
                    }}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteSlug)}
        handleModalClose={() => setDeleteSlug(null)}
      >
        <h3 className="text-center">Delete This Property?</h3>
        <p className="text-center my-4 text-sm">
          Are you sure you want to delete this property? This action is
          irreversible and will remove the property from the system permanently.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => setDeleteSlug(null)}
            color="secondary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </div>
      </ConfirmModal>

      <AlertToast
        alertFlag={alert.open}
        alertType={alert.type}
        alertMsg={alert.msg}
        handleClose={handleAlertClose}
      />
    </main>
  );
};

export default AdminDashboard;