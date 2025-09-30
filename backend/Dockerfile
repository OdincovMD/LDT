FROM python:3.12-slim

# psycopg2 - иначе бинарник
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY src /app/src

EXPOSE ${BACKEND_PORT}

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${BACKEND_PORT} --reload"]
