import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
            emailRedirectTo: `${window.location.origin}/`
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
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            required
          />

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
