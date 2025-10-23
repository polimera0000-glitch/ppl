const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Registration = sequelize.define('Registration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    competition_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'competitions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM('individual', 'team'),
      allowNull: false,
      defaultValue: 'individual'
    },
    team_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [3, 100]
      }
    },
    leader_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    members: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: false
    },
    abstract: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'waitlisted', 'rejected', 'withdrawn'),
      defaultValue: 'pending',
      allowNull: false
    },
    submission_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    stage_progress: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    },
    invitation_status: {
      type: DataTypes.ENUM('complete', 'pending_invitations'),
      defaultValue: 'complete',
      allowNull: false
    }
  }, {
    tableName: 'registrations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['competition_id']
      },
      {
        fields: ['leader_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['members'],
        using: 'gin'
      },
      {
        fields: ['competition_id', 'leader_id'],
        unique: true
      },
      {
        fields: ['rank']
      }
    ],
    hooks: {
      beforeSave: async (registration) => {
        // Auto-set confirmed_at when status changes to confirmed
        if (registration.changed('status') && registration.status === 'confirmed') {
          registration.confirmed_at = new Date();
        }
      }
    }
  });

  // Instance methods
  Registration.prototype.getTeamSize = function() {
    return this.type === 'team' ? this.members.length + 1 : 1; // +1 for leader
  };

  Registration.prototype.isTeamMember = function(userId) {
    return this.leader_id === userId || this.members.includes(userId);
  };

  Registration.prototype.addMember = async function(userId) {
    if (!this.members.includes(userId) && this.leader_id !== userId) {
      this.members = [...this.members, userId];
      await this.save(['members']);
      return true;
    }
    return false;
  };

  Registration.prototype.removeMember = async function(userId) {
    const index = this.members.indexOf(userId);
    if (index > -1) {
      this.members = this.members.filter(id => id !== userId);
      await this.save(['members']);
      return true;
    }
    return false;
  };

  Registration.prototype.canBeEditedBy = function(userId) {
    return this.leader_id === userId && this.status === 'pending';
  };

  Registration.prototype.updateProgress = async function(stage, data) {
    this.stage_progress = {
      ...this.stage_progress,
      [stage]: {
        ...data,
        updated_at: new Date()
      }
    };
    await this.save(['stage_progress']);
    return this;
  };

  Registration.prototype.setScore = async function(score, rank = null) {
    this.score = score;
    if (rank) this.rank = rank;
    await this.save(['score', 'rank']);
    return this;
  };

  Registration.prototype.getPendingInvitations = async function() {
    const TeamInvitation = sequelize.models.TeamInvitation;
    return await TeamInvitation.findAll({
      where: {
        registration_id: this.id,
        status: 'pending'
      }
    });
  };

  Registration.prototype.getAllInvitations = async function() {
    const TeamInvitation = sequelize.models.TeamInvitation;
    return await TeamInvitation.findByRegistration(this.id);
  };

  Registration.prototype.areAllInvitationsResolved = async function() {
    const pendingInvitations = await this.getPendingInvitations();
    return pendingInvitations.length === 0;
  };

  Registration.prototype.getAcceptedInvitations = async function() {
    const TeamInvitation = sequelize.models.TeamInvitation;
    return await TeamInvitation.findAll({
      where: {
        registration_id: this.id,
        status: 'accepted'
      }
    });
  };

  Registration.prototype.updateInvitationStatus = async function() {
    const areResolved = await this.areAllInvitationsResolved();
    const newStatus = areResolved ? 'complete' : 'pending_invitations';
    
    if (this.invitation_status !== newStatus) {
      this.invitation_status = newStatus;
      await this.save(['invitation_status']);
    }
    
    return this;
  };

  Registration.prototype.addMemberFromInvitation = async function(userId) {
    if (!this.members.includes(userId) && this.leader_id !== userId) {
      this.members = [...this.members, userId];
      await this.save(['members']);
      return true;
    }
    return false;
  };

  // Class methods
  Registration.findByCompetition = function(competitionId, status = null) {
    const where = { competition_id: competitionId };
    if (status) where.status = status;
    
    return this.findAll({
      where,
      order: [['rank', 'ASC'], ['score', 'DESC'], ['created_at', 'ASC']]
    });
  };

  Registration.findByUser = function(userId) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { leader_id: userId },
          { members: { [sequelize.Sequelize.Op.contains]: [userId] } }
        ]
      },
      order: [['created_at', 'DESC']]
    });
  };

  Registration.findPendingByCompetition = function(competitionId) {
    return this.findByCompetition(competitionId, 'pending');
  };

  Registration.findConfirmedByCompetition = function(competitionId) {
    return this.findByCompetition(competitionId, 'confirmed');
  };

  Registration.getLeaderboard = function(competitionId, limit = 50) {
    return this.findAll({
      where: {
        competition_id: competitionId,
        status: 'confirmed',
        score: { [sequelize.Sequelize.Op.ne]: null }
      },
      order: [['rank', 'ASC'], ['score', 'DESC']],
      limit
    });
  };

  Registration.checkUserRegistration = async function(competitionId, userId) {
    return this.findOne({
      where: {
        competition_id: competitionId,
        [sequelize.Sequelize.Op.or]: [
          { leader_id: userId },
          { members: { [sequelize.Sequelize.Op.contains]: [userId] } }
        ]
      }
    });
  };

  return Registration;
};