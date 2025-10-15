// src/asyncActions/upload.js
/**
 * @file upload.js
 * @description Async Thunk для загрузки пользовательского CSV-файла демо-данных.
 * Бэкенд-роут: POST /api/demo/upload (проксируется nginx'ом)
 */

import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

/**
 * Загрузка пользовательского CSV (или text/csv).
 * Вход: { file: File }
 * Успех: { ok: true, path: string }
 */
export const uploadDemoCsv = createAsyncThunk(
  "demo/uploadCsv",
  async ({ file }, { rejectWithValue }) => {
    try {
    console.error("я тут")
      if (!file) throw new Error("Файл не выбран")

      const url = `${env.BACKEND_URL}${BACKEND_ENDPOINTS.DEMO.UPLOAD}`
      // отладка пути (в devtools видно в Console)
      // console.debug("[uploadDemoCsv] URL:", url)

      const fd = new FormData()
      fd.append("file", file)
      console.error(url)
      const r = await fetch(url, {
        method: "POST",
        body: fd,
      })

      let data = null
      try {
        data = await r.json()
      } catch (_) {
        // оставляем data = null
      }

      if (!r.ok) {
        const msg =
          (data && (data.detail?.message || data.detail)) ||
          `Upload failed: ${r.status}`
        throw new Error(msg)
      }

      return {
        ok: Boolean(data?.ok),
        path: String(data?.path || ""),
      }
    } catch (e) {
      return rejectWithValue(String(e.message || e))
    }
  }
)