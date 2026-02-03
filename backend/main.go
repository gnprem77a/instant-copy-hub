package main

// Lovable sync trigger: no functional change

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	baseWorkDir     = "/app/work"
	defaultFilename = "output.pdf"
)

type downloadResponse struct {
	DownloadURL string `json:"downloadUrl"`
}

type previewPage struct {
	PageNumber int    `json:"pageNumber"`
	ImageURL   string `json:"imageUrl"`
}

type previewResponse struct {
	Pages []previewPage `json:"pages"`
}

func main() {
	if err := os.MkdirAll(baseWorkDir, 0o755); err != nil {
		log.Fatalf("failed to create work dir: %v", err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// Backwards-compatible routes:
	mux.HandleFunc("/pdf/merge", handleMerge)
	mux.HandleFunc("/pdf/split", handleSplit)
	mux.HandleFunc("/pdf/remove-pages", handleRemovePages)
	mux.HandleFunc("/pdf/extract-pages", handleExtractPages)
	mux.HandleFunc("/pdf/scan-to-pdf", handleScanToPDF)
	mux.HandleFunc("/pdf/compress", handleCompress)
	mux.HandleFunc("/pdf/repair", handleRepair)
	mux.HandleFunc("/pdf/ocr", handleOCR)
	mux.HandleFunc("/pdf/convert-to-pdfa", handleConvertToPDFA)
	mux.HandleFunc("/pdf/image-to-pdf", handleImageToPDF)
	mux.HandleFunc("/pdf/word-to-pdf", handleWordToPDF)
	mux.HandleFunc("/pdf/preview", handlePreview)
	mux.HandleFunc("/pdf/organize", handleOrganize)
	mux.HandleFunc("/pdf/rotate", handleRotate)
	mux.HandleFunc("/pdf/crop", handleCrop)
	mux.HandleFunc("/pdf/page-numbers", handlePageNumbers)
	mux.HandleFunc("/pdf/watermark", handleWatermark)

	// Preferred API base for the frontend: VITE_PDF_API_BASE_URL="/api/pdf"
	mux.HandleFunc("/api/pdf/merge", handleMerge)
	mux.HandleFunc("/api/pdf/split", handleSplit)
	mux.HandleFunc("/api/pdf/remove-pages", handleRemovePages)
	mux.HandleFunc("/api/pdf/extract-pages", handleExtractPages)
	mux.HandleFunc("/api/pdf/scan-to-pdf", handleScanToPDF)
	mux.HandleFunc("/api/pdf/compress", handleCompress)
	mux.HandleFunc("/api/pdf/repair", handleRepair)
	mux.HandleFunc("/api/pdf/ocr", handleOCR)
	mux.HandleFunc("/api/pdf/convert-to-pdfa", handleConvertToPDFA)
	mux.HandleFunc("/api/pdf/image-to-pdf", handleImageToPDF)
	mux.HandleFunc("/api/pdf/word-to-pdf", handleWordToPDF)
	mux.HandleFunc("/api/pdf/preview", handlePreview)
	mux.HandleFunc("/api/pdf/organize", handleOrganize)
	mux.HandleFunc("/api/pdf/rotate", handleRotate)
	mux.HandleFunc("/api/pdf/crop", handleCrop)
	mux.HandleFunc("/api/pdf/page-numbers", handlePageNumbers)
	mux.HandleFunc("/api/pdf/watermark", handleWatermark)

	// PDF Security Tools
	mux.HandleFunc("/api/pdf/protect", handleProtectPDF)
	mux.HandleFunc("/pdf/protect", handleProtectPDF)
	mux.HandleFunc("/api/pdf/unlock", handleUnlockPDF)
	mux.HandleFunc("/pdf/unlock", handleUnlockPDF)
	mux.HandleFunc("/api/pdf/redact", handleRedactPDF)
	mux.HandleFunc("/pdf/redact", handleRedactPDF)
	mux.HandleFunc("/api/pdf/flatten", handleFlattenPDF)
	mux.HandleFunc("/pdf/flatten", handleFlattenPDF)

	// PDF Conversion Tools
	mux.HandleFunc("/api/pdf/pdf-to-word", handlePDFToWord)
	mux.HandleFunc("/pdf/pdf-to-word", handlePDFToWord)
	mux.HandleFunc("/api/pdf/pdf-to-excel", handlePDFToExcel)
	mux.HandleFunc("/pdf/pdf-to-excel", handlePDFToExcel)
	mux.HandleFunc("/api/pdf/pdf-to-powerpoint", handlePDFToPowerPoint)
	mux.HandleFunc("/pdf/pdf-to-powerpoint", handlePDFToPowerPoint)
	mux.HandleFunc("/api/pdf/pdf-to-jpg", handlePDFToJPG)
	mux.HandleFunc("/pdf/pdf-to-jpg", handlePDFToJPG)
	mux.HandleFunc("/api/pdf/extract-text", handleExtractText)
	mux.HandleFunc("/pdf/extract-text", handleExtractText)
	mux.HandleFunc("/api/pdf/extract-images", handleExtractImages)
	mux.HandleFunc("/pdf/extract-images", handleExtractImages)
	mux.HandleFunc("/api/pdf/html-to-pdf", handleHTMLToPDF)
	mux.HandleFunc("/pdf/html-to-pdf", handleHTMLToPDF)
	mux.HandleFunc("/api/pdf/excel-to-pdf", handleExcelToPDF)
	mux.HandleFunc("/pdf/excel-to-pdf", handleExcelToPDF)
	mux.HandleFunc("/api/pdf/powerpoint-to-pdf", handlePowerPointToPDF)
	mux.HandleFunc("/pdf/powerpoint-to-pdf", handlePowerPointToPDF)

	// Advanced PDF Tools
	mux.HandleFunc("/api/pdf/compare", handleComparePDFs)
	mux.HandleFunc("/pdf/compare", handleComparePDFs)
	mux.HandleFunc("/api/pdf/digital-signature", handleDigitalSignature)
	mux.HandleFunc("/pdf/digital-signature", handleDigitalSignature)
	mux.HandleFunc("/api/pdf/validate-pdfa", handleValidatePDFA)
	mux.HandleFunc("/pdf/validate-pdfa", handleValidatePDFA)
	mux.HandleFunc("/api/pdf/pdf-to-html", handlePDFToHTML)
	mux.HandleFunc("/pdf/pdf-to-html", handlePDFToHTML)
	mux.HandleFunc("/api/pdf/add-header-footer", handleAddHeaderFooter)
	mux.HandleFunc("/pdf/add-header-footer", handleAddHeaderFooter)

	mux.HandleFunc("/downloads/", serveDownload)
	mux.HandleFunc("/previews/", servePreview)

	// Simple background cleanup for old jobs.
	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			cleanupOldJobs(2 * time.Hour) // adjust retention as needed
		}
	}()

	addr := ":8080"
	log.Printf("PDF backend listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func parseIntDefault(s string, def int) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func parseFloatDefault(s string, def float64) float64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return def
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return def
	}
	return f
}

func sanitizeFilename(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	// Replace path separators just in case.
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	name = strings.TrimSpace(name)
	if name == "" {
		return "file"
	}
	return name
}

func baseNameWithoutExt(filename string) string {
	filename = sanitizeFilename(filename)
	return strings.TrimSuffix(filename, filepath.Ext(filename))
}

