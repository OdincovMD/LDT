/**
 * @file loginUser.js
 * @description Async Thunk для авторизации пользователя. Выполняет вход, получает access token и информацию о пользователе.
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import { env } from "../imports/ENV";
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS";
import { apiRequest } from "./apiClient";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      // Шаг 1: авторизация
      const tokenData = await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.AUTH.LOGIN}`,
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );

      let userId;
      try {
        userId = tokenData.access_token.split("_")[2];
      } catch {
        throw new Error("Не удалось извлечь user_id из access_token");
      }

      // Шаг 2: запрос информации о пользователе
      const userData = await apiRequest(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.USERS.BY_ID(userId)}`
      );

      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          created_at: userData.created_at,
        },
        rememberMe,
        accessToken: tokenData.access_token, // чтобы можно было хранить в state/localStorage
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
