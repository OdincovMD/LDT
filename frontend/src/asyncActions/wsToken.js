import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

export const createWsToken = createAsyncThunk(
  "wsToken/create",
  async ({ userId, caseId }, { rejectWithValue }) => {
    try {
      const r = await fetch(`${env.BACKEND_URL}${BACKEND_ENDPOINTS.WS_TOKEN.CREATE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, case_id: caseId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail?.message || "WS token create failed")
      // {status:"created", token} | {status:"exists"}
      return { ...data, userId, caseId }
    } catch (e) {
      return rejectWithValue(String(e.message || e))
    }
  }
)

export const checkWsTokenExists = createAsyncThunk(
  "wsToken/exists",
  async ({ userId, caseId }, { rejectWithValue }) => {
    try {
      const url = `${env.BACKEND_URL}${BACKEND_ENDPOINTS.WS_TOKEN.EXISTS(userId, caseId)}`
      const r = await fetch(url, { headers: { Accept: "application/json" } })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail?.message || "WS token exists failed")
      // backend: {exists: boolean}
      return { exists: Boolean(data?.exists), userId, caseId }
    } catch (e) {
      return rejectWithValue(String(e.message || e))
    }
  }
)