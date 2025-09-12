import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export default function Topbar({ onMenuClick }) {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        color: 'text.primary',
        mb: 3
      }}
    >
      <Toolbar>
        <IconButton 
          edge="start" 
          onClick={onMenuClick}
          sx={{ color: 'inherit' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6">Smart Civic Watch</Typography>
      </Toolbar>
    </AppBar>
  );
}