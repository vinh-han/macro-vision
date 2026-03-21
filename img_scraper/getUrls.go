package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"
)

type Response struct {
	Products []struct {
		ImageURL string `json:"image_url"`
	} `json:"products"`
}

func getImageUrls(dishes []Dish, ingredients []Ingredient) error {
	absTmpDir, err := filepath.Abs(TmpDir)
	if err != nil {
		return err
	}
	var (
		doDishes      bool = false // deprecated
		doIngredients bool = true
	)
	_, err = os.Stat(filepath.Join(absTmpDir, "dishes.links"))
	if err == nil {
		log.Printf("dishes exists, ignoring.\n")
		doDishes = false
	} else {
		if errors.Is(err, os.ErrNotExist) {
			err = nil
		} else {
			log.Fatal(err)
		}
	}
	_, err = os.Stat(filepath.Join(absTmpDir, "ingredients.links"))
	if err == nil {
		log.Printf("ingredient exists, ignoring.\n")
		doIngredients = false
	} else {
		if errors.Is(err, os.ErrNotExist) {
			err = nil
		} else {
			log.Fatal(err)
		}
	}
	err = os.MkdirAll(absTmpDir, 0o777)
	if err != nil {
		log.Fatal(err)
	}

	base_url, err := url.Parse(BaseUrl)
	if err != nil {
		log.Fatal(err)
	}

	type Job struct {
		Name   string
		IsDish bool
		Err    error
	}
	jobs := make(chan Job)
	var wg sync.WaitGroup
	resultsChan := make(chan Results, len(ingredients)+len(dishes))
	failedChan := make(chan Job, len(ingredients)+len(dishes))

	worker := func() {
		defer wg.Done()

		for job := range jobs {
			limiter.Wait(context.Background())
			c := *client
			u := *base_url

			result, err := fetchProductCodes(job.Name, &c, &u)
			if err != nil {
				log.Println(err)
				job.Err = err
				failedChan <- job
				continue
			}
			result.IsDish = job.IsDish
			resultsChan <- result
		}
	}

	for range numWorkersURL {
		wg.Add(1)
		go worker()
	}

	if doIngredients {
		for _, ingredientName := range ingredients {
			jobs <- Job{string(ingredientName), false, nil}
		}
	}
	if doDishes {
		for _, dishName := range dishes {
			jobs <- Job{string(dishName), true, nil}
		}
	}
	close(jobs)
	go func() {
		wg.Wait()
		close(resultsChan)
		close(failedChan)
	}()

	failedFile, err := os.OpenFile(
		filepath.Join(absTmpDir, "failed.links"),
		os.O_CREATE|os.O_WRONLY,
		0o777,
	)
	if err != nil {
		return err
	}
	defer failedFile.Close()
	go func() {
		for f := range failedChan {
			failedFile.WriteString(f.Name + ":" + f.Err.Error() + "\n")
		}
	}()

	ingredientFile, err := os.OpenFile(
		filepath.Join(absTmpDir, "ingredients.links"),
		os.O_CREATE|os.O_WRONLY,
		0o777,
	)
	if err != nil {
		return err
	}
	defer ingredientFile.Close()

	dishFile, err := os.OpenFile(
		filepath.Join(absTmpDir, "dishes.links"),
		os.O_CREATE|os.O_WRONLY,
		0o777,
	)
	if err != nil {
		return err
	}
	defer dishFile.Close()

	for _, name := range dishes {
		dishFile.WriteString(Delim + " " + string(name) + "\n")
	}

	for r := range resultsChan {
		if r.IsDish == true {
			dishFile.WriteString(Delim + " " + r.entityName + "\n")
			for _, url := range r.Codes {
				dishFile.WriteString(url + "\n")
			}
		} else {
			ingredientFile.WriteString(Delim + " " + r.entityName + "\n")
			for _, url := range r.Codes {
				ingredientFile.WriteString(url + "\n")
			}
		}
	}
	return nil
}

type Results struct {
	entityName string
	IsDish     bool
	Codes      []string
}

var productCodeRegex *regexp.Regexp = regexp.MustCompile(`/\d{3}/\d{3}/\d{3}/\d{4}/`)

func fetchProductCodes(entityName string, client *http.Client, baseURL *url.URL) (Results, error) {
	const maxRetries = 5
	var results Results
	results.entityName = entityName
	client.Timeout = 40 * time.Second

	queryValues := getQueryValues(entityName)

	var lastErr error

	for attempt := range maxRetries {
		baseURL.RawQuery = queryValues.Encode()

		req, err := http.NewRequest("GET", baseURL.String(), nil)
		if err != nil {
			return results, err
		}

		req.Header.Set("User-Agent", ua)
		req.Header.Set("Accept", "application/json")

		log.Printf("Fetching image product codes for %s (attempt %d)", entityName, attempt+1)

		res, err := client.Do(req)
		if err != nil {
			lastErr = err
		} else {
			func() {
				defer res.Body.Close()

				if res.StatusCode != http.StatusOK {
					lastErr = fmt.Errorf("unexpected status: %s", res.Status)
					return
				}

				var data Response
				if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
					lastErr = err
					return
				}

				for _, p := range data.Products {
					code := productCodeRegex.FindString(p.ImageURL)
					if code == "" {
						continue
					}
					results.Codes = append(results.Codes, code)
				}

				lastErr = nil
			}()

			if lastErr == nil {
				return results, nil
			}
		}

		// exponential backoff
		backoff := time.Duration(1<<attempt) * time.Second
		time.Sleep(backoff)
	}

	if len(results.Codes) == 0 {
		lastErr = fmt.Errorf("No codes returned for this product")
	}
	return results, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}
