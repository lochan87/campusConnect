class ImageService {
  constructor() {
    // Firestore document size limit is 1MB, so we need to be careful with image sizes
    this.maxImageSize = 800 * 1024; // 800KB for post/DM images
    this.maxAvatarSize = 300 * 1024; // 300KB for profile avatars
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  }

  /**
   * Upload an image (multer file object) and return a base64 data URL.
   * Used by messages.js (DM images) and users.js (avatar upload).
   * @param {Object} multerFile - req.file from multer { buffer, mimetype, originalname }
   * @param {string} pathHint  - e.g. 'dm/convId', 'avatars/uid' (not used for storage)
   * @param {Object} options   - { maxSize?: number } override max size
   * @returns {string} base64 data URL
   */
  uploadImage(multerFile, pathHint = '', options = {}) {
    if (!multerFile || !multerFile.buffer) {
      throw new Error('No file provided');
    }

    const { buffer, mimetype } = multerFile;
    const maxSize = options.maxSize || this.maxImageSize;

    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new Error('Unsupported image format. Allowed: jpeg, png, gif, webp');
    }

    if (buffer.length > maxSize) {
      const limitKB = Math.round(maxSize / 1024);
      throw new Error(`Image too large. Maximum size is ${limitKB} KB`);
    }

    const base64 = buffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
  }

  /**
   * Upload an avatar image with stricter 300 KB limit.
   * Returns base64 data URL.
   */
  uploadAvatar(multerFile) {
    return this.uploadImage(multerFile, 'avatars', { maxSize: this.maxAvatarSize });
  }

  /**
   * Convert image buffer to Base64 string with metadata
   */
  convertToBase64(fileBuffer, mimeType, fileName) {
    try {
      if (!this.allowedMimeTypes.includes(mimeType)) {
        throw new Error('Unsupported image format');
      }
      if (fileBuffer.length > this.maxImageSize) {
        throw new Error(`Image size too large. Maximum size is ${this.maxImageSize / 1024}KB`);
      }
      const base64String = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64String}`;
      return {
        imageData: dataUrl,
        mimeType: mimeType,
        originalName: fileName,
        size: fileBuffer.length,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImage(fileBuffer, mimeType) {
    try {
      if (!this.allowedMimeTypes.includes(mimeType)) return false;
      if (fileBuffer.length > this.maxImageSize) return false;
      const header = fileBuffer.toString('hex', 0, 8);
      const validHeaders = {
        'ffd8ffe0': 'jpeg',
        'ffd8ffe1': 'jpeg',
        'ffd8ffe2': 'jpeg',
        '89504e47': 'png',
        '47494638': 'gif',
        '52494646': 'webp'
      };
      return Object.keys(validHeaders).some(h => header.toLowerCase().startsWith(h));
    } catch (error) {
      console.error('Error validating image:', error);
      return false;
    }
  }

  /**
   * Extract base64 data from data URL
   */
  extractFromDataUrl(dataUrl) {
    try {
      if (!dataUrl || !dataUrl.startsWith('data:')) throw new Error('Invalid data URL');
      const [metadata, base64Data] = dataUrl.split(',');
      const mimeType = metadata.match(/data:([^;]+)/)?.[1];
      return { base64Data, mimeType, dataUrl };
    } catch (error) {
      console.error('Error extracting from data URL:', error);
      throw error;
    }
  }

  /**
   * Get image info from base64 data
   */
  getImageInfo(dataUrl) {
    try {
      const extracted = this.extractFromDataUrl(dataUrl);
      const sizeInBytes = Math.ceil(extracted.base64Data.length * 0.75);
      return {
        mimeType: extracted.mimeType,
        sizeInBytes,
        sizeInKB: Math.round(sizeInBytes / 1024),
        format: extracted.mimeType?.split('/')[1]?.toUpperCase()
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }
}

module.exports = new ImageService();
