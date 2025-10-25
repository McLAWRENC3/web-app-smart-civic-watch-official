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
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tooltip,
  Badge,
  Tabs,
  Tab
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
  FiVolumeX,
  FiStar,
  FiAlertTriangle,
  FiTrendingUp,
  FiClock,
  FiMapPin,
  FiFilter,
  FiAward,
  FiZap,
  FiMessageSquare
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
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { exportToCSV } from '../../utils/exportUtils';

// AI Analysis Component
const AIAnalysisPanel = ({ reports, selectedReport, onInsightSelect }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [aiInsights, setAiInsights] = useState({
    priority: [],
    patterns: [],
    recommendations: [],
    sentiment: {}
  });

  // Generate AI insights based on reports data
  useEffect(() => {
    if (reports.length > 0) {
      generateAIInsights();
    }
  }, [reports, selectedReport]);

  const generateAIInsights = () => {
    // AI Pattern Detection
    const patterns = detectPatterns(reports);
    
    // Priority Recommendations
    const priority = calculatePriority(reports);
    
    // Sentiment Analysis
    const sentiment = analyzeSentiment(reports);
    
    // Smart Recommendations
    const recommendations = generateRecommendations(reports, selectedReport);

    setAiInsights({
      patterns,
      priority,
      sentiment,
      recommendations
    });
  };

  const detectPatterns = (reports) => {
    const patterns = [];
    
    // Location clustering
    const locationCounts = {};
    reports.forEach(report => {
      locationCounts[report.location] = (locationCounts[report.location] || 0) + 1;
    });
    
    const hotSpots = Object.entries(locationCounts)
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (hotSpots.length > 0) {
      patterns.push({
        type: 'location_cluster',
        title: 'Geographic Hotspots',
        description: `Multiple reports from ${hotSpots[0][0]}`,
        severity: 'high',
        count: hotSpots[0][1]
      });
    }

    // Time pattern detection
    const hourlyCounts = new Array(24).fill(0);
    reports.forEach(report => {
      const hour = report.timestamp?.toDate?.().getHours() || 12;
      hourlyCounts[hour]++;
    });
    
    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
    if (hourlyCounts[peakHour] > 3) {
      patterns.push({
        type: 'time_pattern',
        title: 'Peak Reporting Time',
        description: `Most reports filed around ${peakHour}:00`,
        severity: 'medium'
      });
    }

    // Category trends
    const categoryCounts = {};
    reports.forEach(report => {
      categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1;
    });
    
    const trendingCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (trendingCategory && trendingCategory[1] > 5) {
      patterns.push({
        type: 'category_trend',
        title: 'Trending Issue',
        description: `${trendingCategory[0]} issues are increasing`,
        severity: 'medium',
        count: trendingCategory[1]
      });
    }

    return patterns;
  };

  const calculatePriority = (reports) => {
    const pendingReports = reports.filter(r => r.status === 'pending');
    
    return pendingReports
      .map(report => {
        let score = 0;
        
        // Priority scoring
        if (report.priority === 'high') score += 30;
        if (report.priority === 'critical') score += 50;
        
        // Time-based urgency (older reports get higher priority)
        const reportAge = report.timestamp ? 
          (new Date() - report.timestamp.toDate()) / (1000 * 60 * 60) : 0;
        if (reportAge > 24) score += 20;
        if (reportAge > 72) score += 30;
        
        // Category urgency
        const urgentCategories = ['Public Safety', 'Infrastructure'];
        if (urgentCategories.includes(report.category)) score += 25;
        
        return {
          ...report,
          aiPriorityScore: score,
          recommendedAction: score > 60 ? 'Immediate Attention' : 
                           score > 30 ? 'Review Today' : 'Monitor'
        };
      })
      .sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)
      .slice(0, 5);
  };

  const analyzeSentiment = (reports) => {
    const sentimentKeywords = {
      positive: ['fixed', 'resolved', 'thanks', 'great', 'good', 'quick', 'helpful'],
      negative: ['broken', 'dangerous', 'urgent', 'failed', 'complaint', 'issue', 'problem'],
      urgent: ['emergency', 'critical', 'immediately', 'danger', 'safety', 'accident']
    };

    let positive = 0, negative = 0, urgent = 0;
    
    reports.forEach(report => {
      const text = (report.title + ' ' + report.description).toLowerCase();
      
      if (sentimentKeywords.urgent.some(keyword => text.includes(keyword))) {
        urgent++;
      } else if (sentimentKeywords.negative.some(keyword => text.includes(keyword))) {
        negative++;
      } else if (sentimentKeywords.positive.some(keyword => text.includes(keyword))) {
        positive++;
      }
    });

    return { positive, negative, urgent, total: reports.length };
  };

  const generateRecommendations = (reports, selectedReport) => {
    const recommendations = [];
    
    // Resource allocation recommendation
    const pendingCount = reports.filter(r => r.status === 'pending').length;
    if (pendingCount > 10) {
      recommendations.push({
        type: 'resource',
        title: 'Increase Resources',
        description: `High backlog: ${pendingCount} pending reports`,
        action: 'Assign additional team members'
      });
    }

    // Response time optimization
    const avgResponseTime = calculateAverageResponseTime(reports);
    if (avgResponseTime > 48) {
      recommendations.push({
        type: 'efficiency',
        title: 'Improve Response Time',
        description: `Average response: ${avgResponseTime}h`,
        action: 'Streamline workflow processes'
      });
    }

    // Specific report recommendations
    if (selectedReport) {
      if (selectedReport.priority === 'high' && selectedReport.status === 'pending') {
        recommendations.push({
          type: 'specific',
          title: 'Expedite This Report',
          description: 'High priority issue requires immediate attention',
          action: 'Assign to senior team member'
        });
      }
      
      if (selectedReport.category === 'Infrastructure' && selectedReport.location) {
        recommendations.push({
          type: 'preventive',
          title: 'Area Inspection',
          description: 'Consider preventive maintenance in this area',
          action: 'Schedule area assessment'
        });
      }
    }

    return recommendations;
  };

  const calculateAverageResponseTime = (reports) => {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.timestamp && r.updatedAt);
    if (resolvedReports.length === 0) return 0;
    
    const totalHours = resolvedReports.reduce((sum, report) => {
      const created = report.timestamp.toDate();
      const resolved = report.updatedAt.toDate();
      return sum + (resolved - created) / (1000 * 60 * 60);
    }, 0);
    
    return Math.round(totalHours / resolvedReports.length);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FiZap style={{ marginRight: 8, color: '#FF6B35' }} />
          <Typography variant="h6">AI Insights & Analytics</Typography>
        </Box>

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Patterns" />
          <Tab label="Priority Queue" />
          <Tab label="Recommendations" />
          <Tab label="Sentiment" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Detected Patterns & Trends
            </Typography>
            {aiInsights.patterns.map((pattern, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {pattern.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {pattern.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={pattern.count || 'Trend'} 
                    size="small"
                    color={pattern.severity === 'high' ? 'error' : 'warning'}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              AI-Prioritized Reports
            </Typography>
            {aiInsights.priority.map((report, index) => (
              <Card 
                key={report.id} 
                variant="outlined" 
                sx={{ mb: 1, p: 1.5, cursor: 'pointer' }}
                onClick={() => onInsightSelect(report)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {report.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {report.category} • {report.location}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(report.aiPriorityScore, 100)} 
                      sx={{ mt: 0.5, height: 4 }}
                      color={report.aiPriorityScore > 60 ? 'error' : 'warning'}
                    />
                  </Box>
                  <Chip 
                    label={report.recommendedAction} 
                    size="small"
                    color={report.aiPriorityScore > 60 ? 'error' : 'warning'}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Smart Recommendations
            </Typography>
            {aiInsights.recommendations.map((rec, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <FiAlertTriangle color="#FF6B35" size={16} style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {rec.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {rec.description}
                    </Typography>
                    <Typography variant="caption" color="primary" display="block">
                      {rec.action}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Community Sentiment Analysis
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {aiInsights.sentiment.positive}
                  </Typography>
                  <Typography variant="caption">Positive</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    {aiInsights.sentiment.negative}
                  </Typography>
                  <Typography variant="caption">Concerned</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="error.main">
                    {aiInsights.sentiment.urgent}
                  </Typography>
                  <Typography variant="caption">Urgent</Typography>
                </Box>
              </Grid>
            </Grid>
            <LinearProgress 
              variant="determinate" 
              value={(aiInsights.sentiment.positive / aiInsights.sentiment.total) * 100} 
              color="success"
              sx={{ mb: 0.5, height: 6 }}
            />
            <LinearProgress 
              variant="determinate" 
              value={(aiInsights.sentiment.negative / aiInsights.sentiment.total) * 100} 
              color="warning"
              sx={{ mb: 0.5, height: 6 }}
            />
            <LinearProgress 
              variant="determinate" 
              value={(aiInsights.sentiment.urgent / aiInsights.sentiment.total) * 100} 
              color="error"
              sx={{ height: 6 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Smart Auto-Response Component
const SmartAutoResponse = ({ report, onApplyResponse }) => {
  const [suggestedResponses, setSuggestedResponses] = useState([]);

  useEffect(() => {
    generateSuggestedResponses();
  }, [report]);

  const generateSuggestedResponses = () => {
    const responses = [];
    
    if (report.category === 'Infrastructure') {
      responses.push({
        type: 'template',
        title: 'Infrastructure Repair',
        message: `Thank you for reporting this ${report.category.toLowerCase()} issue. Our team has been notified and will inspect the location within 24-48 hours. We appreciate your help in keeping our community safe.`,
        status: 'in-progress'
      });
    }

    if (report.priority === 'high' || report.priority === 'critical') {
      responses.push({
        type: 'urgent',
        title: 'Immediate Attention',
        message: `We've classified your report as high priority due to its urgent nature. Our response team has been dispatched to assess the situation. Thank you for bringing this to our attention promptly.`,
        status: 'in-progress'
      });
    }

    if (report.category === 'Public Safety') {
      responses.push({
        type: 'safety',
        title: 'Safety Concern',
        message: `Your public safety concern has been received. We're coordinating with the relevant authorities to address this issue. For immediate emergencies, please contact emergency services directly.`,
        status: 'in-progress'
      });
    }

    // Generic response
    responses.push({
      type: 'generic',
      title: 'Standard Response',
      message: `Thank you for your report. We've received your ${report.category.toLowerCase()} concern and will review it shortly. You can track the status of your report in the app.`,
      status: 'pending'
    });

    setSuggestedResponses(responses);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <FiMessageSquare style={{ marginRight: 8 }} />
        AI Suggested Responses
      </Typography>
      {suggestedResponses.map((response, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {response.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {response.message}
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => onApplyResponse(response)}
              sx={{ ml: 1 }}
            >
              Apply
            </Button>
          </Box>
        </Card>
      ))}
    </Box>
  );
};

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
  const [aiEnabled, setAiEnabled] = useState(true);
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

  // Handle AI suggested response
  const handleApplyResponse = async (response) => {
    if (!viewingReport) return;
    
    try {
      await updateDoc(doc(db, 'reports', viewingReport.id), {
        status: response.status,
        adminResponse: response.message,
        respondedAt: new Date(),
        updatedAt: new Date()
      });
      
      setSnackbar({ 
        open: true, 
        message: 'AI response applied successfully', 
        severity: 'success' 
      });
      setViewingReport(null);
    } catch (error) {
      console.error('Error applying AI response:', error);
      setSnackbar({ open: true, message: 'Error applying response', severity: 'error' });
    }
  };

  // Handle AI insight selection
  const handleInsightSelect = (report) => {
    setViewingReport(report);
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

  // Get AI badge for priority
  const getAIPriorityBadge = (report) => {
    const age = report.timestamp ? (new Date() - report.timestamp.toDate()) / (1000 * 60 * 60) : 0;
    const isUrgent = report.priority === 'high' || report.priority === 'critical' || age > 48;
    
    if (isUrgent) {
      return (
        <Tooltip title="AI Recommended: High Priority">
          <FiStar color="#FF6B35" size={16} style={{ marginLeft: 4 }} />
        </Tooltip>
      );
    }
    return null;
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4">Reports Management</Typography>
          <Chip 
            label="AI Powered" 
            color="primary" 
            variant="outlined"
            icon={<FiZap />}
            sx={{ ml: 2 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={aiEnabled ? "contained" : "outlined"}
            startIcon={<FiZap />}
            onClick={() => setAiEnabled(!aiEnabled)}
            color={aiEnabled ? "primary" : "default"}
          >
            AI {aiEnabled ? 'On' : 'Off'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<FiPlus />}
            sx={{ textTransform: 'none' }}
            onClick={() => window.location.href = '/report-incident'}
          >
            New Report
          </Button>
        </Box>
      </Box>

      {/* AI Insights Panel */}
      {aiEnabled && (
        <AIAnalysisPanel 
          reports={reports} 
          selectedReport={viewingReport}
          onInsightSelect={handleInsightSelect}
        />
      )}

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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {report.title}
                        </Typography>
                        {aiEnabled && getAIPriorityBadge(report)}
                      </Box>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={capitalizeFirst(report.priority)} 
                          size="small"
                          color={
                            report.priority === 'high' ? 'error' : 
                            report.priority === 'medium' ? 'warning' : 'default'
                          }
                        />
                      </Box>
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
          {aiEnabled && (
            <Chip 
              label="AI Enhanced" 
              size="small" 
              color="primary" 
              variant="outlined"
              icon={<FiZap />}
              sx={{ ml: 1 }}
            />
          )}
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

              {/* AI Auto-Response Suggestions */}
              {aiEnabled && (
                <SmartAutoResponse 
                  report={viewingReport}
                  onApplyResponse={handleApplyResponse}
                />
              )}
              
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
