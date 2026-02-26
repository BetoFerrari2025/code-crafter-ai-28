import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"

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
  const { t, language } = useLanguage()
  
  const redirectTo = searchParams.get("redirect") || "/"

  const authSchema = z.object({
    email: z.string().trim().email({ message: t("auth.invalidEmail") }).max(255, { message: t("auth.emailTooLong") }),
    password: z.string().min(6, { message: t("auth.passwordMin") }).max(100, { message: t("auth.passwordTooLong") }),
    phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, { message: t("auth.invalidPhone") }).optional().or(z.literal("")),
  });

  const emailSchema = z.object({
    email: z.string().trim().email({ message: t("auth.invalidEmail") }).max(255, { message: t("auth.emailTooLong") }),
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) navigate(redirectTo)
    }
    checkUser()
  }, [navigate, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsLoading(true)

    try {
      if (mode === "forgot-password") {
        const validationResult = emailSchema.safeParse({ email });
        if (!validationResult.success) {
          toast({ title: t("auth.validationError"), description: validationResult.error.errors[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast({ title: t("auth.emailSent"), description: t("auth.checkInbox") });
        setMessage(t("auth.recoverySent"));
        return;
      }

      const validationResult = authSchema.safeParse({ email, password, phone: mode === "login" ? "" : phone });
      if (!validationResult.success) {
        toast({ title: t("auth.validationError"), description: validationResult.error.errors[0].message, variant: "destructive" });
        return;
      }

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) {
          setMessage(t("auth.loginSuccess"))
          toast({ title: t("auth.loginDone"), description: t("auth.redirecting") });
          setTimeout(() => navigate(redirectTo), 100)
        }
      } else {
        // Store user's locale for country detection
        const userLocale = navigator.language || "en-US";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: {
              phone: phone || undefined,
              locale: userLocale,
            }
          }
        })
        if (error) throw error
        if (data.session) {
          setMessage(t("auth.accountCreated"))
          toast({ title: t("auth.accountDone"), description: t("auth.redirecting") });
          setTimeout(() => navigate(redirectTo), 100)
        } else {
          setMessage(t("auth.accountCreatedLogin"))
          setMode("login")
        }
      }
    } catch (err: any) {
      const errorMessage = err.message === "Invalid login credentials" 
        ? t("auth.invalidCredentials") 
        : err.message;
      setMessage(`❌ ${errorMessage}`)
      toast({ title: t("common.error"), description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "login": return t("auth.loginTitle")
      case "signup": return t("auth.signupTitle")
      case "forgot-password": return t("auth.forgotTitle")
    }
  }

  const getButtonText = () => {
    if (isLoading) return t("auth.loading")
    switch (mode) {
      case "login": return t("auth.login")
      case "signup": return t("auth.signup")
      case "forgot-password": return t("auth.sendEmail")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="bg-card p-6 rounded-2xl shadow-md w-full max-w-md">
        {mode === "forgot-password" && (
          <button onClick={() => setMode("login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition" type="button">
            <ArrowLeft size={16} />
            {t("auth.backToLogin")}
          </button>
        )}

        <h1 className="text-xl font-semibold text-center mb-4 text-foreground">{getTitle()}</h1>

        {mode === "forgot-password" && (
          <p className="text-sm text-muted-foreground text-center mb-4">{t("auth.forgotDesc")}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="border border-border rounded-lg px-3 py-2 bg-background text-foreground" required disabled={isLoading} />
          
          {mode === "signup" && (
            <input type="tel" placeholder={t("auth.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-border rounded-lg px-3 py-2 bg-background text-foreground" disabled={isLoading} />
          )}

          {mode !== "forgot-password" && (
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="border border-border rounded-lg px-3 py-2 pr-10 bg-background text-foreground w-full" required disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition" disabled={isLoading}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot-password")} className="text-sm text-primary hover:underline text-left">
              {t("auth.forgotPassword")}
            </button>
          )}

          <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50">
            {getButtonText()}
          </button>
        </form>

        {mode !== "forgot-password" && (
          <p className="text-sm text-center mt-4 text-foreground">
            {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-medium" type="button" disabled={isLoading}>
              {mode === "login" ? t("auth.create") : t("auth.enter")}
            </button>
          </p>
        )}

        {message && <p className="text-center mt-3 text-foreground">{message}</p>}
      </div>
    </div>
  )
}
