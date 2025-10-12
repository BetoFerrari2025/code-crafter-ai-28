import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";
import MainBuilder from "@/components/builder/MainBuilder"; // 👈 Importa o construtor que criamos

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🌐 Página inicial */}
          <Route path="/" element={<Index />} />

          {/* ✨ Página do construtor tipo Lovable */}
          <Route path="/builder" element={<MainBuilder />} />

          {/* 🧠 Editor original do seu projeto */}
          <Route path="/editor" element={<Editor />} />

          {/* 🚫 Rota de erro */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

