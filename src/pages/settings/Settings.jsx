import React, { useState } from 'react'; // Fixed import
import { 
  Box, 
  Typography, 
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button
} from '@mui/material';
import { FiUser, FiLock, FiBell } from 'react-icons/fi';

// TabPanel component must be defined outside the main component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0); // Now properly imported

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Card elevation={3}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Profile" icon={<FiUser />} />
          <Tab label="Security" icon={<FiLock />} />
          <Tab label="Notifications" icon={<FiBell />} />
        </Tabs>
        
        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Box component="form" sx={{ maxWidth: 500 }}>
              <TextField
                fullWidth
                label="Full Name"
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                margin="normal"
                variant="outlined"
              />
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
              >
                Update Profile
              </Button>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box component="form" sx={{ maxWidth: 500 }}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                margin="normal"
                variant="outlined"
              />
              <Button 
                variant="contained" 
                color="warning"
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography>
              Configure how you receive alerts and updates
            </Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}