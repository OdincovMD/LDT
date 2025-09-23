FROM node:24-alpine

WORKDIR /app


COPY package*.json ./

RUN apk update && apk add bash && \
    npm install
    # npm install react-redux react-router-dom && \
    # npm install -D tailwindcss postcss autoprefixer && \
    # npm install lucide-react &&

COPY . .

RUN npx tailwindcss init -p

EXPOSE 5173
# ARG BACKEND_URL
# RUN echo "export const env = { \
#             BACKEND_URL: '${BACKEND_URL}'\
#             }"\
#           > /app/src/imports/ENV.js

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]