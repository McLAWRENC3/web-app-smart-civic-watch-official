import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  FiUpload,
  FiX,
  FiAward,
  FiUser,
  FiMapPin,
  FiAlertTriangle
} from 'react-icons/fi';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminReportIncident = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    userToCredit: '',
    status: 'pending'
  });

  // Badge options
  const badgeOptions = [
    { id: 'community_hero', label: 'Community Hero', color: 'gold' },
    { id: 'quick_responder', label: 'Quick Responder', color: 'blue' },
    { id: 'problem_solver', label: 'Problem Solver', color: 'green' },
    { id: 'safety_champion', label: 'Safety Champion', color: 'red' },
    { id: 'environmental_guardian', label: 'Environmental Guardian', color: 'teal' },
  ];

  // Category options
  const categoryOptions = [
    'Infrastructure',
    'Public Safety',
    'Sanitation',
    'Environmental',
    'Transportation',
    'Other'
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle badge selection
  const handleBadgeToggle = (badgeId) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId)
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  // Handle file uploads
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => [...prev, ...files]);
  };

  // Remove a file from the upload list
  const removeFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload media files if any
      const mediaUrls = [];
      for (const file of mediaFiles) {
        const storageRef = ref(storage, `admin_reports/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        mediaUrls.push(url);
      }

      // Get current admin user info (you might want to get this from your auth context)
      const adminUser = {
        name: "Admin User", // Replace with actual admin name
        email: "admin@example.com", // Replace with actual admin email
        id: "admin-id" // Replace with actual admin ID
      };

      // Prepare report data
      const reportData = {
        ...formData,
        mediaUrls,
        isVideo: mediaFiles.some(file => file.type.startsWith('video/')),
        badgesAwarded: selectedBadges,
        reportedBy: {
          name: adminUser.name,
          email: adminUser.email,
          id: adminUser.id,
          isAdmin: true
        },
        timestamp: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'admin_reports'), reportData);
      
      // If a user is being credited, update their record
      if (formData.userToCredit) {
        // Here you would typically update the user's document in the users collection
        // For example: await updateDoc(doc(db, 'users', formData.userToCredit), { badges: arrayUnion(...selectedBadges) });
        console.log(`Would credit user ${formData.userToCredit} with badges:`, selectedBadges);
      }

      setSnackbar({ 
        open: true, 
        message: 'Incident reported successfully!', 
        severity: 'success' 
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        location: '',
        userToCredit: '',
        status: 'pending'
      });
      setSelectedBadges([]);
      setMediaFiles([]);

    } catch (error) {
      console.error('Error submitting report:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error submitting report. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Report Incident (Admin)
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Use this form to report incidents and recognize community members with badges.
      </Typography>

      <Card elevation={3}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Incident Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <FiAlertTriangle style={{ marginRight: '8px' }} />
                  Incident Details
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Incident Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Category"
                    onChange={handleInputChange}
                  >
                    {categoryOptions.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiMapPin />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Media Upload */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Media Attachments
                </Typography>
                <Divider />
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    id="media-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="media-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<FiUpload />}
                    >
                      Upload Media
                    </Button>
                  </label>

                  {mediaFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {mediaFiles.map((file, index) => (
                        <Paper 
                          key={index} 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            mt: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between' 
                          }}
                        >
                          <Typography variant="body2">
                            {file.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => removeFile(index)}
                          >
                            <FiX />
                          </IconButton>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* User Recognition */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <FiAward style={{ marginRight: '8px' }} />
                  User Recognition
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Credit User (Email)"
                  name="userToCredit"
                  value={formData.userToCredit}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiUser />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Enter the email of the user you want to credit"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Award Badges
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {badgeOptions.map(badge => (
                    <Chip
                      key={badge.id}
                      label={badge.label}
                      clickable
                      color={selectedBadges.includes(badge.id) ? 'primary' : 'default'}
                      onClick={() => handleBadgeToggle(badge.id)}
                      avatar={
                        <Avatar sx={{ bgcolor: selectedBadges.includes(badge.id) ? badge.color : 'transparent' }}>
                          <FiAward />
                        </Avatar>
                      }
                      variant={selectedBadges.includes(badge.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminReportIncident;