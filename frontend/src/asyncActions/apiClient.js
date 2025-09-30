/**
 * @file apiClient.js
 * @description Универсальный клиент для HTTP-запросов к backend API. Обрабатывает заголовки, ошибки и преобразование ответов в JSON.
 */
export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Ошибка запроса");
  }

  return response.json();
}
