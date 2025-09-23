import csv
import requests
import time

"""
args:
csv_path путь до файла
url наш сервер
delay задержка между отправками, без нее почему-то ошибки 
"""
def send_csv(csv_path, url, delay=0.1):
    try:
        with open(csv_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)

            # Получаем названия всех столбцов
            columns = csv_reader.fieldnames
            print(f"Отправка на {url}")

            for row_num, row in enumerate(csv_reader, 1):

                data_to_send = {}

                # Обрабатываем каждую колонку
                for column in columns:
                    value = row[column]
                    try:
                        # Пытаемся преобразовать в float
                        data_to_send[column] = float(value)
                    except ValueError:
                        # Если не получается в float, пробуем int
                        data_to_send[column] = int(value)


                # Отправляем POST
                response = requests.post(
                    url,
                    json=data_to_send,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )

                # Проверяем статус ответа
                if response.status_code == 200:
                    print(f"✓ Строка {row_num} отправлена")
                    if response.text:
                        print(f"  Ответ сервера: {response.text[:100]}...")
                else:
                    print(f"✗ Ошибка при отправке строки {row_num}: {response.status_code}")
                    if response.text:
                        print(f"  Ответ сервера: {response.text[:200]}...")

                # Задержка между запросами
                time.sleep(delay)
    except Exception as e:
        print(f"Ошибка: {e}")


if __name__ == "__main__":
    # Файл, из которого достаем данные
    csv_path = "try.csv"

    # Сервер, куда летят данные
    url = "http://127.0.0.1:8000/"

    send_csv(csv_path, url, delay=0.1)
