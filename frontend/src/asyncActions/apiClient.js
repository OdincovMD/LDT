/**
 * @file apiClient.js
 * @description Универсальный клиент для HTTP-запросов к backend API. Обрабатывает заголовки, ошибки и преобразование ответов в JSON.
 */
export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = "Ошибка запроса";

    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (typeof data.detail === "object") {
        // например { error, message, extra }
        message = data.detail.message || JSON.stringify(data.detail);
      }
    } else if (data?.message) {
      message = data.message;
    } else if (typeof data === "string") {
      message = data;
    } else if (data) {
      message = JSON.stringify(data);
    } else {
      message = response.statusText || "Неизвестная ошибка";
    }

    throw new Error(message);
  }

  return data;
}
