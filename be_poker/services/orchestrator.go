package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ValidationScores represents detailed rubric scores from the validator model.
type ValidationScores struct {
	ArithmeticConsistency float64 `json:"arithmetic_consistency"`
	Legality              float64 `json:"legality"`
	GTOAlignment          float64 `json:"gto_alignment"`
	JSONIntegrity         float64 `json:"json_integrity"`
}

// ValidationIssue describes a single detected issue.
type ValidationIssue struct {
	Path   string `json:"path"`
	Reason string `json:"reason"`
}

// ValidationReport is the structured response from the validator model.
type ValidationReport struct {
	Verdict     string            `json:"verdict"`
	Overall     float64           `json:"overall_score"`
	Scores      ValidationScores  `json:"scores"`
	Issues      []ValidationIssue `json:"issues"`
	Corrections json.RawMessage   `json:"corrections"`
}

// OrchestratedResult contains the outputs of the two-stage pipeline.
type OrchestratedResult struct {
	PrimaryOutput   string            `json:"primary_output"`
	FinalOutput     string            `json:"final_output"`
	Validation      *ValidationReport `json:"validation_report,omitempty"`
	ValidationMs    int64             `json:"validator_ms"`
	PrimaryMs       int64             `json:"primary_ms"`
	ValidationState string            `json:"validation_status"`
}

// TwoModelOrchestrator coordinates primary and validator calls and merges results.
type TwoModelOrchestrator struct {
	factory *AIServiceFactory
}

func NewTwoModelOrchestrator() *TwoModelOrchestrator {
	return &TwoModelOrchestrator{factory: NewAIServiceFactory()}
}

// Run executes the primary model first, then the validator if enabled, and merges outputs.
func (o *TwoModelOrchestrator) Run(ctx context.Context, handDetails string, language string, primaryModel string, validatorModel string) (*OrchestratedResult, error) {
	// 1) Primary
	pModel := o.factory.GetModelByName(primaryModel)
	if pModel == nil {
		return nil, fmt.Errorf("unsupported primary model: %s", primaryModel)
	}
	pSvc, err := o.factory.CreateService(pModel.Provider, primaryModel)
	if err != nil {
		return nil, fmt.Errorf("primary service error: %w", err)
	}
	t0 := time.Now()
	primaryOut, err := pSvc.AnalyzeHand(handDetails, language)
	pMs := time.Since(t0).Milliseconds()
	if err != nil {
		return nil, fmt.Errorf("primary analysis failed: %w", err)
	}

	// Default result uses primary output directly
	res := &OrchestratedResult{
		PrimaryOutput:   primaryOut,
		FinalOutput:     primaryOut,
		Validation:      nil,
		PrimaryMs:       pMs,
		ValidationMs:    0,
		ValidationState: "skipped",
	}

	// 2) Validator (Sonnet 4) — optional via provided validatorModel
	if strings.TrimSpace(validatorModel) == "" {
		return res, nil
	}
	vModel := o.factory.GetModelByName(validatorModel)
	if vModel == nil {
		// If unknown validator, gracefully skip
		return res, nil
	}
	vSvc, err := o.factory.CreateService(vModel.Provider, validatorModel)
	if err != nil {
		// skip validator on creation error
		return res, nil
	}

	// 優先從檔案載入 Validator Prompt，失敗則使用內建模板
	pm := NewPromptManager()
	validatorPrompt, _ := pm.GetValidatorPrompt(handDetails, primaryOut, language)
	if strings.TrimSpace(validatorPrompt) == "" {
		validatorPrompt = buildValidatorPrompt(handDetails, primaryOut, language)
	}

	// Temporarily reuse the AnalyzeHand method by sending composed details.
	// We rely on model/system prompts to output ValidationReport JSON only.
	// For Claude service, the system prompt is still used, so we encode our
	// instruction into the user content with strict-JSON requirement.
	t1 := time.Now()
	validatorRaw, vErr := vSvc.AnalyzeHand(validatorPrompt, language)
	vMs := time.Since(t1).Milliseconds()
	if vErr != nil {
		res.ValidationMs = vMs
		res.ValidationState = "failed"
		return res, nil
	}

	// Try parse validator JSON
	var report ValidationReport
	if err := json.Unmarshal([]byte(clipToJSONDoc(validatorRaw)), &report); err != nil {
		// validator returned non-JSON; fail and keep primary
		res.ValidationMs = vMs
		res.ValidationState = "failed"
		return res, nil
	}

	res.Validation = &report
	res.ValidationMs = vMs

	// Always apply all corrections (no thresholds)
	merged, mErr := mergeWithCorrections(primaryOut, report.Corrections, true)
	if mErr == nil {
		res.FinalOutput = merged
		res.ValidationState = "applied_all"
	} else {
		res.ValidationState = "failed"
	}

	return res, nil
}

