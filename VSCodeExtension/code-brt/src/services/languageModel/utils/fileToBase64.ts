import fs from 'fs';

// Magic numbers/patterns for different file types mapped to their MIME types
const MAGIC_PATTERNS: { pattern: RegExp; mime: string }[] = [
  // Images
  { pattern: /^\/9j\//, mime: 'image/jpeg' }, // JPEG
  { pattern: /^iVBORw0KGgo/, mime: 'image/png' }, // PNG
  { pattern: /^R0lGOD/, mime: 'image/gif' }, // GIF
  { pattern: /^UklGR/, mime: 'image/webp' }, // WEBP
  { pattern: /^PD94bWwgdmVyc2lvbj0/, mime: 'image/svg+xml' }, // SVG

  // PDFs
  { pattern: /^JVBERi0/, mime: 'application/pdf' }, // PDF

  // Archives
  { pattern: /^UEsDB/, mime: 'application/zip' }, // ZIP
  { pattern: /^H4sI/, mime: 'application/x-gzip' }, // GZIP

  // Audio
  { pattern: /^SUQz/, mime: 'audio/mpeg' }, // MP3
  { pattern: /^T1GGIA/, mime: 'audio/ogg' }, // OGG

  // Video
  { pattern: /^AAAAGGZ0eXAi/, mime: 'video/mp4' }, // MP4
  { pattern: /^AAAAHGZ0eXBtcDQy/, mime: 'video/mp4' }, // MP4

  // Documents
  { pattern: /^0M8R4KGxGuE/, mime: 'application/msword' }, // DOC
  {
    pattern: /^UEsDBBQABg/,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }, // DOCX
];

const detectMimeTypeFromBase64 = (base64: string): string => {
  // Check against known patterns
  for (const { pattern, mime } of MAGIC_PATTERNS) {
    if (pattern.test(base64)) {
      return mime;
    }
  }

  // If no pattern matches, try to detect if it's text
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    // Check if the decoded content is a printable text
    if (/^[\x20-\x7E\t\n\r]*$/.test(decoded)) {
      // Check for specific text formats
      if (decoded.trim().startsWith('{') && decoded.trim().endsWith('}')) {
        return 'application/json';
      }
      if (decoded.trim().startsWith('<?xml')) {
        return 'application/xml';
      }
      if (/<[^>]+>/.test(decoded)) {
        return 'text/html';
      }
      return 'text/plain';
    }
  } catch {
    // If decoding fails, it's likely binary data
  }

  // Default to binary if no other match is found
  return 'application/octet-stream';
};

export const fileToBase64 = async (
  filePath: string,
): Promise<
  | {
      base64Data: string;
      mimeType: string;
    }
  | undefined
> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return undefined;
    }

    const buffer = fs.readFileSync(filePath);

    // Check if buffer is valid
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      console.error('Invalid or empty buffer');
      return undefined;
    }

    const base64Data = buffer.toString('base64');

    // Detect MIME type from a base64 pattern
    const mimeType = detectMimeTypeFromBase64(base64Data);

    return {
      base64Data,
      mimeType,
    };
  } catch (error) {
    console.error('Failed to process file:', error);
    return undefined;
  }
};
