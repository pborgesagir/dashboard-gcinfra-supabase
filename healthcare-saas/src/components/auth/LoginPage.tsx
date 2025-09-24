"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import Image from "next/image";
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Security,
  Analytics,
  Engineering,
} from "@mui/icons-material";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithEmail, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  // Redirecionar automaticamente após login bem-sucedido
  useEffect(() => {
    if (!authLoading && userProfile) {
      // Redirecionar baseado no papel do usuário
      if (userProfile.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userProfile.role === 'manager') {
        router.push('/dashboard');
      } else {
        // Role desconhecido, redirecionar para página padrão
        router.push('/dashboard');
      }
    }
  }, [userProfile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithEmail(email, password);

      if (error) {
        setError(error.message);
      } else {
        // O redirecionamento será feito automaticamente pelo useEffect do AuthContext
        // após o profile do usuário ser carregado
      }
    } catch {
      setError("Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Professional color palette for healthcare infrastructure
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0a1628 0%, #1e293b 50%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
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
            radial-gradient(circle at 20% 20%, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${alpha(
              theme.palette.secondary.main,
              0.1
            )} 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, transparent 50%)
          `,
          "&::before": {
            content: '""',
            position: "absolute",
            top: "10%",
            right: "10%",
            width: "300px",
            height: "300px",
            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: "50%",
            transform: "rotate(45deg)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: "200px",
            height: "200px",
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            borderRadius: "50%",
            transform: "rotate(-45deg)",
          },
        }}
      />

      {/* Left Panel - Brand and Features */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 8,
          py: 6,
          position: "relative",
          background: currentGradients.primary,
          color: "white",
        }}
      >
        {/* 360° Visual Element */}
        <Box
          sx={{
            position: "relative",
            mb: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Rotating rings for 360° concept */}
          <Box
            sx={{
              position: "absolute",
              width: 180,
              height: 180,
              border: "2px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              animation: "rotate 20s linear infinite",
              borderTopColor: "rgba(255,255,255,0.8)",
              "@keyframes rotate": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 140,
              height: 140,
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "50%",
              animation: "rotateReverse 15s linear infinite",
              borderBottomColor: "rgba(255,255,255,0.6)",
              "@keyframes rotateReverse": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(-360deg)" },
              },
            }}
          />
          <Image
            src="/logodaagir.png"
            alt="360° - GCINFRA Logo"
            width={80}
            height={80}
            style={{
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              position: "relative",
              zIndex: 1,
            }}
          />
        </Box>

        <Typography variant="h3" fontWeight="bold" mb={2} textAlign="center">
          GCINFRA 360°
        </Typography>

        <Typography
          variant="h6"
          mb={6}
          textAlign="center"
          sx={{ opacity: 0.9 }}
        >
          Gestão Inteligente de Infraestrutura Hospitalar
        </Typography>

        {/* Feature highlights */}
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {[
            {
              icon: <LocalHospital sx={{ fontSize: 32 }} />,
              title: "Infraestrutura Hospitalar",
              desc: "Gestão completa de equipamentos médicos e prediais",
            },
            {
              icon: <Analytics sx={{ fontSize: 32 }} />,
              title: "Análise 360°",
              desc: "Visão completa dos dados de manutenção e performance",
            },
            {
              icon: <Security sx={{ fontSize: 32 }} />,
              title: "Conformidade",
              desc: "Atendimento a normas técnicas e regulatórias",
            },
            {
              icon: <Engineering sx={{ fontSize: 32 }} />,
              title: "Engenharia Predial e Clínica",
              desc: "Tecnologia aliada à gestão",
            },
          ].map((feature, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 3,
                p: 2,
                borderRadius: 2,
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(255,255,255,0.15)",
                  transform: "translateX(10px)",
                },
              }}
            >
              <Box sx={{ mr: 3, opacity: 0.9 }}>{feature.icon}</Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {feature.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
          position: "relative",
        }}
      >
        <Container maxWidth="sm">
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              alignItems: "center",
              mb: 6,
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: "50%",
                  animation: "rotate 20s linear infinite",
                  borderTopColor: theme.palette.primary.main,
                  "@keyframes rotate": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Image
                src="/logodaagir.png"
                alt="360° - GCINFRA Logo"
                width={60}
                height={60}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary.main"
              textAlign="center"
              mb={1}
            >
              360° - GCINFRA
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ opacity: 0.8 }}
            >
              Gestão Inteligente de Infraestrutura
            </Typography>
          </Box>

          {/* Login Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
            }}
          >
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" fontWeight="600" gutterBottom>
                Bem-vindo(a)!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entre com suas credenciais para acessar
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    width: "100%",
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="E-mail Corporativo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  },
                }}
                placeholder="seu@email.com.br"
              />

              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mb: 4,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="alternar visibilidade da senha"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: currentGradients.primary,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: `0 4px 16px ${alpha(
                    theme.palette.primary.main,
                    0.3
                  )}`,
                  "&:hover": {
                    background: currentGradients.accent,
                    boxShadow: `0 8px 24px ${alpha(
                      theme.palette.primary.main,
                      0.4
                    )}`,
                    transform: "translateY(-2px)",
                  },
                  "&:disabled": {
                    background: alpha(theme.palette.action.disabled, 0.3),
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Autenticando...</span>
                  </Box>
                ) : (
                  "Acessar Sistema"
                )}
              </Button>
            </form>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={1}>
                Precisa de acesso ao sistema?
              </Typography>
              <Typography
                variant="body2"
                color="primary.main"
                sx={{ fontWeight: 500 }}
              >
                Entre em contato com a GCINFRA
              </Typography>
            </Box>
          </Paper>

          {/* Footer */}
          <Box mt={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              © 2025 GCINFRA 360°. Gestão Inteligente de Infraestrutura
              Hospitalar.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
