package scraper

import (
	"fmt"
	config "macro_vision/config"
	"math/rand/v2"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var excluded_courses []string = []string{
	"snacks",
	"drinks",
}

var courses []string = []string{
	"main-dishes", "appetizers", "breakfast", "desserts", "drinks", "salads", "side-dishes", "snacks", "soups",
}

func Scrape() error {
	var cleaned_courses []string = []string{}
	// stripping the excluded courses
	for _, course := range courses {
		if slices.Contains(excluded_courses, course) {
			continue
		}
		cleaned_courses = append(cleaned_courses, course)
	}
	if _, err := os.Stat(filepath.Join(config.Env.LINKS_FOLDER, config.Mainfile_name)); os.IsNotExist(err) {
		fmt.Println("No links files found, scraping.")
		for _, course := range cleaned_courses {
			fmt.Printf("Scraping course: %s\n", course)
			links, err := scrape_course(course)
			if err != nil {
				return err
			}

			err = save_links(course, links)
			if err != nil {
				return err
			}
		}
	}
	total_recipe()
	return nil
}

func save_links(course string, links []string) error {
	var (
		file *os.File
		err  error
	)
	file, err = os.OpenFile(
		fmt.Sprintf("%s/%s_recipe_links%s", config.Env.LINKS_FOLDER, course, config.Links_file_extension),
		os.O_RDWR|os.O_TRUNC|os.O_CREATE,
		0666,
	)
	if err != nil {
		return err
	}
	defer file.Close()
	links = string_dedupe(links)

	_, err = file.WriteString(config.Course_delim + course + "\n")
	if err != nil {
		return err
	}

	for _, link := range links {
		_, err := file.WriteString(link + "\n")
		if err != nil {
			return err
		}
	}
	return nil
}

func total_recipe() error {
	var all_links []string

	main_file, err := os.OpenFile(
		filepath.Join(config.Env.LINKS_FOLDER, config.Mainfile_name), os.O_RDWR|os.O_TRUNC|os.O_CREATE, 0666)
	if err != nil {
		return err
	}
	defer main_file.Close()

	entries, err := os.ReadDir(config.Env.LINKS_FOLDER)
	if err != nil {
		return fmt.Errorf("failed to read directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != config.Links_file_extension {
			continue
		}

		filePath := filepath.Join(config.Env.LINKS_FOLDER, entry.Name())
		links, err := os.ReadFile(filePath)
		if err != nil {
			return err
		}
		lines := strings.SplitSeq(strings.TrimSpace(string(links)), "\n")
		for line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				all_links = append(all_links, line)
			}
		}

	}
	clean_links := string_dedupe(all_links)
	main_file.WriteString(strings.Join(clean_links, "\n"))
	return nil
}

func scrape_course(course string) ([]string, error) {
	var (
		links        []string
		current_page int  = 0
		wait_time    int  = 0
		has_more     bool = true
		err          error
		current_url  string
		res          *http.Response
	)

	for has_more == true {
		fmt.Printf("Processing page %d\n", current_page)
		current_url = fmt.Sprintf(config.Base_url, course, current_page)
		res, err = get_page(current_url)
		if err != nil {
			return nil, err
		}
		defer res.Body.Close()
		doc, err := goquery.NewDocumentFromReader(res.Body)
		if err != nil {
			return nil, err
		}
		links, err = find_recipe_links(doc, links)
		if err != nil {
			return nil, err
		}

		if len(doc.Find(".wp-block-query-pagination-next").Text()) == 0 {
			has_more = false
			fmt.Println("No more pages, terminating link scrape")
		} else {
			current_page += 1
		}
		wait_time = rand.IntN(config.Wait_per_req_s_max) + 1
		fmt.Printf("resting for %d seconds\n", wait_time)
		time.Sleep(time.Duration(time.Second * time.Duration(wait_time)))
	}

	return links, nil
}

func find_recipe_links(doc *goquery.Document, links []string) ([]string, error) {
	doc.Find(".wp-block-post-title").Each(func(i int, selection *goquery.Selection) {
		selection.Find("a").Each(func(i int, selection *goquery.Selection) {
			link, exists := selection.Attr("href")
			if exists {
				if strings.Contains(link, config.Recipe_url_template) {
					links = append(links, link)
				}
			}
		})
	})
	return links, nil
}

func get_page(url string) (*http.Response, error) {
	var res *http.Response
	var err error
	req, err := http.NewRequest("GET", url, nil)
	client := &http.Client{}
	req.Header.Set("User-Agent", config.Env.USER_AGENT)
	if err != nil {
		return nil, err
	}
	res, err = client.Do(req)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func string_dedupe(list []string) []string {
	keys := make(map[string]bool)
	deduped := []string{}
	for _, item := range list {
		item = strings.TrimSpace(item)
		if _, value := keys[item]; !value {
			keys[item] = true
			deduped = append(deduped, item)
		}
	}
	return deduped
}
