package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"poker_tracker_backend/models"
	"testing"
)

func TestCreateHandValidation(t *testing.T) {
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
			name: "Valid hand data",
			requestBody: models.Hand{
				SessionID: "test-session-id",
				Details:   "Test hand details",
				Result:    100,
				Date:      "2024-01-01",
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

			req, err := http.NewRequest("POST", "/hands", bytes.NewBuffer(body))
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(CreateHand)

			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
			}
		})
	}
}

func TestGetHandMissingID(t *testing.T) {
	req, err := http.NewRequest("GET", "/hand", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GetHand)

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

func TestDeleteHandMissingID(t *testing.T) {
	req, err := http.NewRequest("DELETE", "/hand", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(DeleteHand)

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

func TestAnalyzeHandMethodValidation(t *testing.T) {
	req, err := http.NewRequest("GET", "/analyze", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(AnalyzeHand)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestToggleFavoriteMethodValidation(t *testing.T) {
	req, err := http.NewRequest("GET", "/toggle-favorite", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ToggleFavorite)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("Handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}
