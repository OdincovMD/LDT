import { createSlice } from '@reduxjs/toolkit'
import { createPatient, getPatients  } from '../asyncActions/patients'

const initialState = {
  patients: [],
  loading: false,
  error: null,
  currentPatient: null
}

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Get patients
      .addCase(getPatients.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPatients.fulfilled, (state, action) => {
        state.loading = false
        state.patients = action.payload
        state.error = null
      })
      .addCase(getPatients.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.patients = []
      })
      // Create patient
      .addCase(createPatient.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false
        state.patients.push(action.payload)
        state.error = null
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, setCurrentPatient } = patientSlice.actions
export const patientReducer = patientSlice.reducer