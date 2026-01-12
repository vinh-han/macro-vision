FROM golang:1.24.2-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -v -o backend.exe .

FROM scratch AS base
WORKDIR /backend
COPY .env .
COPY --from=builder /app/backend.exe /usr/local/bin/backend

CMD [ "backend" ]
