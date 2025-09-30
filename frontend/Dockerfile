FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache bash && npm install

COPY . .

ENV FRONTEND_PORT=5173
ARG BACKEND_URL
RUN echo "export const env = { BACKEND_URL: '${BACKEND_URL}' }" > /app/src/imports/ENV.js

EXPOSE ${FRONTEND_PORT}

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT}"]