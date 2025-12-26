// src/utils/storageMonitor.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class StorageMonitor {
  constructor(uploadPath) {
    this.uploadPath = uploadPath;
    this.maxStorageGB = 100; // 100GB limit
    this.warningThresholdGB = 80; // Warn at 80GB
  }

  async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Error calculating directory size:', error);
      return 0;
    }
  }

  async checkStorageUsage() {
    try {
      const totalBytes = await this.getDirectorySize(this.uploadPath);
      const totalGB = totalBytes / (1024 * 1024 * 1024);
      const usagePercent = (totalGB / this.maxStorageGB) * 100;

      const storageInfo = {
        totalGB: Math.round(totalGB * 100) / 100,
        maxGB: this.maxStorageGB,
        usagePercent: Math.round(usagePercent * 100) / 100,
        remainingGB: Math.round((this.maxStorageGB - totalGB) * 100) / 100
      };

      // Log storage status
      logger.info('Storage Usage:', storageInfo);

      // Warn if approaching limit
      if (totalGB > this.warningThresholdGB) {
        logger.warn(`Storage usage warning: ${storageInfo.totalGB}GB / ${this.maxStorageGB}GB (${storageInfo.usagePercent}%)`);
      }

      return storageInfo;
    } catch (error) {
      logger.error('Error checking storage usage:', error);
      return null;
    }
  }

  async getVideoCount() {
    try {
      const videosPath = path.join(this.uploadPath, 'videos');
      const files = await fs.readdir(videosPath);
      return files.length;
    } catch (error) {
      logger.error('Error counting videos:', error);
      return 0;
    }
  }
}

module.exports = StorageMonitor;