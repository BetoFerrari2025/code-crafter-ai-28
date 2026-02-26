import { createContext, useContext, useState, ReactNode } from "react";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  "hero.title": { pt: "Crie algo...", en: "Create something..." },
  "hero.brand": { pt: "Criey", en: "Criey" },
  "hero.placeholder": { pt: "Solicite a criação do seu projeto em poucos cliques...", en: "Describe your project and create it in a few clicks..." },
  "hero.start": { pt: "Começar", en: "Start" },
  "nav.community": { pt: "Comunidade", en: "Community" },
  "nav.pricing": { pt: "Preços", en: "Pricing" },
  "nav.gallery": { pt: "Galeria", en: "Gallery" },
  "nav.learn": { pt: "Aprender", en: "Learn" },
  "nav.marketplace": { pt: "Marketplace", en: "Marketplace" },
  "nav.login": { pt: "Login", en: "Login" },
  "nav.signup": { pt: "Cadastro", en: "Sign Up" },
  "pricing.title": { pt: "Planos e Faturamento", en: "Plans & Billing" },
  "pricing.current": { pt: "No momento, você está no plano:", en: "You are currently on the plan:" },
  "pricing.free": { pt: "Gratuito", en: "Free" },
  "pricing.upgrade": { pt: "Atualizar", en: "Upgrade" },
  "pricing.perMonth": { pt: "por mês", en: "per month" },
  "pricing.shared": { pt: "compartilhado entre usuários ilimitados", en: "shared among unlimited users" },
  "pricing.flexBilling": { pt: "Faturamento flexível", en: "Flexible billing" },
  "pricing.customPlans": { pt: "Planos personalizados", en: "Custom plans" },
  "pricing.freePlus": { pt: "Tudo de graça, mais:", en: "Everything free, plus:" },
  "pricing.student": { pt: "Desconto para estudantes", en: "Student discount" },
  "pricing.studentDesc": { pt: "Verifique o status de estudante e tenha acesso a até 50% de desconto no Lovable Pro.", en: "Verify student status and get up to 50% off Lovable Pro." },
  "feature.ai": { pt: "IA Generativa", en: "Generative AI" },
  "feature.aiDesc": { pt: "Crie interfaces completas apenas descrevendo", en: "Create complete interfaces just by describing" },
  "feature.deploy": { pt: "Deploy Instantâneo", en: "Instant Deploy" },
  "feature.deployDesc": { pt: "Publique seu app com um clique", en: "Publish your app with one click" },
  "feature.backend": { pt: "Backend Integrado", en: "Integrated Backend" },
  "feature.backendDesc": { pt: "Banco de dados e APIs prontos para usar", en: "Database and APIs ready to use" },
  "header.settings": { pt: "Configurações", en: "Settings" },
  "header.invite": { pt: "Convidar", en: "Invite" },
  "header.help": { pt: "Centro de Ajuda", en: "Help Center" },
  "header.logout": { pt: "Sair", en: "Logout" },
  "header.goPro": { pt: "Torne-se um profissional", en: "Go Pro" },
  "header.credits": { pt: "Créditos", en: "Credits" },
  "header.remaining": { pt: "restantes", en: "remaining" },
  "header.creditsReset": { pt: "Os créditos diários são reiniciados à meia-noite UTC", en: "Daily credits reset at midnight UTC" },
  "header.darkMode": { pt: "Modo Escuro", en: "Dark Mode" },
  "header.lightMode": { pt: "Modo Claro", en: "Light Mode" },
  "admin.title": { pt: "Gerenciar Usuários", en: "Manage Users" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectLanguage = (): Language => {
  const stored = localStorage.getItem("app-language") as Language;
  if (stored) return stored;
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.startsWith("pt")) return "pt";
  return "en";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(detectLanguage);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string) => translations[key]?.[language] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
};
