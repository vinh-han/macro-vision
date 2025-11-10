FROM golang:1.24.2-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -v -o backend.exe .

FROM alpine:3.22 AS base
COPY .env .
COPY  ./links/ ./links/
COPY --from=builder /app/backend.exe /usr/local/bin/backend

CMD [ "backend" ]
