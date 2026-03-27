package processor

import (
	"context"
	"database/sql"
	"fmt"
	config "macro_vision/config"
	"macro_vision/custom_errors"
	database "macro_vision/database"
	http_requester "macro_vision/http_requester"
	name_processor "macro_vision/processor/name_processor"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"

	"golang.org/x/text/unicode/norm"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
)

var alt_name_regex = regexp.MustCompile(`^(.*?)\s*\((.*?)\)\s*$`)

func Process_recipes() error {
	var mainfile_path string = filepath.Join(config.Env.LINKS_FOLDER + config.Mainfile_name)
	err := database.DB.Queries.UpdateInfo(context.Background(), database.UpdateInfoParams{
		Version:     uuid.Max,
		LastScraped: time.Now(),
	})
	if err != nil {
		return err
	}
	data, err := os.ReadFile(mainfile_path)
	if err != nil {
		return err
	}
	links := strings.SplitSeq(strings.TrimSpace(string(data)), "\n")
	var course string
	for link := range links {
		if strings.Contains(link, config.Course_delim) {
			course = strings.Split(link, " ")[1]
			continue
		}
		res, err := http_requester.GetPage(link)
		if err != nil {
			return fmt.Errorf("%w\n link:%s\n err:%v", custom_errors.GetPageFailed, link, err)
		}
		doc, err := goquery.NewDocumentFromReader(res.Body)
		if err != nil {
			return fmt.Errorf("%w\n link:%s\n err:%v", custom_errors.DocumentGenerationFailed, link, err)
		}
		res.Body.Close()
		err = parse_dish(link, doc, course)
		if err != nil {
			return err
		}
	}

	return nil
}

type Ingredient_macro_temp struct {
	Name        string
	Amount      float64
	Unit        string
	DateCreated time.Time
}

