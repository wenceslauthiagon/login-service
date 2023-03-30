FROM node:alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

COPY . .

RUN npm install

RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
