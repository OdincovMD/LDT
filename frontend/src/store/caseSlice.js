// caseSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { createCase, getCases } from '../asyncActions/cases'

const initialState = {
  case_array: [],
  loading: false,
  error: null
}

const caseSlice = createSlice({
  name: 'case',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },

    addCase: (state, action) => {
      state.case_array.push(action.payload)
    },

    clearCases: (state) => {
      state.case_array = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Get cases
      .addCase(getCases.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCases.fulfilled, (state, action) => {
        state.loading = false
        state.case_array = action.payload 
        state.error = null
      })
      .addCase(getCases.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.case_array = []
      })
      // Create case
      .addCase(createCase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCase.fulfilled, (state, action) => {
        state.loading = false
        state.case_array.push(action.payload)
        state.error = null
      })
      .addCase(createCase.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearCases, clearError, addCase } = caseSlice.actions
export const caseReducer = caseSlice.reducer