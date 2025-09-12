// src/pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Warning,
  People,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  orderBy, 
  getCountFromServer,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import StatCard from '../../components/ui/StatCard';
import ReportHeatmap from '../../components/maps/ReportHeatmap';
import ReportsChart from '../../components/charts/ReportsChart';
import RecentActivity from '../../components/ui/RecentActivity';
import IncidentTable from '../../components/tables/IncidentTable';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    activeAlerts: 0,
    citizenContributors: 0,
    averageResponseTime: '0h',
    previousPeriodStats: {
      totalReports: 0,
      resolvedReports: 0,
      activeAlerts: 0,
      citizenContributors: 0
    }
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate percentage change between current and previous period
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Determine trend direction
  const getTrend = (change) => {
    return change >= 0 ? 'up' : 'down';
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const usersRef = collection(db, 'users');
        
        // Get current period (last 30 days)
        const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        
        // Get previous period (30-60 days ago)
        const sixtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));

        // Execute all count queries in parallel
        const [
          totalSnapshot,
          resolvedSnapshot,
          activeSnapshot,
          usersSnapshot,
          previousPeriodSnapshot,
          previousResolvedSnapshot
        ] = await Promise.all([
          getCountFromServer(reportsRef),
          getCountFromServer(query(reportsRef, where('status', '==', 'resolved'))),
          getCountFromServer(query(
            reportsRef, 
            where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))),
            where('priority', 'in', ['high', 'critical'])
          )),
          getCountFromServer(usersRef),
          getCountFromServer(query(
            reportsRef,
            where('timestamp', '>=', sixtyDaysAgo),
            where('timestamp', '<=', thirtyDaysAgo)
          )),
          getCountFromServer(query(
            reportsRef,
            where('status', '==', 'resolved'),
            where('timestamp', '>=', sixtyDaysAgo),
            where('timestamp', '<=', thirtyDaysAgo)
          ))
        ]);

        // Calculate average response time
        const avgResponseTime = await calculateAverageResponseTime();

        setStats({
          totalReports: totalSnapshot.data().count,
          resolvedReports: resolvedSnapshot.data().count,
          activeAlerts: activeSnapshot.data().count,
          citizenContributors: usersSnapshot.data().count,
          averageResponseTime: avgResponseTime,
          previousPeriodStats: {
            totalReports: previousPeriodSnapshot.data().count,
            resolvedReports: previousResolvedSnapshot.data().count,
            activeAlerts: 0,
            citizenContributors: 0
          }
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // If queries fail, try a simpler approach
        fetchBasicStats();
      } finally {
        setLoading(false);
      }
    };

    // Fallback function for simpler stats fetching
    const fetchBasicStats = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const usersRef = collection(db, 'users');
        
        const [totalSnapshot, resolvedSnapshot, usersSnapshot] = await Promise.all([
          getCountFromServer(reportsRef),
          getCountFromServer(query(reportsRef, where('status', '==', 'resolved'))),
          getCountFromServer(usersRef)
        ]);

        setStats(prev => ({
          ...prev,
          totalReports: totalSnapshot.data().count,
          resolvedReports: resolvedSnapshot.data().count,
          citizenContributors: usersSnapshot.data().count,
          averageResponseTime: 'N/A'
        }));
      } catch (error) {
        console.error('Error fetching basic statistics:', error);
      }
    };

    fetchStats();
  }, []);

  // Calculate average response time for resolved reports
  const calculateAverageResponseTime = async () => {
    try {
      const resolvedReportsQuery = query(
        collection(db, 'reports'),
        where('status', '==', 'resolved')
      );
      
      const querySnapshot = await getDocs(resolvedReportsQuery);
      let totalResponseTime = 0;
      let count = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp && data.updatedAt) {
          try {
            const reportTime = data.timestamp.toDate();
            const resolveTime = data.updatedAt.toDate();
            const responseTimeHours = (resolveTime - reportTime) / (1000 * 60 * 60);
            
            if (responseTimeHours > 0) {
              totalResponseTime += responseTimeHours;
              count++;
            }
          } catch (e) {
            console.warn('Error processing response time for document:', doc.id);
          }
        }
      });

      if (count === 0) return '0h';
      
      const averageHours = totalResponseTime / count;
      return averageHours < 1 
        ? `${Math.round(averageHours * 60)}m` 
        : `${averageHours.toFixed(1)}h`;
    } catch (error) {
      console.error('Error calculating response time:', error);
      return 'N/A';
    }
  };

  // Fetch recent incidents
  useEffect(() => {
    // Use a simpler query that's less likely to fail
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const incidents = [];
      querySnapshot.forEach((doc) => {
        // Only include reports from the last 7 days
        const data = doc.data();
        const reportDate = data.timestamp?.toDate?.() || new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (reportDate >= sevenDaysAgo) {
          incidents.push({ id: doc.id, ...data });
        }
      });
      setRecentIncidents(incidents);
    }, (error) => {
      console.error('Error fetching incidents:', error);
    });

    return () => unsubscribe();
  }, []);

  // Calculate trends and changes
  const totalReportsChange = calculateChange(
    stats.totalReports, 
    stats.previousPeriodStats.totalReports
  );
  
  const resolvedReportsChange = calculateChange(
    stats.resolvedReports, 
    stats.previousPeriodStats.resolvedReports
  );
  
  const activeAlertsChange = calculateChange(
    stats.activeAlerts, 
    stats.previousPeriodStats.activeAlerts
  );
  
  const citizenContributorsChange = calculateChange(
    stats.citizenContributors, 
    stats.previousPeriodStats.citizenContributors
  );

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports.toLocaleString(),
      trend: getTrend(totalReportsChange),
      change: `${Math.abs(totalReportsChange)}%`,
      icon: <Timeline sx={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.light
    },
    {
      title: 'Resolved',
      value: stats.resolvedReports.toLocaleString(),
      trend: getTrend(resolvedReportsChange),
      change: `${Math.abs(resolvedReportsChange)}%`,
      icon: <TrendingUp sx={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.light
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts.toString(),
      trend: getTrend(activeAlertsChange),
      change: `${Math.abs(activeAlertsChange)}%`,
      icon: <Warning sx={{ color: theme.palette.error.main }} />,
      color: theme.palette.error.light
    },
    {
      title: 'Citizen Contributors',
      value: stats.citizenContributors.toLocaleString(),
      trend: getTrend(citizenContributorsChange),
      change: `${Math.abs(citizenContributorsChange)}%`,
      icon: <People sx={{ color: theme.palette.info.main }} />,
      color: theme.palette.info.light
    }
  ];

  return (
    <Box sx={{ p: isMobile ? 1 : 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        fontWeight: 'bold', 
        color: theme.palette.primary.dark,
        mb: 3 
      }}>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
        
        {/* Response Time and Map Overview */}
        <Grid item xs={12} md={8}>  
          <Grid container spacing={3}>
             <Grid item xs={12}>
              <ReportsChart reports={recentIncidents} />
            </Grid>
             <Grid item xs={12}>
              <ReportHeatmap incidents={recentIncidents} />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Recent Activity and Response Time */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                borderRadius: 2
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTime sx={{ mr: 1 }} />
                    <Typography variant="h6">Avg. Response Time</Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.averageResponseTime}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Across {stats.resolvedReports} resolved incidents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <RecentActivity incidents={recentIncidents.slice(0, 5)} />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Recent Incidents Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: theme.palette.primary.main }} />
              Recent Incident Reports ({recentIncidents.length})
            </Typography>
            <IncidentTable incidents={recentIncidents} loading={loading} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}