FROM node:lts-alpine AS main
WORKDIR /frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci
COPY ./frontend/ /frontend
COPY ./.env ./
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
