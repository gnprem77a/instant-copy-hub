// Central PDF API client wired to the backend contract.
// All endpoints return { downloadUrl: string } and the caller is
// responsible for triggering the browser download via window.location.href.

export type DownloadResponse = {
  downloadUrl: string;
};

export type PdfPreviewPage = {
  pageNumber: number;
  imageUrl: string;
};

export type PdfPreviewResponse = {
  pages: PdfPreviewPage[];
};

export type OrganizeRotation = {
  pageNumber: number;
  /** 0, 90, 180, 270 */
  degrees: number;
};

type RequestOptions = {
  /** Optional bearer token for Authorization. Cookies are sent by default. */
  authToken?: string;
  signal?: AbortSignal;
};

const API_BASE_URL = (import.meta.env?.VITE_PDF_API_BASE_URL as string | undefined) ?? "/api/pdf";

async function postPdf(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<DownloadResponse> {
  const headers: Record<string, string> = {};

  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
    signal: options.signal,
    credentials: "include", // allows cookie-based auth/session
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const keys = Array.from(new Set(Array.from(formData.keys())));
    // Helps debugging without guessing.
    console.error("PDF API request failed", {
      url,
      status: response.status,
      statusText: response.statusText,
      formFields: keys,
      responseText: text,
    });
    throw new Error(`PDF API error ${response.status} (${url}): ${text || response.statusText}`);
  }

  const data = (await response.json()) as DownloadResponse;

  if (!data || typeof data.downloadUrl !== "string" || data.downloadUrl.length === 0) {
    throw new Error("Invalid PDF API response: missing downloadUrl");
  }

  return data;
}

export async function runSingleFileTool(
  path: string,
  file: File,
  fields?: Record<string, string>,
  options?: RequestOptions,
): Promise<DownloadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  if (fields) {
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === "string" && v.length > 0) fd.append(k, v);
    });
  }
  return postPdf(path, fd, options);
}

