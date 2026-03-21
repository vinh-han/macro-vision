package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"

	_ "github.com/lib/pq"
)

func getImages() error {
	type Response struct {
		Products []struct {
			ImageURL string `json:"image_url"`
		} `json:"products"`
	}

	var (
		// deprecated do dishes for now
		// doDishes      bool = false
		doIngredients bool = true
		err           error
	)
	absTmpDir, err := filepath.Abs(TmpDir)
	if err != nil {
		return err
	}
	absImagesDir, err := filepath.Abs(ImagesDir)
	if err != nil {
		return err
	}
	_, err = os.Stat(filepath.Join(absImagesDir, "ingredients"))
	if err == nil {
		log.Printf("ingredients exists, stopping.\n")
		doIngredients = false
	} else {
		if errors.Is(err, os.ErrNotExist) {
			err = nil
		} else {
			log.Fatal(err)
		}
	}

	_, err = os.Stat(filepath.Join(absImagesDir, "dishes"))
	if err == nil {
		log.Printf("dishes exists, stopping.\n")
		// doDishes = false
		return nil
	} else {
		if errors.Is(err, os.ErrNotExist) {
			err = nil
		} else {
			log.Fatal(err)
		}
	}

	err = os.MkdirAll(filepath.Join(absImagesDir, "ingredients"), 0o777)
	if err != nil {
		log.Fatal(err)
	}
	err = os.MkdirAll(filepath.Join(absImagesDir, "dishes"), 0o777)
	if err != nil {
		log.Fatal(err)
	}

	type entity struct {
		IsDish bool
		Name   string
		Codes  []string
	}
	entities := []entity{}
	absIngredientsFilePath := filepath.Join(absTmpDir, "ingredients.links")
	absDishesFilePath := filepath.Join(absTmpDir, "dishes.links")
	if _, err := os.Stat(absDishesFilePath); err == nil {
		file, err := os.Open(absDishesFilePath)
		if err != nil {
			return err
		}
		reader := bufio.NewReader(file)
		for {
			line, err := reader.ReadString('\n')
			if err == io.EOF {
				break
			}
			if err != nil {
				return err
			}
			line = strings.TrimSpace(line)
			rootPath := filepath.Join(absImagesDir, "dishes")
			if strings.Contains(line, Delim) {
				name := strings.Split(line, " ")[1]
				rootPath = filepath.Join(rootPath, name)
				err = os.MkdirAll(rootPath, 0o777)
				if err != nil {
					return err
				}
				continue
			}
		}
	}
	if _, err := os.Stat(absIngredientsFilePath); err == nil && doIngredients {
		file, err := os.Open(absIngredientsFilePath)
		if err != nil {
			return err
		}
		tmp := entity{}
		tmp.IsDish = false
		reader := bufio.NewReader(file)
		for {
			line, err := reader.ReadString('\n')
			if err == io.EOF {
				break
			}
			if err != nil {
				return err
			}
			line = strings.TrimSpace(line)
			if strings.Contains(line, Delim) {
				if tmp.Name != "" {
					entities = append(entities, tmp)
				}
				tmp = entity{}
				tmp.Name = strings.Split(line, " ")[1]
				continue
			}
			tmp.Codes = append(tmp.Codes, line)
		}
		if tmp.Name != "" {
			entities = append(entities, tmp)
		}
	}
	if len(entities) == 0 {
		log.Println("no entities found")
	}
	baseUrl, err := url.Parse(ImageBucketUrl)
	if err != nil {
		return err
	}
	// getting the images for real
	type Job struct {
		Code     string
		RootPath string
	}
	jobs := make(chan Job)
	var wg sync.WaitGroup

	worker := func() {
		defer wg.Done()

		for job := range jobs {
			u := *baseUrl
			c := *client
			err := fetchImage(&u, &c, job.Code, job.RootPath)
			if err != nil {
				log.Print(err)
			}
		}
	}
	for range numWorkersImages {
		wg.Add(1)
		go worker()
	}

	for _, e := range entities {
		var rootPath string
		rootPath = filepath.Join(absImagesDir, "ingredients")
		rootPath = filepath.Join(rootPath, e.Name)
		err = os.MkdirAll(rootPath, 0o777)
		if err != nil {
			return err
		}
		for _, code := range e.Codes {
			if code == "" {
				continue
			}
			jobs <- Job{
				Code:     code,
				RootPath: rootPath,
			}
		}
	}
	close(jobs)
	wg.Wait()
	return err
}

func fetchImage(url *url.URL, client *http.Client, code string, rootPath string) error {
	var retries int = 3
	var err error
	log.Print(code)
	imageUrl := url.JoinPath(code, "1.400.jpg")
	req, err := http.NewRequest("GET", imageUrl.String(), nil)
	req.Header.Set("User-Agent", ua)
	req.Header.Set("Accept", "image/jpeg")
getImg:
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode != http.StatusOK {
		if retries != 0 {
			res.Body.Close()
			retries--
			goto getImg
		}
		res.Body.Close()
		return fmt.Errorf("Could not fetch the img, code: %d\n url: %s", res.StatusCode, imageUrl.String())
	}
	fileName, err := randomName()
	if err != nil {
		return err
	}

	file, err := os.OpenFile(
		filepath.Join(rootPath, fileName),
		os.O_CREATE|os.O_WRONLY,
		0o777,
	)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(file, res.Body)
	res.Body.Close()
	return err
}