func buildValidatorPrompt(originalHand string, primaryOutput string, language string) string {
	// Keep concise to control tokens; strict JSON requirement at the end
	template := `You are a strict validator for a poker hand analysis. Language: {{LANGUAGE}}.
Input:
- original_hand_json: A JSON-like description of the hand details provided to the primary model.
- primary_output: The primary model's JSON analysis (may contain mistakes).

Task:
Return ONLY a JSON object with keys: verdict, overall_score, scores, issues, corrections.
- verdict: one of ["pass","warn","fail"]
- overall_score: number 0..1
- scores: { arithmetic_consistency, legality, gto_alignment, json_integrity }
- issues: array of { path, reason }
- corrections: JSON object consisting ONLY of fields that should override the primary_output. Prefer objective fixes (pot math, size legality, frequency normalization, required fields). Subjective advice should be listed as issues, not corrections.

Constraints:
- Ensure JSON is parsable. No markdown, no code fences, no extra text.

original_hand_json:
<<<
%s
>>>

primary_output:
<<<
%s
>>>
`
	// Replace language variable (fallback handled upstream)
	prompt := strings.ReplaceAll(template, "{{LANGUAGE}}", language)
	return fmt.Sprintf(prompt, originalHand, primaryOutput)
}

func clipToJSONDoc(s string) string {
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start >= 0 && end > start {
		return s[start : end+1]
	}
	return s
}

func mergeWithCorrections(primaryJSON string, corrections json.RawMessage, allowAll bool) (string, error) {
	// Parse primary into a generic map
	var primary any
	if err := json.Unmarshal([]byte(primaryJSON), &primary); err != nil {
		// If primary isn't JSON, just return it unmodified
		return primaryJSON, nil
	}
	var corr any
	if len(corrections) == 0 {
		return primaryJSON, nil
	}
	if err := json.Unmarshal(corrections, &corr); err != nil {
		return primaryJSON, nil
	}

	merged := deepMerge(primary, corr, allowAll)
	out, err := json.Marshal(merged)
	if err != nil {
		return primaryJSON, nil
	}
	return string(out), nil
}

// deepMerge merges src into dst. If allowAll=false, only a small whitelist is allowed.
func deepMerge(dst any, src any, allowAll bool) any {
	switch d := dst.(type) {
	case map[string]any:
		s, ok := src.(map[string]any)
		if !ok {
			return dst
		}
		for k, v := range s {
			if !allowAll {
				if !whitelistedPath(k) {
					continue
				}
				// 在白名單模式下，直接以修正值覆蓋整個鍵，避免深度結構造成的數值不更新
				d[k] = v
				continue
			}
			if subDst, ok2 := d[k]; ok2 {
				d[k] = deepMerge(subDst, v, allowAll)
			} else {
				d[k] = v
			}
		}
		return d
	case []any:
		// For arrays, prefer src if allowAll; otherwise keep dst
		if allowAll {
			if arr, ok := src.([]any); ok {
				return arr
			}
		}
		return dst
	default:
		// For primitives replace if allowed
		if allowAll {
			return src
		}
		return dst
	}
}

// A minimal whitelist that is safe to auto-correct when confidence is medium.
func whitelistedPath(key string) bool {
	// Top-level streets and their suggested_action are safe to normalize
	switch key {
	case "summary", "preflop", "flop", "turn", "river":
		return true
	case "suggested_action", "pot", "actions":
		return true
	default:
		return false
	}
}
