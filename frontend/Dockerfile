FROM node:22.21.1-alpine3.21 AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

