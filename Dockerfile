FROM --platform=linux/amd64 golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .


RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o log-analyzer ./cmd/cli


FROM --platform=linux/amd64 alpine:latest

WORKDIR /app

RUN apk add --no-cache tzdata

COPY --from=builder /app/log-analyzer .
COPY --from=builder /app/rules.yaml .

RUN chmod +x /app/log-analyzer
RUN mkdir -p /var/log

CMD ["./log-analyzer"]