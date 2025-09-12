// src/pages/notifications/Notifications.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  Warning,
  Notifications,
  Send,
  Schedule,
  Delete,
  MarkAsUnread
} from '@mui/icons-material';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'alert',
    priority: 'medium',
    target: 'all'
  });
  const [scheduled, setScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData = [];
      querySnapshot.forEach((doc) => {
        notificationsData.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSendNotification = async () => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...newNotification,
        scheduled,
        scheduledTime: scheduled ? new Date(scheduledTime) : null,
        createdAt: serverTimestamp(),
        status: 'sent',
        read: false
      });
      
      setNewNotification({
        title: '',
        message: '',
        type: 'alert',
        priority: 'medium',
        target: 'all'
      });
      setScheduled(false);
      setScheduledTime('');
      
      // Show success message
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: !currentStatus
      });
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return <Warning color="warning" />;
      case 'emergency': return <Warning color="error" />;
      default: return <Notifications color="info" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Notifications Center
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Send Notification
            </Typography>
            
            <TextField
              fullWidth
              label="Title"
              value={newNotification.title}
              onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Message"
              value={newNotification.message}
              onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newNotification.type}
                label="Type"
                onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
              >
                <MenuItem value="alert">Alert</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="reminder">Reminder</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newNotification.priority}
                label="Priority"
                onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={newNotification.target}
                label="Target Audience"
                onChange={(e) => setNewNotification({...newNotification, target: e.target.value})}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="citizens">Citizens Only</MenuItem>
                <MenuItem value="authorities">Authorities Only</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                />
              }
              label="Schedule Notification"
              sx={{ mb: 2 }}
            />
            
            {scheduled && (
              <TextField
                fullWidth
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<Send />}
              onClick={handleSendNotification}
              disabled={!newNotification.title || !newNotification.message}
            >
              Send Notification
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications
            </Typography>
            
            <List>
              {notifications.slice(0, 5).map((notification) => (
                <ListItem
                  key={notification.id}
                  divider
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemIcon>
                    {getTypeIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {notification.createdAt?.toDate?.().toLocaleString() || 'Recent'}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id, notification.read)}
                    >
                      <MarkAsUnread />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
              
              {notifications.length === 0 && (
                <ListItem>
                  <ListItemText primary="No notifications sent yet" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}