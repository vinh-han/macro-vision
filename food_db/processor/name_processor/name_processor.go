package name_processor

import (
	"fmt"
	"macro_vision/custom_errors"
	"regexp"
	"strings"
	"unicode"

	"github.com/aaaton/golem/v4"
	"github.com/aaaton/golem/v4/dicts/en"
	"github.com/jdkato/prose/v2"
	"golang.org/x/text/unicode/norm"
)

var lemmatizer *golem.Lemmatizer = nil

func Process_name(name string) (clean_name string, err error) {
	if lemmatizer == nil {
		lemmatizer, err = golem.New(en.New())
		if err != nil {
			return "", fmt.Errorf("%w\n", custom_errors.LemmetizerInitFailed)
		}
	}

	pre_processed := pre_process(name)
	clean_name = process(pre_processed, lemmatizer)
	fmt.Println("done:" + clean_name)
	return clean_name, err
}

func Post_process(names []string) (processed []string) {
	unique := map[string]bool{}
	for _, ing := range names {
		unique[ing] = true
	}

	// Drop substrings of other ingredients
	for a := range unique {
		for b := range unique {
			if a != b && strings.Contains(b, a) {
				delete(unique, a)
				break
			}
		}
	}
	// Convert map back to slice
	for ing := range unique {
		ing = canonicalize(ing)
		processed = append(processed, ing)
	}

	return processed
}

func pre_process(name string) (processed string) {
	fmt.Println("og:" + name)
	name = normalize_tokens(name)
	name = strings.TrimSpace(name)
	name = strings.ToLower(name)
	name = strip_unicode(name)
	processed = remove_parentheses(name)
	return processed
}

func process(name string, lemmatizer *golem.Lemmatizer) (processed string) {
	// --- handle "or" split (cheap version) ---
	// Just pick the first meaningful half
	if idx := strings.Index(name, " or "); idx != -1 {
		// Keep only the longer or more specific half
		left := strings.TrimSpace(name[:idx])
		right := strings.TrimSpace(name[idx+4:])

		// Heuristic: keep the right side if it contains more spaces (more tokens)
		if strings.Count(right, " ") >= strings.Count(left, " ") {
			name = right
		} else {
			name = left
		}
	}
	// NLP tagging
	doc, err := prose.NewDocument(
		name,
		prose.WithExtraction(false),
		prose.WithSegmentation(false),
	)
	if err != nil {
		return ""
	}

	var nouns []string
	for _, tok := range doc.Tokens() {
		if strings.HasPrefix(tok.Tag, "NN") {
			lemma := lemmatizer.Lemma(tok.Text)
			nouns = append(nouns, lemma)
		}
	}

	if len(nouns) == 0 {
		return ""
	}
	processed = strings.Join(nouns, " ")

	return processed
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

var parenthese_regex *regexp.Regexp = nil

func remove_parentheses(name string) (processed string) {
	if parenthese_regex == nil {
		parenthese_regex = regexp.MustCompile(`\([^)]*\)`)
	}
	processed = parenthese_regex.ReplaceAllString(name, "")

	return processed
}

func canonicalize(s string) string {
	return strings.ReplaceAll(s, " ", "_")
}

func normalize_tokens(name string) string {
	name = strings.ReplaceAll(name, "/", " ")
	// name = strings.ReplaceAll(name, "-", " ")
	return name
}
