import DeleteIcon from "@mui/icons-material/Delete";
import { Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { AlertToast, ConfirmModal, PageLoading } from "../../components";

const Homepage = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: "", msg: "" });

  const fetchProperties = async () => {
    try {
      const response = await axios.get("/api/admin/saved-properties");
      setProperties(response.data.allSavedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
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
    fetchProperties();
  }, []);

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

  if (isLoading) return <PageLoading />;

  return (
    <main className="mx-4 mt-10 mb-12">
      <h2 className="font-heading text-2xl font-bold mb-6">Admin Dashboard</h2>

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property._id}
              className="rounded-lg border shadow-md p-4 flex flex-col justify-between"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">{property.title}</h3>
                <p className="text-sm text-gray-600">
                  Owner: {property.propertyOwner?.firstName}{" "}
                  {property.propertyOwner?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  Saved By: {property.savedBy.name} ({property.savedBy.email})
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Location: {property?.address?.city},{" "}
                  {property?.address?.country}
                </p>
              </div>
              <div className="flex justify-end">
                <Tooltip title="Delete Property">
                  <IconButton
                    onClick={() => setDeleteSlug(property.slug)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
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
          irreversible.
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

export default Homepage;
