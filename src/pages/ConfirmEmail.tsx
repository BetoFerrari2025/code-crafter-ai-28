import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="bg-card p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Mail className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-3">
          {t("confirmEmail.title")}
        </h1>

        <p className="text-muted-foreground mb-6">
          {t("confirmEmail.description")}
        </p>

        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground font-medium mb-1">
            {t("confirmEmail.step1")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("confirmEmail.step2")}
          </p>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          {t("confirmEmail.spam")}
        </p>

        <button
          onClick={() => navigate("/auth")}
          className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:opacity-90 transition"
        >
          <ArrowLeft size={16} />
          {t("confirmEmail.backToLogin")}
        </button>
      </div>
    </div>
  );
}
