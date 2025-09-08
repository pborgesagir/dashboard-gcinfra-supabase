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
  Build,
  Engineering,
  Construction,
  Architecture,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function BuildingPage() {
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
                background: "linear-gradient(45deg, #ff9800 30%, #ff5722 90%)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
                opacity: 0.1,
              }}
            />

            <Box sx={{ mb: 4 }}>
              <Build
                sx={{
                  fontSize: { xs: 80, md: 120 },
                  color: "#ff9800",
                  filter: "drop-shadow(0 4px 8px rgba(255, 152, 0, 0.3))",
                }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                mb: 2,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(45deg, #ff9800 30%, #ff5722 90%)",
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
              Engenharia Predial
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
              Módulo dedicado ao gerenciamento e manutenção da infraestrutura 
              predial hospitalar, incluindo sistemas elétricos, hidráulicos, 
              climatização e estruturas físicas.
            </Typography>

            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Chip
                icon={<Engineering />}
                label="Manutenção Preventiva"
                variant="outlined"
                sx={{
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  "& .MuiChip-icon": { color: "#ff9800" },
                }}
              />
              <Chip
                icon={<Construction />}
                label="Infraestrutura"
                variant="outlined"
                sx={{
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  "& .MuiChip-icon": { color: "#ff9800" },
                }}
              />
              <Chip
                icon={<Architecture />}
                label="Gestão Predial"
                variant="outlined"
                sx={{
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  "& .MuiChip-icon": { color: "#ff9800" },
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
              Desenvolvendo ferramentas especializadas para engenharia predial
              em ambiente hospitalar
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
}