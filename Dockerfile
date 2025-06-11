# 使用官方 Go 映像
FROM golang:1.21-alpine

# 安裝 ca-certificates 和 git
RUN apk --no-cache add ca-certificates git

# 設定工作目錄
WORKDIR /app

# 複製整個專案
COPY . .

# 進入 be_poker 目錄
WORKDIR /app/be_poker

# 下載依賴
RUN go mod download

# 建置應用
RUN go build -o main .

# 暴露端口
EXPOSE 8080

# 運行應用
CMD ["./main"] 