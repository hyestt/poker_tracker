package services

import (
	"encoding/json"
	"regexp"
	"strings"
)

type AnalysisSections struct {
	Summary string `json:"summary"`
	Preflop string `json:"preflop"`
	Flop    string `json:"flop"`
	Turn    string `json:"turn"`
	River   string `json:"river"`
}

// ParseHandAnalysis tries to parse model output into five sections.
// Priority: strict JSON -> markdown H2 headings -> label prefixes -> fallback all to Summary.
func ParseHandAnalysis(text string) AnalysisSections {
	clean := strings.TrimSpace(text)

	// 1) Try strict JSON. Also try to clip to the first '{' .. last '}' to tolerate pre/post noise.
	if sec, ok := tryParseJSON(clean); ok {
		return sec
	}
	if clipped, ok := clipToJSON(clean); ok {
		if sec, ok := tryParseJSON(clipped); ok {
			return sec
		}
	}

	// 2) Try markdown H2 headings (## Summary etc.)
	if sec, ok := splitByHeadings(clean); ok {
		return sec
	}

	// 3) Try label prefixes (Summary:, Preflop:, ...)
	if sec, ok := splitByLabels(clean); ok {
		return sec
	}

	// 4) Fallback: put everything into Summary
	return AnalysisSections{Summary: clean}
}

func emptySafe(s string) string {
	t := strings.TrimSpace(s)
	if t == "None" || t == "-" {
		return ""
	}
	return t
}

func normalize(sec *AnalysisSections) AnalysisSections {
	sec.Summary = emptySafe(sec.Summary)
	sec.Preflop = emptySafe(sec.Preflop)
	sec.Flop = emptySafe(sec.Flop)
	sec.Turn = emptySafe(sec.Turn)
	sec.River = emptySafe(sec.River)
	return *sec
}

func tryParseJSON(s string) (AnalysisSections, bool) {
	var tmp map[string]interface{}
	if err := json.Unmarshal([]byte(s), &tmp); err != nil {
		return AnalysisSections{}, false
	}
	res := AnalysisSections{}
	if v, ok := tmp["summary"]; ok {
		// Handle both string and object formats
		if summaryObj, ok := v.(map[string]interface{}); ok {
			if summaryText, ok := summaryObj["summary"]; ok {
				res.Summary = toString(summaryText)
			}
		} else {
			res.Summary = toString(v)
		}
	}
	// Accept alternative keys often returned by compact prompts
	if v, ok := tmp["line"]; ok {
		if res.Summary == "" {
			res.Summary = toString(v)
		} else {
			res.Summary = strings.TrimSpace(res.Summary + "\n" + toString(v))
		}
	}
	// Handle preflop, flop, turn, river (both string and object formats)
	extractStreetContent := func(key string) string {
		if v, ok := tmp[key]; ok {
			if streetObj, ok := v.(map[string]interface{}); ok {
				// Only extract specific text fields, not frequencies or other objects
				var parts []string
				if summaryText, ok := streetObj["summary"]; ok {
					if str := toString(summaryText); strings.TrimSpace(str) != "" {
						parts = append(parts, str)
					}
				}
				if playerAction, ok := streetObj["player_action"]; ok {
					if str := toString(playerAction); strings.TrimSpace(str) != "" {
						parts = append(parts, str)
					}
				}
				if recommendation, ok := streetObj["recommendation"]; ok {
					if str := toString(recommendation); strings.TrimSpace(str) != "" {
						parts = append(parts, str)
					}
				}
				return strings.Join(parts, " ")
			} else {
				return toString(v)
			}
		}
		return ""
	}

	res.Preflop = extractStreetContent("preflop")
	res.Flop = extractStreetContent("flop")
	res.Turn = extractStreetContent("turn")
	res.River = extractStreetContent("river")
	if v, ok := tmp["notes"]; ok {
		notes := toString(v)
		if strings.TrimSpace(notes) != "" {
			if res.Summary == "" {
				res.Summary = notes
			} else {
				res.Summary = strings.TrimSpace(res.Summary + "\n" + notes)
			}
		}
	}
	return normalize(&res), true
}

func toString(v interface{}) string {
	switch t := v.(type) {
	case string:
		return t
	default:
		b, _ := json.Marshal(t)
		return string(b)
	}
}

func clipToJSON(s string) (string, bool) {
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start >= 0 && end > start {
		return s[start : end+1], true
	}
	return "", false
}

func splitByHeadings(s string) (AnalysisSections, bool) {
	// (?mi) multiline + case-insensitive
	re := regexp.MustCompile(`(?mi)^##\s*(Summary|Preflop|Flop|Turn|River)\s*$`)
	idxs := re.FindAllStringIndex(s, -1)
	labels := re.FindAllStringSubmatch(s, -1)
	if len(idxs) == 0 {
		return AnalysisSections{}, false
	}

	parts := map[string]string{}
	for i := 0; i < len(idxs); i++ {
		start := idxs[i][1]
		end := len(s)
		if i+1 < len(idxs) {
			end = idxs[i+1][0]
		}
		label := strings.ToLower(labels[i][1])
		content := strings.TrimSpace(s[start:end])

		// Remove any trailing section headers from content
		content = cleanTrailingHeaders(content)
		parts[label] = content
	}
	res := AnalysisSections{
		Summary: parts["summary"],
		Preflop: parts["preflop"],
		Flop:    parts["flop"],
		Turn:    parts["turn"],
		River:   parts["river"],
	}
	return normalize(&res), true
}

func splitByLabels(s string) (AnalysisSections, bool) {
	re := regexp.MustCompile(`(?mi)^(Summary|Preflop|Flop|Turn|River)\s*:\s*$`)
	idxs := re.FindAllStringIndex(s, -1)
	labels := re.FindAllStringSubmatch(s, -1)
	if len(idxs) == 0 {
		return AnalysisSections{}, false
	}

	parts := map[string]string{}
	for i := 0; i < len(idxs); i++ {
		start := idxs[i][1]
		end := len(s)
		if i+1 < len(idxs) {
			end = idxs[i+1][0]
		}
		label := strings.ToLower(labels[i][1])
		content := strings.TrimSpace(s[start:end])

		// Remove any trailing section headers from content
		content = cleanTrailingHeaders(content)
		parts[label] = content
	}
	res := AnalysisSections{
		Summary: parts["summary"],
		Preflop: parts["preflop"],
		Flop:    parts["flop"],
		Turn:    parts["turn"],
		River:   parts["river"],
	}
	return normalize(&res), true
}

// cleanTrailingHeaders removes trailing section headers that shouldn't be part of the content
func cleanTrailingHeaders(content string) string {
	// Remove trailing headers like "## Flop", "Flop:", etc.
	headerPatterns := []string{
		`(?mi)^##\s*(Summary|Preflop|Flop|Turn|River)\s*$`,
		`(?mi)^(Summary|Preflop|Flop|Turn|River)\s*:\s*$`,
		`(?mi)^(Summary|Preflop|Flop|Turn|River)\s*$`,
	}

	for _, pattern := range headerPatterns {
		re := regexp.MustCompile(pattern)
		content = re.ReplaceAllString(content, "")
	}

	return strings.TrimSpace(content)
}
