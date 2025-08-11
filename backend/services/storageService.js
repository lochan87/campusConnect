class ImageService {
  constructor() {
    // Firestore document size limit is 1MB, so we need to be careful with image sizes
    this.maxImageSize = 800 * 1024; // 800KB to leave room for other post data
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  }

  /**
   * Convert image buffer to Base64 string with metadata
   * @param {Buffer} fileBuffer - The image buffer
   * @param {string} mimeType - File MIME type
   * @param {string} fileName - Original filename
   * @returns {Object} - Object containing base64 data and metadata
   */
  convertToBase64(fileBuffer, mimeType, fileName) {
    try {
      // Validate file type
      if (!this.allowedMimeTypes.includes(mimeType)) {
        throw new Error('Unsupported image format');
      }

      // Check file size
      if (fileBuffer.length > this.maxImageSize) {
        throw new Error(`Image size too large. Maximum size is ${this.maxImageSize / 1024}KB`);
      }

      // Convert to base64
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
   * @param {Buffer} fileBuffer - The image buffer
   * @param {string} mimeType - File MIME type
   * @returns {boolean} - Whether the image is valid
   */
  validateImage(fileBuffer, mimeType) {
    try {
      // Check MIME type
      if (!this.allowedMimeTypes.includes(mimeType)) {
        return false;
      }

      // Check file size
      if (fileBuffer.length > this.maxImageSize) {
        return false;
      }

      // Basic validation - check if it starts with valid image headers
      const header = fileBuffer.toString('hex', 0, 8);
      const validHeaders = {
        'ffd8ffe0': 'jpeg', // JPEG
        'ffd8ffe1': 'jpeg', // JPEG EXIF
        'ffd8ffe2': 'jpeg', // JPEG EXIF
        '89504e47': 'png',  // PNG
        '47494638': 'gif',  // GIF
        '52494646': 'webp'  // WEBP
      };

      return Object.keys(validHeaders).some(validHeader => 
        header.toLowerCase().startsWith(validHeader)
      );

    } catch (error) {
      console.error('Error validating image:', error);
      return false;
    }
  }

  /**
   * Extract base64 data from data URL
   * @param {string} dataUrl - Data URL string
   * @returns {Object} - Extracted data and metadata
   */
  extractFromDataUrl(dataUrl) {
    try {
      if (!dataUrl || !dataUrl.startsWith('data:')) {
        throw new Error('Invalid data URL');
      }

      const [metadata, base64Data] = dataUrl.split(',');
      const mimeType = metadata.match(/data:([^;]+)/)?.[1];

      return {
        base64Data,
        mimeType,
        dataUrl
      };

    } catch (error) {
      console.error('Error extracting from data URL:', error);
      throw error;
    }
  }

  /**
   * Compress image if needed (basic implementation)
   * Note: For production, consider using a proper image processing library like sharp
   * @param {Buffer} fileBuffer - The image buffer
   * @param {string} mimeType - File MIME type
   * @returns {Buffer} - Compressed image buffer
   */
  compressIfNeeded(fileBuffer, mimeType) {
    // For now, just return the original buffer
    // In production, you might want to use sharp or similar library for compression
    if (fileBuffer.length > this.maxImageSize) {
      throw new Error('Image too large and compression not implemented');
    }
    return fileBuffer;
  }

  /**
   * Get image info from base64 data
   * @param {string} dataUrl - Data URL string
   * @returns {Object} - Image information
   */
  getImageInfo(dataUrl) {
    try {
      const extracted = this.extractFromDataUrl(dataUrl);
      const sizeInBytes = Math.ceil(extracted.base64Data.length * 0.75); // Approximate original size

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
