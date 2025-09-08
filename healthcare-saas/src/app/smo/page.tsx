"use client";

import { Box, Typography, Container, Paper, Fade, Chip } from "@mui/material";
import {
  HourglassEmpty,
  IntegrationInstructions,
  Timeline,
  TrendingUp,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function SMOPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in={mounted} timeout={1000}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          textAlign="center"
        >
          {/* Seção principal com Coming Soon */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: 3,
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              position: "relative",
              overflow: "hidden",
              maxWidth: "800px",
              width: "100%",
            }}
          >
            {/* Elemento decorativo de fundo */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 200,
                height: 200,
                background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
                opacity: 0.1,
              }}
            />

            {/* Ícone principal */}
            <Box sx={{ mb: 4 }}>
              <HourglassEmpty
                sx={{
                  fontSize: { xs: 80, md: 120 },
                  color: "#2196f3",
                  filter: "drop-shadow(0 4px 8px rgba(33, 150, 243, 0.3))",
                }}
              />
            </Box>

            {/* Título principal */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                mb: 2,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              COMING SOON
            </Typography>

            {/* Subtítulo */}
            <Typography
              variant="h4"
              sx={{
                color: "#555",
                mb: 4,
                fontWeight: 300,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Integração com o SMO
            </Typography>

            {/* Descrição */}
            <Typography
              variant="body1"
              sx={{
                color: "#666",
                mb: 4,
                fontSize: { xs: "1rem", md: "1.2rem" },
                lineHeight: 1.6,
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              Sistema de Medição de Ordens de Serviço será integrado em breve
              para fornecer ainda mais uma visão 360 sobre as operações de
              infraestrutura.
            </Typography>

            {/* Chips informativos */}
            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Chip
                icon={<IntegrationInstructions />}
                label="Integração Avançada"
                variant="outlined"
                sx={{
                  borderColor: "#2196f3",
                  color: "#2196f3",
                  "& .MuiChip-icon": { color: "#2196f3" },
                }}
              />
              <Chip
                icon={<Timeline />}
                label="Monitoramento Real-time"
                variant="outlined"
                sx={{
                  borderColor: "#2196f3",
                  color: "#2196f3",
                  "& .MuiChip-icon": { color: "#2196f3" },
                }}
              />
              <Chip
                icon={<TrendingUp />}
                label="Analytics Avançados"
                variant="outlined"
                sx={{
                  borderColor: "#2196f3",
                  color: "#2196f3",
                  "& .MuiChip-icon": { color: "#2196f3" },
                }}
              />
            </Box>
          </Paper>

          {/* Seção secundária com informações adicionais */}
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography
              variant="body2"
              sx={{
                color: "#888",
                fontSize: "0.9rem",
                fontStyle: "italic",
              }}
            >
              Estamos trabalhando para trazer a melhor experiência de gestão de
              infraestrutura hospitalar
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
}
