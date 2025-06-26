import AcUnitIcon from "@mui/icons-material/AcUnit";
import ArticleIcon from "@mui/icons-material/Article";
import BalconyIcon from "@mui/icons-material/Balcony";
import BathtubRoundedIcon from "@mui/icons-material/BathtubRounded";
import BedRoundedIcon from "@mui/icons-material/BedRounded";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import ChairIcon from "@mui/icons-material/Chair";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import GavelIcon from "@mui/icons-material/Gavel";
import HorizontalSplitRoundedIcon from "@mui/icons-material/HorizontalSplitRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WifiIcon from "@mui/icons-material/Wifi";
import { Button, CircularProgress } from "@mui/material";
import countryToCurrency from "country-to-currency";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertToast,
  ConfirmModal,
  Footer,
  ImageCarousal,
  PageLoading,
} from "../../components";
import {
  clearAlert,
  deleteProperty,
  getRealEstateDetail,
} from "../../features/realEstateOwner/realEstateOwnerSlice";
import { countries } from "../../utils/countryList";
import {
  createNumberFormatter,
  dateFormatter,
} from "../../utils/valueFormatter";

const PersonalRealEstateDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getRealEstateDetail({ slug }));
  }, [slug, dispatch]);

  const {
    realEstate,
    isLoading,
    isProcessing,
    alertFlag,
    alertMsg,
    alertType,
    postSuccess,
  } = useSelector((store) => store.realEstateOwner);

  const currentCountry = countries.find(
    (country) => country.label === realEstate?.address?.country
  );
  const format = createNumberFormatter(currentCountry?.code);

  // Redirect to detail page of the property after successful contract creation
  useEffect(() => {
    if (postSuccess) {
      const timer = setTimeout(() => {
        navigate(`/owner`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [postSuccess, navigate, slug]);

  //close the alert toast
  const handleAlertClose = useCallback(
    (event, reason) => {
      if (reason === "clickaway") {
        return;
      }
      dispatch(clearAlert());
    },
    [dispatch]
  );

  //handel modal open and close state
  const [open, setOpen] = useState(false);
  const handleModalOpen = useCallback(() => setOpen(true), []);
  const handleModalClose = useCallback(() => setOpen(false), []);

  const handleDeleteProperty = useCallback(() => {
    dispatch(deleteProperty({ slug }));
    handleModalClose();
  }, [dispatch, slug, handleModalClose]);

  if (isLoading) return <PageLoading />;

  if (!realEstate)
    return <h1 className="mt-6 text-center">No real estate found</h1>;

  const getRoomDetails = (rooms) => {
    if (!rooms) return [];

    const roomDetails = [];

    // Add bedrooms if exists
    if (rooms.bedrooms !== undefined && rooms.bedrooms !== null) {
      roomDetails.push({
        key: "bedrooms",
        label: `Bedroom${rooms.bedrooms !== 1 ? "s" : ""}`,
        value: rooms.bedrooms,
        icon: <BedRoundedIcon sx={{ color: "#4A90E2" }} />,
      });
    }

    // Add bathrooms if exists
    if (rooms.bathrooms !== undefined && rooms.bathrooms !== null) {
      roomDetails.push({
        key: "bathrooms",
        label: `Bathroom${rooms.bathrooms !== 1 ? "s" : ""}`,
        value: rooms.bathrooms,
        icon: <BathtubRoundedIcon sx={{ color: "#2196F3" }} />,
      });
    }

    // Add kitchens if exists
    if (rooms.kitchens !== undefined && rooms.kitchens !== null) {
      roomDetails.push({
        key: "kitchens",
        label: `Kitchen${rooms.kitchens !== 1 ? "s" : ""}`,
        value: rooms.kitchens,
        icon: <KitchenRoundedIcon sx={{ color: "#FF9800" }} />,
      });
    }

    return roomDetails;
  };

  const getPositiveAmenities = (amenities) => {
    if (!amenities) return [];

    const amenityLabels = {
      furnished: "Furnished",
      parking: "Parking Available",
      petFriendly: "Pet Friendly",
      wifi: "WiFi Available",
      waterSupply: "Water Supply",
      balcony: "Balcony",
      airConditioning: "Air Conditioning",
    };

    const positiveAmenities = [];

    // Handle boolean amenities
    [
      "furnished",
      "parking",
      "petFriendly",
      "wifi",
      "waterSupply",
      "balcony",
      "airConditioning",
    ].forEach((key) => {
      if (amenities[key] === true) {
        positiveAmenities.push({
          key,
          label: amenityLabels[key],
          value: true,
          type: "boolean",
        });
      }
    });

    return positiveAmenities;
  };

  const getAmenityIcon = (key) => {
    const iconProps = { sx: { color: "#29b46e" } };

    switch (key) {
      case "furnished":
        return <ChairIcon {...iconProps} />;
      case "parking":
        return <DirectionsCarIcon {...iconProps} />;
      case "petFriendly":
        return <PetsIcon {...iconProps} />;
      case "wifi":
        return <WifiIcon {...iconProps} />;
      case "waterSupply":
        return <WaterDropIcon {...iconProps} />;
      case "balcony":
        return <BalconyIcon {...iconProps} />;
      case "airConditioning":
        return <AcUnitIcon {...iconProps} />;
      default:
        return <CheckCircleIcon {...iconProps} />;
    }
  };

  return (
    <>
      <main className="mb-12 mt-10 mx-4 md:mx-12">
        <div className="flex flex-col gap-4 mx-auto">
          <h3 className="font-heading font-bold">Rental Property Detail</h3>
          <section className="flex flex-col gap-12 rounded-md md:flex-row">
            <div className="w-full md:w-2/3">
              <ImageCarousal realEstateImages={realEstate?.realEstateImages} />
            </div>
            <div className="flex flex-col rounded-md gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">{realEstate?.title}</h3>
                <div>
                  <p className="font-roboto text-gray-500">
                    {realEstate?.category}
                  </p>
                </div>
                <p className="-ml-1 text-base tracking-tight">
                  <LocationOnOutlinedIcon sx={{ color: "#019149" }} />
                  {realEstate?.address?.streetName}, {realEstate?.address?.city}
                  , {realEstate?.address?.state}, {realEstate?.address?.country}
                </p>
                <div className="">
                  <p className="font-robotoNormal text-xs font-semibold tracking-tight">
                    Posted on: {dateFormatter(realEstate?.createdAt)}
                  </p>
                  <p className="font-robotoNormal text-xs tracking-tight">
                    Id: {realEstate?.propertyId}
                  </p>
                </div>
              </div>
              <div className="">
                <div className="rounded-md">
                  <p className="font-roboto text-primaryDark leading-4 ">
                    RENT per month
                  </p>
                  <span className="font-semibold text-lg text-primaryDark">
                    {countryToCurrency[currentCountry.code]}{" "}
                    {format(realEstate?.price)}
                  </span>
                </div>
              </div>
              {/* Render the edit and create contract if the real estate property is available for rental */}
              {realEstate?.status === true ? (
                <div className="flex flex-wrap gap-4 mt-2 text-center">
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ color: "#fff" }}
                    size="small"
                    onClick={() => {
                      navigate(`/owner/real-estate/update/${slug}`);
                    }}
                    startIcon={<BorderColorIcon />}
                  >
                    Edit
                  </Button>
                  <Link
                    to={`/owner/contract/create`}
                    state={{
                      realEstateId: realEstate?._id,
                      title: realEstate?.title,
                      price: realEstate?.price,
                      slug: slug,
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{ color: "#fff" }}
                      size="small"
                      startIcon={<GavelIcon />}
                    >
                      Create Contract
                    </Button>
                  </Link>
                  <Button
                    disabled={
                      isProcessing || (alertFlag && alertType === "success")
                    }
                    variant="contained"
                    color="error"
                    sx={{ color: "#fff" }}
                    size="small"
                    onClick={handleModalOpen}
                    startIcon={<DeleteForeverRoundedIcon />}
                  >
                    {isProcessing ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: "#fff",
                        }}
                      />
                    ) : (
                      "Delete Property"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="">
                  <Link to={`/owner/contract/${realEstate?._id}/${slug}`}>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      sx={{ color: "#fff" }}
                      startIcon={<ArticleIcon />}
                    >
                      View Contract
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
          <div className="">
            <h3 className="font-semibold p-3">Description</h3>
            <hr className="w-3/4 ml-3 border-t-2 rounded-md" />
            <p className="text-lg p-3 tracking-normal">
              {realEstate?.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 p-3 mb-4">
            {/* Bedrooms */}
            <div className="flex gap-2 items-center">
              <span>
                <BedRoundedIcon sx={{ color: "#4A90E2" }} />
              </span>
              <span className="font-semibold">
                {realEstate?.rooms?.bedrooms}
              </span>
              <span className="text-gray-600">
                Bedroom{realEstate?.rooms?.bedrooms !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Bathrooms */}
            <div className="flex gap-2 items-center">
              <span>
                <BathtubRoundedIcon sx={{ color: "#2196F3" }} />
              </span>
              <span className="font-semibold">
                {realEstate?.rooms?.bathrooms}
              </span>
              <span className="text-gray-600">
                Bathroom{realEstate?.rooms?.bathrooms !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Kitchens */}
            <div className="flex gap-2 items-center">
              <span>
                <KitchenRoundedIcon sx={{ color: "#FF9800" }} />
              </span>
              <span className="font-semibold">
                {realEstate?.rooms?.kitchens}
              </span>
              <span className="text-gray-600">
                Kitchen{realEstate?.rooms?.kitchens !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="">
            <h3 className="font-semibold p-3">Overview</h3>
            <hr className="w-3/4 ml-3 border-t-2 rounded-md" />
            <div className="flex flex-wrap">
              {/* Basic Property Info */}
              <div className="flex p-3 mt-2 gap-2 items-center">
                <span>
                  <SquareFootRoundedIcon sx={{ color: "#738FA7" }} />
                </span>
                <span className="font-semibold"> Area of Property </span>
                <p className="">{format(realEstate?.area)} sq. feet</p>
              </div>
              <div className="flex p-3 mt-2 gap-2 items-center">
                <span>
                  <HorizontalSplitRoundedIcon />
                </span>
                <span className="font-semibold">
                  Number of {realEstate?.floors > 1 ? "floors" : "floor"}
                </span>
                <p className="">{format(realEstate?.floors)} </p>
              </div>
              <div className="flex p-3 mt-2 gap-2 items-center">
                <span>
                  <ExploreRoundedIcon sx={{ color: "#29b46e" }} />
                </span>
                <span className="font-semibold"> Property Facing </span>
                <p className="">{realEstate?.facing}</p>
              </div>

              {/* Amenities Section */}
              {getPositiveAmenities(realEstate?.amenities).map((amenity) => (
                <div
                  key={amenity.key}
                  className="flex p-3 mt-2 gap-2 items-center"
                >
                  <span>{getAmenityIcon(amenity.key)}</span>
                  <span className="font-semibold">{amenity.label}</span>
                  {amenity.type === "numeric" ? (
                    <p className="">{format(amenity.value)}</p>
                  ) : (
                    <p className="text-green-600 font-medium">✓ Available</p>
                  )}
                </div>
              ))}

              {/* Show message if no amenities are available */}
              {getPositiveAmenities(realEstate?.amenities).length === 0 && (
                <div className="flex p-3 mt-2 gap-2 items-center text-gray-500">
                  <span className="font-semibold">
                    No additional amenities specified
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <ConfirmModal open={open} handleModalClose={handleModalClose}>
            <h3 className="text-center">Confirm Delete?</h3>
            <p className="text-center my-4">
              Are you sure you want to delete this property? This action cannot
              be undone.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <Button onClick={handleModalClose} color="error">
                Close
              </Button>

              <Button
                onClick={handleDeleteProperty}
                color="success"
                variant="contained"
              >
                Confirm
              </Button>
            </div>
          </ConfirmModal>
        </div>
        <AlertToast
          alertFlag={alertFlag}
          alertMsg={alertMsg}
          alertType={alertType}
          handleClose={handleAlertClose}
        />
      </main>
      <Footer />
    </>
  );
};

export default PersonalRealEstateDetail;
