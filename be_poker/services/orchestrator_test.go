package services

import (
	"encoding/json"
	"testing"
)

func Test_clipToJSONDoc(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{"pure", `{"a":1}`, `{"a":1}`},
		{"wrapped", `xxx {"a":1} yyy`, `{"a":1}`},
		{"nojson", `hello`, `hello`},
	}
	for _, c := range cases {
		got := clipToJSONDoc(c.in)
		if got != c.want {
			t.Fatalf("%s: got %q want %q", c.name, got, c.want)
		}
	}
}

func Test_mergeWithCorrections_AllVsWhitelist(t *testing.T) {
	primary := `{"summary":"ok","preflop":{"frequencies":{"fold":"40%","call":"60%"}},"pot":100,"notes":"keep"}`

	corrAll := json.RawMessage(`{"summary":"fixed","preflop":{"frequencies":{"fold":"50%","call":"50%"}},"pot":110,"notes":"replace"}`)
	corrWL := json.RawMessage(`{"preflop":{"frequencies":{"fold":"50%","call":"50%"}},"pot":110,"notes":"replace"}`)

	// allowAll=true should replace everything present in corrections
	mergedAll, err := mergeWithCorrections(primary, corrAll, true)
	if err != nil {
		t.Fatalf("merge all err: %v", err)
	}
	var all map[string]any
	if err := json.Unmarshal([]byte(mergedAll), &all); err != nil {
		t.Fatalf("merged all not json: %v", err)
	}
	if all["summary"] != "fixed" {
		t.Fatalf("expected summary replaced")
	}
	if all["pot"].(float64) != 110 {
		t.Fatalf("expected pot replaced to 110")
	}
	// whitelist=false should not overwrite non-whitelisted keys like "summary" or "notes"
	mergedWL, err := mergeWithCorrections(primary, corrWL, false)
	if err != nil {
		t.Fatalf("merge wl err: %v", err)
	}
	var wl map[string]any
	if err := json.Unmarshal([]byte(mergedWL), &wl); err != nil {
		t.Fatalf("merged wl not json: %v", err)
	}
	if wl["summary"] != "ok" {
		t.Fatalf("summary should stay original when whitelist only")
	}
	// pot and preflop.frequencies are whitelisted -> should change
	if wl["pot"].(float64) != 110 {
		t.Fatalf("expected pot updated in whitelist mode")
	}
	pf := wl["preflop"].(map[string]any)
	freq := pf["frequencies"].(map[string]any)
	if freq["fold"] != "50%" || freq["call"] != "50%" {
		t.Fatalf("frequencies not updated in whitelist mode")
	}
	if wl["notes"] != "keep" {
		t.Fatalf("notes should not be overwritten in whitelist mode")
	}
}
