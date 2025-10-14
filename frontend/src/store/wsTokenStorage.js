const keyFor = (userId, caseId) => `ws_token_u${userId}_c${caseId}`

export function loadStoredWsToken(userId, caseId) {
  return sessionStorage.getItem(keyFor(userId, caseId)) || localStorage.getItem(keyFor(userId, caseId)) || null
}

export function storeWsToken(userId, caseId, token, persist = "session") {
  const k = keyFor(userId, caseId)
  if (persist === "local") localStorage.setItem(k, token)
  else sessionStorage.setItem(k, token)
}

export function clearWsToken(userId, caseId) {
  const k = keyFor(userId, caseId)
  sessionStorage.removeItem(k)
  localStorage.removeItem(k)
}