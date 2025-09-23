from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)


class SimplePostHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Получаем длину содержимого
            content_length = int(self.headers.get('Content-Length', 0))

            # Читаем данные
            post_data = self.rfile.read(content_length)

            # Парсим JSON
            data = json.loads(post_data.decode('utf-8'))

            # Логируем полученные данные
            logging.info(f"Данные: {data}")

            # Отправляем успешный ответ
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            response = {
                "time": datetime.now().isoformat(),
                "data": data
            }


            # отправляет обратно те же данные, убеждаемся, что все доходит корректно
            # self.wfile.write(json.dumps(response).encode('utf-8'))


        except Exception as e:
            logging.error(f"Ошибка: {str(e)}")
            self.send_error(500, f"Ошибка сервера: {str(e)}")


def run_server(host='127.0.0.1', port=8000):
    server_address = (host, port)
    httpd = HTTPServer(server_address, SimplePostHandler)

    logging.info("Сервер запущен")

    httpd.serve_forever()



if __name__ == '__main__':
    run_server()