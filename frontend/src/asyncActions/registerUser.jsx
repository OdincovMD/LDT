import { env } from "../imports/ENV"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

export const registerUser = createAsyncThunk(
    'app/registerUser',
    async ({ name, email, password, rememberMe }, { rejectWithValue }) => {

    try {
      const response = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          name: name,
          password: password 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Неизвестная ошибка' }))
        const errorMessage = errorData.detail.message
        throw new Error(errorMessage || `HTTP ошибка: ${response.status}`)
      }

      const data = await response.json()
      
      return { 
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          created_at: data.created_at,
        },
        rememberMe: rememberMe 
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)