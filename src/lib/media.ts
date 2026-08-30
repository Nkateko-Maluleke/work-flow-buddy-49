export const ACCEPTED_DOC_TYPES =
  ".pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.rtf,.html,.png,.jpg,.jpeg,.webp";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(blob);
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
