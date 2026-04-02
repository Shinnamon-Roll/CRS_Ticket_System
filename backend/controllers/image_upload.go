package controllers

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxImageUploadSize int64 = 10 * 1024 * 1024

func saveSingleImageFromField(c *gin.Context, fieldName string, folder string) (*string, error) {
	fileHeader, err := c.FormFile(fieldName)
	if err != nil {
		return nil, nil
	}

	url, err := saveAndCompressImage(fileHeader, folder)
	if err != nil {
		return nil, err
	}

	return &url, nil
}

func saveImagesFromFields(c *gin.Context, folder string, fieldNames []string) ([]string, error) {
	form, err := c.MultipartForm()
	if err != nil {
		return nil, nil
	}

	var headers []*multipart.FileHeader
	for _, field := range fieldNames {
		headers = append(headers, form.File[field]...)
	}

	if len(headers) == 0 {
		return nil, nil
	}

	urls := make([]string, 0, len(headers))
	for _, header := range headers {
		url, saveErr := saveAndCompressImage(header, folder)
		if saveErr != nil {
			return nil, saveErr
		}
		urls = append(urls, url)
	}

	return urls, nil
}

func saveAndCompressImage(fileHeader *multipart.FileHeader, folder string) (string, error) {
	if fileHeader == nil {
		return "", fmt.Errorf("invalid image upload")
	}

	if fileHeader.Size > maxImageUploadSize {
		return "", fmt.Errorf("image size must not exceed 10MB")
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
	if !allowed[ext] {
		return "", fmt.Errorf("image must be .jpg, .jpeg, or .png")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to read uploaded image")
	}
	defer file.Close()

	img, err := decodeByExtension(file, ext)
	if err != nil {
		return "", fmt.Errorf("failed to decode image")
	}

	processed := resizeToFit1080p(img)

	if err := os.MkdirAll(folder, 0755); err != nil {
		return "", fmt.Errorf("failed to prepare upload directory")
	}

	fileName := fmt.Sprintf("%d_%s.jpg", time.Now().UnixNano(), uuid.NewString())
	dst := filepath.Join(folder, fileName)

	out, err := os.Create(dst)
	if err != nil {
		return "", fmt.Errorf("failed to save image")
	}
	defer out.Close()

	if err := jpeg.Encode(out, processed, &jpeg.Options{Quality: 82}); err != nil {
		return "", fmt.Errorf("failed to encode image")
	}

	return "/" + folder + "/" + fileName, nil
}

func decodeByExtension(file multipart.File, ext string) (image.Image, error) {
	switch ext {
	case ".jpg", ".jpeg":
		return jpeg.Decode(file)
	case ".png":
		return png.Decode(file)
	default:
		return nil, fmt.Errorf("unsupported image format")
	}
}

func resizeToFit1080p(src image.Image) image.Image {
	b := src.Bounds()
	srcW := b.Dx()
	srcH := b.Dy()

	if srcW <= 1920 && srcH <= 1080 {
		return src
	}

	ratioW := 1920.0 / float64(srcW)
	ratioH := 1080.0 / float64(srcH)
	ratio := ratioW
	if ratioH < ratio {
		ratio = ratioH
	}

	newW := int(float64(srcW) * ratio)
	newH := int(float64(srcH) * ratio)
	if newW < 1 {
		newW = 1
	}
	if newH < 1 {
		newH = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	for y := 0; y < newH; y++ {
		srcY := b.Min.Y + (y*srcH)/newH
		for x := 0; x < newW; x++ {
			srcX := b.Min.X + (x*srcW)/newW
			dst.Set(x, y, src.At(srcX, srcY))
		}
	}
	return dst
}