func pageCountPoppler(dir, inPath string) (int, error) {
	// Uses poppler-utils (pdfinfo), which is already a required dependency for previews.
	out, err := runCommandOutput(dir, "pdfinfo", inPath)
	if err != nil {
		return 0, fmt.Errorf("pdfinfo failed: %w", err)
	}
	for _, line := range strings.Split(out, "\n") {
		trim := strings.TrimSpace(line)
		if strings.HasPrefix(trim, "Pages:") {
			parts := strings.Fields(trim)
			if len(parts) >= 2 {
				n, err := strconv.Atoi(parts[len(parts)-1])
				if err == nil && n > 0 {
					return n, nil
				}
			}
		}
	}
	return 0, fmt.Errorf("could not parse page count")
}

func pageCountPDF(dir, inPath string) (int, error) {
	out, err := runCommandOutput(dir, "pdfcpu", "info", inPath)
	if err != nil {
		return 0, fmt.Errorf("pdfcpu info failed: %w", err)
	}
	// Typical line: "Pages:             12"
	for _, line := range strings.Split(out, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "Pages:") {
			parts := strings.Fields(line)
			// Fields: [Pages: 12]
			if len(parts) >= 2 {
				n, err := strconv.Atoi(parts[len(parts)-1])
				if err == nil {
					return n, nil
				}
			}
		}
	}
	return 0, fmt.Errorf("could not parse page count")
}

