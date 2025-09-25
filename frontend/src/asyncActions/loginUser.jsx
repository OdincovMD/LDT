import { env } from "../imports/ENV"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

export const loginUser = createAsyncThunk(
    'app/loginUser',
    async ({ email, password, rememberMe }, { rejectWithValue }) => {

    try {
      const response_1 = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          password: password 
        }),
      })

      if (!response_1.ok) {
        const errorData = await response_1.json().catch(() => ({ message: 'Неизвестная ошибка' }))
        throw new Error(errorData.detail || `HTTP ошибка: ${response_1.status}`)
      }

      // Всё прошло без ошибок, значит, можно обратиться к бэку по id пользователя
      const token = await response_1.json()

      const user_id = token.access_token.split('_')[2]

      const response_2 = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.USERS.BY_ID(user_id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      })

      if (!response_2.ok) {
        const errorData = await response_2.json().catch(() => ({ message: 'Неизвестная ошибка' }))
        throw new Error(errorData.detail || `HTTP ошибка: ${response_2.status}`)
      }
      
      const data = await response_2.json()

      return { 
        user: data.user,
        rememberMe: rememberMe 
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
