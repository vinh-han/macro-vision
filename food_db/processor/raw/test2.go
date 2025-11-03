package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

func main() {
	inputFile := "output.txt"
	outputFile := "cleaned_output.txt"

	in, err := os.Open(inputFile)
	if err != nil {
		panic(err)
	}
	defer in.Close()

	out, err := os.Create(outputFile)
	if err != nil {
		panic(err)
	}
	defer out.Close()

	writer := bufio.NewWriter(out)
	defer writer.Flush()

	// Words we want to ignore/remove
	stopWords := map[string]bool{
		"package":     true,
		"half":        true,
		"split":       true,
		"inch":        true,
		"-inch":       true,
		"cup":         true,
		"tablespoon":  true,
		"teaspoon":    true,
		"lb":          true,
		"oz":          true,
		"bunch":       true,
		"bundle":      true,
		"handful":     true,
		"room":        true,
		"temperature": true,
		"amount":      true,
		"air":         true,
		"fryer":       true,
		"piece":       true,
		"pinch":       true,
		"fry":         true,
		"blender":     true,
	}

	reNumUnit := regexp.MustCompile(`\b\d+(-?inch|in|cm|mm|lb|oz|g|kg)?\b`)

	uniqueLines := make(map[string]bool)

	scanner := bufio.NewScanner(in)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		// Remove numeric measurements like “3-inch”, “2g”, etc.
		line = reNumUnit.ReplaceAllString(line, "")

		// Remove unwanted words
		parts := strings.Fields(line)
		cleaned := make([]string, 0, len(parts))
		wordSeen := make(map[string]bool)
		for _, word := range parts {
			word = strings.ToLower(word)
			word = strings.Trim(word, "-")
			if stopWords[word] {
				continue
			}
			// Deduplicate within line
			if !wordSeen[word] && word != "" {
				wordSeen[word] = true
				wow := strip_unicode(word)
				cleaned = append(cleaned, wow)
			}
		}

		if len(cleaned) == 0 {
			continue
		}

		final := strings.Join(cleaned, " ")

		// Deduplicate globally
		if !uniqueLines[final] {
			uniqueLines[final] = true
		}
	}

	// Sort for consistent output
	sorted := make([]string, 0, len(uniqueLines))
	for k := range uniqueLines {
		sorted = append(sorted, k)
	}
	sort.Strings(sorted)

	for _, line := range sorted {
		fmt.Fprintln(writer, line)
	}

	fmt.Printf("✅ Cleaned %d unique ingredients → %s\n", len(sorted), outputFile)
}

func strip_unicode(input string) string {
	// Normalize the string (NFD splits base + diacritic)
	t := norm.NFD.String(input)
	var b strings.Builder

	for _, r := range t {
		// Skip combining marks (accents, tone marks, etc.)
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		// Only keep valid ASCII characters
		if r > 127 {
			// optional: replace non-ASCII with space
			continue
		}
		b.WriteRune(r)
	}

	// Clean up extra spaces
	return strings.Join(strings.Fields(b.String()), " ")
}
