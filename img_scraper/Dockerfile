FROM golang:1.25.7-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /app
COPY ./img_scraper/go.mod ./img_scraper/go.sum ./
RUN go mod download && go mod verify
COPY ./img_scraper .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -v -o img_scraper.exe .

FROM alpine:latest AS base
WORKDIR /img_scraper
COPY .env .
COPY --from=builder /app/img_scraper.exe /usr/local/bin/img_scraper

CMD [ "img_scraper" ]
