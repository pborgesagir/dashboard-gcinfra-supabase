"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
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
  Chip,
  useTheme,
  alpha,
  Avatar,
} from "@mui/material";
import {
  AccountCircle,
  Menu as MenuIcon,
  Dashboard,
  Build,
  Business,
  People,
  ExitToApp,
  MedicalServices,
  ChevronLeft,
  ChevronRight,
  HourglassEmpty,
  Psychology,
} from "@mui/icons-material";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface AppLayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { userProfile, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      handleClose();
      await signOut();
      // Force a page reload to clear any cached state and ensure proper redirect
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: still redirect to login even if signOut fails
      window.location.href = "/auth/login";
    }
  };

  const navigationItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: isAdmin ? "/admin/dashboard" : "/dashboard",
      show: true,
    },
    {
      text: "Engenharia Clínica",
      icon: <MedicalServices />,
      path: isAdmin ? "/admin/clinical" : "/clinical",
      show: true,
    },
    {
      text: "Engenharia Predial",
      icon: <Build />,
      path: isAdmin ? "/admin/building" : "/building",
      show: true,
    },
    {
      text: "Análises",
      icon: <Psychology />,
      path: isAdmin ? "/admin/analytics" : "/analytics",
      show: true,
    },
    {
      text: "Empresas",
      icon: <Business />,
      path: "/admin/companies",
      show: isAdmin,
    },
    {
      text: "Gerenciar Usuários",
      icon: <People />,
      path: "/admin/users",
      show: isAdmin,
    },
    {
      text: "SMO",
      icon: <HourglassEmpty />,
      path: "/smo",
      show: true,
    },
  ];

  // Professional gradient colors matching login screen
  const gradientColors = {
    light: {
      primary: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
      secondary: "linear-gradient(135deg, #00695c 0%, #004d40 100%)",
      accent: "linear-gradient(135deg, #0277bd 0%, #01579b 100%)",
    },
    dark: {
      primary: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
      secondary: "linear-gradient(135deg, #00695c 0%, #004d40 100%)",
      accent: "linear-gradient(135deg, #0277bd 0%, #01579b 100%)",
    },
  };

  const currentGradients =
    theme.palette.mode === "dark" ? gradientColors.dark : gradientColors.light;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background geometric pattern for 360° concept */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 10% 20%, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, ${alpha(
              theme.palette.secondary.main,
              0.05
            )} 0%, transparent 50%)
          `,
          "&::before": {
            content: '""',
            position: "absolute",
            top: "20%",
            right: "-50px",
            width: "100px",
            height: "100px",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: "50%",
            transform: "rotate(45deg)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "30%",
            left: "-30px",
            width: "60px",
            height: "60px",
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
            borderRadius: "50%",
            transform: "rotate(-30deg)",
          },
        }}
      />

      {/* Header with logo and title */}
      <Box
        sx={{
          p: sidebarOpen ? 3 : 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          justifyContent: sidebarOpen ? "flex-start" : "center",
          background: currentGradients.primary,
          color: "white",
          position: "relative",
          zIndex: 1,
          borderBottom: `1px solid ${alpha("#ffffff", 0.1)}`,
        }}
      >
        {/* 360° rotating logo element */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sidebarOpen && (
            <Box
              sx={{
                position: "absolute",
                width: 60,
                height: 60,
                border: "2px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                animation: "rotate 20s linear infinite",
                borderTopColor: "rgba(255,255,255,0.6)",
                "@keyframes rotate": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          )}
          <Image
            src="/logodaagir.png"
            alt="360° - GCINFRA Logo"
            width={sidebarOpen ? 48 : 40}
            height={sidebarOpen ? 48 : 40}
            style={{
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              position: "relative",
              zIndex: 1,
            }}
          />
        </Box>

        {sidebarOpen && (
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography variant="h6" noWrap fontWeight="bold" sx={{ mb: 0.5 }}>
              GCINFRA 360°
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Gestão Inteligente de Infraestrutura
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Profile Section */}
      {sidebarOpen && (
        <Box
          sx={{
            mt: 3,
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: currentGradients.accent,
              color: "white",
              fontWeight: "bold",
              fontSize: "1.4rem",
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {userProfile?.email?.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="subtitle1" fontWeight="600" textAlign="center">
            {userProfile?.email?.split("@")[0]}
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
            <Chip
              label={userProfile?.role}
              size="small"
              sx={{
                background: isAdmin
                  ? "linear-gradient(135deg, #d32f2f 0%, #c62828 100%)"
                  : currentGradients.primary,
                color: "white",
                fontWeight: 600,
                "& .MuiChip-label": {
                  px: 1.5,
                },
              }}
            />
            {userProfile?.company && (
              <Chip
                label={userProfile.company.name}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  "& .MuiChip-label": {
                    px: 1.5,
                  },
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2, position: "relative", zIndex: 1 }}>
        {navigationItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = false; // You can add active route detection here

            return (
              <ListItem
                key={item.text}
                onClick={() => {
                  router.push(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  cursor: "pointer",
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  minHeight: 48,
                  background: isActive
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  border: isActive
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    : "1px solid transparent",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )}`,
                    transform: "translateX(4px)",
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )}`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen ? 56 : "auto",
                    justifyContent: "center",
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    transition: "color 0.3s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      fontSize: "0.9rem",
                    }}
                  />
                )}
              </ListItem>
            );
          })}
      </List>

      {/* Footer with gradient accent */}
      {sidebarOpen && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: alpha(theme.palette.secondary.main, 0.1),
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ opacity: 0.7 }}
          >
            © 2025 - GCINFRA 360°
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ opacity: 0.6 }}
          >
            Infraestrutura Hospitalar
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <DataProvider>
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: {
              sm: sidebarOpen
                ? `calc(100% - ${drawerWidth}px)`
                : `calc(100% - 72px)`,
            },
            ml: { sm: sidebarOpen ? `${drawerWidth}px` : "72px" },
            transition: "width 0.3s ease-in-out, margin 0.3s ease-in-out",
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            color: theme.palette.text.primary,
            boxShadow: `0 1px 8px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <IconButton
              color="inherit"
              aria-label="alternar sidebar"
              onClick={handleSidebarToggle}
              sx={{
                mr: 2,
                display: { xs: "none", sm: "inline-flex" },
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: alpha(theme.palette.primary.main, 0.08),
                  transform: "scale(1.05)",
                },
              }}
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                background: currentGradients.primary,
                backgroundClip: "text",
                color: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {isAdmin ? "Painel Administrativo" : "Dashboard"}
            </Typography>

            <Box sx={{ mr: 2 }}>
              <ThemeToggle />
            </Box>

            <Box>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: alpha(theme.palette.primary.main, 0.08),
                    transform: "scale(1.05)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: currentGradients.accent,
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  {userProfile?.email?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  "& .MuiPaper-root": {
                    borderRadius: 2,
                    mt: 1,
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.common.black,
                      0.12
                    )}`,
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    router.push("/profile");
                    handleClose();
                  }}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <AccountCircle sx={{ mr: 2, color: "text.secondary" }} />
                  Perfil
                </MenuItem>
                <MenuItem
                  onClick={handleSignOut}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: alpha(theme.palette.error.main, 0.08),
                      color: "error.main",
                    },
                  }}
                >
                  <ExitToApp sx={{ mr: 2, color: "text.secondary" }} />
                  Sair
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{
            width: { sm: sidebarOpen ? drawerWidth : 72 },
            flexShrink: { sm: 0 },
            transition: "width 0.3s",
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
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                overflowX: "hidden",
                borderRight: "none",
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.common.black,
                  0.15
                )}`,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: sidebarOpen ? drawerWidth : 72,
                transition: "width 0.3s ease-in-out",
                overflowX: "hidden",
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.common.black,
                  0.08
                )}`,
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
            width: {
              sm: sidebarOpen
                ? `calc(100% - ${drawerWidth}px)`
                : `calc(100% - 72px)`,
            },
            transition: "width 0.3s, margin 0.3s",
            mt: 8,
          }}
        >
          {children}
        </Box>
      </Box>
    </DataProvider>
  );
}
