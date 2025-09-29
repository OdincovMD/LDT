// asyncActions/stream.js
import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

import { predictionDummy } from "../imports/DUMMIES"

// Глобальные контроллеры для отмены конкурирующих запросов
const controllers = {
  startSimulation: null,
  stopSimulation: null,
  loadHistorical: null,
  fetchLatest: null,
  fetchPreds: null,
  checkHasData: null,
}

const HISTORY_OFFSET = 300

export const startSimulation = createAsyncThunk(
  'stream/startSimulation',
  async ({ caseId, hz = 1 }, { rejectWithValue }) => {
    try {
      if (controllers.startSimulation) controllers.startSimulation.abort()
      controllers.startSimulation = new AbortController()

      const response = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.SIM.START}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, hz }),
        signal: controllers.startSimulation.signal,
      })

      if (!response.ok) throw new Error('Ошибка запуска симуляции')
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.startSimulation = null
    }
  }
)

export const stopSimulation = createAsyncThunk(
  'stream/stopSimulation',
  async (caseId, { rejectWithValue }) => {
    try {
      if (controllers.stopSimulation) controllers.stopSimulation.abort()
      controllers.stopSimulation = new AbortController()

      const response = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.SIM.STOP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
        signal: controllers.stopSimulation.signal,
      })

      if (!response.ok) throw new Error('Ошибка остановки симуляции')
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.stopSimulation = null
    }
  }
)

// Загрузка истории: сырые + предсказания, сопоставление по индексу,
export const loadHistoricalData = createAsyncThunk(
  'stream/loadHistorical',
  async (caseId, { rejectWithValue }) => {
    try {
      if (controllers.loadHistorical) controllers.loadHistorical.abort()
      controllers.loadHistorical = new AbortController()

      const [rawDataResponse, predictionsResponse] = await Promise.all([
        fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=3600`, {
          signal: controllers.loadHistorical.signal,
        }),
        fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.PREDICTIONS.BY_CASE(caseId)}?limit=3600`, {
          signal: controllers.loadHistorical.signal,
        }),
      ])

      if (!rawDataResponse.ok || !predictionsResponse.ok) {
        throw new Error('Ошибка загрузки исторических данных')
      }

      const rawData = await rawDataResponse.json()
      const predictions = await predictionsResponse.json()

      const dataWithRisk = rawData.map((rawPoint, index) => {
        const prediction =
          index < HISTORY_OFFSET
            ? { ...predictionDummy, probability: 0 }
            : predictions[index - HISTORY_OFFSET]

        return {
          ...rawPoint,
          risk: prediction ? prediction.probability : 0,
          label: prediction ? prediction.label : null,
          alert: prediction ? prediction.alert : null,
        }
      })

      return dataWithRisk
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.loadHistorical = null
    }
  }
)

export const fetchLatestDataPoint = createAsyncThunk(
  'stream/fetchLatestDataPoint',
  async (caseId, { rejectWithValue }) => {
    try {
      if (controllers.fetchLatest) controllers.fetchLatest.abort()
      controllers.fetchLatest = new AbortController()

      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=1`,
        { signal: controllers.fetchLatest.signal }
      )

      if (!response.ok) throw new Error('Ошибка получения данных')

      const data = await response.json()
      return data.length > 0 ? data[0] : null
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.fetchLatest = null
    }
  }
)

export const fetchPredictions = createAsyncThunk(
  'stream/fetchPredictions',
  async (caseId, { rejectWithValue }) => {
    try {
      if (controllers.fetchPreds) controllers.fetchPreds.abort()
      controllers.fetchPreds = new AbortController()

      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.PREDICTIONS.BY_CASE(caseId)}?limit=1`,
        { signal: controllers.fetchPreds.signal }
      )

      if (!response.ok) throw new Error('Ошибка получения предсказаний')

      const data = await response.json()
      return data.length > 0 ? data[0] : null
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.fetchPreds = null
    }
  }
)

export const checkCaseHasData = createAsyncThunk(
  'stream/checkCaseHasData',
  async (caseId, { rejectWithValue }) => {
    try {
      if (controllers.checkHasData) controllers.checkHasData.abort()
      controllers.checkHasData = new AbortController()

      const response = await fetch(
        `${env.BACKEND_URL}${BACKEND_ENDPOINTS.STREAM.DATA_BY_CASE(caseId)}?limit=1`,
        { signal: controllers.checkHasData.signal }
      )

      if (!response.ok) throw new Error('Ошибка проверки данных кейса')

      const data = await response.json()
      return data.length > 0
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      controllers.checkHasData = null
    }
  }
)
