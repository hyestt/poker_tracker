# Railway Dockerfile for Poker Tracker Backend
FROM golang:1.21-alpine AS builder

# 安裝必要的套件
RUN apk add --no-cache gcc musl-dev

# 設定工作目錄
WORKDIR /app

# 複製 go 模組檔案
COPY be_poker/go.mod be_poker/go.sum ./

# 下載依賴
RUN go mod download

# 複製源碼
COPY be_poker/ .

# 建置應用
RUN go build -o main .

# 執行階段
FROM alpine:latest

# 安裝 ca-certificates 用於 HTTPS 請求
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 從建置階段複製執行檔
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 執行應用
CMD ["./main"] 