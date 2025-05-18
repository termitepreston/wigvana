# Dockerfile (wigvana-application)

FROM node:23-alpine

WORKDIR /app

COPY package.json ./

RUN npm install -g pnpm && pnpm install

COPY . .

CMD ["pnpm", "start"]

