import { useEffect, useMemo, useRef, useState } from 'react';
import { getAcceptedMimeTypes, uploadWatermarkImage } from '../api/upload.js';

const DEFAULT_STATUS = {
  phase: 'idle',
  message: null
};

export default function UploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [progress, setProgress] = useState(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus(DEFAULT_STATUS);
      setProgress(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  const acceptedTypes = useMemo(() => getAcceptedMimeTypes().join(','), []);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target.dataset.overlay === 'true') {
      onClose();
    }
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setStatus(DEFAULT_STATUS);
    setProgress(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setStatus({ phase: 'error', message: 'Please choose an image first.' });
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStatus({ phase: 'uploading', message: null });
    setProgress(null);

    try {
      await uploadWatermarkImage(file, {
        signal: abortController.signal,
        onProgress: (value) => {
          setProgress(value);
        }
      });

      setStatus({ phase: 'success', message: 'Image uploaded successfully.' });
      setProgress(100);
    } catch (error) {
      const friendlyMessage = error?.message || 'Upload failed. Try again.';
      setStatus({ phase: 'error', message: friendlyMessage });
      setProgress(null);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    setStatus(DEFAULT_STATUS);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.focus();
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const isUploading = status.phase === 'uploading';

  return (
    <div className="modal-overlay" data-overlay="true" onMouseDown={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <header className="modal__header">
          <h2 id="upload-modal-title">Add watermark</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
            title="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>
        <form className="modal__body" onSubmit={handleSubmit}>
          <label className="modal__label" htmlFor="upload-input">
            Choose an image (JPEG or PNG)
          </label>
          <input
            id="upload-input"
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {file && (
            <p className="modal__file">Selected: {file.name}</p>
          )}

          {isUploading && (
            <div className="modal__progress">
              <div
                className="modal__progress-bar"
                style={{ width: typeof progress === 'number' ? `${progress}%` : '100%' }}
              />
              <span>{typeof progress === 'number' ? `${progress}%` : 'Uploading...'}</span>
            </div>
          )}

          {status.phase === 'success' && (
            <p className="modal__status modal__status--success">{status.message}</p>
          )}

          {status.phase === 'error' && (
            <div className="modal__status modal__status--error">
              <p>{status.message}</p>
              <button type="button" onClick={handleRetry} className="btn-link">
                Try again
              </button>
            </div>
          )}

          <footer className="modal__footer">
            <div className="modal__footer-actions">
              <button type="submit" className="btn-primary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isUploading}>
                Cancel
              </button>
            </div>

            {isUploading && (
              <button type="button" className="btn-ghost" onClick={handleAbort}>
                Abort
              </button>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}

