FROM golang:1.24-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /pdf-backend

# Install pdfcpu CLI into the builder, then copy it into the final image.
RUN go install github.com/pdfcpu/pdfcpu/cmd/pdfcpu@latest

FROM debian:bookworm-slim

RUN useradd -m -u 10001 appuser \
  && apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates \
       ghostscript \
       tesseract-ocr \
       ocrmypdf \
       imagemagick \
       poppler-utils \
       libreoffice \
       qpdf \
       wkhtmltopdf \
       python3 \
       python3-pip \
       default-jre-headless \
       wget \
       diffutils \
  && sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true \
  && sed -i 's/rights="none" pattern="PS"/rights="read|write" pattern="PS"/' /etc/ImageMagick-6/policy.xml || true \
  && pip3 install --no-cache-dir --break-system-packages pdf2docx tabula-py python-pptx pdf2image Pillow openpyxl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure all processing happens inside /app
RUN mkdir -p /app/work && chown -R appuser:appuser /app

COPY --from=builder /pdf-backend /app/pdf-backend
COPY --from=builder /go/bin/pdfcpu /usr/local/bin/pdfcpu

USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/pdf-backend"]