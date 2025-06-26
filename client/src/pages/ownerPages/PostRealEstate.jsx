import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertToast,
  CountrySelectField,
  FormSelectField,
  FormTextField,
} from "../../components";
import {
  clearAlert,
  postRealEstate,
} from "../../features/realEstateOwner/realEstateOwnerSlice";

import postRealEstateImg3 from "../../assets/images/postRealEstateImg3.svg";

import BungalowIcon from "@mui/icons-material/Bungalow";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  TextField,
} from "@mui/material";
import countryToCurrency from "country-to-currency";

const PostRealEstate = () => {
  const { alertFlag, alertMsg, alertType, isLoading, postSuccess, realEstate } =
    useSelector((store) => store.realEstateOwner);

  const initialFormValues = {
    title: "",
    price: "",
    description: "",
    streetName: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    category: "",
    area: "",
    floors: "",
    facing: "",
    furnished: false,
    parking: false,
    petFriendly: false,
    wifi: false,
    waterSupply: true,
    balcony: false,
    airConditioning: false,
  };

  const [values, setFormValues] = useState(initialFormValues);

  const [images, setImages] = useState(null);

  const handleImagesChange = (e) => {
    const arr = Array.from(e.target.files);
    setImages(arr.map((file) => URL.createObjectURL(file)));
  };

  const previewImage = () => {
    if (images) {
      return images.map((image, index) => {
        return (
          <div className="p-2" key={index}>
            <img src={image} alt="profilePreview" className="h-24 md:h-28" />
          </div>
        );
      });
    }
  };

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormValues({
        ...values,
        [name]: type === "checkbox" ? checked : value,
      });
    },
    [values]
  );

  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = document.getElementById("form");
    const formData = new FormData(form);

    formData.append("furnished", values.furnished);
    formData.append("parking", values.parking);
    formData.append("petFriendly", values.petFriendly);
    formData.append("wifi", values.wifi);
    formData.append("waterSupply", values.waterSupply);
    formData.append("balcony", values.balcony);
    formData.append("airConditioning", values.airConditioning);

    dispatch(postRealEstate({ formData }));
  };

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === "clickaway") {
        return;
      }
      dispatch(clearAlert());
    },
    [dispatch]
  );

  const navigate = useNavigate();

  // Redirect to detail page of the property after successful posting
  useEffect(() => {
    if (postSuccess) {
      const timer = setTimeout(() => {
        navigate(`/owner/real-estate/${realEstate?.slug}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [postSuccess, navigate, realEstate]);

  return (
    <div>
      <main className="px-6 h-full mt-10">
        <div className="flex lg:justify-between justify-center flex-wrap h-full g-6">
          <div className="lg:w-7/12 md:w-8/12 mb-12">
            <form onSubmit={handleSubmit} id="form">
              <div className="flex flex-col justify-center items-center mt-3 mb-4">
                <h3 className="font-heading font-bold">Post your Property </h3>
                <p className="text-gray-400 text-sm">
                  Enter the details of your property
                </p>
              </div>
              <div className="flex flex-wrap flex-col gap-2 ml-5">
                <div className="flex flex-col gap-4 my-2">
                  <h5 className="mb-1">
                    <InfoIcon /> Initial Details
                  </h5>
                  <FormTextField
                    label="Title"
                    name="title"
                    type={"text"}
                    value={values.title}
                    handleChange={handleChange}
                    autoFocus={true}
                  />
                  <TextField
                    label="Description"
                    required
                    multiline
                    rows={4}
                    color="tertiary"
                    placeholder="Description of your property"
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col gap-4 my-2">
                  <h5 className="mb-1">
                    <LocationOnIcon /> Address
                  </h5>
                  <FormTextField
                    label="Street Name / Landmark"
                    name="streetName"
                    type={"text"}
                    value={values.streetName}
                    handleChange={handleChange}
                  />
                  <FormTextField
                    label="City"
                    name="city"
                    type={"text"}
                    value={values.city}
                    handleChange={handleChange}
                  />
                  <FormTextField
                    label="State"
                    name="state"
                    type={"text"}
                    value={values.state}
                    handleChange={handleChange}
                  />

                  <CountrySelectField
                    value={values.country}
                    setFormValues={setFormValues}
                    handleChange={handleChange}
                  />
                </div>

                <div className="flex flex-col gap-4 my-2">
                  <h5 className="mb-1">
                    <BungalowIcon /> Property Info
                  </h5>
                  <TextField
                    label="Price"
                    name="price"
                    type="number"
                    placeholder="Rent per month"
                    required
                    value={values.price}
                    color="tertiary"
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {countryToCurrency[values.countryCode]}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormSelectField
                    label="Category"
                    name="category"
                    options={["House", "Apartment", "Room", "Villa", "Studio"]}
                    value={values.category}
                    handleChange={handleChange}
                  />

                  <TextField
                    label="Area"
                    name="area"
                    type="number"
                    placeholder="Area of the property"
                    required
                    value={values.area}
                    color="tertiary"
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">sq. feet</InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Floors"
                    name="floors"
                    type="number"
                    placeholder="Number of floors"
                    required
                    value={values.floors}
                    color="tertiary"
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">floors</InputAdornment>
                      ),
                    }}
                  />
                  <FormSelectField
                    label="Property Facing"
                    name="facing"
                    options={[
                      "North",
                      "South",
                      "East",
                      "West",
                      "North-East",
                      "North-West",
                      "South-East",
                      "South-West",
                    ]}
                    value={values.facing}
                    handleChange={handleChange}
                  />
                </div>
                {/* Room Details */}
                <div className="mt-4">
                  <h6 className="mb-3 text-base font-semibold text-gray-800">
                    Room Details
                  </h6>
                  <div className="flex flex-col gap-4">
                    <TextField
                      label="🛏️ Bedrooms"
                      name="bedrooms"
                      type="number"
                      placeholder="Number of bedrooms"
                      required
                      value={values.bedrooms}
                      color="tertiary"
                      onChange={handleChange}
                      inputProps={{ min: 0, max: 10 }}
                      fullWidth
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontSize: "1rem",
                          fontWeight: 500,
                        },
                      }}
                    />
                    <TextField
                      label="🚿 Bathrooms"
                      name="bathrooms"
                      type="number"
                      placeholder="Number of bathrooms"
                      required
                      value={values.bathrooms}
                      color="tertiary"
                      onChange={handleChange}
                      inputProps={{ min: 1, max: 10 }}
                      fullWidth
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontSize: "1rem",
                          fontWeight: 500,
                        },
                      }}
                    />
                    <TextField
                      label="🍳 Kitchens"
                      name="kitchens"
                      type="number"
                      placeholder="Number of kitchens"
                      required
                      value={values.kitchens}
                      color="tertiary"
                      onChange={handleChange}
                      inputProps={{ min: 1, max: 3 }}
                      fullWidth
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontSize: "1rem",
                          fontWeight: 500,
                        },
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <strong>Property Type:</strong> {values.bedrooms}BHK (
                    {values.bedrooms} Bedroom{values.bedrooms !== 1 ? "s" : ""},{" "}
                    {values.bathrooms} Bathroom
                    {values.bathrooms !== 1 ? "s" : ""}, {values.kitchens}{" "}
                    Kitchen{values.kitchens !== 1 ? "s" : ""})
                  </p>
                </div>

                {/* New Amenities Section */}
                <div className="flex flex-col gap-4 my-2">
                  <h5 className="mb-1">
                    <HomeIcon /> Amenities
                  </h5>

                  {/* Boolean amenities as checkboxes */}
                  <div className="mt-4">
                    <h6 className="mb-2 text-sm font-medium text-gray-700"></h6>
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.furnished}
                              onChange={handleChange}
                              name="furnished"
                              color="primary"
                            />
                          }
                          label="Furnished"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.parking}
                              onChange={handleChange}
                              name="parking"
                              color="primary"
                            />
                          }
                          label="Parking"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.petFriendly}
                              onChange={handleChange}
                              name="petFriendly"
                              color="primary"
                            />
                          }
                          label="Pet Friendly"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.wifi}
                              onChange={handleChange}
                              name="wifi"
                              color="primary"
                            />
                          }
                          label="WiFi"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.waterSupply}
                              onChange={handleChange}
                              name="waterSupply"
                              color="primary"
                            />
                          }
                          label="Water Supply"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.balcony}
                              onChange={handleChange}
                              name="balcony"
                              color="primary"
                            />
                          }
                          label="Balcony"
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.airConditioning}
                              onChange={handleChange}
                              name="airConditioning"
                              color="primary"
                            />
                          }
                          label="Air Conditioning"
                        />
                      </Grid>
                    </Grid>
                  </div>
                </div>

                <div className="flex flex-col my-2">
                  <h5>
                    <PermMediaIcon /> Media
                  </h5>
                  <div className="flex flex-col justify-center pb-2">
                    <label
                      htmlFor="formFileMultiple"
                      className="form-label inline-block mb-2 text-gray-500 cursor-pointer font-robotoNormal"
                    >
                      Upload Images of the Real Estate
                    </label>

                    <input
                      required
                      name="realEstateImages"
                      className="form-control block font-robotoNormal w-full px-3 py-1.5 text-base font-normal border border-solid border-gray-300 rounded cursor-pointer focus:border-tertiary focus:outline-none"
                      type="file"
                      id="formFileMultiple"
                      multiple
                      onChange={handleImagesChange}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      JPG, JPEG, PNG or GIF (MAX 3.5mb per)
                    </p>
                  </div>
                  <div className="flex flex-wrap self-center border mt-2">
                    {previewImage()}
                  </div>
                </div>
              </div>

              <div className="text-center mt-2">
                <Button
                  disabled={isLoading || (alertFlag && alertType === "success")}
                  type="submit"
                  variant="contained"
                  size="large"
                  color="primary"
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                      opacity: [0.9, 0.8, 0.7],
                    },
                    width: "25%",
                  }}
                >
                  {isLoading ? (
                    <CircularProgress
                      size={26}
                      sx={{
                        color: "#fff",
                      }}
                    />
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right side with only one image */}
          <div className="hidden grow-0 shrink-1 md:shrink-0 basis-auto w-4/12 mb-12 lg:block">
            <img
              src={postRealEstateImg3}
              className="w-full"
              alt="Cartoon of a person holding a card"
            />
          </div>
        </div>
      </main>

      <AlertToast
        alertFlag={alertFlag}
        alertMsg={alertMsg}
        alertType={alertType}
        handleClose={handleClose}
      />
    </div>
  );
};

export default PostRealEstate;
