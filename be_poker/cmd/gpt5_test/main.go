package main

import (
	"context"
	"fmt"
	"os"
	"time"

	openai "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/responses"
)

// Minimal sanity test that calls OpenAI GPT-5 via the official openai-go SDK.
// It prints the first text output or an error message.
func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("ERROR: OPENAI_API_KEY is not set in environment")
		os.Exit(1)
	}

	// Create client with a short timeout to avoid hanging.
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	client := openai.NewClient(option.WithAPIKey(apiKey))

	// Build a very small Responses API request to validate reachability and model access.
	params := responses.ResponseNewParams{
		Model:           "gpt-5",
		Input:           responses.ResponseNewParamsInputUnion{OfString: param.NewOpt[string]("Reply ONLY with: OK")},
		MaxOutputTokens: param.NewOpt[int64](64),
	}

	fmt.Println("[gpt5_test] Sending request to OpenAI...")
	resp, err := client.Responses.New(ctx, params)
	if err != nil {
		fmt.Printf("[gpt5_test] API call failed: %v\n", err)
		os.Exit(2)
	}
	out := resp.OutputText()
	if out == "" {
		fmt.Println("[gpt5_test] Empty OutputText; dumping raw JSON for diagnosis:")
		fmt.Println(resp.RawJSON())
	} else {
		fmt.Println(out)
	}
}
