// src/components/charts/ReportsChart.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ReportsChart = ({ reports }) => {
  const [timeRange, setTimeRange] = React.useState('week');
  
  // Process report data for chart visualization
  const processChartData = () => {
    if (!reports || reports.length === 0) return [];
    
    // Group reports by date based on selected time range
    const groupedData = {};
    const now = new Date();
    
    reports.forEach(report => {
      if (!report.timestamp) return;
      
      const reportDate = report.timestamp.toDate();
      let key;
      
      switch (timeRange) {
        case 'day':
          key = reportDate.toLocaleDateString();
          break;
        case 'week':
          // Group by day of week
          key = reportDate.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          // Group by week number
          const weekNumber = Math.ceil(reportDate.getDate() / 7);
          key = `Week ${weekNumber}`;
          break;
        default:
          key = reportDate.toLocaleDateString();
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { period: key, total: 0, resolved: 0, pending: 0 };
      }
      
      groupedData[key].total += 1;
      if (report.status === 'resolved') {
        groupedData[key].resolved += 1;
      } else {
        groupedData[key].pending += 1;
      }
    });
    
    return Object.values(groupedData);
  };

  const chartData = processChartData();

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Incident Reports Over Time</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="day">Daily</MenuItem>
            <MenuItem value="week">Weekly</MenuItem>
            <MenuItem value="month">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#8884d8" name="Total Reports" />
            <Bar dataKey="resolved" fill="#82ca9d" name="Resolved" />
            <Bar dataKey="pending" fill="#ffc658" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          height="100%"
          flexDirection="column"
        >
          <Typography variant="body1" color="textSecondary" gutterBottom>
            No report data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Reports will appear here once they are submitted
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ReportsChart;