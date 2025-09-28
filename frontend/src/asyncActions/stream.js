// asyncActions/stream.js
import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

import { predicitonDummy } from "../imports/DUMMIES"

export const startSimulation = createAsyncThunk(
  'stream/startSimulation',
  async ({ caseId, hz = 1 }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.SIM.START}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ case_id: caseId, hz })
      })

      if (!response.ok) {
        throw new Error('Ошибка запуска симуляции')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const stopSimulation = createAsyncThunk(
  'stream/stopSimulation',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.SIM.STOP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ case_id: caseId })
      })

      if (!response.ok) {
        throw new Error('Ошибка остановки симуляции')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// И обновить loadHistoricalData для объединения данных
export const loadHistoricalData = createAsyncThunk(
  'stream/loadHistorical',
  async (caseId, { rejectWithValue }) => {
    try {
      // Параллельно получаем сырые данные и предсказания
      const [rawDataResponse, predictionsResponse] = await Promise.all([
        fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=3600`),
        fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.PREDICTIONS.BY_CASE(caseId)}?limit=3600`)
      ])

      if (!rawDataResponse.ok || !predictionsResponse.ok) {
        throw new Error('Ошибка загрузки исторических данных')
      }

      const rawData = await rawDataResponse.json()
      const predictions = await predictionsResponse.json()

      console.log(predictions)
      // Просто сопоставляем элементы по порядку (по индексу)
      const dataWithRisk = rawData.map((rawPoint, index) => {
        const prediction = index < 300 ? {...predicitonDummy, prediction: 0} : predictions[index - 300]
        
        return {
          ...rawPoint,
          risk: prediction ? prediction.probability : 0,
          label: prediction ? prediction.label : null,
          alert: prediction ? prediction.alert : null
        }
      })
      
      return dataWithRisk
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchLatestDataPoint = createAsyncThunk(
  'stream/fetchLatestDataPoint',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=1`
      )

      if (!response.ok) {
        throw new Error('Ошибка получения данных')
      }

      const data = await response.json()
      return data.length > 0 ? data[0] : null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPredictions = createAsyncThunk(
  'stream/fetchPredictions',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PREDICTIONS.BY_CASE(caseId)}?limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Ошибка получения предсказаний')
      }

      const data = await response.json()
      return data.length > 0 ? data[0] : null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const checkCaseHasData = createAsyncThunk(
  'stream/checkCaseHasData',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Ошибка проверки данных кейса')
      }

      const data = await response.json()
      return data.length > 0 // true если есть данные, false если пусто
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)