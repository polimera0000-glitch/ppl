// src/services/storageService.js
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const config = require("../config");
const logger = require("../utils/logger");

class StorageService {
  constructor() {
    // provider and safe storage config
    this.provider =
      config && config.storage && config.storage.provider
        ? config.storage.provider
        : "local";

    const storageLocal =
      config && config.storage && config.storage.local
        ? config.storage.local
        : {};
    this.uploadBase =
      storageLocal.uploadPath || path.join(__dirname, "..", "uploads");
    this.maxFileSize =
      typeof storageLocal.maxFileSize === "number"
        ? storageLocal.maxFileSize
        : 50 * 1024 * 1024; // 50MB // Start async initialization but don't block module import

    this.initializeStorage().catch((err) => {
      // Log but don't throw — prevents crash at require() time
      logger.error("StorageService initialization error (non-fatal):", err);
    });
  }

  async initializeStorage() {
    if (this.provider === "local") {
      // Ensure upload directories exist
      const directories = [
        this.uploadBase,
        path.join(this.uploadBase, "videos"),
        path.join(this.uploadBase, "thumbnails"),
        path.join(this.uploadBase, "attachments"),
        path.join(this.uploadBase, "temp"),
      ];

      for (const dir of directories) {
        try {
          await fs.mkdir(dir, { recursive: true });
          logger.info(`Ensured storage directory exists: ${dir}`);
        } catch (error) {
          // Log but continue
          logger.error(`Failed to create directory ${dir}:`, error);
        }
      }
    } else {
      logger.info(
        `Storage provider "${this.provider}" selected — skipping local dir creation`
      );
    }
  }

  generateFileName(originalName, videoId, type = "video") {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString("hex"); // use let because we may override the extension for thumbnails

    let ext = path.extname(originalName) || ""; // For thumbnails, force an image extension (use .png)

    if (type === "thumb") ext = ".png";

    return `${type}_${videoId}_${timestamp}_${randomHash}${ext}`;
  }

