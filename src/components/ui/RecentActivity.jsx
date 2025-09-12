import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box
} from '@mui/material';
import {
  Warning,
  Report,
  CheckCircle,
  AccessTime
} from '@mui/icons-material';

const RecentActivity = ({ incidents }) => {
  const getActivityIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle color="success" />;
      case 'critical': return <Warning color="error" />;
      case 'in-progress': return <AccessTime color="warning" />;
      default: return <Report color="info" />;
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <List dense>
        {incidents.slice(0, 5).map((incident) => (
          <ListItem key={incident.id} divider>
            <ListItemIcon>
              {getActivityIcon(incident.status || 'pending')}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                    {incident.type || 'Incident'}
                  </Typography>
                  <Chip 
                    label={incident.status || 'pending'} 
                    size="small" 
                    color={
                      incident.status === 'resolved' ? 'success' : 
                      incident.status === 'critical' ? 'error' : 'default'
                    }
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="textSecondary" noWrap>
                  {incident.timestamp?.toDate?.().toLocaleDateString() || 'Recent'}
                </Typography>
              }
            />
          </ListItem>
        ))}
        {incidents.length === 0 && (
          <ListItem>
            <ListItemText primary="No recent activity" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default RecentActivity;