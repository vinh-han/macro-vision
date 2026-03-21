package main

import (
	"crypto/rand"
	"encoding/hex"
	"net/url"
	"strconv"
	"strings"
)

func getQueryValues(search_terms string) url.Values {
	var vals url.Values = url.Values{}
	vals.Add("search_terms", search_terms)
	vals.Add("page_size", strconv.FormatInt(int64(MaxImages), 10))
	vals.Add("json", strconv.FormatInt(1, 10))
	vals.Add("search_simple", strconv.FormatInt(1, 10))
	vals.Add("action", "process")
	vals.Add("sort_by", "unique_scans_n")
	vals.Add("fields", "image_url")
	return vals
}

func randomName() (string, error) {
	b := make([]byte, 6) // 6 bytes = 12 hex chars
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b) + ".jpg", nil
}

func toSnakeName(s string) string {
	fields := strings.Fields(s) // splits on any whitespace
	return strings.ToLower(strings.Join(fields, "_"))
}

