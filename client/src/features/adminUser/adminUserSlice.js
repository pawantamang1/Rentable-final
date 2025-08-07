import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAdminPropertyDetail = createAsyncThunk(
  "admin/getAdminPropertyDetail",
  async ({ slug }, thunkAPI) => {
    try {
      const response = await customFetch.get(`/admin/property-detail/${slug}`);
      return response.data.property;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.msg);
    }
  }
);
