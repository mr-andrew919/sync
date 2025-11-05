import { addWatermark } from '../services/watermarkService.js';

export const addWatermarkController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required under field name "image".',
      });
    }

    const { relativePath } = await addWatermark(req.file);

    return res.status(200).json({
      success: true,
      filePath: relativePath,
    });
  } catch (error) {
    return next(error);
  }
};

