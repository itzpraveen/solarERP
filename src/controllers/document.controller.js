'use strict';

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { Document, DocumentVersion, DocumentSignature, DocumentAccessControl, User } = db;

// GET /api/documents/public/:token
exports.getPublicDocument = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  const doc = await Document.findOne({
    where: {
      isPublic: true,
      publicAccessUrl: { [Op.like]: `%/${token}` }
    }
  });
  if (!doc) return next(new AppError('Public document not found or expired', 404));

  // Enforce share link expiration if set
  if (doc.shareExpiration && doc.shareExpiration < new Date()) {
    return next(new AppError('Public link has expired', 410));
  }

  res.status(200).json({ status: 'success', data: { document: doc } });
});

// GET /api/documents/search?q=...
exports.searchDocuments = catchAsync(async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (q) {
    const like = `%${q}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('name')), { [Op.like]: like }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('description')), { [Op.like]: like })
    ];
  }

  const { rows, count } = await Document.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  res.status(200).json({ status: 'success', results: rows.length, total: count, page, pages: Math.ceil(count / limit), data: { documents: rows } });
});

// GET /api/documents
exports.getAllDocuments = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.type) where.type = req.query.type;
  if (req.query.category) where.category = req.query.category;
  if (req.query.relatedEntityType) where.relatedEntityType = req.query.relatedEntityType;
  if (req.query.relatedEntityId) where.relatedEntityId = req.query.relatedEntityId;
  if (req.query.status) where.status = req.query.status;

  if (req.query.search) {
    const like = `%${req.query.search.toLowerCase()}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('name')), { [Op.like]: like }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('description')), { [Op.like]: like })
    ];
  }

  const { rows, count } = await Document.findAndCountAll({
    where,
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true
  });

  res.status(200).json({ status: 'success', results: rows.length, total: count, page, pages: Math.ceil(count / limit), data: { documents: rows } });
});

// POST /api/documents (multipart)
exports.createDocument = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('File is required', 400));

  const {
    name,
    description,
    type,
    category = 'other',
    relatedEntityType,
    relatedEntityId,
    tags,
    expiresAt,
    isPublic
  } = req.body;

  if (!name || !type || !relatedEntityType || !relatedEntityId) {
    return next(new AppError('Missing required fields', 400));
  }

  const file = req.file;
  const fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();

  const doc = await Document.create({
    name,
    description: description || null,
    type,
    category,
    relatedEntityType,
    relatedEntityId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: file.path,
    fileUrl: file.path, // If you serve uploads statically, change to the public URL
    fileExtension,
    storageProvider: 'local',
    version: 1,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    isPublic: isPublic === 'true' || isPublic === true,
    tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [],
    metadata: {},
    createdById: req.user.id
  });

  // Create initial version record
  await DocumentVersion.create({
    documentId: doc.id,
    versionNumber: 1,
    fileUrl: doc.fileUrl,
    uploadedById: req.user.id,
    notes: 'Initial upload'
  });

  res.status(201).json({ status: 'success', data: { document: doc } });
});

// GET /api/documents/:id
exports.getDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id, {
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: DocumentVersion, as: 'previousVersions' },
      { model: DocumentAccessControl, as: 'accessControls' },
      { model: DocumentSignature, as: 'signatures' }
    ]
  });
  if (!doc) return next(new AppError('Document not found', 404));
  res.status(200).json({ status: 'success', data: { document: doc } });
});

// PATCH /api/documents/:id (optionally multipart)
exports.updateDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return next(new AppError('Document not found', 404));

  const updates = {};
  const updatableFields = [
    'name', 'description', 'type', 'category', 'relatedEntityType', 'relatedEntityId', 'expiresAt', 'isPublic', 'status', 'tags', 'metadata'
  ];
  updatableFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.expiresAt) updates.expiresAt = new Date(updates.expiresAt);
  if (updates.tags && !Array.isArray(updates.tags)) updates.tags = String(updates.tags).split(',').map(t => t.trim()).filter(Boolean);

  // Handle new file upload (version bump)
  if (req.file) {
    const file = req.file;
    updates.originalName = file.originalname;
    updates.mimeType = file.mimetype;
    updates.fileSize = file.size;
    updates.filePath = file.path;
    updates.fileUrl = file.path; // adjust if serving statically
    updates.fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();
    updates.version = doc.version + 1;

    await DocumentVersion.create({
      documentId: doc.id,
      versionNumber: updates.version,
      fileUrl: updates.fileUrl,
      uploadedById: req.user.id,
      notes: req.body.versionNotes || 'New version upload'
    });
  }

  updates.updatedById = req.user.id;
  await doc.update(updates);

  res.status(200).json({ status: 'success', data: { document: doc } });
});

// DELETE /api/documents/:id (soft delete)
exports.deleteDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return next(new AppError('Document not found', 404));
  await doc.update({ active: false, updatedById: req.user.id });
  res.status(204).json({ status: 'success', data: null });
});

// GET /api/documents/:id/download
exports.downloadDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return next(new AppError('Document not found', 404));
  const filePath = path.resolve(doc.filePath);
  if (!fs.existsSync(filePath)) return next(new AppError('File not found on server', 404));
  return res.download(filePath, doc.originalName);
});

// POST /api/documents/:id/share
exports.shareDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return next(new AppError('Document not found', 404));
  const minutes = parseInt(req.body.expiresInMinutes || '0', 10);
  const expiresAt = minutes > 0 ? new Date(Date.now() + minutes * 60 * 1000) : null;
  await doc.update({ isPublic: true, shareExpiration: expiresAt, updatedById: req.user.id });
  res.status(200).json({ status: 'success', data: { document: doc } });
});

// POST /api/documents/:id/sign
exports.signDocument = catchAsync(async (req, res, next) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return next(new AppError('Document not found', 404));
  const signatureData = req.body.signatureData;
  if (!signatureData) return next(new AppError('Signature data is required', 400));
  const signature = await DocumentSignature.create({
    documentId: doc.id,
    signedById: req.user.id,
    signedAt: new Date(),
    signatureData,
    verified: false
  });
  res.status(201).json({ status: 'success', data: { signature } });
});
