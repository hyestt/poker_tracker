package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"poker_tracker_backend/models"
)

func TestCreateSessionValidation(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
	}{
		{
			name:           "Invalid JSON",
			requestBody:    "invalid json",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Valid session data",
			requestBody: models.Session{
				Location:      "Test Casino",
				Date:          "2024-01-01",
				SmallBlind:    1,
				BigBlind:      2,
				Currency:      "USD",
				EffectiveStack: 200,
				TableSize:     9,
			},
			expectedStatus: http.StatusInternalServerError, // DB not initialized in test
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			var err error

			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, err = json.Marshal(tt.requestBody)
				if err != nil {
					t.Fatalf("Failed to marshal request body: %v", err)
				}
			}

			req, err := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(CreateSession)

			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
			}
		})
	}
}

func TestGetSessionMissingID(t *testing.T) {
	req, err := http.NewRequest("GET", "/session", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GetSession)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "Missing id parameter"
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("Handler returned unexpected body: got %v want to contain %v",
			rr.Body.String(), expected)
	}
}

func TestDeleteSessionMissingID(t *testing.T) {
	req, err := http.NewRequest("DELETE", "/session", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(DeleteSession)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "Missing id parameter"
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("Handler returned unexpected body: got %v want to contain %v",
			rr.Body.String(), expected)
	}
}