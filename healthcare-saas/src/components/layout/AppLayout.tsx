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
  MedicalServices,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface AppLayoutProps {
  children: ReactNode
}

const drawerWidth = 280

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  const { userProfile, signOut, isAdmin } = useAuth()
  const router = useRouter()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
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
      text: 'Engenharia Clínica',
      icon: <MedicalServices />,
      path: isAdmin ? '/admin/clinical' : '/clinical',
      show: true
    },
    {
      text: 'Engenharia Predial',
      icon: <Build />,
      path: isAdmin ? '/admin/building' : '/building',
      show: true
    },
    {
      text: 'Análises',
      icon: <Analytics />,
      path: isAdmin ? '/admin/analytics' : '/analytics',
      show: true
    },
    {
      text: 'Empresas',
      icon: <Business />,
      path: '/admin/companies',
      show: isAdmin
    },
    {
      text: 'Gerenciar Usuários',
      icon: <People />,
      path: '/admin/users',
      show: isAdmin
    },
    {
      text: 'Configurações',
      icon: <Settings />,
      path: '/settings',
      show: true
    }
  ]

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
        <MedicalServices sx={{ color: 'primary.main' }} />
        {sidebarOpen && (
          <Box>
            <Typography variant="h6" noWrap>
              Healthcare SaaS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerenciamento de Infraestrutura
            </Typography>
          </Box>
        )}
      </Box>
      
      <Divider />
      
      {sidebarOpen && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userProfile?.email}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
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
      )}
      
      <Divider />
      
      <List>
        {navigationItems
          .filter(item => item.show)
          .map((item) => (
            <ListItem
              key={item.text}
              onClick={() => {
                router.push(item.path)
                setMobileOpen(false)
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 56 : 'auto', justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.text} />}
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
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : `calc(100% - 72px)` },
          ml: { sm: sidebarOpen ? `${drawerWidth}px` : '72px' },
          transition: 'width 0.3s, margin 0.3s'
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
          
          <IconButton
            color="inherit"
            aria-label="alternar sidebar"
            onClick={handleSidebarToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isAdmin ? 'Painel Administrativo' : 'Dashboard'}
          </Typography>
          
          <ThemeToggle />
          
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
        sx={{ 
          width: { sm: sidebarOpen ? drawerWidth : 72 }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s'
        }}
        aria-label="folders de navegação"
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              overflowX: 'hidden'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarOpen ? drawerWidth : 72,
              transition: 'width 0.3s',
              overflowX: 'hidden'
            },
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
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : `calc(100% - 72px)` },
          transition: 'width 0.3s, margin 0.3s',
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  )
}