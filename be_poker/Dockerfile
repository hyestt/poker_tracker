# 使用官方Go鏡像作為構建環境
FROM golang:1.21-alpine AS builder

# 安裝必要的構建工具和SQLite
RUN apk add --no-cache gcc musl-dev sqlite-dev

# 設置工作目錄
WORKDIR /app

# 複製go mod文件
COPY go.mod go.sum ./

# 下載依賴
RUN go mod download

# 複製源代碼
COPY . .

# 啟用CGO並構建應用
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

RUN go build -a -ldflags '-linkmode external -extldflags "-static"' -o main .

# 使用輕量級鏡像運行
FROM alpine:latest

# 安裝SQLite
RUN apk --no-cache add sqlite

# 設置工作目錄
WORKDIR /root/

# 從構建階段複製二進制文件
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 運行應用
CMD ["./main"] 