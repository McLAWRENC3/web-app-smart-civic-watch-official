// src/components/ui/StatCard.jsx
import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatCard = ({ title, value, trend, change, icon, color }) => {
  const theme = useTheme();

  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)'
      }
    }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ 
            backgroundColor: color, 
            borderRadius: 2, 
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
          <Box display="flex" alignItems="center">
            {trend === 'up' ? (
              <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: theme.palette.error.main, mr: 0.5 }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 'bold'
              }}
            >
              {change}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;