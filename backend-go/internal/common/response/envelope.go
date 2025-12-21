package response

import "time"

type Envelope[T any] struct {
	Data      T       `json:"data"`
	Timestamp string  `json:"timestamp"`
	RequestID *string `json:"requestId,omitempty"`
	Path      *string `json:"path,omitempty"`
}

func Build[T any](data T) Envelope[T] {
	return Envelope[T]{
		Data:      data,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
}

func BuildWithExtras[T any](data T, requestID *string, path *string) Envelope[T] {
	return Envelope[T]{
		Data:      data,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		RequestID: requestID,
		Path:      path,
	}
}

