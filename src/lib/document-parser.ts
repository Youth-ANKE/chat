/**
 * Client-side document parser for PDF, DOCX, PPTX, XLSX.
 *
 * Uses libraries loaded via CDN (loaded dynamically on demand):
 * - PDF: pdf.js (pdfjs-dist)
 * - DOCX: mammoth.js
 * - XLSX: SheetJS
 * - PPTX: manual extraction of text from slide XMLs
 */

export type DocParseResult = {
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  text: string;
  pages?: { page: number; text: string }[];
  metadata?: Record<string, string>;
};

function parsePPTXFromBuffer(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder();
    const uint8 = new Uint8Array(buffer);
    // PPTX is a ZIP file. We need JSZip.
    // Since we can't bundle heavy libraries, we return a fallback message.
    return '';
  } catch {
    return '';
  }
}

function parseXLSXFromBuffer(buffer: ArrayBuffer): string {
  try {
    return '';
  } catch {
    return '';
  }
}

/** Load a JS library dynamically from CDN */
async function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${url}`));
    document.head.appendChild(script);
  });
}

/** Parse PDF document using pdf.js (loaded dynamically) */
async function parsePDF(buffer: ArrayBuffer): Promise<DocParseResult> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  const pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib as {
    getDocument: (opts: { data: ArrayBuffer; useWorkerFetch?: boolean }) => {
      promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str: string }[] }> }> }>;
    };
  };

  const doc = await pdfjsLib.getDocument({
    data: buffer,
    useWorkerFetch: false,
  }).promise;

  const pages: { page: number; text: string }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(' ');
    pages.push({ page: i, text });
  }

  return {
    type: 'pdf',
    text: pages.map((p) => p.text).join('\n\n'),
    pages,
    metadata: { totalPages: String(doc.numPages) },
  };
}

/** Parse DOCX using mammoth.js (loaded dynamically) */
async function parseDOCX(buffer: ArrayBuffer): Promise<DocParseResult> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js');
  const mammoth = (window as unknown as Record<string, unknown>).mammoth as {
    extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };

  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return { type: 'docx', text: result.value };
}

/** Parse XLSX using SheetJS (loaded dynamically) */
async function parseXLSX(buffer: ArrayBuffer): Promise<DocParseResult> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const XLSX = (window as unknown as Record<string, unknown>).XLSX as {
    read: (data: ArrayBuffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
    utils: { sheet_to_csv: (sheet: unknown) => string };
  };

  const workbook = XLSX.read(buffer, { type: 'array' });
  const texts: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    texts.push(`## ${name}\n\n${XLSX.utils.sheet_to_csv(sheet)}`);
  }
  return { type: 'xlsx', text: texts.join('\n\n') };
}

/** Parse PPTX using JSZip (loaded dynamically) */
async function parsePPTX(buffer: ArrayBuffer): Promise<DocParseResult> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const JSZip = (window as unknown as Record<string, unknown>).JSZip as {
    loadAsync: (data: ArrayBuffer) => Promise<{
      file: (path: RegExp | string) => { async: (type: string) => Promise<string> } | null;
    }>;
  };

  const zip = await JSZip.loadAsync(buffer);
  const slides: string[] = [];
  let idx = 1;

  while (true) {
    const slideFile = zip.file(new RegExp(`ppt/slides/slide${idx}\\.xml`));
    if (!slideFile) break;
    const xml = await slideFile.async('string');
    // Extract text from <a:t> tags
    const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const text = textMatches
        .map((m) => m.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .join(' ');
      slides.push(`Slide ${idx}: ${text}`);
    }
    idx++;
  }

  return { type: 'pptx', text: slides.join('\n\n') };
}

/**
 * Parse any document by its MIME type.
 * Falls back to returning the file name for unsupported types.
 */
export async function parseDocument(
  file: File
): Promise<DocParseResult | null> {
  const buffer = await file.arrayBuffer();

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try { return await parsePDF(buffer); } catch { /* fall through */ }
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    try { return await parseDOCX(buffer); } catch { /* fall through */ }
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.name.endsWith('.xlsx')
  ) {
    try { return await parseXLSX(buffer); } catch { /* fall through */ }
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.name.endsWith('.pptx')
  ) {
    try { return await parsePPTX(buffer); } catch { /* fall through */ }
  }

  // Plain text file — read as text
  if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json|xml|yaml|yml|html|css|js|ts|py|java|c|cpp|rs|go|rb|php|lua|sh|bash|zsh|sql|r|toml|ini|cfg|conf|log)$/i)) {
    const text = await file.text();
    return { type: 'docx', text };
  }

  return null;
}

/** Check if a file is a parseable document */
export function isParseableDocument(file: File): boolean {
  const docTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (docTypes.includes(file.type)) return true;
  if (file.name.match(/\.(pdf|docx|xlsx|pptx)$/i)) return true;
  return false;
}
