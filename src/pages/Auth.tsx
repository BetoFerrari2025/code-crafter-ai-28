import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"

const authSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, { message: "Número de celular inválido" }).optional().or(z.literal("")),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }),
});

type AuthMode = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<AuthMode>("login")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const redirectTo = searchParams.get("redirect") || "/"

  // 🧠 Verifica se o usuário já está logado
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        navigate(redirectTo)
      }
    }

    checkUser()
  }, [navigate, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsLoading(true)

    try {
      if (mode === "forgot-password") {
        // Validação do email
        const validationResult = emailSchema.safeParse({ email });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast({
            title: "Erro de validação",
            description: firstError.message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });

        if (error) throw error;

        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setMessage("✅ E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        return;
      }

      // Validação dos campos para login/signup
      const validationResult = authSchema.safeParse({ 
        email, 
        password, 
        phone: mode === "login" ? "" : phone 
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      if (mode === "login") {
        // 🔐 LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Aguardar a sessão ser estabelecida
        if (data.session) {
          setMessage("✅ Login realizado com sucesso!")
          toast({
            title: "Login realizado!",
            description: "Redirecionando...",
          });
          setTimeout(() => navigate(redirectTo), 100)
        }
      } else {
        // 🆕 CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: {
              phone: phone || undefined,
            }
          }
        })
        if (error) throw error

        // Aguardar a sessão ser estabelecida
        if (data.session) {
          setMessage("✅ Conta criada com sucesso!")
          toast({
            title: "Conta criada!",
            description: "Redirecionando...",
          });
          setTimeout(() => navigate(redirectTo), 100)
        } else {
          setMessage("✅ Conta criada! Faça login para continuar.")
          setMode("login")
        }
      }
    } catch (err: any) {
      const errorMessage = err.message === "Invalid login credentials" 
        ? "E-mail ou senha incorretos" 
        : err.message;
      setMessage(`❌ ${errorMessage}`)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "login": return "Entrar na sua conta"
      case "signup": return "Criar uma conta"
      case "forgot-password": return "Recuperar senha"
    }
  }

  const getButtonText = () => {
    if (isLoading) return "Aguarde..."
    switch (mode) {
      case "login": return "Entrar"
      case "signup": return "Cadastrar"
      case "forgot-password": return "Enviar e-mail"
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="bg-card p-6 rounded-2xl shadow-md w-full max-w-md">
        {mode === "forgot-password" && (
          <button
            onClick={() => setMode("login")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
            type="button"
          >
            <ArrowLeft size={16} />
            Voltar ao login
          </button>
        )}

        <h1 className="text-xl font-semibold text-center mb-4 text-foreground">
          {getTitle()}
        </h1>

        {mode === "forgot-password" && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            required
            disabled={isLoading}
          />
          
          {mode === "signup" && (
            <input
              type="tel"
              placeholder="Número de Celular (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              disabled={isLoading}
            />
          )}

          {mode !== "forgot-password" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 pr-10 bg-background text-foreground w-full"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot-password")}
              className="text-sm text-primary hover:underline text-left"
            >
              Esqueci minha senha
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {getButtonText()}
          </button>
        </form>

        {mode !== "forgot-password" && (
          <p className="text-sm text-center mt-4 text-foreground">
            {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium"
              type="button"
              disabled={isLoading}
            >
              {mode === "login" ? "Criar" : "Entrar"}
            </button>
          </p>
        )}

        {message && <p className="text-center mt-3 text-foreground">{message}</p>}
      </div>
    </div>
  )
}