package httprequester

import (
	"crypto/tls"
	"log"
	config "macro_vision/config"
	"math/rand/v2"
	"net/http"
	"time"
)

func GetPage(url string) (*http.Response, error) {
	var res *http.Response
	var err error
	req, err := http.NewRequest("GET", url, nil)
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				MaxVersion:         tls.VersionTLS12,
				MinVersion:         tls.VersionTLS12,
			},
		},
	}
	req.Header.Set("User-Agent", config.Env.USER_AGENT)
	if err != nil {
		return nil, err
	}
	log.Printf("Getting page content for %s", url)
	res, err = client.Do(req)
	if err != nil {
		return nil, err
	}
	wait_time := rand.IntN(config.Wait_per_req_s_max) + 1
	log.Printf("resting for %d seconds\n", wait_time)
	time.Sleep(time.Duration(time.Second * time.Duration(wait_time)))
	return res, nil
}
