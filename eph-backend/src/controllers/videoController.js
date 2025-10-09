// src/controllers/videoController.js
const {
  Video,
  User,
  Submission,
  Competition,
  Registration,
} = require("../models");
const { Op } = require("sequelize");
const storageService = require("../services/storageService");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");

const videoController = {
  // Get video feed (public/authenticated)
getVideoFeed: async (req, res) => {
  try {
    const { page = 1, limit = 20, tags, search, uploader } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const userRole = req.user?.role || "guest";
    const userId = req.user?.id || null;

    logger.info(`Feed request - Role: ${userRole}, User ID: ${userId}`);

    // Base constraints
    const whereClause = {
      is_active: true,
    };

    // Role-based visibility
    if (userRole === "student") {
      // ✅ Students see ONLY their own videos (any processing state is okay for self)
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      whereClause.uploader_id = userId;

      // If you want students to see only completed ones, uncomment next line:
      // whereClause.processing_status = { [Op.eq]: "completed" };
    } else if (["admin", "hiring", "investor"].includes(userRole)) {
      // ✅ Elevated roles: see all completed videos
      whereClause.processing_status = { [Op.eq]: "completed" };
    } else {
      // ✅ Guests/unknown: public completed videos only
      whereClause.processing_status = { [Op.eq]: "completed" };
      whereClause.visibility_roles = { [Op.contains]: ["public"] };
    }

    // Extra filters (these should NOT broaden student scope beyond self)
    if (tags) {
      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagArray.length) whereClause.tags = { [Op.overlap]: tagArray };
    }

    if (search) {
      // merge with existing OR carefully
      whereClause[Op.and] = (whereClause[Op.and] || []).concat([{
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { tags: { [Op.overlap]: [search] } },
        ]
      }]);
    }

    // uploader param only respected for elevated roles or for the student themselves
    if (uploader) {
      if (["admin", "hiring", "investor"].includes(userRole)) {
        whereClause.uploader_id = uploader;
      } else if (userRole === "student") {
        // keep it locked to self, ignore if not self
        whereClause.uploader_id = userId;
      } else {
        // guest + uploader filter not allowed; keep public scope
      }
    }

    const orderBy = [["created_at", "DESC"]];

    logger.info(`Feed query where clause: ${JSON.stringify(whereClause)}`);

    const { rows: videos, count } = await Video.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "uploader",
          attributes: ["id", "name", "college", "branch", "profile_pic_url", "verified"],
        },
      ],
      limit: limitNum,
      offset,
      order: orderBy,
      distinct: true,
    });

    logger.info(`Feed query returned ${videos.length} videos out of ${count} total`);

    const totalPages = Math.ceil(count / limitNum);

    const formattedVideos = videos.map((video) => ({
      ...video.toPublicJSON(userRole),
      uploader: video.uploader ? video.uploader.toJSON() : null,
    }));

    res.json({
      success: true,
      data: {
        videos: formattedVideos,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalVideos: count,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Get video feed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch video feed",
      error: error.message,
    });
  }
},


  getVideoById: async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || "guest";
    const userId = req.user?.id || null;

    const video = await Video.findByPk(id, {
      include: [
        {
          model: User,
          as: "uploader",
          attributes: [
            "id",
            "name",
            "college",
            "branch",
            "year",
            "profile_pic_url",
            "verified",
            "xp",
            "badges",
          ],
        },
      ],
    });

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (userRole === "student") {
      // ✅ Students can ONLY access their own videos (even if visibility says "student")
      if (!userId || video.uploader_id !== userId) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      // (Optional) if you also want to hide non-completed self videos, enforce it here.
      // if (video.processing_status !== "completed") { ... }
    } else if (["admin", "hiring", "investor"].includes(userRole)) {
      // elevated roles: allowed
    } else {
      // guest: only public completed
      if (
        video.processing_status !== "completed" ||
        !(Array.isArray(video.visibility_roles) && video.visibility_roles.includes("public"))
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    if (video.uploader_id !== userId) {
      await video.incrementViews();
    }

    res.json({
      success: true,
      data: {
        video: {
          ...video.toPublicJSON(userRole),
          uploader: video.uploader ? video.uploader.toJSON() : null,
        },
      },
    });
  } catch (error) {
    logger.error("Get video by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: error.message,
    });
  }
},


  // Legacy: Upload new video (single-file flow)
  uploadVideo: async (req, res) => {
    try {
      const {
        title,
        description,
        tags = [],
        visibility_roles = ["uploader", "hiring", "investor", "admin"],
      } = req.body;
      const userId = req.user.id;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Video file is required" });
      }

      const allowedTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/webm",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid file type. Only MP4/MOV/WebM allowed.",
          });
      }

      let uploadResult;
      try {
        uploadResult = await storageService.uploadVideo(req.file, {
          uploaderId: userId,
          title,
        });
      } catch (err) {
        logger.error("Video storage upload failed:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to upload to storage",
            error: err.message,
          });
      }

      const remoteUrl = uploadResult?.url;
      const thumbnail = uploadResult?.thumbnailUrl || null;
      const rawDuration =
        uploadResult && uploadResult.duration
          ? parseInt(uploadResult.duration, 10)
          : 1;
      const duration = Math.min(60, Math.max(1, rawDuration));

      if (!remoteUrl || typeof remoteUrl !== "string") {
        logger.error("Storage returned invalid URL for video upload", {
          uploadResult,
        });
        return res
          .status(500)
          .json({
            success: false,
            message: "Storage did not return a valid remote URL",
          });
      }

      const video = await Video.create({
        uploader_id: userId,
        title,
        description,
        url: remoteUrl,
        thumbnail_url: thumbnail,
        length_sec: Math.max(1, duration),
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        tags: Array.isArray(tags)
          ? tags
          : (tags || "")
              .toString()
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
        visibility_roles,
        processing_status: "processing",
      });

      await video.update({
        processing_metadata: {
          originalFilename: req.file.originalname,
          uploadedAt: new Date(),
          processingStarted: true,
        },
      });

      try {
        const user = await User.findByPk(userId);
        if (user) await user.addXP(25, "Video Upload");
      } catch (xpErr) {
        logger.warn("Award XP failed", xpErr);
      }

      setTimeout(async () => {
        try {
          await video.update({ processing_status: "completed" });
          logger.info(`Video ${video.id} processing completed`);
        } catch (err) {
          logger.error(`Video ${video.id} processing failed:`, err);
          await video.update({
            processing_status: "failed",
            processing_metadata: { error: err.message },
          });
        }
      }, 5000);

      res.status(201).json({
        success: true,
        message: "Video uploaded successfully and is being processed",
        data: { video: video.toPublicJSON(req.user.role) },
      });
    } catch (error) {
      logger.error("Upload video error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to upload video",
          error: error.message,
        });
    }
  },

  // New: Upload submission (multipart: video + [zip] + [attachments])
  // ✅ FIX: Update submission upload to ensure proper visibility
  uploadSubmission: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      // TEXT fields
      const title = (req.body.title || req.body.summary || "Submission")
        .toString()
        .slice(0, 60);
      const description = (req.body.description || "").toString().slice(0, 140);
      const summary = req.body.summary ? req.body.summary.toString() : null;
      const repo_url = req.body.repo_url ? req.body.repo_url.toString() : null;
      const drive_url = req.body.drive_url
        ? req.body.drive_url.toString()
        : null;
      const tagsRaw = req.body.tags || req.body.tag || "";
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw
        : tagsRaw
        ? tagsRaw
            .toString()
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // FILES (multer)
      const files = req.files || {};
      const videoFile = (files.video && files.video[0]) || null;
      const attachmentFiles = files.attachments || [];
      const zipFile = (files.zip && files.zip[0]) || null;

      if (!videoFile) {
        return res
          .status(400)
          .json({ success: false, message: "Video file is required" });
      }

      // Validate video
      try {
        await storageService.validateVideoFile(videoFile);
      } catch (vErr) {
        try {
          await fs.unlink(videoFile.path);
        } catch (_) {}
        return res
          .status(400)
          .json({
            success: false,
            message: vErr.message || "Invalid video file",
          });
      }

      // Upload video to storage
      const videoId = uuidv4();
      let uploadResult = null;
      try {
        uploadResult = await storageService.uploadVideo(videoFile, {
          videoId,
          uploaderId: userId,
          title,
        });
      } catch (err) {
        try {
          await fs.unlink(videoFile.path);
        } catch (_) {}
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to store video",
            error: err.message,
          });
      }

      if (!uploadResult || !uploadResult.url) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Storage returned invalid upload result",
          });
      }

      // Upload attachments (optional)
      const attachmentUrls = [];
      try {
        const allAttach = [].concat(attachmentFiles || []);
        if (zipFile) allAttach.push(zipFile);
        if (allAttach.length > 0) {
          const attRes = await storageService.uploadAttachmentsLocal(
            allAttach,
            {
              contextId: videoId,
              uploaderId: userId,
            }
          );
          for (const a of attRes) {
            if (a && a.url) attachmentUrls.push(a.url);
          }
        }
      } catch (attErr) {
        logger.warn("Attachment upload failed (non-fatal):", attErr);
      }

      // Create Video row
      const rawDuration =
        uploadResult.duration && Number(uploadResult.duration) > 0
          ? Math.floor(uploadResult.duration)
          : 60;
      const lengthSec = Math.min(60, Math.max(1, rawDuration));
      const thumbnailUrl =
        uploadResult.thumbnailUrl || uploadResult.thumbnail_url || null;

      // ✅ FIX: Ensure visibility_roles includes all necessary roles
      const visibilityRoles = req.body.visibility_roles
        ? Array.isArray(req.body.visibility_roles)
          ? req.body.visibility_roles
          : req.body.visibility_roles.split(",").map(r => r.trim())
        : ["uploader", "student", "hiring", "investor", "admin"];

      logger.info(`Creating video with visibility roles: ${JSON.stringify(visibilityRoles)}`);

      const videoData = {
        uploader_id: userId,
        title: title || "Submission",
        description: description || null,
        url: uploadResult.url,
        thumbnail_url: thumbnailUrl,
        length_sec: lengthSec,
        file_size: uploadResult.fileSize || videoFile.size || null,
        tags,
        visibility_roles: visibilityRoles,
        processing_status: "processing", // Will be updated to "completed" after processing
        metadata: {
          attachments: attachmentUrls,
          originalFilename: videoFile.originalname,
        },
        summary,
        repo_url,
        drive_url,
      };

      const createdVideo = await Video.create(videoData);

      logger.info(`Video created with ID: ${createdVideo.id}, visibility: ${JSON.stringify(createdVideo.visibility_roles)}`);

      // ALWAYS create a Submission when competition_id is provided
      const competitionId = (
        req.body.competition_id ||
        req.body.competitionId ||
        ""
      )
        .toString()
        .trim();
      let submission = null;

      if (competitionId) {
        try {
          const comp = await require("../models").Competition.findByPk(
            competitionId
          );
          if (!comp) {
            logger.warn(
              `Competition ${competitionId} not found; creating Submission anyway with loose link`
            );
          }

          const Registration = require("../models").Registration;
          const reg = await Registration.findOne({
            where: { competition_id: competitionId, leader_id: userId },
          }).catch(() => null);

          const Submission = require("../models").Submission;

          const zipUrl =
            (Array.isArray(attachmentUrls) &&
              attachmentUrls.find((u) => u.toLowerCase().endsWith(".zip"))) ||
            null;

          submission = await Submission.create({
            competition_id: competitionId,
            leader_id: userId,
            team_name: reg?.team_name || null,
            title: videoData.title || "Submission",
            summary: summary || null,
            repo_url: repo_url || null,
            drive_url: drive_url || null,
            video_url: createdVideo.url,
            zip_url: zipUrl,
            attachments_json: JSON.stringify(attachmentUrls || []),
            status: "submitted",
          });

          logger.info(`Submission created with ID: ${submission.id}`);
        } catch (subErr) {
          logger.error(
            "Failed to create Submission after video upload:",
            subErr
          );
        }
      }

      // Simulate processing finishing (mark as completed)
      setTimeout(async () => {
        try {
          const fresh = await Video.findByPk(createdVideo.id);
          if (fresh) {
            await fresh.update({ processing_status: "completed" });
            logger.info(`Video ${createdVideo.id} marked as completed`);
          }
        } catch (err) {
          logger.error(`Failed to mark video ${createdVideo.id} as completed:`, err);
          try {
            const fresh = await Video.findByPk(createdVideo.id);
            if (fresh) {
              await fresh.update({
                processing_status: "failed",
                processing_metadata: { error: err.message },
              });
            }
          } catch (_) {}
        }
      }, 5000);

      res.status(201).json({
        success: true,
        message: "Submission uploaded and is being processed",
        data: {
          video: createdVideo.toJSON(),
          submission: submission ? submission.toJSON() : null,
        },
      });
    } catch (error) {
      logger.error("Upload submission error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload submission",
        error: error.message,
      });
    }
  },

  // Update video
  updateVideo: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, tags, visibility_roles } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const video = await Video.findByPk(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      if (!video.canBeEditedBy(userId, userRole)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (tags)
        updateData.tags = Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim());
      if (visibility_roles) updateData.visibility_roles = visibility_roles;

      await video.update(updateData);

      res.json({
        success: true,
        message: "Video updated successfully",
        data: {
          video: video.toPublicJSON(userRole),
        },
      });
    } catch (error) {
      logger.error("Update video error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update video",
        error: error.message,
      });
    }
  },

  // Delete video
  deleteVideo: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const video = await Video.findByPk(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      if (!video.canBeEditedBy(userId, userRole)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      try {
        await storageService.deleteVideo(video.url, video.thumbnail_url);
      } catch (storageError) {
        logger.error("Failed to delete from storage:", storageError);
      }

      await video.destroy();

      res.json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error) {
      logger.error("Delete video error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete video",
        error: error.message,
      });
    }
  },

  // Toggle video like
  toggleVideoLike: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const video = await Video.findByPk(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      if (!video.isVisibleTo(req.user.role) && video.uploader_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const hasLiked = req.body.liked || false;

      if (hasLiked) {
        await video.decrementLikes();
      } else {
        await video.incrementLikes();

        if (video.uploader_id !== userId) {
          const uploader = await User.findByPk(video.uploader_id);
          await uploader.addXP(2, "Video Like Received");
        }
      }

      res.json({
        success: true,
        message: hasLiked ? "Video unliked" : "Video liked",
        data: {
          liked: !hasLiked,
          likesCount: video.likes_count,
        },
      });
    } catch (error) {
      logger.error("Toggle video like error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
        error: error.message,
      });
    }
  },

  // Get user's videos
  getUserVideos: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status, processing_status } = req.query;
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;

      const offset = (page - 1) * limit;

      const isOwnProfile = userId === currentUserId;
      const isAuthorized =
        currentUserRole === "admin" ||
        currentUserRole === "hiring" ||
        currentUserRole === "investor";

      if (!isOwnProfile && !isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const whereClause = { uploader_id: userId };

      if (processing_status) {
        whereClause.processing_status = processing_status;
      } else if (!isOwnProfile) {
        whereClause.processing_status = "completed";
      }

      const { rows: videos, count } = await Video.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "uploader",
            attributes: [
              "id",
              "name",
              "college",
              "profile_pic_url",
              "verified",
            ],
          },
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          videos: videos.map((video) => video.toPublicJSON(currentUserRole)),
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalVideos: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error("Get user videos error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user videos",
        error: error.message,
      });
    }
  },

  // Feature/unfeature video (admin only)
  toggleVideoFeature: async (req, res) => {
    try {
      const { id } = req.params;
      const { featured = true } = req.body;

      const video = await Video.findByPk(id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      await video.update({ is_featured: featured });

      res.json({
        success: true,
        message: `Video ${featured ? "featured" : "unfeatured"} successfully`,
        data: {
          video: video.toPublicJSON(req.user.role),
        },
      });
    } catch (error) {
      logger.error("Toggle video feature error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle video feature",
        error: error.message,
      });
    }
  },

  // Get video analytics (admin/uploader only)
  getVideoAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const video = await Video.findByPk(id, {
        include: [
          {
            model: User,
            as: "uploader",
            attributes: ["id", "name"],
          },
        ],
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      if (video.uploader_id !== userId && userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const analytics = {
        videoId: video.id,
        title: video.title,
        uploader: video.uploader.name,
        views: video.views_count,
        likes: video.likes_count,
        comments: video.comments_count,
        processing_status: video.processing_status,
        uploadDate: video.created_at,
        duration: video.getDurationFormatted(),
        fileSize: video.getFileSizeFormatted(),
        processingMetadata: video.processing_metadata,
      };

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      logger.error("Get video analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch video analytics",
        error: error.message,
      });
    }
  },

  // Get video statistics (admin only)
  getVideoStats: async (req, res) => {
    try {
      const stats = await Video.getStats();

      const additionalStats = {
        ...stats,
        totalViews: (await Video.sum("views_count")) || 0,
        totalLikes: (await Video.sum("likes_count")) || 0,
        averageVideoLength: await Video.findAll({
          attributes: [
            [
              Video.sequelize.fn("AVG", Video.sequelize.col("length_sec")),
              "avg_length",
            ],
          ],
          raw: true,
        }).then((result) => Math.round(result[0]?.avg_length || 0)),
      };

      res.json({
        success: true,
        data: { stats: additionalStats },
      });
    } catch (error) {
      logger.error("Get video stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch video statistics",
        error: error.message,
      });
    }
  },
};

module.exports = videoController;
