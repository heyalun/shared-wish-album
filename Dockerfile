FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm ci

COPY jest.config.js ./
COPY tests/ ./tests/
COPY miniprogram/cloudfunctions/ ./miniprogram/cloudfunctions/

CMD ["npm", "test"]