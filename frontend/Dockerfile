FROM node:lts-alpine AS main
WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm install
COPY .env .
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
