"use client";

import {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from "@mui/material";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

// 1. Interface para tipar os dados do convite
interface Invitation {
  id: string;
  email: string;
  role: "admin" | "manager";
  company_id: string;
  expires_at: string;
  status: "pending" | "accepted" | "expired";
  companies: {
    name: string;
    acronym: string;
  } | null;
}

export default function CompleteInvitationPage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // 2. Função otimizada com useCallback
  const validateToken = useCallback(async () => {
    if (!token) return;

    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select(
          `
          *,
          companies:company_id (
            name,
            acronym
          )
        `
        )
        .eq("token", token)
        .eq("status", "pending")
        .single<Invitation>();

      if (error || !data) {
        setError("Convite inválido ou expirado");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Convite expirado");
        return;
      }

      setInvitation(data);
    } catch (err) {
      console.error("Erro ao validar token:", err);
      setError("Erro ao validar convite");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 3. useEffect com dependência correta
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError("Token de convite não fornecido");
      setLoading(false);
    }
  }, [token, validateToken]);

  // 5. Função única para manipular inputs do formulário
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      setError("Informações do convite não carregadas.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: invitation.role,
            company_id: invitation.company_id,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: invitation.email,
            full_name: formData.fullName,
            role: invitation.role,
            company_id: invitation.company_id,
            is_active: true,
          })
          .throwOnError();

        await supabase
          .from("user_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", invitation.id)
          .throwOnError();

        setSuccess(true);

        setTimeout(() => {
          router.push("/auth/login?message=Cadastro completado com sucesso!");
        }, 3000);
      }
      // 4. Tratamento de erro mais seguro
    } catch (err: unknown) {
      console.error("Erro ao completar cadastro:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // O JSX abaixo permanece o mesmo, mas agora aplicamos o `handleChange`
  // ...

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !invitation) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Card>
            <CardContent>
              <Alert severity="error">{error}</Alert>
              <Box mt={2}>
                <Button
                  variant="contained"
                  onClick={() => router.push("/auth/login")}
                  fullWidth
                >
                  Ir para Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 2 }}>
                  Cadastro completado com sucesso!
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Você será redirecionado para a página de login...
                </Typography>
                <CircularProgress size={24} sx={{ mt: 2 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={4}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Image
            src="/logodaagir.png"
            alt="360° - GCINFRA Logo"
            width={120}
            height={120}
            style={{ objectFit: "contain" }}
          />
          <Typography variant="h3" fontWeight="bold" color="primary.main">
            360° - GCINFRA
          </Typography>
        </Box>

        {invitation && (
          <Card sx={{ width: "100%", maxWidth: 500 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" align="center" gutterBottom>
                Completar Cadastro
              </Typography>

              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Complete seu cadastro para acessar o sistema
              </Typography>

              <Box sx={{ mb: 3, p: 2, bgcolor: "#f8f9fa", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {invitation.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Perfil:</strong>{" "}
                  {invitation.role === "admin" ? "Administrador" : "Gerente"}
                </Typography>
                {invitation.companies && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Empresa:</strong> {invitation.companies.name}
                  </Typography>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  name="fullName" // Adicionado para o handleChange
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  name="password" // Adicionado para o handleChange
                  value={formData.password}
                  onChange={handleChange}
                  required
                  helperText="Mínimo 6 caracteres"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Confirmar Senha"
                  type="password"
                  name="confirmPassword" // Adicionado para o handleChange
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{ mb: 2 }}
                >
                  {submitting ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Processando...</span>
                    </Box>
                  ) : (
                    "Completar Cadastro"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}
