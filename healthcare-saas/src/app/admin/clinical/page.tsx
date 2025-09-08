"use client";

import {
  Box,
  Typography,
  Container,
  Paper,
  Fade,
  Chip,
} from "@mui/material";
import {
  MedicalServices,
  Biotech,
  HealthAndSafety,
  LocalHospital,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function AdminClinicalPage() {
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
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 200,
                height: 200,
                background: "linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
                opacity: 0.1,
              }}
            />

            <Box sx={{ mb: 4 }}>
              <MedicalServices
                sx={{
                  fontSize: { xs: 80, md: 120 },
                  color: "#4caf50",
                  filter: "drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))",
                }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                mb: 2,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              COMING SOON
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#555",
                mb: 4,
                fontWeight: 300,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Engenharia Clínica - Admin
            </Typography>

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
              Painel administrativo centralizado para supervisão de engenharia 
              clínica em múltiplas unidades, controle de inventário, 
              certificações e compliance regulatório.
            </Typography>

            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Chip
                icon={<Biotech />}
                label="Controle Multi-unidade"
                variant="outlined"
                sx={{
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  "& .MuiChip-icon": { color: "#4caf50" },
                }}
              />
              <Chip
                icon={<HealthAndSafety />}
                label="Compliance Central"
                variant="outlined"
                sx={{
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  "& .MuiChip-icon": { color: "#4caf50" },
                }}
              />
              <Chip
                icon={<LocalHospital />}
                label="Supervisão Geral"
                variant="outlined"
                sx={{
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  "& .MuiChip-icon": { color: "#4caf50" },
                }}
              />
            </Box>
          </Paper>

          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography
              variant="body2"
              sx={{
                color: "#888",
                fontSize: "0.9rem",
                fontStyle: "italic",
              }}
            >
              Centralizando o controle de engenharia clínica em múltiplas 
              infraestruturas hospitalares
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
}