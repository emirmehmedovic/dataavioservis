import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';

export const downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { documentId } = req.params;

  if (!documentId || isNaN(parseInt(documentId))) {
    res.status(400).json({ message: 'Invalid document ID provided.' });
    return;
  }

  try {
    const id = parseInt(documentId);
    const document = await prisma.fuelIntakeDocuments.findUnique({
      where: { id },
    });

    if (!document || !document.document_path) {
      res.status(404).json({ message: 'Document not found.' });
      return;
    }

    // Construct the absolute path to the document
    // Assuming 'document.document_path' is stored relative to a base 'uploads' directory 
    // and that 'uploads' directory is at the root of the backend project.
    // e.g., document_path = /uploads/fuel_documents/file.pdf
    // project_root = /Users/emir_mw/data-avioservis/
    // file_path = /Users/emir_mw/data-avioservis/backend/uploads/fuel_documents/file.pdf
    // If document_path already includes /backend, adjust accordingly.
    // For now, assuming document_path is like '/fuel_documents/file.pdf' and needs 'uploads' and project base to be prepended.

    // Let's assume document_path is stored as something like: '/uploads/fuel_documents/document-xyz.pdf'
    // And the 'uploads' directory is at the root of the backend project.
    const basePath = path.join(__dirname, '..', '..'); // This should point to /Users/emir_mw/data-avioservis/backend
    let filePath = path.join(basePath, document.document_path); // Correctly joins to form an absolute path

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        // Attempt an alternative path if the document_path might be relative to the project root directly
        // e.g. document_path = '/uploads/fuel_documents/file.pdf'
        // project_root = /Users/emir_mw/data-avioservis
        // We'd need path.join(project_root, document.document_path)
        // However, the original example showed: '/uploads/fuel_documents/document-1747850284911-135931953.pdf'
        // Let's assume the structure is backend/uploads/...
        // If the 'uploads' folder is in the main project root not 'backend/uploads' then this needs adjustment.
        // For now, this path construction assumes 'uploads' is a top-level dir in 'backend'.
        // If document.document_path is absolute, this logic needs to change.
        // Given the example: document_path: '/uploads/fuel_documents/document-1747850284911-135931953.pdf'
        // This looks like it's intended to be relative to some static serving root.
        // If 'uploads' is at /Users/emir_mw/data-avioservis/uploads, then:
        // const projectRootPath = path.join(__dirname, '..', '..', '..'); // up to data-avioservis
        // filePath = path.join(projectRootPath, document.document_path);

        // Based on typical Express setups, if you have `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`
        // then `document_path` should be relative to that. The current path logic assumes `document_path` is from the project root.
        // The example `document_path: '/uploads/fuel_documents/document-1747850284911-135931953.pdf'`
        // This structure suggests that `uploads` is a directory at the root of the *overall project*, not inside `backend/src`.
        // So, we need to go up three levels from `backend/src/controllers` to reach `data-avioservis`.
        const projectRoot = path.resolve(__dirname, '..', '..', '..'); // Resolves to /Users/emir_mw/data-avioservis
        filePath = path.join(projectRoot, document.document_path);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found at primary path: ${path.join(basePath, document.document_path)} or alternative: ${filePath}`);
            res.status(404).json({ message: 'Physical document file not found on server.' });
            return;
        }
    }

    // Set headers to prompt download
    res.setHeader('Content-Disposition', `attachment; filename="${document.document_name || path.basename(filePath)}"`);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        // Don't try to send another response if one has already been started
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming file.' });
        }
        next(err); // Pass error to Express error handler
    });

    // No explicit res.end() or res.json() here as pipe handles it.

  } catch (error) {
    console.error('Error in downloadDocument:', error);
    // Pass to the generic error handler
    next(error);
  }
};
