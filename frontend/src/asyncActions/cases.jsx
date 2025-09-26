import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

export const createCase = createAsyncThunk(
  'patient/createCase',
  async ({ patientId, description }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.CASES.DEFAULT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            patient_id: patientId,
            description: description
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка создания исследования' }))
        throw new Error(errorData.detail?.message || errorData.detail || 'Ошибка создания исследования')
      }

      const caseData = await response.json()
      return caseData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const getCases = createAsyncThunk(
  'patient/getCases',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.CASES.BY_PATIENT(patientId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка загрузки исследований' }))
        throw new Error(errorData.detail?.message || errorData.detail || 'Ошибка загрузки исследований')
      }

      const cases = await response.json()
      return cases
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)