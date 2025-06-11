# 使用官方 Go 映像
FROM golang:1.21-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 複製 be_poker 目錄下的 go.mod 和 go.sum
COPY be_poker/go.mod be_poker/go.sum ./

# 下載依賴
RUN go mod download

# 複製 be_poker 目錄下的所有原始碼
COPY be_poker/ .

# 建置應用
RUN go build -o main .

# 使用輕量級映像運行
FROM alpine:latest

# 安裝 ca-certificates (HTTPS 連接需要)
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 從 builder 複製執行檔
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 運行應用
CMD ["./main"] 