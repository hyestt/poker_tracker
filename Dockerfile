# 使用官方 Go 映像
FROM golang:1.21-alpine

# 安裝 ca-certificates 和 git
RUN apk --no-cache add ca-certificates git

# 設定工作目錄
WORKDIR /app

# 先複製 go.mod 和 go.sum
COPY be_poker/go.mod be_poker/go.sum ./

# 下載依賴
RUN go mod download

# 複製所有 Go 源碼檔案
COPY be_poker/*.go ./
COPY be_poker/db/ ./db/
COPY be_poker/handlers/ ./handlers/
COPY be_poker/models/ ./models/
COPY be_poker/routes/ ./routes/
COPY be_poker/services/ ./services/
COPY be_poker/prompts/ ./prompts/

# 建置應用
RUN go build -o main .

# 暴露端口
EXPOSE 8080

# 運行應用
CMD ["./main"] 