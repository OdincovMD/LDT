import { env } from "../imports/ENV"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { ENDPOINTS } from "../imports/ENDPOINTS"

export const registerUser = createAsyncThunk(
    'app/registerUser',
    async ({ name, email, password, rememberMe }, { rejectWithValue }) => {

      return { 
        user: {
            name: 'Иван Иванов',
            email: 'ivanivanov@mail.ru'
        },
        rememberMe
      }
      
      {/* Заглушка */}
  //   try {
  //     const response = await fetch(`${env.BACKEND_URL}${ENDPOINTS.REGISTER}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ name, email, password }),
  //     })

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }))
  //       throw new Error(errorData.message || `HTTP ошибка: ${response.status}`)
  //     }

  //     const data = await response.json()
      
  //     return { 
  //       user: data.user,
  //       rememberMe 
  //     }
  //   } catch (error) {
  //     return rejectWithValue(error.message)
  //   }
  }
)