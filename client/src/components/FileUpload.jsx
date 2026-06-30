import { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import fileApi from '../services/fileApi';
import '../components/FileUpload.css';

function FileUpload({ onUploadComplete }) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only PDF, TXT, DOCX, and images are allowed.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            const result = await fileApi.uploadFile(file);
            if (onUploadComplete) {
                onUploadComplete(result);
            }
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="file-upload-container">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <button
                id="btn_upload_file"
                className="upload-btn"
                onClick={handleClick}
                disabled={isUploading}
                title="Upload file (PDF, TXT, DOCX, Images)"
            >
                {isUploading ? (
                    <Loader2 size={18} className="spin" />
                ) : (
                    <Upload size={18} />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
            </button>

            {error && (
                <div className="upload-error">
                    <X size={14} style={{ marginRight: '6px' }} />
                    {error}
                </div>
            )}
        </div>
    );
}

export default FileUpload;