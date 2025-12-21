package supabase

import (
	"context"
	"encoding/json"
	"fmt"
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

type getUserResponse struct {
	User struct {
		ID           string                 `json:"id"`
		Email        string                 `json:"email"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
	} `json:"user"`
}

func (c *Client) GetUser(ctx context.Context, accessToken string) (*User, error) {
	url := c.url + "/auth/v1/user"
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

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("supabase returned status %d", resp.StatusCode)
	}

	var userResp getUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if userResp.User.ID == "" {
		return nil, fmt.Errorf("user not found")
	}

	return &User{
		ID:       userResp.User.ID,
		Email:    userResp.User.Email,
		Metadata: userResp.User.UserMetadata,
	}, nil
}

