import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import { 
  FiDownload, 
  FiEye, 
  FiTrash2,
  FiPlus,
  FiImage,
  FiVideo,
  FiMail,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX
} from 'react-icons/fi';
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { exportToCSV } from '../../utils/exportUtils';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewingReport, setViewingReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [videoState, setVideoState] = useState({
    playing: false,
    muted: false,
    progress: 0,
    duration: 0
  });
  const videoRef = useRef(null);

  // Status color mapping
  const statusColors = {
    pending: "warning",
    'in-progress': "info",
    resolved: "success",
    rejected: "error",
    critical: "error"
  };

  // Status and category options
  const statusOptions = ['pending', 'in-progress', 'resolved', 'rejected', 'critical'];
  const categoryOptions = ['Infrastructure', 'Public Safety', 'Sanitation', 'Environmental', 'Other'];

  // Handle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoState.playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  // Handle video mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoState.muted;
      setVideoState(prev => ({ ...prev, muted: !prev.muted }));
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoState(prev => ({ 
        ...prev, 
        progress: progress || 0,
        duration: videoRef.current.duration || 0
      }));
    }
  };

  // Handle seek in video
  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Reset video state when dialog closes
  useEffect(() => {
    if (!viewingReport) {
      setVideoState({
        playing: false,
        muted: false,
        progress: 0,
        duration: 0
      });
    }
  }, [viewingReport]);

  // Fetch reports from Firebase
  useEffect(() => {
    setLoading(true);
    let q;
    
    if (statusFilter !== 'all' && categoryFilter !== 'all') {
      q = query(
        collection(db, 'reports'),
        where('status', '==', statusFilter),
        where('category', '==', categoryFilter),
        orderBy('timestamp', 'desc')
      );
    } else if (statusFilter !== 'all') {
      q = query(
        collection(db, 'reports'),
        where('status', '==', statusFilter),
        orderBy('timestamp', 'desc')
      );
    } else if (categoryFilter !== 'all') {
      q = query(
        collection(db, 'reports'),
        where('category', '==', categoryFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reportsData.push({ 
          id: doc.id, 
          ...data,
          title: data.title || 'Untitled Report',
          description: data.description || 'No description provided',
          category: data.category || 'Other',
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          location: data.location || 'Location not specified',
          userEmail: data.userEmail || 'Unknown'
        });
      });
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      setSnackbar({ open: true, message: 'Error fetching reports', severity: 'error' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter, categoryFilter]);

  // Filter reports based on search term
  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle report status update
  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  // Handle report deletion
  const handleDeleteReport = async () => {
    try {
      await deleteDoc(doc(db, 'reports', deleteConfirm));
      setDeleteConfirm(null);
      setSnackbar({ open: true, message: 'Report deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting report:', error);
      setSnackbar({ open: true, message: 'Error deleting report', severity: 'error' });
    }
  };

  // Handle export to CSV
  const handleExport = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reportsData.push({
          id: doc.id,
          title: data.title || 'Untitled Report',
          description: data.description || 'No description',
          category: data.category || 'Other',
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          location: data.location || 'Not specified',
          userEmail: data.userEmail || 'Unknown',
          timestamp: data.timestamp?.toDate?.().toISOString() || '',
          updatedAt: data.updatedAt?.toDate?.().toISOString() || ''
        });
      });
      
      exportToCSV(reportsData, `reports_export_${new Date().toISOString().split('T')[0]}`);
      setSnackbar({ open: true, message: 'Data exported successfully', severity: 'success' });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({ open: true, message: 'Error exporting data', severity: 'error' });
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get first sentence of description
  const getShortDescription = (description) => {
    if (!description) return 'No description';
    const firstSentence = description.split('.')[0];
    return firstSentence.length > 100 
      ? firstSentence.substring(0, 100) + '...' 
      : firstSentence;
  };

  // Capitalize first letter
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Box>
      {/* Header and Action Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4">Reports Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<FiPlus />}
          sx={{ textTransform: 'none' }}
          onClick={() => window.location.href = '/report-incident'}
        >
          New Report
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <TextField
          label="Search reports"
          variant="outlined"
          size="small"
          sx={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            {statusOptions.map(status => (
              <MenuItem key={status} value={status}>{capitalizeFirst(status)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categoryOptions.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<FiDownload />}
          sx={{ textTransform: 'none', ml: 'auto' }}
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      {/* Reports Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Media</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Date Reported</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading reports...
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              filteredReports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      {report.media_url ? (
                        report.is_video ? (
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <FiVideo />
                          </Avatar>
                        ) : (
                          <Avatar 
                            src={report.media_url} 
                            variant="rounded"
                            sx={{ width: 50, height: 50 }}
                          >
                            <FiImage />
                          </Avatar>
                        )
                      ) : (
                        <Avatar sx={{ bgcolor: 'grey.300' }}>
                          <FiImage color="grey" />
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {report.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" title={report.description}>
                        {getShortDescription(report.description)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.category} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={report.status}
                          onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                          sx={{ 
                            height: 32,
                            backgroundColor: `${statusColors[report.status] || 'default'}.light`,
                            color: 'white',
                            '& .MuiSelect-select': { py: 0.5 }
                          }}
                        >
                          {statusOptions.map(status => (
                            <MenuItem key={status} value={status}>
                              {capitalizeFirst(status)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={capitalizeFirst(report.priority)} 
                        size="small"
                        color={
                          report.priority === 'high' ? 'error' : 
                          report.priority === 'medium' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 150 }} title={report.location}>
                        {report.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => setViewingReport(report)}
                        title="View details"
                      >
                        <FiEye />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteConfirm(report.id)}
                        title="Delete report"
                      >
                        <FiTrash2 />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onClose={() => setViewingReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Report Details
        </DialogTitle>
        <DialogContent>
          {viewingReport && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>{viewingReport.title}</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={viewingReport.category} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={capitalizeFirst(viewingReport.status)} 
                  color={statusColors[viewingReport.status] || "default"}
                />
                <Chip 
                  label={capitalizeFirst(viewingReport.priority)} 
                  color={
                    viewingReport.priority === 'high' ? 'error' : 
                    viewingReport.priority === 'medium' ? 'warning' : 'default'
                  }
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {viewingReport.description}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Location:</strong> {viewingReport.location}
              </Typography>
              
              {/* Added user email information */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FiMail size={16} />
                <Typography variant="body2">
                  <strong>Reported by:</strong> {viewingReport.userEmail}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="body2">
                  <strong>Reported on:</strong> {formatDate(viewingReport.timestamp)}
                </Typography>
                {viewingReport.updatedAt && (
                  <Typography variant="body2">
                    <strong>Last updated:</strong> {formatDate(viewingReport.updatedAt)}
                  </Typography>
                )}
              </Box>
              
              {viewingReport.media_url && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Attached Media:</strong>
                  </Typography>
                  {viewingReport.is_video ? (
                    <Box sx={{ 
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: 'black'
                    }}>
                      <video
                        ref={videoRef}
                        src={viewingReport.media_url}
                        style={{ width: '100%', display: 'block' }}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleTimeUpdate}
                        onPlay={() => setVideoState(prev => ({ ...prev, playing: true }))}
                        onPause={() => setVideoState(prev => ({ ...prev, playing: false }))}
                      />
                      
                      {/* Video controls overlay */}
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          p: 1, 
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          color: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        {/* Progress bar */}
                        <Box 
                          sx={{ 
                            height: 4, 
                            width: '100%', 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            borderRadius: 2,
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onClick={handleSeek}
                        >
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: `${videoState.progress}%`, 
                              bgcolor: 'primary.main',
                              borderRadius: 2
                            }}
                          />
                        </Box>
                        
                        {/* Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={togglePlay}
                              sx={{ color: 'white' }}
                            >
                              {videoState.playing ? <FiPause /> : <FiPlay />}
                            </IconButton>
                            
                            <IconButton 
                              size="small" 
                              onClick={toggleMute}
                              sx={{ color: 'white' }}
                            >
                              {videoState.muted ? <FiVolumeX /> : <FiVolume2 />}
                            </IconButton>
                            
                            <Typography variant="caption">
                              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoState.duration)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption">
                            VIDEO
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <img 
                      src={viewingReport.media_url} 
                      alt="Report attachment" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 300, 
                        borderRadius: 4,
                        border: '1px solid #ddd'
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this report? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteReport} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;