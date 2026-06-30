const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/db');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.resolve(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, TXT, DOCX, and images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

class FileService {
    /**
     * Get multer upload middleware
     */
    getUploadMiddleware() {
        return upload.single('file');
    }

    /**
     * Extract text content from file based on type
     * @param {Object} file - File object from multer
     * @returns {Promise<string>} Extracted text content
     */
    async extractTextContent(file) {
        const filePath = file.path;
        const mimeType = file.mimetype;

        try {
            if (mimeType === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                return data.text;
            }
            else if (mimeType === 'text/plain') {
                return fs.readFileSync(filePath, 'utf-8');
            }
            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ path: filePath });
                return result.value;
            }
            else if (mimeType.startsWith('image/')) {
                // For images, return metadata description
                return `[Image file: ${file.originalname}]\nType: ${mimeType}\nSize: ${file.size} bytes\n\nNote: OCR text extraction requires additional setup.`;
            }

            throw new Error('Unsupported file type');
        } catch (error) {
            console.error('[FileService] Error extracting text:', error.message);
            throw new Error('Failed to extract text from file');
        }
    }

    /**
     * Upload and process file
     * @param {number} userId - User ID
     * @param {Object} file - File object from multer
     * @returns {Promise<Object>} File metadata with extracted content
     */
    async uploadFile(userId, file) {
        try {
            const extractedText = await this.extractTextContent(file);

            const sql = `
        INSERT INTO user_files (user_id, filename, original_name, file_type, file_size, file_path, extracted_content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

            return new Promise((resolve, reject) => {
                db.run(sql, [
                    userId,
                    file.filename,
                    file.originalname,
                    file.mimetype,
                    file.size,
                    file.path,
                    extractedText
                ], function (err) {
                    if (err) {
                        console.error('[FileService] Error saving file metadata:', err.message);
                        return reject(new Error('Failed to save file metadata'));
                    }

                    resolve({
                        id: this.lastID,
                        userId,
                        filename: file.filename,
                        originalName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: file.size,
                        extractedContent: extractedText,
                        createdAt: new Date().toISOString()
                    });
                });
            });
        } catch (error) {
            // Clean up uploaded file on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }

    /**
     * Get all files for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of files
     */
    getUserFiles(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, user_id, filename, original_name, file_type, file_size, created_at
        FROM user_files
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    console.error('[FileService] Error fetching files:', err.message);
                    return reject(new Error('Failed to fetch files'));
                }
                resolve(rows);
            });
        });
    }

    /**
     * Get file by ID
     * @param {number} fileId - File ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<Object>} File metadata
     */
    getFile(fileId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, user_id, filename, original_name, file_type, file_size, extracted_content, created_at
        FROM user_files
        WHERE id = ? AND user_id = ?
      `;

            db.get(sql, [fileId, userId], (err, row) => {
                if (err) {
                    console.error('[FileService] Error fetching file:', err.message);
                    return reject(new Error('Failed to fetch file'));
                }
                if (!row) {
                    return reject(new Error('File not found'));
                }
                resolve(row);
            });
        });
    }

    /**
     * Delete file
     * @param {number} fileId - File ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(fileId, userId) {
        try {
            // Get file info first
            const file = await this.getFile(fileId, userId);

            // Delete from database
            const sql = `DELETE FROM user_files WHERE id = ? AND user_id = ?`;

            return new Promise((resolve, reject) => {
                db.run(sql, [fileId, userId], function (err) {
                    if (err) {
                        console.error('[FileService] Error deleting file:', err.message);
                        return reject(new Error('Failed to delete file'));
                    }

                    if (this.changes === 0) {
                        return reject(new Error('File not found'));
                    }

                    // Delete physical file
                    if (fs.existsSync(file.file_path)) {
                        fs.unlinkSync(file.file_path);
                    }

                    resolve(true);
                });
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search files by content
     * @param {number} userId - User ID
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching files
     */
    searchFiles(userId, query) {
        return new Promise((resolve, reject) => {
            const searchTerm = `%${query}%`;
            const sql = `
        SELECT id, user_id, filename, original_name, file_type, file_size, created_at
        FROM user_files
        WHERE user_id = ? AND (original_name LIKE ? OR extracted_content LIKE ?)
        ORDER BY created_at DESC
      `;

            db.all(sql, [userId, searchTerm, searchTerm], (err, rows) => {
                if (err) {
                    console.error('[FileService] Error searching files:', err.message);
                    return reject(new Error('Failed to search files'));
                }
                resolve(rows);
            });
        });
    }
}

module.exports = new FileService();