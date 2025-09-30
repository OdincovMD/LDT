/**
 * @file patients.js
 * @description Async Thunks для работы с пациентами. Создание новых пациентов и получение списка пациентов пользователя.
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import { env } from "../imports/ENV";
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS";
import { apiRequest } from "./apiClient";

// Создание пациента
export const createPatient = createAsyncThunk(
  "patients/createPatient",
  async ({ owner_id, name, birth_date }, { rejectWithValue }) => {
    try {
      return await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PATIENTS.DEFAULT}?owner_id=${owner_id}`,
        {
          method: "POST",
          body: JSON.stringify({ name, birth_date }),
        }
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Получение списка пациентов по пользователю
export const getPatients = createAsyncThunk(
  "patients/getPatients",
  async (ownerId, { rejectWithValue }) => {
    try {
      return await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PATIENTS.BY_USER(ownerId)}`
      );
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
