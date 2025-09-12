// src/components/maps/ReportHeatmap.jsx
import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const ReportHeatmap = ({ incidents }) => {
  const [heatmapType, setHeatmapType] = useState('priority');
  
  // Process data for heatmap visualization
  const heatmapData = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];
    
    // Define time periods (hours of day)
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Define days of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize heatmap data structure
    const data = days.map(day => ({
      day,
      ...hours.reduce((acc, hour) => {
        acc[hour] = 0;
        return acc;
      }, {})
    }));
    
    // Count incidents based on selected heatmap type
    incidents.forEach(incident => {
      if (!incident.timestamp) return;
      
      const incidentDate = incident.timestamp.toDate();
      const day = days[incidentDate.getDay()];
      const hour = incidentDate.getHours();
      
      const dayIndex = data.findIndex(d => d.day === day);
      if (dayIndex !== -1) {
        if (heatmapType === 'priority') {
          // Weight by priority
          const priorityWeight = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
          };
          data[dayIndex][hour] += priorityWeight[incident.priority] || 1;
        } else {
          // Simple count
          data[dayIndex][hour] += 1;
        }
      }
    });
    
    return data;
  }, [incidents, heatmapType]);
  
  // Find max value for color scaling
  const maxValue = useMemo(() => {
    if (!heatmapData.length) return 1;
    return Math.max(...heatmapData.flatMap(day => 
      Object.values(day).filter(val => typeof val === 'number')
    ));
  }, [heatmapData]);
  
  // Get color intensity based on value
  const getColorIntensity = (value) => {
    if (value === 0) return '#f0f0f0';
    const intensity = Math.floor((value / maxValue) * 240);
    return `rgb(${intensity}, ${100}, ${100})`;
  };

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Incident Heatmap</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>View By</InputLabel>
          <Select
            value={heatmapType}
            label="View By"
            onChange={(e) => setHeatmapType(e.target.value)}
          >
            <MenuItem value="count">Incident Count</MenuItem>
            <MenuItem value="priority">Priority Weighted</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {incidents.length > 0 ? (
        <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Box sx={{ display: 'inline-block', minWidth: 800 }}>
            {/* Header row with hours */}
            <Box sx={{ display: 'flex', ml: 7 }}>
              {Array.from({ length: 24 }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 30,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {i}
                </Box>
              ))}
            </Box>
            
            {/* Heatmap rows */}
            {heatmapData.map((dayData, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box
                  sx={{
                    width: 50,
                    textAlign: 'right',
                    pr: 1,
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}
                >
                  {dayData.day}
                </Box>
                {Array.from({ length: 24 }, (_, hour) => (
                  <Box
                    key={hour}
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: getColorIntensity(dayData[hour]),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: dayData[hour] > maxValue / 2 ? 'white' : 'black',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        zIndex: 1,
                        boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                      }
                    }}
                    title={`${dayData.day} ${hour}:00 - ${dayData[hour]} incidents`}
                  >
                    {dayData[hour] > 0 ? dayData[hour] : ''}
                  </Box>
                ))}
              </Box>
            ))}
            
            {/* Legend */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, ml: 7 }}>
              <Typography variant="caption" sx={{ mr: 1 }}>
                Less:
              </Typography>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <Box
                  key={ratio}
                  sx={{
                    width: 30,
                    height: 15,
                    backgroundColor: getColorIntensity(ratio * maxValue),
                    display: 'inline-block',
                    border: '1px solid #ddd'
                  }}
                />
              ))}
              <Typography variant="caption" sx={{ ml: 1 }}>
                More
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          height="100%"
          flexDirection="column"
        >
          <Typography variant="body1" color="textSecondary" gutterBottom>
            No incident data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Incident heatmap will appear here once reports are submitted
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ReportHeatmap;