  async uploadVideo(file, metadata = {}) {
    try {
      const { videoId, uploaderId, title } = metadata;

      if (this.provider === "local") {
        return await this.uploadVideoLocal(file, videoId, uploaderId);
      } else if (this.provider === "aws") {
        return await this.uploadVideoAWS(file, videoId, uploaderId);
      } else if (this.provider === "cloudinary") {
        return await this.uploadVideoCloudinary(file, videoId, uploaderId);
      } else {
        throw new Error(`Unsupported storage provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error("Video upload failed:", error);
      throw error;
    }
  }

  async uploadVideoLocal(file, videoId, uploaderId) {
    if (!file || !file.path) throw new Error("Invalid uploaded file"); // create file names

    const videoFileName = this.generateFileName(
      file.originalname,
      videoId,
      "video"
    );
    const thumbnailFileName = this.generateFileName(
      file.originalname,
      videoId,
      "thumb"
    ); // prepare directories/paths

    const videosDir = path.join(this.uploadBase, "videos");
    const thumbsDir = path.join(this.uploadBase, "thumbnails");

    const videoPath = path.join(videosDir, videoFileName);
    const thumbnailPath = path.join(thumbsDir, thumbnailFileName); // Move uploaded file to videos directory

    await fs.rename(file.path, videoPath); // Generate thumbnail (mock implementation) -> returns boolean (true on success)

    const thumbCreated = await this.generateThumbnail(videoPath, thumbnailPath); // Get video duration (mock implementation) -> number (seconds)

    const duration = await this.getVideoDuration(videoPath);

    // ✅ FIX: Use the correct base URL from the config
    const baseUrl =
      config.storage.publicUrl || `http://localhost:${config.server.port}`; // Build public URLs (only if thumbnail created)

    const videoPublicUrl = `${baseUrl}/uploads/videos/${videoFileName}`;
    const thumbnailPublicUrl = thumbCreated
      ? `${baseUrl}/uploads/thumbnails/${thumbnailFileName}`
      : null;

    return {
      url: videoPublicUrl,
      thumbnailUrl: thumbnailPublicUrl,
      duration,
      filePath: videoPath,
      thumbnailPath: thumbCreated ? thumbnailPath : null,
      fileSize: (() => {
        try {
          const stats = fs.statSync ? fs.statSync(videoPath) : null;
          return stats ? stats.size : file.size || null;
        } catch (e) {
          return file.size || null;
        }
      })(),
    };
  }

  async uploadAttachmentsLocal(files, metadata = {}) {
    // files: array of multer file objects { path, originalname, mimetype, size }
    if (!Array.isArray(files) || files.length === 0) return [];

    const attachDir = path.join(this.uploadBase, "attachments");
    try {
      await fs.mkdir(attachDir, { recursive: true });
    } catch (err) {
      logger.error("Failed to ensure attachments dir:", err); // continue
    }

    const results = [];
    for (const file of files) {
      try {
        const fileName = `${Date.now()}_${crypto
          .randomBytes(6)
          .toString("hex")}_${path.basename(file.originalname || file.path)}`;
        const destPath = path.join(attachDir, fileName);
        await fs.rename(file.path, destPath);

        // ✅ FIX: Use the correct base URL from the config
        const baseUrl =
          config.storage.publicUrl || `http://localhost:${config.server.port}`;
        const url = `${baseUrl}/uploads/attachments/${fileName}`;

        results.push({
          fileName,
          url,
          filePath: destPath,
          size: file.size,
          mimetype: file.mimetype,
        });
      } catch (err) {
        logger.error("Failed to move attachment file:", err); // try to cleanup temp file
        try {
          await fs.unlink(file.path);
        } catch (_) {}
      }
    }
    return results;
  }

  async uploadVideoAWS(file, videoId, uploaderId) {
    throw new Error("AWS S3 integration not implemented yet");
  }

  async uploadVideoCloudinary(file, videoId, uploaderId) {
    throw new Error("Cloudinary integration not implemented yet");
  }

  async generateThumbnail(videoPath, thumbnailPath) {
    try {
      // Placeholder thumbnail file; replace with ffmpeg in production
      const placeholderContent = "thumbnail-placeholder";
      await fs.writeFile(thumbnailPath, placeholderContent);
      logger.info(`Thumbnail generated for video: ${videoPath}`);
      return true;
    } catch (error) {
      logger.error("Thumbnail generation failed:", error);
      return null;
    }
  }

  async getVideoDuration(videoPath) {
    try {
      // Mock duration for now
      return Math.floor(Math.random() * 300) + 30;
    } catch (error) {
      logger.error("Failed to get video duration:", error);
      return 60;
    }
  }

  async deleteVideo(videoUrl, thumbnailUrl = null) {
    try {
      if (this.provider === "local") {
        await this.deleteVideoLocal(videoUrl, thumbnailUrl);
      } else if (this.provider === "aws") {
        await this.deleteVideoAWS(videoUrl, thumbnailUrl);
      } else if (this.provider === "cloudinary") {
        await this.deleteVideoCloudinary(videoUrl, thumbnailUrl);
      }
    } catch (error) {
      logger.error("Video deletion failed:", error);
      throw error;
    }
  }

  async deleteVideoLocal(videoUrl, thumbnailUrl) {
    try {
      const videoFileName = path.basename(videoUrl);
      const videoPath = path.join(this.uploadBase, "videos", videoFileName);

      try {
        await fs.unlink(videoPath);
        logger.info(`Video file deleted: ${videoPath}`);
      } catch (error) {
        if (error.code !== "ENOENT") {
          logger.error(`Failed to delete video file: ${videoPath}`, error);
        }
      }

      if (thumbnailUrl) {
        const thumbnailFileName = path.basename(thumbnailUrl);
        const thumbnailPath = path.join(
          this.uploadBase,
          "thumbnails",
          thumbnailFileName
        );

        try {
          await fs.unlink(thumbnailPath);
          logger.info(`Thumbnail file deleted: ${thumbnailPath}`);
        } catch (error) {
          if (error.code !== "ENOENT") {
            logger.error(
              `Failed to delete thumbnail file: ${thumbnailPath}`,
              error
            );
          }
        }
      }
    } catch (error) {
      logger.error("Local video deletion failed:", error);
      throw error;
    }
  }

  async getVideoInfo(videoPath) {
    try {
      const stats = await fs.stat(videoPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error("Failed to get video info:", error);
      return null;
    }
  }

  async validateVideoFile(file) {
    const allowedTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm",
    ];
    const maxSize = this.maxFileSize;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        "Invalid file type. Only MP4, MPEG, MOV, and WebM are allowed."
      );
    }

    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
      );
    }

    return true;
  }

  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const tempDir = path.join(this.uploadBase, "temp");
      const files = await fs.readdir(tempDir);
      const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up temp file: ${filePath}`);
        }
      }
    } catch (error) {
      logger.error("Temp file cleanup failed:", error);
    }
  }

  getPublicUrl(filename, type = "video") {
    if (this.provider === "local") {
      // ✅ FIX: Use the correct base URL from the config
      const baseUrl =
        config.storage.publicUrl || `http://localhost:${config.server.port}`;
      return `${baseUrl}/uploads/${type}s/${filename}`;
    }
    return filename;
  }
}

module.exports = new StorageService();

// export internals for debugging if needed
module.exports._internal = {
  provider:
    config && config.storage && config.storage.provider
      ? config.storage.provider
      : "local",
  uploadBase:
    config &&
    config.storage &&
    config.storage.local &&
    config.storage.local.uploadPath
      ? config.storage.local.uploadPath
      : null,
  maxFileSize:
    config &&
    config.storage &&
    config.storage.local &&
    typeof config.storage.local.maxFileSize === "number"
      ? config.storage.local.maxFileSize
      : 50 * 1024 * 1024,
};
