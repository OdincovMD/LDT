import { env } from "../imports/ENV"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { ENDPOINTS } from "../imports/ENDPOINTS"

export const loginUser = createAsyncThunk(
    'app/loginUser',
    async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${env.BACKEND_URL}${ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ошибка входа')
      }

      const data = await response.json()
      
      return { 
        user: data.user,
        rememberMe 
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
