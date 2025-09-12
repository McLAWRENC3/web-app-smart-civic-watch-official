import React from 'react';
import { Menu } from 'react-pro-sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import { 
  IconButton, 
  Button, 
  Box,
  Slide,
  Fade,
  styled 
} from '@mui/material';
import { getAuth, signOut } from 'firebase/auth';

// Styled component for smooth transitions
const TransitionButton = styled(Button)(({ theme, active }) => ({
  margin: '4px 8px',
  justifyContent: 'flex-start',
  padding: '12px 16px',
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: active ? 600 : 400,
  backgroundColor: active ? theme.palette.primary.dark : 'transparent',
  color: active ? 'white' : theme.palette.grey[300],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.primary.light,
    transform: 'translateX(4px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
  '& .MuiButton-startIcon': {
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiButton-startIcon': {
    transform: 'scale(1.2)',
  }
}));

const AnimatedMenuItem = styled(Box)({
  overflow: 'hidden',
  margin: '4px 0',
});

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  // Define menu items
  const menuItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/reports', icon: <FiUsers />, label: 'Reports' },
    { path: '/settings', icon: <FiSettings />, label: 'Settings' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // redirect to login page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ 
      height: '100vh',
      position: 'fixed',
      width: collapsed ? '80px' : '250px',
      transition: 'width 0.3s ease-in-out',
      backgroundColor: '#1976d2',
      color: 'white',
      padding: '16px 8px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Menu Section */}
      <Menu>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path || 
                          (item.path === '/dashboard' && location.pathname === '/');
          
          return (
            <AnimatedMenuItem key={item.path}>
              <Slide 
                direction="right" 
                in={true} 
                timeout={300 + (index * 100)}
                mountOnEnter
                unmountOnExit
              >
                <div>
                  {collapsed ? (
                    <IconButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        color: isActive ? 'white' : 'grey.300',
                        backgroundColor: isActive ? 'primary.dark' : 'transparent',
                        margin: '4px',
                        padding: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: isActive ? 'primary.dark' : 'primary.light',
                          transform: 'scale(1.1)',
                        }
                      }}
                      title={item.label}
                    >
                      <Fade in={true} timeout={500}>
                        <span>{item.icon}</span>
                      </Fade>
                    </IconButton>
                  ) : (
                    <TransitionButton
                      fullWidth
                      startIcon={
                        <Fade in={true} timeout={500}>
                          <span>{item.icon}</span>
                        </Fade>
                      }
                      onClick={() => handleNavigation(item.path)}
                      active={isActive}
                      variant={isActive ? 'contained' : 'text'}
                    >
                      <Fade in={true} timeout={800}>
                        <span>{item.label}</span>
                      </Fade>
                    </TransitionButton>
                  )}
                </div>
              </Slide>
            </AnimatedMenuItem>
          );
        })}
      </Menu>

      {/* Logout Button */}
      <Box sx={{ mb: 2 }}>
        {collapsed ? (
          <IconButton
            onClick={handleLogout}
            sx={{
              color: 'grey.300',
              margin: '4px',
              padding: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'primary.light',
                transform: 'scale(1.1)',
              }
            }}
            title="Logout"
          >
            <Fade in={true} timeout={500}>
              <span><FiLogOut /></span>
            </Fade>
          </IconButton>
        ) : (
          <TransitionButton
            fullWidth
            startIcon={
              <Fade in={true} timeout={500}>
                <span><FiLogOut /></span>
              </Fade>
            }
            onClick={handleLogout}
            variant="text"
          >
            <Fade in={true} timeout={800}>
              <span>Logout</span>
            </Fade>
          </TransitionButton>
        )}
      </Box>
    </div>
  );
}
