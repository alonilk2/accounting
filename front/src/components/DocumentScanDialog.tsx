import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Scanner as ScanIcon
} from '@mui/icons-material';
import { 
  documentScanApi, 
  fileToBase64, 
  isValidDocumentFile, 
  isValidFileSize, 
  formatFileSize 
} from '../services/documentScanService';
import { DocumentType } from '../types/documentScan';
import type { DocumentScanResponse, DocumentUploadProgress } from '../types/documentScan';

interface DocumentScanDialogProps {
  open: boolean;
  onClose: () => void;
  onScanComplete: (scanResult: DocumentScanResponse) => void;
  language?: 'he' | 'en';
}

const DocumentScanDialog: React.FC<DocumentScanDialogProps> = ({
  open,
  onClose,
  onScanComplete,
  language = 'en'
}) => {
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploadProgress(null);

    // Validate file
    if (!isValidDocumentFile(file)) {
      setError(language === 'he' 
        ? 'סוג קובץ לא נתמך. יש להעלות תמונה (JPG, PNG) או PDF'
        : 'Unsupported file type. Please upload an image (JPG, PNG) or PDF'
      );
      return;
    }

    if (!isValidFileSize(file)) {
      setError(language === 'he' 
        ? `הקובץ גדול מדי. גודל מקסימלי: ${formatFileSize(10 * 1024 * 1024)}`
        : `File too large. Maximum size: ${formatFileSize(10 * 1024 * 1024)}`
      );
      return;
    }

    try {
      // Show upload progress
      setUploadProgress({
        fileName: file.name,
        progress: 25,
        status: 'uploading'
      });

      // Convert to base64
      const fileData = await fileToBase64(file);
      
      setUploadProgress(prev => prev ? { ...prev, progress: 50, status: 'scanning' } : null);
      setScanning(true);

      // Scan document
      const scanRequest = {
        fileData,
        fileName: file.name,
        contentType: file.type,
        documentType: DocumentType.Invoice // Default to invoice
      };

      const result = await documentScanApi.scanDocument(scanRequest);

      setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
      setScanning(false);

      // Call completion handler
      onScanComplete(result);

      // Close dialog after short delay to show completion
      setTimeout(() => {
        setUploadProgress(null);
        onClose();
      }, 1000);

    } catch (err: unknown) {
      setScanning(false);
      setUploadProgress(prev => prev ? { ...prev, status: 'error' } : null);
      
      const errorMessage = err instanceof Error && err.message
        ? err.message
        : (language === 'he' ? 'שגיאה בסריקת המסמך' : 'Error scanning document');
      
      setError(errorMessage);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const text = {
    title: language === 'he' ? 'סריקת מסמך' : 'Scan Document',
    subtitle: language === 'he' ? 'העלה חשבונית או קבלה לסריקה אוטומטית' : 'Upload an invoice or receipt for automatic scanning',
    dragText: language === 'he' ? 'גרור קובץ לכאן או לחץ להעלאה' : 'Drag file here or click to upload',
    dragActiveText: language === 'he' ? 'שחרר כדי להעלות' : 'Drop to upload',
    supportedFiles: language === 'he' ? 'נתמכים: JPG, PNG, PDF (עד 10MB)' : 'Supported: JPG, PNG, PDF (up to 10MB)',
    uploading: language === 'he' ? 'מעלה...' : 'Uploading...',
    scanning: language === 'he' ? 'סורק מסמך...' : 'Scanning document...',
    completed: language === 'he' ? 'הושלם!' : 'Completed!',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    scanAnother: language === 'he' ? 'סרוק מסמך נוסף' : 'Scan Another'
  };

  const getProgressText = () => {
    if (!uploadProgress) return '';
    
    switch (uploadProgress.status) {
      case 'uploading':
        return text.uploading;
      case 'scanning':
        return text.scanning;
      case 'completed':
        return text.completed;
      case 'error':
        return error || 'Error';
      default:
        return '';
    }
  };

  const getProgressColor = (): "primary" | "error" | "success" => {
    if (!uploadProgress) return 'primary';
    
    switch (uploadProgress.status) {
      case 'error':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ScanIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {text.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {text.subtitle}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={scanning}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <FileIcon color="action" />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {uploadProgress.fileName}
              </Typography>
              <Chip
                label={getProgressText()}
                color={getProgressColor()}
                size="small"
                icon={uploadProgress.status === 'scanning' ? <CircularProgress size={16} /> : undefined}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={uploadProgress.progress}
              color={getProgressColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Upload Area */}
        <Paper
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!scanning) {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/jpg,image/png,application/pdf';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                handleFileUpload(target.files);
              };
              input.click();
            }
          }}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            bgcolor: dragOver ? 'primary.50' : 'grey.50',
            cursor: scanning ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            opacity: scanning ? 0.7 : 1,
            '&:hover': {
              borderColor: scanning ? 'grey.300' : 'primary.main',
              bgcolor: scanning ? 'grey.50' : 'primary.50'
            }
          }}
        >
          <UploadIcon 
            sx={{ 
              fontSize: 64, 
              color: dragOver ? 'primary.main' : 'grey.400',
              transition: 'color 0.3s ease'
            }} 
          />
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: dragOver ? 'primary.main' : 'text.primary',
              fontWeight: 500
            }}
          >
            {dragOver ? text.dragActiveText : text.dragText}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {text.supportedFiles}
          </Typography>

          {scanning && (
            <Box display="flex" alignItems="center" gap={1} mt={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="primary">
                {text.scanning}
              </Typography>
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          disabled={scanning}
          sx={{ minWidth: 100 }}
        >
          {text.cancel}
        </Button>
        
        {uploadProgress?.status === 'completed' && (
          <Button
            variant="outlined"
            onClick={() => {
              setUploadProgress(null);
              setError(null);
            }}
            sx={{ minWidth: 120 }}
          >
            {text.scanAnother}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentScanDialog;
