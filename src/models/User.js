'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'First name is required'
        },
        len: {
          args: [1, 50],
          msg: 'First name must be between 1 and 50 characters'
        }
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Last name is required'
        },
        len: {
          args: [1, 50],
          msg: 'Last name must be between 1 and 50 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notEmpty: {
          msg: 'Email is required'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password is required'
        },
        len: {
          args: [8, 128],
          msg: 'Password must be between 8 and 128 characters'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'manager', 'sales', 'installer', 'finance'),
      defaultValue: 'user',
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\d\s\-\+\(\)]+$/,
          msg: 'Invalid phone number format'
        }
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
        user.email = user.email.toLowerCase();
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
        }
        if (user.changed('email')) {
          user.email = user.email.toLowerCase();
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      },
      active: {
        where: { active: true }
      }
    }
  });

  // Instance methods
  User.prototype.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  User.prototype.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
  };

  User.prototype.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return verificationToken;
  };

  User.prototype.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > new Date());
  };

  User.prototype.incLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < new Date()) {
      await this.update({
        loginAttempts: 1,
        lockUntil: null
      });
      return;
    }
    
    const updates = { loginAttempts: this.loginAttempts + 1 };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Lock the account after max attempts
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
      updates.lockUntil = new Date(Date.now() + lockTime);
    }
    
    await this.update(updates);
  };

  User.prototype.resetLoginAttempts = async function() {
    await this.update({
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date()
    });
  };

  // Associations
  User.associate = function(models) {
    // Lead associations
    User.hasMany(models.Lead, {
      foreignKey: 'assignedToId',
      as: 'assignedLeads'
    });
    
    User.hasMany(models.Lead, {
      foreignKey: 'createdById',
      as: 'createdLeads'
    });
    
    // Project associations
    User.hasMany(models.Project, {
      foreignKey: 'projectManagerId',
      as: 'managedProjects'
    });
    
    User.hasMany(models.Project, {
      foreignKey: 'salesRepId',
      as: 'salesProjects'
    });
    
    User.hasMany(models.Project, {
      foreignKey: 'designerId',
      as: 'designProjects'
    });
    
    User.hasMany(models.Project, {
      foreignKey: 'createdById',
      as: 'createdProjects'
    });
    
    // Many-to-many for installation team
    User.belongsToMany(models.Project, {
      through: 'project_installation_team',
      foreignKey: 'userId',
      otherKey: 'projectId',
      as: 'installationProjects'
    });
    
    // Customer associations
    User.hasMany(models.Customer, {
      foreignKey: 'createdById',
      as: 'createdCustomers'
    });
    
    // Proposal associations
    User.hasMany(models.Proposal, {
      foreignKey: 'createdById',
      as: 'createdProposals'
    });
    
    // Document associations
    User.hasMany(models.Document, {
      foreignKey: 'createdById',
      as: 'createdDocuments'
    });
    
    User.hasMany(models.Document, {
      foreignKey: 'updatedById',
      as: 'updatedDocuments'
    });
    
    // Equipment associations
    User.hasMany(models.Equipment, {
      foreignKey: 'createdById',
      as: 'createdEquipment'
    });
    
    // Service Request associations
    User.hasMany(models.ServiceRequest, {
      foreignKey: 'assignedToId',
      as: 'assignedServiceRequests'
    });
    
    User.hasMany(models.ServiceRequest, {
      foreignKey: 'createdById',
      as: 'createdServiceRequests'
    });
    
    // Note associations
    User.hasMany(models.CustomerNote, {
      foreignKey: 'createdById',
      as: 'customerNotes'
    });
    
    User.hasMany(models.LeadNote, {
      foreignKey: 'createdById',
      as: 'leadNotes'
    });
    
    User.hasMany(models.ProjectNote, {
      foreignKey: 'createdById',
      as: 'projectNotes'
    });
    
    User.hasMany(models.ServiceRequestNote, {
      foreignKey: 'createdById',
      as: 'serviceRequestNotes'
    });
  };

  return User;
};