package response

// ErrorResponse represents an error response
// @Description Error response structure
type ErrorResponse struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Path       string `json:"path,omitempty"`
	RequestID  string `json:"requestId,omitempty"`
	Timestamp  string `json:"timestamp,omitempty"`
}

