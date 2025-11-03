package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/aaaton/golem/v4"
	"github.com/aaaton/golem/v4/dicts/en"
	"github.com/jdkato/prose/v2"
)

func main() {
	inputFile := "./all_ingredients.yikes"
	outputFile := "output.txt"

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
	lemmatizer, err := golem.New(en.New())
	if err != nil {
		panic(err)
	}

	scanner := bufio.NewScanner(in)
	for scanner.Scan() {
		line := scanner.Text()
		cleaned := normalizeIngredient(line, lemmatizer)
		if cleaned != "" {
			fmt.Printf("clean: %s\n", cleaned)
			writer.WriteString(cleaned + "\n")
		}
	}
	writer.Flush()
	fmt.Println("Normalization complete →", outputFile)
}

func normalizeIngredient(line string, lemmatizer *golem.Lemmatizer) string {
	// Lowercase and basic cleanup
	line = strings.ToLower(line)

	// Remove parentheses and their contents
	line = regexp.MustCompile(`\([^)]*\)`).ReplaceAllString(line, "")

	// Remove "for frying", "for baking", "for serving", etc.
	line = regexp.MustCompile(`\bfor\s+\w+\b`).ReplaceAllString(line, "")

	// Remove words like "homemade", "store-bought", "fresh", "finely", "unsalted", etc.
	line = regexp.MustCompile(`\b(homemade|store-bought|fresh|finely|unsalted|optional|cooked|raw|ground|dry|wet|prepared|sliced|chopped|minced|large|small|medium|thin|thick)\b`).ReplaceAllString(line, "")

	line = strings.TrimSpace(line)
	if line == "" {
		return ""
	}

	// NLP tagging
	doc, err := prose.NewDocument(line)
	if err != nil {
		return ""
	}

	var nouns []string
	for _, tok := range doc.Tokens() {
		if strings.HasPrefix(tok.Tag, "NN") { // penn treebank pos tagset
			lemma := lemmatizer.Lemma(tok.Text)
			nouns = append(nouns, lemma)
		}
	}

	if len(nouns) == 0 {
		return ""
	}

	// Keep only up to 2 nouns
	if len(nouns) > 2 {
		nouns = nouns[:2]
	}

	cleaned := strings.Join(nouns, " ")
	return strings.TrimSpace(cleaned)
}
