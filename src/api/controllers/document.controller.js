const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Document = require('../models/document.model');

// Get all documents with filtering, sorting, and pagination
exports.getAllDocuments = catchAsync(async (req, res, _next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach((el) => delete queryObj[el]);

  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Document.find(JSON.parse(queryStr));

  // Text search if search parameter is provided
  if (req.query.search) {
    query = query.find({
      $text: { $search: req.query.search },
    });
  }

  // Filter by related entity if provided
  if (req.query.entityType && req.query.entityId) {
    query = query.find({
      'relatedTo.entityType': req.query.entityType,
      'relatedTo.entityId': req.query.entityId,
    });
  }

  // 3) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // 4) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // 5) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // EXECUTE QUERY
  const documents = await query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: {
      documents,
    },
  });
  // No return needed here as it's the main function body
});

// Get document by ID
exports.getDocument = catchAsync(async (req, res, next) => {
  const document = await Document.findById(req.params.id)
    .populate({
      path: 'relatedTo.entityId',
      select: 'name firstName lastName email title',
    })
    .populate({
      path: 'previousVersions.uploadedBy',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'signatures.signedBy',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'accessControl.readAccess accessControl.writeAccess',
      select: 'firstName lastName email',
    });

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Check if user has access
  if (!document.isPublic) {
    const userId = req.user.id;
    const creatorId = document.createdBy._id.toString();
    const hasReadAccess = document.accessControl.readAccess.some(
      (user) => user._id.toString() === userId
    );
    const hasWriteAccess = document.accessControl.writeAccess.some(
      (user) => user._id.toString() === userId
    );

    if (
      userId !== creatorId &&
      !hasReadAccess &&
      !hasWriteAccess &&
      req.user.role !== 'admin'
    ) {
      next(
        new AppError('You do not have permission to access this document', 403)
      );
      return;
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      document,
    },
  });
  // No return needed here as it's the main function body
});

// Create new document (file upload handled by multer middleware)
exports.createDocument = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;

  // Extract file information from the uploaded file
  if (!req.file) {
    next(new AppError('Please upload a file', 400));
    return;
  }

  // Construct file object from uploaded file
  req.body.file = {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    url: `/uploads/${req.file.filename}`,
    extension: path.extname(req.file.originalname).toLowerCase(),
    storageProvider: 'local',
  };

  // Parse tags if provided as string
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map((tag) => tag.trim());
  }

  // Parse access control if provided
  if (req.body.readAccess && typeof req.body.readAccess === 'string') {
    req.body.accessControl = {
      readAccess: req.body.readAccess.split(',').map((id) => id.trim()),
      writeAccess: req.body.writeAccess
        ? req.body.writeAccess.split(',').map((id) => id.trim())
        : [],
    };
  }

  const newDocument = await Document.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      document: newDocument,
    },
  });
  // No return needed here as it's the main function body
});

// Update document
exports.updateDocument = catchAsync(async (req, res, next) => {
  // Get document to check permissions
  const document = await Document.findById(req.params.id);

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Check if user has write access
  const userId = req.user.id;
  const creatorId = document.createdBy._id.toString();
  const hasWriteAccess = document.accessControl.writeAccess.some(
    (user) => user._id.toString() === userId
  );

  if (userId !== creatorId && !hasWriteAccess && req.user.role !== 'admin') {
    next(
      new AppError('You do not have permission to update this document', 403)
    );
    return;
  }

  // Extract file information if new file is uploaded
  if (req.file) {
    // If updating with a new file, store the current version in previous versions
    const previousVersion = {
      versionNumber: document.version,
      fileUrl: document.file.url,
      uploadedBy: document.updatedBy || document.createdBy,
      uploadedAt: document.updatedAt || document.createdAt,
      notes: req.body.versionNotes || 'Updated version',
    };

    // Add to previous versions array
    if (!document.previousVersions) document.previousVersions = [];
    document.previousVersions.push(previousVersion);

    // Increment version number
    req.body.version = document.version + 1;

    // Construct file object from new uploaded file
    req.body.file = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
      extension: path.extname(req.file.originalname).toLowerCase(),
      storageProvider: 'local',
    };
  }

  // Parse tags if provided as string
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map((tag) => tag.trim());
  }

  // Parse access control if provided
  if (req.body.readAccess && typeof req.body.readAccess === 'string') {
    req.body.accessControl = {
      readAccess: req.body.readAccess.split(',').map((id) => id.trim()),
      writeAccess: req.body.writeAccess
        ? req.body.writeAccess.split(',').map((id) => id.trim())
        : [],
    };
  }

  // Set updatedBy
  req.body.updatedBy = req.user.id;

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      document: updatedDocument,
    },
  });
  // No return needed here as it's the main function body
});