async function postJson<T>(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
    signal: options.signal,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const keys = Array.from(new Set(Array.from(formData.keys())));
    console.error("PDF API request failed", {
      url,
      status: response.status,
      statusText: response.statusText,
      formFields: keys,
      responseText: text,
    });
    throw new Error(`PDF API error ${response.status} (${url}): ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}

export function triggerDownload(downloadUrl: string) {
  // The backend must return a real downloadable URL.
  // We simply redirect the browser; no Blobs or Object URLs.
  window.location.href = downloadUrl;
}

// === Individual tool helpers ===

export async function mergePdf(files: File[], options?: RequestOptions & { outputFilename?: string }) {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file));
  if (options?.outputFilename) {
    fd.append("outputFilename", options.outputFilename);
  }
  return postPdf("/merge", fd, options);
}

export async function splitPdf(
  file: File,
  params: {
    mode: "all" | "ranges";
    ranges?: string; // e.g. "1-3,5,8-10"
  },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("mode", params.mode);
  if (params.ranges) {
    fd.append("ranges", params.ranges);
  }
  return postPdf("/split", fd, options);
}

export async function removePages(
  file: File,
  pages: string, // e.g. "1-3,5"
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("pages", pages);
  return postPdf("/remove-pages", fd, options);
}

export async function extractPages(
  file: File,
  params: {
    mode: "all" | "ranges";
    ranges?: string; // for mode === "ranges": produces a single PDF
  },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("mode", params.mode);
  if (params.ranges) {
    fd.append("ranges", params.ranges);
  }
  return postPdf("/extract-pages", fd, options);
}

export async function scanToPdf(files: File[], options?: RequestOptions & { deskew?: boolean }) {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file));
  if (options?.deskew) {
    fd.append("deskew", "true");
  }
  return postPdf("/scan-to-pdf", fd, options);
}

export async function compressPdf(
  file: File,
  params: { level?: "low" | "medium" | "high" },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  if (params.level) {
    fd.append("level", params.level);
  }
  return postPdf("/compress", fd, options);
}

export async function repairPdf(file: File, options?: RequestOptions) {
  const fd = new FormData();
  fd.append("file", file);
  return postPdf("/repair", fd, options);
}

export async function ocrPdf(
  file: File,
  params: { language?: string },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  if (params.language) {
    fd.append("lang", params.language);
  }
  return postPdf("/ocr", fd, options);
}

export async function imageToPdf(files: File[], options?: RequestOptions & { outputFilename?: string }) {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file));
  if (options?.outputFilename) {
    fd.append("outputFilename", options.outputFilename);
  }
  return postPdf("/image-to-pdf", fd, options);
}

export async function wordToPdf(
  file: File,
  options?: RequestOptions & { format?: "docx" | "pptx" | "xlsx" },
) {
  const fd = new FormData();
  fd.append("file", file);
  if (options?.format) {
    fd.append("format", options.format);
  }
  return postPdf("/word-to-pdf", fd, options);
}

// === Preview helpers ===

export async function previewPdf(file: File, options?: RequestOptions): Promise<PdfPreviewResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const data = await postJson<PdfPreviewResponse>("/preview", fd, options);

  if (!data || !Array.isArray(data.pages)) {
    throw new Error("Invalid PDF preview response");
  }
  return data;
}

// === Newly surfaced tools (frontend wiring) ===

export async function comparePdfs(left: File, right: File, options?: RequestOptions) {
  const fd = new FormData();
  fd.append("left", left);
  fd.append("right", right);
  return postPdf("/compare", fd, options);
}

export async function digitalSignature(
  file: File,
  signatureImage: File,
  params?: { position?: string; page?: number },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("signatureImage", signatureImage);
  if (params?.position) fd.append("position", params.position);
  if (typeof params?.page === "number") fd.append("page", String(params.page));
  return postPdf("/digital-signature", fd, options);
}

export type ValidatePdfaResult =
  | { kind: "download"; downloadUrl: string }
  | { kind: "report"; report: unknown };

export async function validatePdfa(file: File, options?: RequestOptions): Promise<ValidatePdfaResult> {
  const fd = new FormData();
  fd.append("file", file);

  const url = `${API_BASE_URL}/validate-pdfa`;
  const response = await fetch(url, {
    method: "POST",
    body: fd,
    signal: options?.signal,
    credentials: "include",
    headers: options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("PDF API request failed", {
      url,
      status: response.status,
      statusText: response.statusText,
      formFields: ["file"],
      responseText: text,
    });
    throw new Error(`PDF API error ${response.status} (${url}): ${text || response.statusText}`);
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // If the backend returns non-JSON here, surface the raw text.
    return { kind: "report", report: text };
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "downloadUrl" in (parsed as Record<string, unknown>) &&
    typeof (parsed as Record<string, unknown>).downloadUrl === "string"
  ) {
    return { kind: "download", downloadUrl: (parsed as { downloadUrl: string }).downloadUrl };
  }

  return { kind: "report", report: parsed };
}

export async function organizePdf(
  file: File,
  params: { order: string; rotations?: OrganizeRotation[] },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("order", params.order);
  if (params.rotations && params.rotations.length > 0) {
    fd.append("rotations", JSON.stringify(params.rotations));
  }
  return postPdf("/organize", fd, options);
}

export async function rotatePdf(
  file: File,
  params: { degrees: 90 | 180 | 270 },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("degrees", String(params.degrees));
  return postPdf("/rotate", fd, options);
}

export async function cropPdf(
  file: File,
  params: { description: string; unit?: "pt" | "mm" | "cm" | "in" },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("description", params.description);
  if (params.unit) fd.append("unit", params.unit);
  return postPdf("/crop", fd, options);
}

export async function addPageNumbersPdf(
  file: File,
  params: { position?: string; fontSize?: number; opacity?: number; startAt?: number },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  if (params.position) fd.append("position", params.position);
  if (typeof params.fontSize === "number") fd.append("fontSize", String(params.fontSize));
  if (typeof params.opacity === "number") fd.append("opacity", String(params.opacity));
  if (typeof params.startAt === "number") fd.append("startAt", String(params.startAt));
  return postPdf("/page-numbers", fd, options);
}

export async function watermarkPdf(
  file: File,
  params: { text: string; opacity?: number; rotation?: number; fontSize?: number; position?: string },
  options?: RequestOptions,
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("text", params.text);
  if (typeof params.opacity === "number") fd.append("opacity", String(params.opacity));
  if (typeof params.rotation === "number") fd.append("rotation", String(params.rotation));
  if (typeof params.fontSize === "number") fd.append("fontSize", String(params.fontSize));
  if (params.position) fd.append("position", params.position);
  return postPdf("/watermark", fd, options);
}
