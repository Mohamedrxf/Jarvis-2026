import { useState, useEffect } from 'react';
import { File, Trash2, Eye, Loader2 } from 'lucide-react';
import fileApi from '../services/fileApi';
import '../components/FileList.css';

function FileList({ onFileSelect, refreshTrigger }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingFile, setViewingFile] = useState(null);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await fileApi.getUserFiles();
            setFiles(data);
        } catch (err) {
            setError(err.message || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [refreshTrigger]);

    const handleDelete = async (e, fileId) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            await fileApi.deleteFile(fileId);
            setFiles(files.filter(f => f.id !== fileId));
        } catch (err) {
            setError(err.message || 'Failed to delete file');
        }
    };

    const handleView = async (e, fileId) => {
        e.stopPropagation();
        try {
            const file = await fileApi.getFile(fileId);
            setViewingFile(file);
        } catch (err) {
            setError(err.message || 'Failed to load file content');
        }
    };

    const handleFileClick = (file) => {
        if (onFileSelect) {
            onFileSelect(file);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (fileType) => {
        if (fileType === 'application/pdf') return '📄';
        if (fileType === 'text/plain') return '📝';
        if (fileType.includes('word')) return '📘';
        if (fileType.startsWith('image/')) return '🖼️';
        return '📎';
    };

    if (loading) {
        return (
            <div className="file-list-loading">
                <Loader2 size={24} className="spin" />
                <span>Loading files...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="file-list-error">
                <span>{error}</span>
                <button onClick={loadFiles} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className="file-list-container">
            {files.length === 0 ? (
                <div className="file-list-empty">
                    <File size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p>No files uploaded yet</p>
                    <p style={{ fontSize: '12px', opacity: 0.7 }}>Upload a file to get started</p>
                </div>
            ) : (
                <div className="file-list">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="file-item"
                            onClick={() => handleFileClick(file)}
                        >
                            <div className="file-icon">
                                {getFileIcon(file.file_type)}
                            </div>
                            <div className="file-info">
                                <div className="file-name" title={file.original_name}>
                                    {file.original_name}
                                </div>
                                <div className="file-meta">
                                    {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="file-actions">
                                <button
                                    className="file-action-btn"
                                    onClick={(e) => handleView(e, file.id)}
                                    title="View content"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    className="file-action-btn delete"
                                    onClick={(e) => handleDelete(e, file.id)}
                                    title="Delete file"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* File Content Modal */}
            {viewingFile && (
                <div className="modal-overlay" onClick={() => setViewingFile(null)}>
                    <div className="file-content-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{viewingFile.original_name}</h3>
                            <button
                                className="close-btn"
                                onClick={() => setViewingFile(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <pre className="file-content">
                                {viewingFile.extracted_content || 'No content available'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileList;