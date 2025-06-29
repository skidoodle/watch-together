package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/csehviktor/watch-together/manager"
	"github.com/csehviktor/watch-together/routes"
	"golang.org/x/net/websocket"
)

const defaultAddr = ":3000"

func main() {
	go manager.DeleteRoomCronjob()

	http.HandleFunc("/", serveStaticFiles("ui/dist"))
	http.Handle("/createroom/", websocket.Handler(routes.HandleCreateRoom))
	http.Handle("/joinroom/{code}/", websocket.Handler(routes.HandleJoinRoom))
	http.Handle("/checkroom/{code}/", http.HandlerFunc(routes.HandleCheckRoom))

	log.Printf("starting socket server on addr %s", defaultAddr)

	if err := http.ListenAndServe(defaultAddr, nil); err != nil {
		log.Fatalln(err.Error())
	}
}

func serveStaticFiles(distDir string) http.HandlerFunc {
	fs := http.FileServer(http.Dir(distDir))

	return func(w http.ResponseWriter, r *http.Request) {
		fp := filepath.Join(distDir, r.URL.Path)
		if stat, err := os.Stat(fp); err == nil && !stat.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	}
}
