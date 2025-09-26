import { createSlice } from '@reduxjs/toolkit'
import { createCase, getCases } from '../asyncActions/cases'

const initialState = {
  cases: [],
  loading: false,
  error: null
}

const caseSlice = createSlice({
  name: 'case',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
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
        state.cases = action.payload
        state.error = null
      })
      .addCase(getCases.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.cases = []
      })
      // Create case
      .addCase(createCase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCase.fulfilled, (state, action) => {
        state.loading = false
        state.cases = action.payload
        state.error = null
      })
      .addCase(createCase.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError } = caseSlice.actions
export const caseReducer = caseSlice.reducer