'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Chip
} from '@mui/material'
import {
  AccountCircle,
  Menu as MenuIcon,
  Dashboard,
  Build,
  Business,
  People,
  Analytics,
  Settings,
  ExitToApp,
  MedicalServices
} from '@mui/icons-material'

interface AppLayoutProps {
  children: ReactNode
}

const drawerWidth = 280

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  const { userProfile, signOut, isAdmin } = useAuth()
  const router = useRouter()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
    handleClose()
  }

  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: isAdmin ? '/admin/dashboard' : '/dashboard',
      show: true
    },
    {
      text: 'Clinical Engineering',
      icon: <MedicalServices />,
      path: isAdmin ? '/admin/clinical' : '/clinical',
      show: true
    },
    {
      text: 'Building Engineering',
      icon: <Build />,
      path: isAdmin ? '/admin/building' : '/building',
      show: true
    },
    {
      text: 'Analytics',
      icon: <Analytics />,
      path: isAdmin ? '/admin/analytics' : '/analytics',
      show: true
    },
    {
      text: 'Companies',
      icon: <Business />,
      path: '/admin/companies',
      show: isAdmin
    },
    {
      text: 'User Management',
      icon: <People />,
      path: '/admin/users',
      show: isAdmin
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      show: true
    }
  ]

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <MedicalServices sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" noWrap>
            Healthcare SaaS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Infrastructure Management
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {userProfile?.email}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip 
            label={userProfile?.role} 
            size="small" 
            color={isAdmin ? 'error' : 'primary'}
          />
          {userProfile?.company && (
            <Chip 
              label={userProfile.company.name} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {navigationItems
          .filter(item => item.show)
          .map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                router.push(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isAdmin ? 'Admin Panel' : 'Dashboard'}
          </Typography>
          
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { router.push('/profile'); handleClose(); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                <ExitToApp sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  )
}