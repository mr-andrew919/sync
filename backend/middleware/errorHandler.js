import multer from 'multer';

const statusFromError = (err) => {
  if (err.statusCode && Number.isInteger(err.statusCode)) {
    return err.statusCode;
  }

  if (err.status && Number.isInteger(err.status)) {
    return err.status;
  }

  return 500;
};

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isMulterError = err instanceof multer.MulterError;

  if (isMulterError) {
    let message = 'Upload failed.';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds size limit.';
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Only image uploads are supported.';
    }

    return res.status(400).json({ success: false, message });
  }

  const statusCode = statusFromError(err);

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in request pipeline:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

