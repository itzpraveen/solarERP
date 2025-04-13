const express = require('express');
const documentController = require('../controllers/document.controller');
const authController = require('../controllers/auth.controller');
const upload = require('../../utils/fileUpload');
const { check } = require('express-validator');
const router = express.Router();

// Public route for accessing shared documents
router.get('/public/:token', documentController.getPublicDocument);

// All other routes require authentication
router.use(authController.protect);

// Input validation
const validateDocument = [
  check('name', 'Document name is required').not().isEmpty(),
  check('type', 'Valid document type is required').isIn([
    'permit',
    'contract',
    'design',
    'proposal',
    'inspection',
    'utility',
    'warranty',
    'invoice',
    'customer',
    'marketing',
    'legal',
    'other'
  ]),
  check('relatedTo.entityType', 'Valid entity type is required').isIn([
    'project',
    'customer',
    'lead',
    'proposal',
    'equipment',
    'user',
    'other'
  ]),
  check('relatedTo.entityId', 'Valid entity ID is required').isMongoId()
];

// Search documents
router.get('/search', authController.restrictTo('admin', 'manager', 'sales'), documentController.searchDocuments);

// Main document routes
router.route('/')
  .get(authController.restrictTo('admin', 'manager', 'sales'), documentController.getAllDocuments)
  .post(authController.restrictTo('admin', 'manager', 'sales'), upload.single('file'), validateDocument, documentController.createDocument);

router.route('/:id')
  .get(authController.restrictTo('admin', 'manager', 'sales'), documentController.getDocument)
  .patch(authController.restrictTo('admin', 'manager'), upload.single('file'), documentController.updateDocument)
  .delete(authController.restrictTo('admin', 'manager'), documentController.deleteDocument);

// Download document
router.get('/:id/download', authController.restrictTo('admin', 'manager', 'sales'), documentController.downloadDocument);

// Share document
router.post('/:id/share', authController.restrictTo('admin', 'manager', 'sales'), documentController.shareDocument);

// Sign document
router.post('/:id/sign', 
  check('signatureData', 'Signature data is required').not().isEmpty(),
  authController.restrictTo('admin', 'manager', 'sales'), // Restricting internal signing for now
  documentController.signDocument
);

module.exports = router;