import { createAsyncThunk } from "@reduxjs/toolkit";
import { env } from "../imports/ENV";
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS";
import { apiRequest } from "./apiClient";

// Создание нового кейса
export const createCase = createAsyncThunk(
  "cases/createCase",
  async ({ patientId, description }, { rejectWithValue }) => {
    try {
      return await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.CASES.DEFAULT}`,
        {
          method: "POST",
          body: JSON.stringify({ patient_id: patientId, description }),
        }
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Получение списка кейсов по patientId
export const getCases = createAsyncThunk(
  "cases/getCases",
  async (patientId, { rejectWithValue }) => {
    try {
      return await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.CASES.BY_PATIENT(patientId)}`
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
