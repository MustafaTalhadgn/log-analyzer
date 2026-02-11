FROM golang:alpine as builder

WORKDIR /app


COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o server ./cmd/cli


FROM alpine:latest

WORKDIR /app


RUN apk add --no-cache tzdata ca-certificates

COPY --from=builder /app/server .


COPY --from=builder /app/rules.yaml .


RUN mkdir -p /app/reports && chmod 777 /app/reports


RUN chmod +x /app/server


EXPOSE 8080


CMD ["./server"]