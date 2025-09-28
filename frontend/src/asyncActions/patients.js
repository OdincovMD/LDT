import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

export const createPatient = createAsyncThunk(
  'patient/createPatient',
  async ({ owner_id, name, birth_date }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PATIENTS.DEFAULT}?owner_id=${owner_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            birth_date: birth_date
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка создания пациента' }))
        throw new Error(errorData.detail?.message || errorData.detail || 'Ошибка создания пациента')
      }

      const patient = await response.json()
      return patient
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const getPatients = createAsyncThunk(
  'patient/getPatients',
  async (ownerId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PATIENTS.BY_USER(ownerId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка загрузки пациентов' }))
        throw new Error(errorData.detail?.message || errorData.detail || 'Ошибка загрузки пациентов')
      }

      const patients = await response.json()
      return patients
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

