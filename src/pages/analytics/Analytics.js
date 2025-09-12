// src/pages/analytics/Analytics.js
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Warning,
  People,
  LocationCity,
  Category
} from '@mui/icons-material';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import StatCard from '../../components/ui/StatCard';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    activeAlerts: 0,
    citizenContributors: 0,
    reportsByCategory: {},
    reportsByArea: {}
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Calculate date range based on selection
        const now = new Date();
        let startDate = new Date();
        
        switch(timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          default:
            startDate.setDate(now.getDate() - 7);
        }

        // Fetch various statistics
        const reportsRef = collection(db, 'reports');
        const totalQuery = query(reportsRef, where('timestamp', '>=', startDate));
        const resolvedQuery = query(
          reportsRef, 
          where('timestamp', '>=', startDate),
          where('status', '==', 'resolved')
        );
        
        const [totalSnapshot, resolvedSnapshot] = await Promise.all([
          getCountFromServer(totalQuery),
          getCountFromServer(resolvedQuery)
        ]);

        setStats(prev => ({
          ...prev,
          totalReports: totalSnapshot.data().count,
          resolvedReports: resolvedSnapshot.data().count
        }));

      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports.toLocaleString(),
      trend: 'up',
      change: '12%',
      icon: <Timeline />,
      color: '#5f5fc4'
    },
    {
      title: 'Resolved',
      value: stats.resolvedReports.toLocaleString(),
      trend: 'up',
      change: '8%',
      icon: <TrendingUp />,
      color: '#4caf50'
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts.toString(),
      trend: 'down',
      change: '3%',
      icon: <Warning />,
      color: '#f44336'
    },
    {
      title: 'Citizen Contributors',
      value: stats.citizenContributors.toLocaleString(),
      trend: 'up',
      change: '24%',
      icon: <People />,
      color: '#2196f3'
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Reports by Category
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Category sx={{ fontSize: 64, color: 'text.secondary', mr: 2 }} />
              <Typography color="textSecondary">
                Category distribution chart will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Reports by Area
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <LocationCity sx={{ fontSize: 64, color: 'text.secondary', mr: 2 }} />
              <Typography color="textSecondary">
                Geographical distribution chart will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Time Analysis
            </Typography>
            <Box height={300} display="flex" alignItems="center" justifyContent="center">
              <Typography color="textSecondary">
                Response time trends and metrics will be displayed here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}