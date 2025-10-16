import { createAsyncThunk } from "@reduxjs/toolkit"
import { env } from "../imports/ENV"
import { BACKEND_ENDPOINTS } from "../imports/ENDPOINTS"

/**
 * Создаёт drop-файл для USB-моста (токен берётся на бэке из БД).
 * body: { user_id, case_id, H, stride, name_hint? }
 * response: { filename, path_in_container, ws_url }
 */
export const provisionBridgeWs = createAsyncThunk(
"bridge/provisionWs",
async ({ userId, caseId, H = 300, stride = 15, nameHint }, { rejectWithValue }) => {
    try {
    const url = `${env.BACKEND_URL}${BACKEND_ENDPOINTS.BRIDGE.PROVISION_WS}?user_id=${encodeURIComponent(
        userId
    )}`
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
        user_id: userId,
        case_id: caseId,
        H,
        stride,
        name_hint: nameHint,
        }),
    })
    const data = await r.json()
    if (!r.ok) {
        throw new Error(data?.detail || data?.message || "Bridge provision failed")
    }
    // { filename, path_in_container, ws_url }
    return { ...data, userId, caseId, H, stride }
    } catch (e) {
    return rejectWithValue(String(e.message || e))
    }
}
)
