import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import TrackingScripts from "@/components/TrackingScripts"

type AuthMode = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
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
              display_name: displayName || undefined,
              phone: phone || undefined,
              locale: userLocale,
            }
          }
        })
        if (error) throw error
        if (data.session) {
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'CompleteRegistration');
          }
          setMessage(t("auth.accountCreated"))
          toast({ title: t("auth.accountDone"), description: t("auth.redirecting") });
          setTimeout(() => navigate(redirectTo), 100)
        } else {
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'CompleteRegistration');
          }
          toast({ title: t("auth.accountDone"), description: t("auth.redirecting") });
          setTimeout(() => navigate(redirectTo), 100)
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
    <div className="flex items-center justify-center min-h-screen bg-background px-4 relative">
      <TrackingScripts />
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5515997109182"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#1da851] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        title="Suporte via WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

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
            <input type="text" placeholder={t("auth.namePlaceholder")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="border border-border rounded-lg px-3 py-2 bg-background text-foreground" disabled={isLoading} />
          )}

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
