package main

import (
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	_ "golang.org/x/image/webp"

	"github.com/gabriel-vasile/mimetype"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

const (
	ImageProcessingWorkers int = 8
)

var wg *sync.WaitGroup = &sync.WaitGroup{}

func postProcess() error {
	absTmpDir, err := filepath.Abs(TmpDir)
	if err != nil {
		return err
	}
	absImagesDir, err := filepath.Abs(ImagesDir)
	if err != nil {
		return err
	}

	newImagesDir := filepath.Join(absTmpDir, "images")
	newDishesDir := filepath.Join(newImagesDir, "dishes")
	newIngredientsDir := filepath.Join(newImagesDir, "ingredients")
	err = os.MkdirAll(newDishesDir, 0o777)
	if err != nil {
		return err
	}

	err = os.MkdirAll(newIngredientsDir, 0o777)
	if err != nil {
		return err
	}

	type ImageJobs struct {
		Dir    string
		IsDish bool
	}
	jobs := make(chan ImageJobs, ImageProcessingWorkers*4)
	worker := func() {
		defer wg.Done()

		for job := range jobs {
			var (
				path    string
				outPath string
			)
			if job.IsDish {
				path = newDishesDir
			} else {
				path = newIngredientsDir
			}
			outPath = filepath.Join(path, filepath.Base(job.Dir))
			if err := os.MkdirAll(filepath.Dir(outPath), 0o777); err != nil {
				log.Println(err)
				continue
			}
			newName := filepath.Base(filepath.Dir(job.Dir))
			if err := convertToWebp(job.Dir, outPath, newName, job.IsDish); err != nil {
				log.Printf("ERROR: %v", err)
			}
		}
	}
	for range ImageProcessingWorkers {
		wg.Add(1)
		go worker()
	}

	err = filepath.WalkDir(absImagesDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		mime, err := mimetype.DetectFile(path)
		if err != nil {
			return err
		}
		if !strings.HasPrefix(mime.String(), "image/") {
			return nil
		}
		log.Println(path)
		relPath, err := filepath.Rel(absImagesDir, path)
		if err != nil {
			return err
		}
		isDish := strings.Split(relPath, string(os.PathSeparator))[0] == "dishes"
		jobs <- ImageJobs{
			Dir:    path,
			IsDish: isDish,
		}

		return nil
	})
	if err != nil {
		return err
	}
	close(jobs)
	wg.Wait()
	return nil
}

const (
	ingredientSize int = 400
	dishSize       int = 800
)

var webpOpts *webp.Options = &webp.Options{
	Quality: 80,
	Exact:   false,
}

func convertToWebp(inPath string, outPath string, newName string, isDish bool) error {
	file, err := os.Open(inPath)
	if err != nil {
		return err
	}
	defer file.Close()
	image, _, err := image.Decode(file)
	if err != nil {
		return err
	}
	newPath := filepath.Join(filepath.Dir(outPath), newName) + ".webp"

    var size int
    if isDish{
        size = dishSize
    } else {
        size = ingredientSize
    }
    resized := imaging.Resize(image, size, 0, imaging.Lanczos)
	out, err := os.OpenFile(
		newPath,
		os.O_CREATE|os.O_WRONLY,
		0o777,
	)
	if err != nil {
		return err
	}
	defer out.Close()
	webp.Encode(out, resized, webpOpts)
	return nil
}
