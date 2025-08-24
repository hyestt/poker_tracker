package main

import (
	"context"
	"fmt"
	"os"

	openai "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/responses"
)

// A tiny script to validate calling GPT-5-mini using the official openai-go SDK (Responses API).
func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("ERROR: OPENAI_API_KEY is not set")
		os.Exit(1)
	}

	client := openai.NewClient(option.WithAPIKey(apiKey))

	prompt := "Reply with just: OK (plain text)"
	params := responses.ResponseNewParams{
		Model:           "gpt-5-mini",
		Input:           responses.ResponseNewParamsInputUnion{OfString: param.NewOpt[string](prompt)},
		MaxOutputTokens: param.NewOpt[int64](64),
	}

	fmt.Println("[gpt5mini_go] Calling GPT-5-mini...")
	resp, err := client.Responses.New(context.Background(), params)
	if err != nil {
		fmt.Printf("API error: %v\n", err)
		os.Exit(2)
	}

	out := resp.OutputText()
	if out == "" {
		fmt.Println(resp.RawJSON())
	} else {
		fmt.Println(out)
	}
}
