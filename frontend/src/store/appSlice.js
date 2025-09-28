import { createSlice } from '@reduxjs/toolkit'

import { loginUser } from "../asyncActions/loginUser"
import { registerUser } from "../asyncActions/registerUser"

import { PAGE_NAMES } from '../imports/ENDPOINTS'

// Функция для загрузки начального состояния из localStorage или sessionStorage
const loadInitialState = () => {
  const savedUser = localStorage.getItem('user')
  const checkUser = savedUser === 'undefined' ? null : savedUser
  const rememberMe = localStorage.getItem('rememberMe') === 'true'
  
  if (!rememberMe) {
    sessionStorage.removeItem('user')
    return {
      user: null,
      rememberMe: false
    }
  }

  return {
    user: checkUser ? JSON.parse(checkUser) : null,
    rememberMe
  }
}

const initialState = {
  sidebarOpen: true,
  loading: false,
  error: null,
  ...loadInitialState()
}

const appSlice = createSlice({
  name: "app",
  initialState: initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },

    setRememberMe: (state, action) => {
      state.rememberMe = action.payload
      localStorage.setItem('rememberMe', action.payload.toString())
      
      if (state.user) {
        if (action.payload) {
          localStorage.setItem('user', JSON.stringify(state.user))
          sessionStorage.removeItem('user')
        } else {
          sessionStorage.setItem('user', JSON.stringify(state.user))
          localStorage.removeItem('user')
        }
      }
    },

    logout: (state) => {
      state.user = null
      state.rememberMe = false
      
      // Очищаем все хранилища
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('rememberMe')
    },

    clearError: (state) => {
      state.error = null
    }
  },

  extraReducers: (builder) => {
    builder
      // Логин
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.rememberMe = action.payload.rememberMe
        state.error = null
        
        const storage = action.payload.rememberMe ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('rememberMe', action.payload.rememberMe.toString())
        
        if (action.payload.rememberMe) {
          sessionStorage.removeItem('user')
        } else {
          localStorage.removeItem('user')
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.user = null
      })
      
      // Регистрация
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.rememberMe = action.payload.rememberMe
        state.error = null
        
        const storage = action.payload.rememberMe ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('rememberMe', action.payload.rememberMe.toString())
        
        if (action.payload.rememberMe) {
          sessionStorage.removeItem('user')
        } else {
          localStorage.removeItem('user')
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.user = null
      })
  }
})

export const {
  toggleSidebar,
  setRememberMe,
  logout,
  clearError
} = appSlice.actions

export const appReducer = appSlice.reducer