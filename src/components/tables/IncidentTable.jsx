import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  Typography,
  Box
} from '@mui/material';
import { Visibility, LocationOn, Warning } from '@mui/icons-material';

const IncidentTable = ({ incidents, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'default';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <Warning color="error" />;
      case 'medium': return <Warning color="warning" />;
      case 'low': return <Warning color="info" />;
      default: return <Warning />;
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (incidents.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No incidents reported yet.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="incidents table">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date Reported</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id} hover>
              <TableCell>
                <Box display="flex" alignItems="center">
                  {getPriorityIcon(incident.priority)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {incident.type || 'Incident'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {incident.description}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <LocationOn color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {incident.location || 'Unknown'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={incident.status || 'pending'} 
                  color={getStatusColor(incident.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {incident.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
              </TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <Visibility />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IncidentTable;