func handleRotate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	degrees := parseIntDefault(r.FormValue("degrees"), 90)
	if degrees != 90 && degrees != 180 && degrees != 270 {
		errorJSON(w, http.StatusBadRequest, "degrees must be 90, 180, or 270")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	if err := runCommand(dir, "pdfcpu", "rotate", inPath, strconv.Itoa(degrees), outPath); err != nil {
		log.Printf("rotate error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to rotate PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleCrop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	desc := strings.TrimSpace(r.FormValue("description"))
	if desc == "" {
		errorJSON(w, http.StatusBadRequest, "description is required")
		return
	}
	unit := strings.TrimSpace(r.FormValue("unit"))
	if unit == "" {
		unit = "po"
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	args := []string{"crop", "-u", unit, "--", desc, inPath, outPath}
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("crop error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to crop PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handlePageNumbers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	pos := strings.TrimSpace(r.FormValue("position"))
	if pos == "" {
		pos = "bc"
	}
	fontSize := parseIntDefault(r.FormValue("fontSize"), 10)
	if fontSize < 6 {
		fontSize = 6
	}
	if fontSize > 72 {
		fontSize = 72
	}
	opacity := parseFloatDefault(r.FormValue("opacity"), 0.95)
	if opacity < 0 {
		opacity = 0
	}
	if opacity > 1 {
		opacity = 1
	}
	startAt := parseIntDefault(r.FormValue("startAt"), 1)
	if startAt < 1 {
		startAt = 1
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	// iLovePDF-style robustness:
	// Avoid repeatedly stamping the same PDF in-place (pdfcpu may stack stamp resources).
	// Instead:
	// 1) extract pages into single-page PDFs
	// 2) stamp each single-page PDF once
	// 3) merge back into a clean output PDF

	total, err := pageCountPDF(dir, inPath)
	if err != nil {
		log.Printf("page numbers: page count error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to read page count")
		return
	}

	pagesDir := filepath.Join(dir, "pages")
	if err := os.MkdirAll(pagesDir, 0o755); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
		return
	}

	if err := runCommand(dir, "pdfcpu", "extract", "-mode", "page", inPath, pagesDir); err != nil {
		log.Printf("page numbers: extract pages error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to prepare pages")
		return
	}

	// Make stamping deterministic (no default relative scale / diagonal).
	// - scale:1 abs => exact font size in points
	// - rot:0 => no diagonal behavior
	// - fillc => readable neutral gray
	desc := fmt.Sprintf("pos:%s, points:%d, scale:1 abs, rot:0, op:%.2f, fillc:.2 .2 .2", pos, fontSize, opacity)

	stamped := make([]string, 0, total)
	for i := 1; i <= total; i++ {
		// pdfcpu extract names are typically "page_1.pdf", "page_2.pdf" ...
		// but we don't rely on that; we scan for the first file that ends with "_%d.pdf" or "-%d.pdf".
		// We also fall back to the common "page_%d.pdf" pattern.
		pagePath := filepath.Join(pagesDir, fmt.Sprintf("page_%d.pdf", i))
		if _, err := os.Stat(pagePath); err != nil {
			// Fallback for different naming conventions.
			// Try: "page-%d.pdf".
			alt := filepath.Join(pagesDir, fmt.Sprintf("page-%d.pdf", i))
			if _, err2 := os.Stat(alt); err2 == nil {
				pagePath = alt
			}
		}

		label := fmt.Sprintf("%d", startAt+(i-1))
		outPage := filepath.Join(dir, fmt.Sprintf("stamped-%04d.pdf", i))
		if err := runCommand(dir, "pdfcpu", "stamp", "add", "-mode", "text", "--", label, desc, pagePath, outPage); err != nil {
			log.Printf("page numbers: stamp error (page=%d): %v", i, err)
			errorJSON(w, http.StatusInternalServerError, "failed to add page numbers")
			return
		}
		stamped = append(stamped, outPage)
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)
	args := append([]string{"merge", outPath}, stamped...)
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("page numbers: merge error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to write output")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleWatermark(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	text := strings.TrimSpace(r.FormValue("text"))
	if text == "" {
		errorJSON(w, http.StatusBadRequest, "text is required")
		return
	}

	pos := strings.TrimSpace(r.FormValue("position"))
	if pos == "" {
		pos = "c"
	}
	rot := parseIntDefault(r.FormValue("rotation"), 45)
	fontSize := parseIntDefault(r.FormValue("fontSize"), 48)
	if fontSize < 8 {
		fontSize = 8
	}
	if fontSize > 200 {
		fontSize = 200
	}
	opacity := parseFloatDefault(r.FormValue("opacity"), 0.25)
	if opacity < 0 {
		opacity = 0
	}
	if opacity > 1 {
		opacity = 1
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	// Use stamp (foreground) for reliability on scanned PDFs.
	desc := fmt.Sprintf("pos:%s, rot:%d, points:%d, op:%.2f, c:.9 .9 .9", pos, rot, fontSize, opacity)
	if err := runCommand(dir, "pdfcpu", "stamp", "add", "-mode", "text", "--", text, desc, inPath, outPath); err != nil {
		log.Printf("watermark(stamp) error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to add watermark")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

type organizeRotation struct {
	PageNumber int `json:"pageNumber"`
	Degrees    int `json:"degrees"`
}

func handleOrganize(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	order := strings.TrimSpace(r.FormValue("order"))
	if order == "" {
		errorJSON(w, http.StatusBadRequest, "order is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	workPath := filepath.Join(dir, "work.pdf")
	if b, err := os.ReadFile(inPath); err == nil {
		_ = os.WriteFile(workPath, b, 0o644)
	} else {
		errorJSON(w, http.StatusInternalServerError, "failed to prepare work file")
		return
	}

	// Optional per-page rotations.
	rotationsRaw := strings.TrimSpace(r.FormValue("rotations"))
	if rotationsRaw != "" {
		var rotations []organizeRotation
		if err := json.Unmarshal([]byte(rotationsRaw), &rotations); err != nil {
			errorJSON(w, http.StatusBadRequest, "invalid rotations")
			return
		}

		// Group pages by degrees.
		buckets := map[int][]int{90: {}, 180: {}, 270: {}}
		for _, rot := range rotations {
			deg := ((rot.Degrees % 360) + 360) % 360
			if deg == 0 {
				continue
			}
			if deg != 90 && deg != 180 && deg != 270 {
				continue
			}
			if rot.PageNumber <= 0 {
				continue
			}
			buckets[deg] = append(buckets[deg], rot.PageNumber)
		}

		for _, deg := range []int{90, 180, 270} {
			if len(buckets[deg]) == 0 {
				continue
			}
			sort.Ints(buckets[deg])
			parts := make([]string, 0, len(buckets[deg]))
			for _, p := range buckets[deg] {
				parts = append(parts, strconv.Itoa(p))
			}
			pagesSpec := strings.Join(parts, ",")

			// pdfcpu rotate rotates in-place.
			// Example: pdfcpu rotate -pages 1-2 test.pdf -90
			if err := runCommand(dir, "pdfcpu", "rotate", "-pages", pagesSpec, workPath, fmt.Sprintf("-%d", deg)); err != nil {
				log.Printf("organize rotate error: %v", err)
				errorJSON(w, http.StatusInternalServerError, "failed to rotate pages")
				return
			}
		}
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	// Reorder + delete by collecting pages in the specified order.
	if err := runCommand(dir, "pdfcpu", "collect", "-pages", order, workPath, outPath); err != nil {
		log.Printf("organize collect error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to organize PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func buildPreviewURL(r *http.Request, jobID, filename string) string {
	base := inferBaseURL(r)
	return fmt.Sprintf("%s/previews/%s/%s", base, jobID, filename)
}

func newJobDir() (string, string, error) {
	jobID := uuid.NewString()
	dir := filepath.Join(baseWorkDir, jobID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", "", err
	}
	return jobID, dir, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func errorJSON(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func inferBaseURL(r *http.Request) string {
	scheme := "http"
	if r.Header.Get("X-Forwarded-Proto") == "https" || r.TLS != nil {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s", scheme, r.Host)
}

func buildDownloadURL(r *http.Request, jobID, filename string) string {
	base := inferBaseURL(r)
	return fmt.Sprintf("%s/downloads/%s/%s", base, jobID, filename)
}

func saveUploadedFile(fileHeader *multipart.FileHeader, dst string) error {
	src, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}

func runCommand(dir string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func runCommandOutput(dir string, name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func zipDirectory(srcDir, zipPath string) error {
	f, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer f.Close()

	zw := zip.NewWriter(f)
	defer zw.Close()

	return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		rel, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		w, err := zw.Create(rel)
		if err != nil {
			return err
		}
		in, err := os.Open(path)
		if err != nil {
			return err
		}
		defer in.Close()
		_, err = io.Copy(w, in)
		return err
	})
}

// === Handlers ===

func handleMerge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil { // 64MB
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		errorJSON(w, http.StatusBadRequest, "no files provided")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	var inputPaths []string
	for i, fh := range files {
		inPath := filepath.Join(dir, fmt.Sprintf("input_%d.pdf", i))
		if err := saveUploadedFile(fh, inPath); err != nil {
			errorJSON(w, http.StatusInternalServerError, "failed to save input file")
			return
		}
		inputPaths = append(inputPaths, inPath)
	}

	outName := r.FormValue("outputFilename")
	if outName == "" {
		outName = defaultFilename
	}
	outPath := filepath.Join(dir, outName)

	args := append([]string{"merge", outPath}, inputPaths...)
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("merge error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to merge PDFs")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleSplit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}
	file.Close()

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	origBase := baseNameWithoutExt(header.Filename)
	// Use a stable filename for processing to avoid odd characters/spaces.
	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	mode := r.FormValue("mode")
	ranges := r.FormValue("ranges")

	pagesDir := filepath.Join(dir, "pages")
	if err := os.MkdirAll(pagesDir, 0o755); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
		return
	}

	var args []string
	if mode == "ranges" && ranges != "" {
		args = []string{"extract", "-mode", "page", "-pages", ranges, inPath, pagesDir}
	} else {
		args = []string{"extract", "-mode", "page", inPath, pagesDir}
	}

	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("split error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to split PDF")
		return
	}

	zipName := fmt.Sprintf("%s_split_pages.zip", origBase)
	zipPath := filepath.Join(dir, zipName)
	if err := zipDirectory(pagesDir, zipPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to zip pages")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
}

func handleRemovePages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	pages := r.FormValue("pages")
	if pages == "" {
		errorJSON(w, http.StatusBadRequest, "pages is required")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	args := []string{"pages", "remove", "-pages", pages, inPath, outPath}
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("remove pages error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to remove pages")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleExtractPages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	mode := r.FormValue("mode")
	ranges := r.FormValue("ranges")

	if mode == "ranges" && ranges != "" {
		outName := defaultFilename
		outPath := filepath.Join(dir, outName)
		args := []string{"collect", "-pages", ranges, inPath, outPath}
		if err := runCommand(dir, "pdfcpu", args...); err != nil {
			log.Printf("extract ranges error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "failed to extract pages")
			return
		}
		writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
		return
	}

	// mode == all -> ZIP with each page
	pagesDir := filepath.Join(dir, "pages")
	if err := os.MkdirAll(pagesDir, 0o755); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
		return
	}

	args := []string{"extract", "-mode", "page", inPath, pagesDir}
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("extract all pages error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to extract pages")
		return
	}

	zipPath := filepath.Join(dir, "extracted_pages.zip")
	if err := zipDirectory(pagesDir, zipPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to zip pages")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, "extracted_pages.zip")})
}

func handleScanToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(256 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		errorJSON(w, http.StatusBadRequest, "no files provided")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	var imagePaths []string
	for i, fh := range files {
		inPath := filepath.Join(dir, fmt.Sprintf("scan_%d%s", i, filepath.Ext(fh.Filename)))
		if err := saveUploadedFile(fh, inPath); err != nil {
			errorJSON(w, http.StatusInternalServerError, "failed to save image")
			return
		}
		imagePaths = append(imagePaths, inPath)
	}

	// First, convert images to a single PDF using ImageMagick.
	rawPDF := filepath.Join(dir, "scans_raw.pdf")
	args := append(imagePaths, rawPDF)
	if err := runCommand(dir, "convert", args...); err != nil {
		log.Printf("scan convert error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to convert scans")
		return
	}

	// Then run OCR to produce a searchable PDF.
	outName := defaultFilename
	outPath := filepath.Join(dir, outName)
	if err := runCommand(dir, "ocrmypdf", "--skip-text", rawPDF, outPath); err != nil {
		log.Printf("scan ocr error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to OCR scans")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleCompress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	level := strings.ToLower(r.FormValue("level"))
	if level == "" {
		level = "medium"
	}

	// Map logical levels to Ghostscript PDFSETTINGS.
	setting := "/screen"
	switch level {
	case "low":
		setting = "/screen"
	case "medium":
		setting = "/ebook"
	case "high":
		setting = "/printer"
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	args := []string{
		"-sDEVICE=pdfwrite",
		"-dCompatibilityLevel=1.4",
		"-dPDFSETTINGS=" + setting,
		"-dNOPAUSE",
		"-dQUIET",
		"-dBATCH",
		"-sOutputFile=" + outPath,
		inPath,
	}

	if err := runCommand(dir, "gs", args...); err != nil {
		log.Printf("compress error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to compress PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleRepair(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	// pdfcpu optimize also repairs many structural issues.
	args := []string{"optimize", inPath, outPath}
	if err := runCommand(dir, "pdfcpu", args...); err != nil {
		log.Printf("repair error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to repair PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleOCR(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	outName := defaultFilename
	outPath := filepath.Join(dir, outName)

	lang := r.FormValue("lang")
	args := []string{"--skip-text"}
	if lang != "" {
		args = append(args, "-l", lang)
	}
	args = append(args, inPath, outPath)

	if err := runCommand(dir, "ocrmypdf", args...); err != nil {
		log.Printf("ocr error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to OCR PDF")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleImageToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(256 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		errorJSON(w, http.StatusBadRequest, "no files provided")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	var imagePaths []string
	for i, fh := range files {
		inPath := filepath.Join(dir, fmt.Sprintf("image_%d%s", i, filepath.Ext(fh.Filename)))
		if err := saveUploadedFile(fh, inPath); err != nil {
			errorJSON(w, http.StatusInternalServerError, "failed to save image")
			return
		}
		imagePaths = append(imagePaths, inPath)
	}

	outName := r.FormValue("outputFilename")
	if outName == "" {
		outName = defaultFilename
	}
	outPath := filepath.Join(dir, outName)

	args := append(imagePaths, outPath)
	if err := runCommand(dir, "convert", args...); err != nil {
		log.Printf("image to pdf error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to convert images")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleWordToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(128 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inPath := filepath.Join(dir, header.Filename)
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	// LibreOffice will write the PDF into the same directory.
	if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", inPath); err != nil {
		log.Printf("libreoffice error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to convert document")
		return
	}

	// LibreOffice names the output based on the input file with .pdf extension.
	base := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename)) + ".pdf"
	outName := base
	outPath := filepath.Join(dir, outName)

	if _, err := os.Stat(outPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "converted PDF not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handlePreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	// Use a stable filename so the previews handler can reliably locate the source PDF.
	inPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	// Progressive preview (iLovePDF-style):
	// Instead of rendering ALL pages up-front (slow for large PDFs), we:
	// 1) determine total page count
	// 2) return predictable per-page image URLs
	// 3) generate each thumbnail lazily on first request to /previews/*
	previewsDir := filepath.Join(dir, "previews")
	if err := os.MkdirAll(previewsDir, 0o755); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create previews dir")
		return
	}

	// Count pages using poppler (more tolerant + matches preview toolchain).
	// Fallback to pdfcpu info if pdfinfo fails.
	total, err := pageCountPoppler(dir, inPath)
	if err != nil {
		total, err = pageCountPDF(dir, inPath)
		if err != nil {
			log.Printf("preview: page count error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "failed to read page count")
			return
		}
	}

	pages := make([]previewPage, 0, total)
	for i := 1; i <= total; i++ {
		// pdftoppm naming: page-<n>.png
		pages = append(pages, previewPage{PageNumber: i, ImageURL: buildPreviewURL(r, jobID, filepath.Join("previews", fmt.Sprintf("page-%d.png", i)))})
	}

	// Kick off background rendering for ALL pages (non-blocking), so previews are warm
	// and never 404 on a clean machine.
	go func(jobDir string) {
		previewsDir := filepath.Join(jobDir, "previews")
		_ = os.MkdirAll(previewsDir, 0o755)
		prefix := filepath.Join(previewsDir, "page")
		// 110 DPI is a good speed/quality compromise for card thumbnails.
		_, _ = runCommandOutput(jobDir, "pdftoppm", "-png", "-r", "110", inPath, prefix)
	}(dir)

	writeJSON(w, http.StatusOK, previewResponse{Pages: pages})
}

func serveDownload(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimPrefix(r.URL.Path, "/downloads/")
	clean := filepath.Clean(rel)
	if strings.Contains(clean, "..") {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	full := filepath.Join(baseWorkDir, clean)

	fi, err := os.Stat(full)
	if err != nil || fi.IsDir() {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename="+strconv.Quote(fi.Name()))
	http.ServeFile(w, r, full)
}

func servePreview(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimPrefix(r.URL.Path, "/previews/")
	clean := filepath.Clean(rel)
	if strings.Contains(clean, "..") {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	full := filepath.Join(baseWorkDir, clean)

	fi, err := os.Stat(full)
	if err != nil || fi.IsDir() {
		// Lazy-generate page thumbnails if this looks like a preview page request.
		// Expected: /previews/<jobId>/previews/page-<n>.png
		parts := strings.Split(clean, string(os.PathSeparator))
		if len(parts) >= 3 && parts[1] == "previews" {
			jobID := parts[0]
			filename := parts[len(parts)-1]
			if strings.HasPrefix(filename, "page-") && strings.HasSuffix(strings.ToLower(filename), ".png") {
				numStr := strings.TrimSuffix(strings.TrimPrefix(filename, "page-"), ".png")
				n, convErr := strconv.Atoi(numStr)
				if convErr == nil && n > 0 {
					jobDir := filepath.Join(baseWorkDir, jobID)
					srcPDF := filepath.Join(jobDir, "input.pdf")
					previewsDir := filepath.Join(jobDir, "previews")
					_ = os.MkdirAll(previewsDir, 0o755)

					prefix := filepath.Join(previewsDir, "page")
					// Render just this page.
					if out, genErr := runCommandOutput(jobDir, "pdftoppm", "-png", "-r", "110", "-f", strconv.Itoa(n), "-l", strconv.Itoa(n), srcPDF, prefix); genErr != nil {
						log.Printf("lazy preview error (job=%s page=%d): %v output=%s", jobID, n, genErr, out)
						http.Error(w, "failed to render preview", http.StatusInternalServerError)
						return
					}

					// Retry stat after generation.
					fi, err = os.Stat(full)
					if err != nil || fi.IsDir() {
						http.Error(w, "file not found", http.StatusNotFound)
						return
					}
				}
			}
		}

		if err != nil || fi.IsDir() {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
	}

	// No attachment header here: we want the browser to render thumbnails inline.
	http.ServeFile(w, r, full)
}

func cleanupOldJobs(maxAge time.Duration) {
	entries, err := os.ReadDir(baseWorkDir)
	if err != nil {
		return
	}
	cutoff := time.Now().Add(-maxAge)
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		p := filepath.Join(baseWorkDir, e.Name())
		info, err := os.Stat(p)
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			_ = os.RemoveAll(p)
		}
	}
}

// =============================================================================
// PDF Security Tools: Protect, Unlock, Redact, Flatten
// =============================================================================

// handleProtectPDF encrypts a PDF with a password using 256-bit AES encryption.
func handleProtectPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[protect] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	password := strings.TrimSpace(r.FormValue("password"))
	if password == "" {
		errorJSON(w, http.StatusBadRequest, "password is required")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[protect] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[protect] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[protect] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + "_protected.pdf"
	outputPath := filepath.Join(dir, outputName)

	// qpdf --encrypt <user-pw> <owner-pw> 256 -- input.pdf output.pdf
	if err := runCommand(dir, "qpdf",
		"--warning-exit-0",
		"--encrypt", password, password, "256",
		"--",
		inputPath,
		outputPath,
	); err != nil {
		log.Printf("[protect] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "qpdf encrypt failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleUnlockPDF removes password protection from a PDF.
func handleUnlockPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[unlock] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	password := strings.TrimSpace(r.FormValue("password"))

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[unlock] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[unlock] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[unlock] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + "_unlocked.pdf"
	outputPath := filepath.Join(dir, outputName)

	// qpdf --password=<pw> --decrypt input.pdf output.pdf
	var args []string
	if password != "" {
		args = []string{"--warning-exit-0", "--password=" + password, "--decrypt", inputPath, outputPath}
	} else {
		args = []string{"--warning-exit-0", "--decrypt", inputPath, outputPath}
	}
	if err := runCommand(dir, "qpdf", args...); err != nil {
		log.Printf("[unlock] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "qpdf decrypt failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleRedactPDF permanently redacts specified areas from a PDF.
//
// SECURITY NOTE: This implementation performs TRUE PERMANENT REDACTION.
// The PDF is rasterized to images, black rectangles are drawn over the
// sensitive areas, and then converted back to PDF. The original text/vector
// content beneath redacted areas is completely destroyed and cannot be
// recovered. Additionally, metadata is stripped using qpdf to ensure no
// residual information remains.
//
// Request format:
//   - file: PDF file (multipart)
//   - redactions: JSON array of redaction areas
//     [{"page":1,"x":0.1,"y":0.2,"width":0.3,"height":0.1}, ...]
//     Coordinates are percentages (0.0-1.0) relative to page dimensions.
func handleRedactPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[redact] parse form: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	// Parse redactions JSON
	redactionsJSON := strings.TrimSpace(r.FormValue("redactions"))
	if redactionsJSON == "" {
		errorJSON(w, http.StatusBadRequest, "redactions JSON required")
		return
	}

	type redactionArea struct {
		Page   int     `json:"page"`
		X      float64 `json:"x"`
		Y      float64 `json:"y"`
		Width  float64 `json:"width"`
		Height float64 `json:"height"`
	}
	var redactions []redactionArea
	if err := json.Unmarshal([]byte(redactionsJSON), &redactions); err != nil {
		log.Printf("[redact] parse redactions: %v", err)
		errorJSON(w, http.StatusBadRequest, "invalid redactions JSON: "+err.Error())
		return
	}
	if len(redactions) == 0 {
		errorJSON(w, http.StatusBadRequest, "at least one redaction area required")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[redact] file: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[redact] newJobDir: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[redact] save: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	// Step 1: Render all pages to PNG at 300 DPI using pdftoppm
	pngPrefix := filepath.Join(dir, "page")
	if err := runCommand(dir, "pdftoppm", "-png", "-r", "300", inputPath, pngPrefix); err != nil {
		log.Printf("[redact] pdftoppm: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdftoppm failed: "+err.Error())
		return
	}

	// Group redactions by page number
	pageRedactions := make(map[int][]redactionArea)
	for _, rd := range redactions {
		pageRedactions[rd.Page] = append(pageRedactions[rd.Page], rd)
	}

	// Find all generated PNG files
	pngFiles, err := filepath.Glob(filepath.Join(dir, "page-*.png"))
	if err != nil || len(pngFiles) == 0 {
		log.Printf("[redact] no pages: %v", err)
		errorJSON(w, http.StatusInternalServerError, "no pages generated")
		return
	}
	sort.Strings(pngFiles)

	// Step 2: For each page with redactions, draw black rectangles
	for pageNum, areas := range pageRedactions {
		// pdftoppm names files as page-1.png, page-2.png, etc. (or page-01.png for >9 pages)
		var pngPath string
		for _, p := range pngFiles {
			base := filepath.Base(p)
			// Extract page number from filename (page-1.png or page-01.png)
			var pn int
			if _, err := fmt.Sscanf(base, "page-%d.png", &pn); err == nil && pn == pageNum {
				pngPath = p
				break
			}
		}
		if pngPath == "" {
			log.Printf("[redact] page %d not found, skipping", pageNum)
			continue
		}

		// Get image dimensions using ImageMagick identify
		dimOutput, err := runCommandOutput(dir, "identify", "-format", "%w %h", pngPath)
		if err != nil {
			log.Printf("[redact] identify: %v", err)
			errorJSON(w, http.StatusInternalServerError, "identify failed: "+err.Error())
			return
		}
		var imgWidth, imgHeight int
		if _, err := fmt.Sscanf(strings.TrimSpace(dimOutput), "%d %d", &imgWidth, &imgHeight); err != nil {
			log.Printf("[redact] parse dimensions: %v", err)
			errorJSON(w, http.StatusInternalServerError, "parse dimensions failed")
			return
		}

		// Build draw commands for all redaction areas on this page
		var drawCmds []string
		for _, area := range areas {
			// Convert percentage coordinates to pixel coordinates
			x1 := int(area.X * float64(imgWidth))
			y1 := int(area.Y * float64(imgHeight))
			x2 := int((area.X + area.Width) * float64(imgWidth))
			y2 := int((area.Y + area.Height) * float64(imgHeight))
			drawCmds = append(drawCmds, fmt.Sprintf("rectangle %d,%d %d,%d", x1, y1, x2, y2))
		}

		// Draw black rectangles using ImageMagick convert
		tempPath := pngPath + ".tmp.png"
		convertArgs := []string{pngPath, "-fill", "black"}
		for _, cmd := range drawCmds {
			convertArgs = append(convertArgs, "-draw", cmd)
		}
		convertArgs = append(convertArgs, tempPath)

		if err := runCommand(dir, "convert", convertArgs...); err != nil {
			log.Printf("[redact] convert draw: %v", err)
			errorJSON(w, http.StatusInternalServerError, "convert failed: "+err.Error())
			return
		}

		// Atomically replace original with redacted version
		if err := os.Rename(tempPath, pngPath); err != nil {
			log.Printf("[redact] rename: %v", err)
			errorJSON(w, http.StatusInternalServerError, "rename failed: "+err.Error())
			return
		}
	}

	// Step 3: Rebuild PDF from images
	tempPdfPath := filepath.Join(dir, "temp_redacted.pdf")
	convertPdfArgs := append(pngFiles, tempPdfPath)
	if err := runCommand(dir, "convert", convertPdfArgs...); err != nil {
		log.Printf("[redact] convert to pdf: %v", err)
		errorJSON(w, http.StatusInternalServerError, "convert to pdf failed: "+err.Error())
		return
	}

	// Step 4: Strip metadata and optimize with qpdf
	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + "_redacted.pdf"
	outputPath := filepath.Join(dir, outputName)

	if err := runCommand(dir, "qpdf",
		"--warning-exit-0",
		"--linearize",
		"--compress-streams=y",
		"--object-streams=disable",
		tempPdfPath,
		outputPath,
	); err != nil {
		log.Printf("[redact] qpdf optimize: %v", err)
		errorJSON(w, http.StatusInternalServerError, "qpdf optimize failed: "+err.Error())
		return
	}

	// Clean up temporary files
	_ = os.Remove(tempPdfPath)
	for _, p := range pngFiles {
		_ = os.Remove(p)
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleFlattenPDF flattens all annotations and rotations in a PDF.
func handleFlattenPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[flatten] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[flatten] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[flatten] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[flatten] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + "_flattened.pdf"
	outputPath := filepath.Join(dir, outputName)

	// qpdf --flatten-annotations=all --flatten-rotation input.pdf output.pdf
	if err := runCommand(dir, "qpdf",
		"--warning-exit-0",
		"--flatten-annotations=all",
		"--flatten-rotation",
		inputPath,
		outputPath,
	); err != nil {
		log.Printf("[flatten] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "qpdf flatten failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// =============================================================================
// PDF Conversion Tools: PDF to Word, PDF to JPG, Extract Text, Extract Images, HTML to PDF
// =============================================================================

// handlePDFToWord converts a PDF to Word (.docx) using pdf2docx Python library.
// This provides better quality conversion than LibreOffice, preserving page breaks,
// fonts, and formatting more accurately.
func handlePDFToWord(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[pdf-to-word] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[pdf-to-word] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[pdf-to-word] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[pdf-to-word] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".docx"
	outputPath := filepath.Join(dir, outputName)

	// Create Python conversion script using pdf2docx library
	pythonScript := `#!/usr/bin/env python3
import sys
from pdf2docx import Converter

pdf_file = sys.argv[1]
docx_file = sys.argv[2]

try:
    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
	scriptPath := filepath.Join(dir, "convert.py")
	if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
		log.Printf("[pdf-to-word] error writing script: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
		return
	}

	// Execute Python script with pdf2docx
	if err := runCommand(dir, "python3", scriptPath, inputPath, outputPath); err != nil {
		log.Printf("[pdf-to-word] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdf2docx convert failed: "+err.Error())
		return
	}

	// Verify output file was created
	if _, err := os.Stat(outputPath); err != nil {
		log.Printf("[pdf-to-word] output not found: %v", err)
		errorJSON(w, http.StatusInternalServerError, "converted file not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handlePDFToExcel converts a PDF to Excel (.xlsx) using tabula-py to extract tables.
func handlePDFToExcel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[pdf-to-excel] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[pdf-to-excel] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[pdf-to-excel] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[pdf-to-excel] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".xlsx"
	outputPath := filepath.Join(dir, outputName)

	// Create Python conversion script using tabula-py and pandas
	pythonScript := `#!/usr/bin/env python3
import sys
import tabula
import pandas as pd

pdf_file = sys.argv[1]
excel_file = sys.argv[2]

try:
    tables = tabula.read_pdf(pdf_file, pages='all', multiple_tables=True)
    if not tables:
        # No tables found, create empty Excel file
        pd.DataFrame().to_excel(excel_file, index=False)
    else:
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            for i, table in enumerate(tables):
                table.to_excel(writer, sheet_name=f'Sheet{i+1}', index=False)
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
	scriptPath := filepath.Join(dir, "convert_excel.py")
	if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
		log.Printf("[pdf-to-excel] error writing script: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
		return
	}

	// Execute Python script with tabula-py
	if err := runCommand(dir, "python3", scriptPath, inputPath, outputPath); err != nil {
		log.Printf("[pdf-to-excel] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "tabula convert failed: "+err.Error())
		return
	}

	// Verify output file was created
	if _, err := os.Stat(outputPath); err != nil {
		log.Printf("[pdf-to-excel] output not found: %v", err)
		errorJSON(w, http.StatusInternalServerError, "converted file not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handlePDFToPowerPoint converts a PDF to PowerPoint (.pptx) by converting pages to images.
func handlePDFToPowerPoint(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[pdf-to-pptx] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[pdf-to-pptx] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[pdf-to-pptx] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[pdf-to-pptx] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".pptx"
	outputPath := filepath.Join(dir, outputName)

	// Create Python conversion script using pdf2image and python-pptx
	pythonScript := `#!/usr/bin/env python3
import sys
import os
from pdf2image import convert_from_path
from pptx import Presentation
from pptx.util import Inches

pdf_file = sys.argv[1]
pptx_file = sys.argv[2]
work_dir = os.path.dirname(pdf_file)

try:
    images = convert_from_path(pdf_file, dpi=150)
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    
    for i, img in enumerate(images):
        slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
        img_path = os.path.join(work_dir, f"slide_{i+1}.png")
        img.save(img_path, 'PNG')
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)
    
    prs.save(pptx_file)
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
	scriptPath := filepath.Join(dir, "convert_pptx.py")
	if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
		log.Printf("[pdf-to-pptx] error writing script: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
		return
	}

	// Execute Python script with pdf2image and python-pptx
	if err := runCommand(dir, "python3", scriptPath, inputPath, outputPath); err != nil {
		log.Printf("[pdf-to-pptx] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pptx convert failed: "+err.Error())
		return
	}

	// Verify output file was created
	if _, err := os.Stat(outputPath); err != nil {
		log.Printf("[pdf-to-pptx] output not found: %v", err)
		errorJSON(w, http.StatusInternalServerError, "converted file not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleExcelToPDF converts an Excel file (.xlsx, .xls) to PDF using LibreOffice.
func handleExcelToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[excel-to-pdf] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[excel-to-pdf] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[excel-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	// Keep original extension for LibreOffice
	ext := filepath.Ext(hdr.Filename)
	if ext == "" {
		ext = ".xlsx"
	}
	inputPath := filepath.Join(dir, "input"+ext)
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[excel-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	// LibreOffice converts Excel to PDF
	if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", "--outdir", dir, inputPath); err != nil {
		log.Printf("[excel-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "libreoffice convert failed: "+err.Error())
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".pdf"
	outputPath := filepath.Join(dir, outputName)

	// LibreOffice names output based on input filename
	expectedOutput := filepath.Join(dir, "input.pdf")
	if _, err := os.Stat(expectedOutput); err == nil {
		if err := os.Rename(expectedOutput, outputPath); err != nil {
			log.Printf("[excel-to-pdf] rename error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "rename failed")
			return
		}
	} else if _, err := os.Stat(outputPath); err != nil {
		log.Printf("[excel-to-pdf] output not found: %v", err)
		errorJSON(w, http.StatusInternalServerError, "converted file not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handlePowerPointToPDF converts a PowerPoint file (.pptx, .ppt) to PDF using LibreOffice.
func handlePowerPointToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(128 << 20); err != nil {
		log.Printf("[pptx-to-pdf] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[pptx-to-pdf] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[pptx-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	// Keep original extension for LibreOffice
	ext := filepath.Ext(hdr.Filename)
	if ext == "" {
		ext = ".pptx"
	}
	inputPath := filepath.Join(dir, "input"+ext)
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[pptx-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	// LibreOffice converts PowerPoint to PDF
	if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", "--outdir", dir, inputPath); err != nil {
		log.Printf("[pptx-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "libreoffice convert failed: "+err.Error())
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".pdf"
	outputPath := filepath.Join(dir, outputName)

	// LibreOffice names output based on input filename
	expectedOutput := filepath.Join(dir, "input.pdf")
	if _, err := os.Stat(expectedOutput); err == nil {
		if err := os.Rename(expectedOutput, outputPath); err != nil {
			log.Printf("[pptx-to-pdf] rename error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "rename failed")
			return
		}
	} else if _, err := os.Stat(outputPath); err != nil {
		log.Printf("[pptx-to-pdf] output not found: %v", err)
		errorJSON(w, http.StatusInternalServerError, "converted file not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handlePDFToJPG converts PDF pages to JPG images.
// For single-page PDFs, returns a single JPG file.
// For multi-page PDFs, returns a ZIP containing all JPG files.
func handlePDFToJPG(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	// Optional DPI parameter (default 150)
	dpi := parseIntDefault(r.FormValue("dpi"), 150)
	if dpi < 72 {
		dpi = 72
	}
	if dpi > 600 {
		dpi = 600
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	// Get page count using pdfinfo
	pageCount, err := pageCountPoppler(dir, inputPath)
	if err != nil {
		log.Printf("[pdf-to-jpg] pdfinfo error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to get page count: "+err.Error())
		return
	}

	// Create images directory
	imagesDir := filepath.Join(dir, "images")
	if err := os.MkdirAll(imagesDir, 0o755); err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create images dir")
		return
	}

	// Convert PDF to JPG using pdftoppm
	prefix := filepath.Join(imagesDir, "page")
	if err := runCommand(dir, "pdftoppm", "-jpeg", "-r", strconv.Itoa(dpi), inputPath, prefix); err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdftoppm failed: "+err.Error())
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)

	// Smart output: single JPG for 1-page PDFs, ZIP for multi-page PDFs
	if pageCount == 1 {
		// Find the generated JPG file
		jpgFiles, err := filepath.Glob(filepath.Join(imagesDir, "page-*.jpg"))
		if err != nil || len(jpgFiles) == 0 {
			log.Printf("[pdf-to-jpg] error: no JPG files generated")
			errorJSON(w, http.StatusInternalServerError, "no JPG files generated")
			return
		}

		// Move the single JPG to main directory with proper name
		outputName := baseName + ".jpg"
		outputPath := filepath.Join(dir, outputName)
		if err := os.Rename(jpgFiles[0], outputPath); err != nil {
			log.Printf("[pdf-to-jpg] rename error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "rename failed: "+err.Error())
			return
		}

		writeJSON(w, http.StatusOK, downloadResponse{
			DownloadURL: buildDownloadURL(r, jobID, outputName),
		})
		return
	}

	// Multiple pages: create ZIP
	zipName := baseName + "_images.zip"
	zipPath := filepath.Join(dir, zipName)

	if err := zipDirectory(imagesDir, zipPath); err != nil {
		log.Printf("[pdf-to-jpg] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "zip failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, zipName),
	})
}

// handleExtractText extracts plain text from a PDF using pdftotext.
func handleExtractText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[extract-text] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[extract-text] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[extract-text] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[extract-text] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	outputName := baseName + ".txt"
	outputPath := filepath.Join(dir, outputName)

	// pdftotext extracts text from PDF
	// -layout preserves the original layout
	if err := runCommand(dir, "pdftotext", "-layout", inputPath, outputPath); err != nil {
		log.Printf("[extract-text] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdftotext failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleExtractImages extracts embedded images from a PDF using pdfimages.
func handleExtractImages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	_, hdr, err := r.FormFile("file")
	if err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "file required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(hdr, inputPath); err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "save failed")
		return
	}

	// Create images directory
	imagesDir := filepath.Join(dir, "images")
	if err := os.MkdirAll(imagesDir, 0o755); err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create images dir")
		return
	}

	// pdfimages extracts embedded images
	// -all extracts all images in their native format
	prefix := filepath.Join(imagesDir, "image")
	if err := runCommand(dir, "pdfimages", "-all", inputPath, prefix); err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdfimages failed: "+err.Error())
		return
	}

	// Check if any images were extracted
	entries, err := os.ReadDir(imagesDir)
	if err != nil || len(entries) == 0 {
		errorJSON(w, http.StatusOK, "no images found in PDF")
		return
	}

	baseName := baseNameWithoutExt(hdr.Filename)
	zipName := baseName + "_extracted_images.zip"
	zipPath := filepath.Join(dir, zipName)

	if err := zipDirectory(imagesDir, zipPath); err != nil {
		log.Printf("[extract-images] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "zip failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, zipName),
	})
}

// handleHTMLToPDF converts an HTML file or URL to PDF using wkhtmltopdf.
func handleHTMLToPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		log.Printf("[html-to-pdf] error: %v", err)
		errorJSON(w, http.StatusBadRequest, "parse form failed")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		log.Printf("[html-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to create job")
		return
	}

	// Check for URL parameter first
	url := strings.TrimSpace(r.FormValue("url"))
	var inputSource string
	var baseName string

	if url != "" {
		// URL mode
		inputSource = url
		baseName = "webpage"
	} else {
		// File mode
		_, hdr, err := r.FormFile("file")
		if err != nil {
			errorJSON(w, http.StatusBadRequest, "file or url required")
			return
		}

		inputPath := filepath.Join(dir, "input.html")
		if err := saveUploadedFile(hdr, inputPath); err != nil {
			log.Printf("[html-to-pdf] error: %v", err)
			errorJSON(w, http.StatusInternalServerError, "save failed")
			return
		}
		inputSource = inputPath
		baseName = baseNameWithoutExt(hdr.Filename)
	}

	outputName := baseName + ".pdf"
	outputPath := filepath.Join(dir, outputName)

	// wkhtmltopdf converts HTML/URL to PDF
	// --enable-local-file-access allows loading local resources
	if err := runCommand(dir, "wkhtmltopdf",
		"--enable-local-file-access",
		"--quiet",
		inputSource,
		outputPath,
	); err != nil {
		log.Printf("[html-to-pdf] error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "wkhtmltopdf failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced PDF Tools
// ─────────────────────────────────────────────────────────────────────────────

// handleComparePDFs compares two PDF files and returns a text diff
// Expects two files: "file1" and "file2"
func handleComparePDFs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "failed to parse form: "+err.Error())
		return
	}

	// Get file1
	file1, _, err := r.FormFile("file1")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file1 is required: "+err.Error())
		return
	}
	defer file1.Close()

	// Get file2
	file2, _, err := r.FormFile("file2")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file2 is required: "+err.Error())
		return
	}
	defer file2.Close()

	// Save both files
	inputPath1 := filepath.Join(dir, "file1.pdf")
	outFile1, err := os.Create(inputPath1)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create file1: "+err.Error())
		return
	}
	if _, err := io.Copy(outFile1, file1); err != nil {
		outFile1.Close()
		errorJSON(w, http.StatusInternalServerError, "failed to save file1: "+err.Error())
		return
	}
	outFile1.Close()

	inputPath2 := filepath.Join(dir, "file2.pdf")
	outFile2, err := os.Create(inputPath2)
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create file2: "+err.Error())
		return
	}
	if _, err := io.Copy(outFile2, file2); err != nil {
		outFile2.Close()
		errorJSON(w, http.StatusInternalServerError, "failed to save file2: "+err.Error())
		return
	}
	outFile2.Close()

	// Extract text from both PDFs
	text1Path := filepath.Join(dir, "file1.txt")
	text2Path := filepath.Join(dir, "file2.txt")

	if err := runCommand(dir, "pdftotext", inputPath1, text1Path); err != nil {
		log.Printf("[compare] pdftotext file1 error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to extract text from file1: "+err.Error())
		return
	}

	if err := runCommand(dir, "pdftotext", inputPath2, text2Path); err != nil {
		log.Printf("[compare] pdftotext file2 error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to extract text from file2: "+err.Error())
		return
	}

	// Compare using diff (diff returns exit code 1 if files differ, which is normal)
	outputName := "differences.txt"
	outputPath := filepath.Join(dir, outputName)

	// Run diff and capture output (ignore exit code since diff returns 1 when files differ)
	cmd := exec.Command("diff", "-u", text1Path, text2Path)
	cmd.Dir = dir
	diffOutput, _ := cmd.Output() // Ignore error - diff exits 1 when files differ

	// Write diff output to file
	if len(diffOutput) == 0 {
		diffOutput = []byte("No differences found between the two PDF files.\n")
	}
	if err := os.WriteFile(outputPath, diffOutput, 0644); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to write diff output: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleDigitalSignature processes PDF and marks it as signed using qpdf
func handleDigitalSignature(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inputPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	baseName := baseNameWithoutExt(header.Filename)
	outputName := baseName + "_signed.pdf"
	outputPath := filepath.Join(dir, outputName)

	// Use qpdf to linearize and process PDF (marks as optimized/signed)
	if err := runCommand(dir, "qpdf",
		"--linearize",
		"--warning-exit-0",
		inputPath,
		outputPath,
	); err != nil {
		log.Printf("[digital-signature] qpdf error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to process PDF: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleValidatePDFA validates PDF/A compliance using verapdf
func handleValidatePDFA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inputPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	baseName := baseNameWithoutExt(header.Filename)
	outputName := baseName + "_validation.txt"
	outputPath := filepath.Join(dir, outputName)

	// Build validation report using qpdf and pdfinfo
	var reportBuilder strings.Builder

	// Run qpdf --check to validate PDF structure
	reportBuilder.WriteString("=== PDF Structure Validation (qpdf --check) ===\n\n")
	cmd := exec.Command("qpdf", "--check", "--warning-exit-0", inputPath)
	cmd.Dir = dir
	qpdfOutput, err := cmd.CombinedOutput()
	if err != nil {
		reportBuilder.WriteString(fmt.Sprintf("qpdf check failed: %v\n", err))
	}
	if len(qpdfOutput) > 0 {
		reportBuilder.Write(qpdfOutput)
	} else {
		reportBuilder.WriteString("No issues found.\n")
	}

	// Run pdfinfo to get PDF version and metadata
	reportBuilder.WriteString("\n=== PDF Metadata (pdfinfo) ===\n\n")
	cmd2 := exec.Command("pdfinfo", inputPath)
	cmd2.Dir = dir
	pdfinfoOutput, err := cmd2.CombinedOutput()
	if err != nil {
		reportBuilder.WriteString(fmt.Sprintf("pdfinfo failed: %v\n", err))
	}
	if len(pdfinfoOutput) > 0 {
		reportBuilder.Write(pdfinfoOutput)
	} else {
		reportBuilder.WriteString("No metadata available.\n")
	}

	// Write combined validation output to file
	if err := os.WriteFile(outputPath, []byte(reportBuilder.String()), 0644); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to write validation report: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handlePDFToHTML converts PDF to HTML using pdftohtml
func handlePDFToHTML(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inputPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	baseName := baseNameWithoutExt(header.Filename)

	// pdftohtml with -s creates a single HTML file
	// The output will be named baseName.html (pdftohtml adds suffix automatically)
	if err := runCommand(dir, "pdftohtml",
		"-s",            // single HTML file
		"-noframes",     // no frame structure
		"-enc", "UTF-8", // UTF-8 encoding
		inputPath,
		filepath.Join(dir, baseName),
	); err != nil {
		log.Printf("[pdf-to-html] pdftohtml error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "pdftohtml failed: "+err.Error())
		return
	}

	// pdftohtml creates baseName-html.html or baseName.html
	// Check which file was created
	outputName := baseName + ".html"
	outputPath := filepath.Join(dir, outputName)

	// If the standard output doesn't exist, try the -html suffix
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		altName := baseName + "-html.html"
		altPath := filepath.Join(dir, altName)
		if _, err := os.Stat(altPath); err == nil {
			outputName = altName
			outputPath = altPath
		} else {
			// Try baseName.html (pdftohtml sometimes just uses original name + .html)
			suffixName := baseName + "s.html"
			suffixPath := filepath.Join(dir, suffixName)
			if _, err := os.Stat(suffixPath); err == nil {
				outputName = suffixName
				outputPath = suffixPath
			}
		}
	}

	// Verify output exists
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		// List directory to find HTML files
		entries, _ := os.ReadDir(dir)
		for _, entry := range entries {
			if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".html") {
				outputName = entry.Name()
				outputPath = filepath.Join(dir, outputName)
				break
			}
		}
	}

	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		errorJSON(w, http.StatusInternalServerError, "HTML output not found")
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleAddHeaderFooter adds headers and footers to PDF using Ghostscript
func handleAddHeaderFooter(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inputPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	// Get header and footer text from query parameters
	headerText := r.URL.Query().Get("headerText")
	footerText := r.URL.Query().Get("footerText")

	if headerText == "" && footerText == "" {
		errorJSON(w, http.StatusBadRequest, "at least one of headerText or footerText is required")
		return
	}

	baseName := baseNameWithoutExt(header.Filename)
	outputName := baseName + "_headerfooter.pdf"
	outputPath := filepath.Join(dir, outputName)

	// Get page dimensions using pdfinfo
	pageWidth := 612.0  // Default Letter width in points
	pageHeight := 792.0 // Default Letter height in points

	cmd := exec.Command("pdfinfo", inputPath)
	cmd.Dir = dir
	infoOutput, err := cmd.Output()
	if err == nil {
		// Parse page size from pdfinfo output
		lines := strings.Split(string(infoOutput), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "Page size:") {
				// Format: "Page size:      612 x 792 pts (letter)"
				parts := strings.Fields(line)
				if len(parts) >= 4 {
					if w, err := strconv.ParseFloat(parts[2], 64); err == nil {
						pageWidth = w
					}
					if h, err := strconv.ParseFloat(parts[4], 64); err == nil {
						pageHeight = h
					}
				}
				break
			}
		}
	}

	// Calculate positions
	headerY := pageHeight - 25 // 25 points from top
	footerY := 20.0            // 20 points from bottom
	centerX := pageWidth / 2   // Center of page

	// Build PostScript commands for header and footer overlay
	var psCommands strings.Builder
	psCommands.WriteString("/Helvetica findfont 12 scalefont setfont\n")
	psCommands.WriteString("0.5 0.5 0.5 setrgbcolor\n") // Gray color

	if headerText != "" {
		// Center the header text
		psCommands.WriteString(fmt.Sprintf("%.1f %.1f moveto (%s) dup stringwidth pop 2 div neg 0 rmoveto show\n",
			centerX, headerY, headerText))
	}

	if footerText != "" {
		// Center the footer text
		psCommands.WriteString(fmt.Sprintf("%.1f %.1f moveto (%s) dup stringwidth pop 2 div neg 0 rmoveto show\n",
			centerX, footerY, footerText))
	}

	// Create PostScript file that adds header/footer to each page
	psPath := filepath.Join(dir, "overlay.ps")
	psContent := fmt.Sprintf(`%%!PS-Adobe-3.0
<< /EndPage {
  exch pop
  0 eq {
    %s
    true
  } { false } ifelse
} bind >> setpagedevice
`, psCommands.String())

	if err := os.WriteFile(psPath, []byte(psContent), 0644); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to create overlay script")
		return
	}

	// Use Ghostscript to apply header/footer overlay to each page
	if err := runCommand(dir, "gs",
		"-dBATCH",
		"-dNOPAUSE",
		"-dQUIET",
		"-sDEVICE=pdfwrite",
		"-dPDFSETTINGS=/prepress",
		"-sOutputFile="+outputPath,
		psPath,
		inputPath,
	); err != nil {
		log.Printf("[add-header-footer] ghostscript error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to add header/footer: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}

// handleConvertToPDFA converts PDF to PDF/A-2b format using Ghostscript
func handleConvertToPDFA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorJSON(w, http.StatusMethodNotAllowed, "POST required")
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		errorJSON(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	_, header, err := r.FormFile("file")
	if err != nil {
		errorJSON(w, http.StatusBadRequest, "file is required")
		return
	}

	jobID, dir, err := newJobDir()
	if err != nil {
		errorJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	inputPath := filepath.Join(dir, "input.pdf")
	if err := saveUploadedFile(header, inputPath); err != nil {
		errorJSON(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	baseName := baseNameWithoutExt(header.Filename)
	outputName := baseName + "_pdfa.pdf"
	outputPath := filepath.Join(dir, outputName)

	// Convert to PDF/A-2b using Ghostscript
	if err := runCommand(dir, "gs",
		"-dBATCH",
		"-dNOPAUSE",
		"-dQUIET",
		"-sDEVICE=pdfwrite",
		"-dPDFA=2",
		"-dPDFACompatibilityPolicy=1",
		"-sOutputFile="+outputPath,
		inputPath,
	); err != nil {
		log.Printf("[convert-to-pdfa] ghostscript error: %v", err)
		errorJSON(w, http.StatusInternalServerError, "failed to convert to PDF/A: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, downloadResponse{
		DownloadURL: buildDownloadURL(r, jobID, outputName),
	})
}
