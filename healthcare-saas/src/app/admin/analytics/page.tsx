"use client";

import { Box, Typography, Container, Paper, Fade, Chip } from "@mui/material";
import {
  Psychology,
  AutoAwesome,
  Insights,
  SmartToy,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function AdminAnalyticsPage() {
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
                background: "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
                opacity: 0.1,
              }}
            />

            {/* Ícone principal */}
            <Box sx={{ mb: 4 }}>
              <Psychology
                sx={{
                  fontSize: { xs: 80, md: 120 },
                  color: "#9c27b0",
                  filter: "drop-shadow(0 4px 8px rgba(156, 39, 176, 0.3))",
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
                background: "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
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
              variant="h5"
              sx={{
                color: "#555",
                mb: 4,
                fontWeight: 300,
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                lineHeight: 1.4,
              }}
            >
              Resumos e análises gerados por Inteligência Artificial para
              facilitar a geração de insights.
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
              Painel administrativo para análises que transformam dados em
              insights acionáveis, utilizando IA para otimizar a gestão de
              infraestrutura em diferentes unidades hospitalares.
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
                icon={<AutoAwesome />}
                label="IA Generativa"
                variant="outlined"
                sx={{
                  borderColor: "#9c27b0",
                  color: "#9c27b0",
                  "& .MuiChip-icon": { color: "#9c27b0" },
                }}
              />
              <Chip
                icon={<Insights />}
                label="Insights Multi-empresa"
                variant="outlined"
                sx={{
                  borderColor: "#9c27b0",
                  color: "#9c27b0",
                  "& .MuiChip-icon": { color: "#9c27b0" },
                }}
              />
              <Chip
                icon={<AnalyticsIcon />}
                label="Análise Preditiva"
                variant="outlined"
                sx={{
                  borderColor: "#9c27b0",
                  color: "#9c27b0",
                  "& .MuiChip-icon": { color: "#9c27b0" },
                }}
              />
              <Chip
                icon={<SmartToy />}
                label="Machine Learning"
                variant="outlined"
                sx={{
                  borderColor: "#9c27b0",
                  color: "#9c27b0",
                  "& .MuiChip-icon": { color: "#9c27b0" },
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
              Desenvolvendo soluções inteligentes para obter uma análise 360º de
              dados em infraestrutura hospitalar
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
}
