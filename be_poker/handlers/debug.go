package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	openai "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/responses"
)

// DebugGpt5Mini calls GPT-5-mini via the official Responses API with a minimal prompt
// "Reply ONLY with OK" and returns the raw text output.
func DebugGpt5Mini(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		http.Error(w, "OPENAI_API_KEY not set", http.StatusInternalServerError)
		return
	}

	client := openai.NewClient(option.WithAPIKey(apiKey))
	modelName := "gpt-5-mini"
	input := "Reply ONLY with OK"

	params := responses.ResponseNewParams{
		Model:           modelName,
		Input:           responses.ResponseNewParamsInputUnion{OfString: param.NewOpt[string](input)},
		MaxOutputTokens: param.NewOpt[int64](2000),
	}

	resp, err := client.Responses.New(context.Background(), params)

	// gather env tails for verification (no secrets)
	key := os.Getenv("OPENAI_API_KEY")
	proj := os.Getenv("OPENAI_PROJECT_ID")
	tail := func(s string) string {
		if len(s) <= 6 {
			return s
		}
		return s[len(s)-6:]
	}

	out := map[string]any{
		"model":        modelName,
		"api_key_tail": tail(key),
		"project_tail": tail(proj),
	}
	if err != nil {
		out["error"] = err.Error()
		if strings.Contains(strings.ToLower(err.Error()), "unsupported model") {
			out["hint"] = "This environment key/project may not have access to gpt-5-mini."
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(out)
		return
	}

	text := strings.TrimSpace(resp.OutputText())
	if text == "" {
		out["output"] = ""
		out["raw_response"] = json.RawMessage(resp.RawJSON())
	} else {
		out["output"] = text
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}