func parse_dish(source string, doc *goquery.Document, course string) error {
	var dish *database.Dish = &database.Dish{}
	var ingredient_list []*Ingredient_macro_temp = []*Ingredient_macro_temp{}
	var current_time time.Time = time.Now()

	dish.Course = course
	dish.Source = source
	dish.DateCreated = current_time

	doc.Find("div.tasty-recipes-description-body>p").Each(func(i int, s *goquery.Selection) {
		dish.Description = s.Text()
	})
	doc.Find("h2.tasty-recipes-title").Each(func(i int, s *goquery.Selection) {
		main_name, alt_name := parse_alt_name(s.Text())
		// main_name should only be en, alt can be either
		if has_vietnamese_unicode(main_name) {
			dish.DishName = alt_name
			dish.AltName = sql.NullString{
				String: main_name,
				Valid:  true,
			}
			return
		}
		if has_vietnamese_unicode(alt_name) {
			clean_alt_name := strip_unicode(alt_name)
			dish.DishName = main_name
			dish.AltName = sql.NullString{
				String: clean_alt_name,
				Valid:  true,
			}
			return
		}
		dish.DishName = main_name
		dish.AltName = sql.NullString{
			String: alt_name,
			Valid:  alt_name != "",
		}
	})
	// TEMP: ignoring non-compliant dishes
	if dish.DishName == "" {
		return nil
	}
	var recipe string
	doc.Find("div.tasty-recipes-ingredients").Each(func(i int, s *goquery.Selection) {
		s.Find("ul").Each(
			func(i int, s *goquery.Selection) {
				if s.Length() == 0 {
					return
				}
				recipe = strings.TrimSpace(s.Text())
			},
		)
		if recipe == "" {
			return
		}
		dish.FullRecipe = recipe
	})
	doc.Find("h2").Each(func(i int, s *goquery.Selection) {
		if strings.Contains(strings.ToLower(s.Text()), "Ingredients") {
			s.Find("ul").Each(func(i int, s *goquery.Selection) {
				recipe = s.Text()
				if recipe != "" {
					dish.FullRecipe = recipe
				}
			})
		}
	})
	doc.Find("div.tasty-recipes-entry-content").Each(func(i int, s *goquery.Selection) {
		s.Find("h4").Each(func(i int, h4 *goquery.Selection) {
			// Find the <ul> right after <h4>
			ul := h4.NextFiltered("ul")

			ul.Find("li").Each(func(j int, li *goquery.Selection) {
				ingredient_temp := &Ingredient_macro_temp{}
				ingredient_temp.DateCreated = dish.DateCreated

				if sel := li.Find("span.nutrifox-name"); sel.Length() > 0 {
					ingredient_temp.Name = sel.Text()
					amount, err := strconv.ParseFloat(li.Find("span.nutrifox-quantity").Text(), 64)
					if err != nil {
						ingredient_temp.Amount = 0.0
					} else {
						ingredient_temp.Amount = amount
					}
					ingredient_temp.Unit = li.Find("span.nutrifox-unit").Text()
					ingredient_list = append(ingredient_list, ingredient_temp)
					return

				}
				if sel := li.Find("span[data-amount], span[data-unit]"); sel.Length() > 0 {
					if sel := li.Find("a"); sel.Length() > 0 {
						ingredient_temp.Name = strings.TrimSpace(sel.Text())
					} else {
						clone := li.Clone()
						clone.Children().Remove()
						ingredient_temp.Name = strings.TrimSpace(clone.Text())
					}
					amount, err := strconv.ParseFloat(sel.AttrOr("data-amount", "0.0"), 64)
					if err != nil {
						amount = 0.0
					}
					ingredient_temp.Amount = amount
					ingredient_temp.Unit = sel.AttrOr("data-unit", "N/A")
					ingredient_list = append(ingredient_list, ingredient_temp)
					return
				}
				fullText := strings.TrimSpace(li.Text())
				spanText := strings.TrimSpace(li.Find("span").Text())
				ingredient_temp.Name = strings.TrimSpace(strings.Replace(fullText, spanText, "", 1))
				ingredient_temp.Amount = 0.0
				ingredient_temp.Unit = "N/A"
				ingredient_list = append(ingredient_list, ingredient_temp)
			})
		})
	})
	ingredient_list, err := Process_Ingredient(ingredient_list)
	if err != nil {
		return err
	}

	dish_id, err := database.DB.Queries.Insert_dish(context.Background(), database.Insert_dishParams{
		DishID:      uuid.New(),
		DishName:    dish.DishName,
		Course:      dish.Course,
		Source:      dish.Source,
		AltName:     dish.AltName,
		FullRecipe:  dish.FullRecipe,
		Description: dish.Description,
		DateCreated: dish.DateCreated,
	})
	if err != nil {
		return err
	}
	for _, ingredient := range ingredient_list {
		if ingredient.Name == "" {
			continue
		}
		ingredient_id, err := database.DB.Queries.Upsert_ingredient(context.Background(), database.Upsert_ingredientParams{
			IngredientID:   uuid.New(),
			IngredientName: ingredient.Name,
			DateCreated:    dish.DateCreated,
		})
		if err == sql.ErrNoRows {
			continue
		}
		if err != nil {
			return err
		}
		err = database.DB.Queries.Insert_dish_ingredients(context.Background(), database.Insert_dish_ingredientsParams{
			DishID:       dish_id,
			IngredientID: ingredient_id,
			Amount:       float32(ingredient.Amount),
			Unit:         ingredient.Unit,
		})
	}
	return nil
}

func parse_alt_name(name string) (main_name, alt_name string) {
	matches := alt_name_regex.FindStringSubmatch(name)
	if len(matches) == 3 {
		main_name = strings.TrimSpace(matches[1])
		alt_name = strings.TrimSpace(matches[2])
	} else {
		return name, ""
	}
	return main_name, alt_name
}

// technically a hack since this only check for non-ascii
//
// if it works it works
func has_vietnamese_unicode(text string) bool {
	for _, r := range text {
		if r > 127 { // non-ASCII character
			return true
		}
	}
	return false
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

func Process_Ingredient(ings []*Ingredient_macro_temp) ([]*Ingredient_macro_temp, error) {
	result := make([]*Ingredient_macro_temp, len(ings))

	var wg sync.WaitGroup
	errCh := make(chan error, 1)

	for i, ing := range ings {
		wg.Add(1)

		go func(i int, ing *Ingredient_macro_temp) {
			defer wg.Done()

			name, err := name_processor.Process_name(ing.Name)
			if err != nil {
				select {
				case errCh <- err:
				default:
				}
				return
			}

			ing.Name = name
			result[i] = ing
		}(i, ing)
	}

	wg.Wait()

	select {
	case err := <-errCh:
		return nil, err
	default:
	}

	return result, nil
}