// Delete document (soft delete)
exports.deleteDocument = catchAsync(async (req, res, next) => {
  // Get document to check permissions
  const document = await Document.findById(req.params.id);

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Check if user has write access
  const userId = req.user.id;
  const creatorId = document.createdBy._id.toString();

  if (userId !== creatorId && req.user.role !== 'admin') {
    next(
      new AppError('You do not have permission to delete this document', 403)
    );
    return;
  }

  await Document.findByIdAndUpdate(req.params.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
});

// Download document
exports.downloadDocument = catchAsync(async (req, res, next) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Check if user has access
  if (!document.isPublic) {
    const userId = req.user.id;
    const creatorId = document.createdBy._id.toString();
    const hasReadAccess = document.accessControl.readAccess.some(
      (user) => user._id.toString() === userId
    );
    const hasWriteAccess = document.accessControl.writeAccess.some(
      (user) => user._id.toString() === userId
    );

    if (
      userId !== creatorId &&
      !hasReadAccess &&
      !hasWriteAccess &&
      req.user.role !== 'admin'
    ) {
      next(
        new AppError(
          'You do not have permission to download this document',
          403
        )
      );
      return;
    }
  }

  // Get file path
  const filePath = path.join(__dirname, '../../../', document.file.path);

  // Check if file exists
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch (err) {
    next(new AppError('File not found on server', 404));
    return;
  }

  // Set content-disposition header for download
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${document.file.originalName}"`
  );
  res.setHeader('Content-Type', document.file.mimeType);

  // Stream file to response
  const fileStream = fs.createReadStream(filePath);
  return fileStream.pipe(res); // Added return
});

// Get public document (no auth required)
exports.getPublicDocument = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const document = await Document.findOne({
    publicAccessUrl: `/documents/public/${token}`,
    isPublic: true,
  });

  if (!document) {
    next(new AppError('No public document found with that token', 404));
    return;
  }

  // Check if share has expired
  if (document.shareExpiration && Date.now() > document.shareExpiration) {
    next(new AppError('This link has expired', 403));
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      document,
    },
  });
  // No return needed here as it's the main function body
});

// Share document (create public access)
exports.shareDocument = catchAsync(async (req, res, next) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Check if user has permission to share
  const userId = req.user.id;
  const creatorId = document.createdBy._id.toString();
  const hasWriteAccess = document.accessControl.writeAccess.some(
    (user) => user._id.toString() === userId
  );

  if (userId !== creatorId && !hasWriteAccess && req.user.role !== 'admin') {
    next(
      new AppError('You do not have permission to share this document', 403)
    );
    return;
  }

  // Generate unique token
  const token = crypto.randomBytes(20).toString('hex');

  // Set expiration if provided
  let shareExpiration = null;
  if (req.body.expirationDays) {
    shareExpiration = new Date();
    shareExpiration.setDate(
      shareExpiration.getDate() + parseInt(req.body.expirationDays, 10) // Added radix 10
    );
  }

  // Update document
  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    {
      isPublic: true,
      publicAccessUrl: `/documents/public/${token}`,
      shareExpiration,
    },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      document: updatedDocument,
    },
  });
  // No return needed here as it's the main function body
});

// Add signature to document
exports.signDocument = catchAsync(async (req, res, next) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    next(new AppError('No document found with that ID', 404));
    return;
  }

  // Add signature
  const signature = {
    signedBy: req.user.id,
    signedAt: Date.now(),
    signatureData: req.body.signatureData,
    verified: true,
  };

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    { $push: { signatures: signature } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      document: updatedDocument,
    },
  });
  // No return needed here as it's the main function body
});

// Search documents
exports.searchDocuments = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    next(new AppError('Please provide a search query', 400));
    return;
  }

  const documents = await Document.find({
    $text: { $search: query },
  }).sort({
    score: { $meta: 'textScore' },
  });

  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: {
      documents,
    },
  });
  // No return needed here as it's the main function body
});
