import { Router } from 'express';
import { downloadDocument } from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth'; // Corrected import path

const router = Router();

// Protect the download route with authentication
router.get('/download/:documentId', authenticateToken, downloadDocument);

export default router;
