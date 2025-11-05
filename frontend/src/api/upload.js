// dev plan:
// 1. Provide a focused helper for POSTing FormData to /api/add-watermark.
// 2. Validate file type before network call and surface human readable errors.
// 3. Emit upload progress to align modal UI feedback with request lifecycle.

const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

function normaliseError(message, code = 'UNKNOWN') {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function uploadWatermarkImage(file, { onProgress, signal } = {}) {
  if (!file) {
    throw normaliseError('No file provided. Please pick an image first.', 'NO_FILE');
  }

  if (file.type && !ACCEPTED_MIME_TYPES.has(file.type)) {
    throw normaliseError('Unsupported file type. Use JPEG or PNG.', 'UNSUPPORTED_TYPE');
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/add-watermark');

    if (signal) {
      const abortListener = () => {
        request.abort();
      };
      if (signal.aborted) {
        request.abort();
        reject(normaliseError('Upload was aborted.', 'ABORTED'));
        return;
      }
      signal.addEventListener('abort', abortListener, { once: true });
      request.addEventListener(
        'loadend',
        () => {
          signal.removeEventListener('abort', abortListener);
        },
        { once: true }
      );
    }

    if (typeof onProgress === 'function') {
      request.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) {
          onProgress(null);
          return;
        }
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress(percentage);
      });
    }

    request.responseType = 'json';

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({
          status: request.status,
          body: request.response ?? null
        });
        return;
      }

      const fallbackMessage = request.response?.message || request.statusText || 'Upload failed.';
      reject(normaliseError(fallbackMessage, 'HTTP_' + request.status));
    };

    request.onerror = () => {
      reject(normaliseError('Network error while uploading image.', 'NETWORK'));
    };

    request.ontimeout = () => {
      reject(normaliseError('Upload timed out. Try again.', 'TIMEOUT'));
    };

    request.onabort = () => {
      reject(normaliseError('Upload was aborted.', 'ABORTED'));
    };

    request.send(formData);
  });
}

export function getAcceptedMimeTypes() {
  return Array.from(ACCEPTED_MIME_TYPES);
}

