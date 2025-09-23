import { env } from "../imports/ENV"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { ENDPOINTS } from "../imports/ENDPOINTS"

export const registerUser = createAsyncThunk(
  'app/registerUser',
  async ({ name, email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ошибка регистрации')
      }

      const data = await response.json()
      
      return { 
        user: data.user,
        token: data.token,
        rememberMe 
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)