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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        setMessage("✅ Login realizado com sucesso!")
        navigate("/") // redireciona para home
      } else {
        // 🆕 CADASTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        setMessage("✅ Conta criada com sucesso! Verifique seu e-mail.")
        navigate("/") // redireciona para home
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md w-96">
        <h1 className="text-xl font-semibold text-center mb-4">
          {isLogin ? "Entrar na sua conta" : "Criar uma conta"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg px-3 py-2"
            required
          />

          <button
            type="submit"
            className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 font-medium"
          >
            {isLogin ? "Criar" : "Entrar"}
          </button>
        </p>

        {message && <p className="text-center mt-3 text-gray-700">{message}</p>}
      </div>
    </div>
  )
}

