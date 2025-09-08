"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EquipamentoIndisponivel {
  id: number;
  equipamento: string | null;
  tag: string | null;
  setor: string | null;
  data_chamado: string | null;
  responsavel: string | null;
  causa: string | null;
  prioridade: string | null;
  os: string | null;
  empresa: string | null;
}

interface EquipamentosIndisponiveisModalProps {
  open: boolean;
  onClose: () => void;
  equipamentos: EquipamentoIndisponivel[];
}

export default function EquipamentosIndisponiveisModal({
  open,
  onClose,
  equipamentos,
}: EquipamentosIndisponiveisModalProps) {
  const formatTempoParado = (dataChamado: string) => {
    const now = new Date();
    const chamadoDate = new Date(dataChamado);
    const horasParado = differenceInHours(now, chamadoDate);
    const diasParado = differenceInDays(now, chamadoDate);

    if (diasParado > 0) {
      return `${diasParado}d ${horasParado % 24}h`;
    }
    return `${horasParado}h`;
  };

  const getPrioridadeColor = (prioridade: string | null) => {
    switch (prioridade?.toUpperCase()) {
      case "ALTA":
        return "#f44336";
      case "MEDIA":
      case "MÉDIA":
        return "#ff9800";
      case "BAIXA":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  const getPrioridadeLabel = (prioridade: string | null) => {
    return prioridade?.toUpperCase() || "NÃO DEFINIDA";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
          color: "white",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}
          >
            <WarningIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Equipamentos com Manutenção Corretiva Ativas
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {equipamentos.length}{" "}
              {equipamentos.length === 1
                ? "equipamento aguardando"
                : "equipamentos aguardando"}{" "}
              reparo
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "white",
            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#f8f9fa" }}>
        {equipamentos.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={6}
          >
            <Avatar sx={{ bgcolor: "#4caf50", width: 80, height: 80, mb: 2 }}>
              <BuildIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Todos os equipamentos estão operacionais!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Nenhum equipamento com manutenção corretiva em andamento no
              momento.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {equipamentos.map((equipamento) => (
              <Card
                key={equipamento.id}
                elevation={2}
                sx={{
                  borderRadius: 2,
                  border: `2px solid ${getPrioridadeColor(
                    equipamento.prioridade
                  )}`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{
                          bgcolor: getPrioridadeColor(equipamento.prioridade),
                          width: 40,
                          height: 40,
                        }}
                      >
                        <BuildIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {equipamento.equipamento ||
                            "Equipamento não identificado"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          TAG: {equipamento.tag || "Não informada"}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={getPrioridadeLabel(equipamento.prioridade)}
                      size="small"
                      sx={{
                        bgcolor: getPrioridadeColor(equipamento.prioridade),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" flexWrap="wrap" gap={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon sx={{ color: "#ff9800", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Tempo Parado
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {equipamento.data_chamado
                            ? formatTempoParado(equipamento.data_chamado)
                            : "Não informado"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <BusinessIcon sx={{ color: "#2196f3", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Setor
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {equipamento.setor || "Não informado"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon sx={{ color: "#4caf50", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Responsável
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {equipamento.responsavel || "Não atribuído"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <BuildIcon sx={{ color: "#9c27b0", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          OS / Causa
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {equipamento.os || "N/A"} -{" "}
                          {equipamento.causa || "Não informada"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {equipamento.data_chamado && (
                    <Box
                      mt={2}
                      p={2}
                      bgcolor="rgba(255, 152, 0, 0.1)"
                      borderRadius={1}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Chamado aberto em:{" "}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        fontWeight="medium"
                      >
                        {format(
                          new Date(equipamento.data_chamado),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          {
                            locale: ptBR,
                          }
                        )}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "#f8f9fa" }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
            },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
