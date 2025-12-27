package supabase

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	url       string
	secretKey string
	httpClient *http.Client
}

func NewClient(url, secretKey string) (*Client, error) {
	return &Client{
		url:        url,
		secretKey:  secretKey,
		httpClient: &http.Client{},
	}, nil
}

type User struct {
	ID       string
	Email    string
	Metadata map[string]interface{}
}

// Supabase /auth/v1/user endpoint returns user object directly, not wrapped in "user" field
type getUserResponse struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
}

func (c *Client) GetUser(ctx context.Context, accessToken string) (*User, error) {
	// Ensure URL doesn't have trailing slash
	baseURL := c.url
	if baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}
	url := baseURL + "/auth/v1/user"
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("apikey", c.secretKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user from supabase: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for error details
	bodyBytes, _ := io.ReadAll(resp.Body)
	bodyStr := string(bodyBytes)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("supabase returned status %d: %s", resp.StatusCode, bodyStr)
	}

	var userResp getUserResponse
	if err := json.Unmarshal(bodyBytes, &userResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w (body: %s)", err, bodyStr)
	}

	if userResp.ID == "" {
		return nil, fmt.Errorf("user not found (response: %s)", bodyStr)
	}

	return &User{
		ID:       userResp.ID,
		Email:    userResp.Email,
		Metadata: userResp.UserMetadata,
	}, nil
}

