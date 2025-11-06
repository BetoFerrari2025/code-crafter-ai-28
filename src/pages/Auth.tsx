import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"

const authSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, { message: "Número de celular inválido" }).optional().or(z.literal("")),
});

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  // 🧠 Verifica se o usuário já está logado
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        // 👇 Se já estiver logado, redireciona para a home
        navigate("/")
      }
    }

    checkUser()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    try {
      // Validação dos campos
      const validationResult = authSchema.safeParse({ 
        email, 
        password, 
        phone: isLogin ? "" : phone 
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

      if (isLogin) {
        // 🔐 LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Aguardar a sessão ser estabelecida
        if (data.session) {
          setMessage("✅ Login realizado com sucesso!")
          setTimeout(() => navigate("/"), 100)
        }
      } else {
        // 🆕 CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              phone: phone || undefined,
            }
          }
        })
        if (error) throw error

        // Aguardar a sessão ser estabelecida
        if (data.session) {
          setMessage("✅ Conta criada com sucesso!")
          setTimeout(() => navigate("/"), 100)
        } else {
          setMessage("✅ Conta criada! Faça login para continuar.")
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="bg-card p-6 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-xl font-semibold text-center mb-4 text-foreground">
          {isLogin ? "Entrar na sua conta" : "Criar uma conta"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            required
          />
          
          {!isLogin && (
            <input
              type="tel"
              placeholder="Número de Celular (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 pr-10 bg-background text-foreground w-full"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 transition"
          >
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-foreground">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium"
            type="button"
          >
            {isLogin ? "Criar" : "Entrar"}
          </button>
        </p>

        {message && <p className="text-center mt-3 text-foreground">{message}</p>}
      </div>
    </div>
  )
}
