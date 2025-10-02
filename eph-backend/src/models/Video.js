const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define('Video', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    uploader_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 60]
      }
    },
    description: {
      type: DataTypes.STRING(140),
      allowNull: true,
      validate: {
        len: [0, 140]
      }
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    repo_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
      validate: { isUrl: true }
    },
    drive_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
      validate: { isUrl: true }
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        isValidUrl(value) {
        // accept http(s) URLs, including localhost with port
          if (typeof value !== 'string' || !/^https?:\/\/[^\s]+$/.test(value)) {
            throw new Error('Invalid URL for video (must start with http:// or https://)');
          }
        }
      }
    },
    thumbnail_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
         isValidUrlOrNull(value) {
      if (value === null || value === undefined || value === '') return;
      if (typeof value !== 'string' || !/^https?:\/\/[^\s]+$/.test(value)) {
        throw new Error('Invalid thumbnail URL (must start with http:// or https://)');
      }
    }
      }
    },
    length_sec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 60
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    },
    visibility_roles: {
  // use plain strings to match existing DB column (varchar[]). Safer during development.
  type: DataTypes.ARRAY(DataTypes.STRING),
  defaultValue: ['uploader', 'hiring', 'investor', 'admin'],
  allowNull: false
},
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    file_format: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    processing_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    transcoding_job_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'videos',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['uploader_id']
      },
      {
        fields: ['processing_status']
      },
      {
        fields: ['is_active', 'created_at']
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['visibility_roles'],
        using: 'gin'
      },
      {
        fields: ['views_count']
      },
      {
        fields: ['is_featured']
      }
    ]
  });

  // Instance methods
  Video.prototype.incrementViews = async function() {
    this.views_count += 1;
    await this.save(['views_count']);
    return this;
  };

  Video.prototype.incrementLikes = async function() {
    this.likes_count += 1;
    await this.save(['likes_count']);
    return this;
  };

  Video.prototype.decrementLikes = async function() {
    if (this.likes_count > 0) {
      this.likes_count -= 1;
      await this.save(['likes_count']);
    }
    return this;
  };

  Video.prototype.isVisibleTo = function(userRole) {
    return this.visibility_roles.includes(userRole) || userRole === 'admin';
  };

  Video.prototype.canBeEditedBy = function(userId, userRole) {
    return this.uploader_id === userId || userRole === 'admin';
  };

  Video.prototype.toPublicJSON = function(userRole = 'student') {
  // base fields always safe to expose
  const base = {
    id: this.id,
    uploader_id: this.uploader_id,
    title: this.title,
    description: this.description,
    summary: this.summary,
    url: this.url,
    thumbnail_url: this.thumbnail_url,
    length_sec: this.length_sec,
    tags: this.tags || [],
    file_size: this.file_size,
    file_format: this.file_format,
    views_count: this.views_count,
    likes_count: this.likes_count,
    is_featured: this.is_featured,
    is_active: this.is_active,
    created_at: this.created_at,
    updated_at: this.updated_at,
    metadata: this.metadata || {}
  };

  // Add derived fields
  base.duration_formatted = (typeof this.length_sec === 'number') ? `${Math.floor(this.length_sec/60)}:${String(this.length_sec%60).padStart(2,'0')}` : null;
  base.uploader = undefined; // controller will inject uploader separately

  // Role-based trimming: only admins see some internals
  if (userRole === 'admin') {
    base.processing_status = this.processing_status;
    base.transcoding_job_id = this.transcoding_job_id;
  }

  return base;
};

  // Class methods
  Video.findByUploader = function(uploaderId) {
    return this.findAll({
      where: { uploader_id: uploaderId, is_active: true },
      order: [['created_at', 'DESC']]
    });
  };

  Video.findVisible = function(userRole) {
    return this.findAll({
      where: {
        is_active: true,
        visibility_roles: {
          [sequelize.Sequelize.Op.contains]: [userRole]
        }
      },
      order: [['created_at', 'DESC']]
    });
  };

  Video.findFeatured = function(userRole) {
    return this.findAll({
      where: {
        is_active: true,
        is_featured: true,
        visibility_roles: {
          [sequelize.Sequelize.Op.contains]: [userRole]
        }
      },
      order: [['views_count', 'DESC'], ['created_at', 'DESC']]
    });
  };

  Video.findByTags = function(tags, userRole) {
    return this.findAll({
      where: {
        is_active: true,
        tags: {
          [sequelize.Sequelize.Op.overlap]: tags
        },
        visibility_roles: {
          [sequelize.Sequelize.Op.contains]: [userRole]
        }
      },
      order: [['created_at', 'DESC']]
    });
  };

  Video.getProcessingQueue = function() {
    return this.findAll({
      where: {
        processing_status: ['pending', 'processing']
      },
      order: [['created_at', 'ASC']]
    });
  };

  return Video;
}