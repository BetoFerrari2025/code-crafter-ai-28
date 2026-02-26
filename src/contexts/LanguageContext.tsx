import { createContext, useContext, useState, ReactNode } from "react";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Hero / Index
  "hero.title": { pt: "Crie algo...", en: "Create something..." },
  "hero.brand": { pt: "Criey", en: "Criey" },
  "hero.placeholder": { pt: "Solicite a criação do seu projeto em poucos cliques...", en: "Describe your project and create it in a few clicks..." },
  "hero.start": { pt: "Começar", en: "Start" },
  "hero.typing1": { pt: "Solicite à Criey a criação de um protótipo do seu projeto em poucos cliques.", en: "Ask Criey to create a prototype of your project in just a few clicks." },
  "hero.typing2": { pt: "Transforme suas ideias em interfaces completas em segundos.", en: "Transform your ideas into complete interfaces in seconds." },
  "hero.typing3": { pt: "Deixe a Criey construir o design perfeito para você.", en: "Let Criey build the perfect design for you." },
  "hero.downloadApp": { pt: "Baixar App para Celular", en: "Download Mobile App" },
  "hero.downloadToast": { pt: "Baixar App", en: "Download App" },
  "hero.downloadDesc": { pt: "Para instalar o app, abra o menu do navegador e selecione 'Adicionar à tela inicial'", en: "To install the app, open the browser menu and select 'Add to Home Screen'" },
  "hero.public": { pt: "Público", en: "Public" },
  "hero.emptyPrompt": { pt: "Digite algo primeiro", en: "Type something first" },
  "hero.emptyPromptDesc": { pt: "Descreva o que você quer criar para começar", en: "Describe what you want to create to get started" },

  // Nav
  "nav.community": { pt: "Comunidade", en: "Community" },
  "nav.pricing": { pt: "Preços", en: "Pricing" },
  "nav.gallery": { pt: "Galeria", en: "Gallery" },
  "nav.learn": { pt: "Aprender", en: "Learn" },
  "nav.marketplace": { pt: "Marketplace", en: "Marketplace" },
  "nav.login": { pt: "Login", en: "Login" },
  "nav.signup": { pt: "Cadastro", en: "Sign Up" },

  // Pricing
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

  // Features
  "feature.ai": { pt: "IA Generativa", en: "Generative AI" },
  "feature.aiDesc": { pt: "Crie interfaces completas apenas descrevendo", en: "Create complete interfaces just by describing" },
  "feature.deploy": { pt: "Deploy Instantâneo", en: "Instant Deploy" },
  "feature.deployDesc": { pt: "Publique seu app com um clique", en: "Publish your app with one click" },
  "feature.backend": { pt: "Backend Integrado", en: "Integrated Backend" },
  "feature.backendDesc": { pt: "Banco de dados e APIs prontos para usar", en: "Database and APIs ready to use" },

  // Header
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
  "header.logoutSuccess": { pt: "Logout realizado", en: "Logged out" },
  "header.logoutDesc": { pt: "Você saiu da sua conta com sucesso.", en: "You have been signed out successfully." },
  "header.logoutError": { pt: "Erro ao sair", en: "Error signing out" },
  "header.user": { pt: "Usuário", en: "User" },

  // Admin
  "admin.title": { pt: "Gerenciar Usuários", en: "Manage Users" },
  "admin.users": { pt: "Usuários", en: "Users" },
  "admin.stats": { pt: "Estatísticas", en: "Statistics" },
  "admin.credits": { pt: "Créditos", en: "Credits" },
  "admin.online": { pt: "Tempo Real", en: "Real-time" },
  "admin.manageUsers": { pt: "Gerenciar Usuários", en: "Manage Users" },
  "admin.planStats": { pt: "Estatísticas de Planos", en: "Plan Statistics" },
  "admin.manageCredits": { pt: "Gerenciar Créditos", en: "Manage Credits" },
  "admin.onlineUsers": { pt: "Usuários Online", en: "Online Users" },
  "admin.panel": { pt: "Painel Admin", en: "Admin Panel" },
  "admin.searchPlaceholder": { pt: "Buscar por nome ou email...", en: "Search by name or email..." },
  "admin.usersCount": { pt: "usuários", en: "users" },
  "admin.loading": { pt: "Carregando...", en: "Loading..." },
  "admin.name": { pt: "Nome", en: "Name" },
  "admin.email": { pt: "Email", en: "Email" },
  "admin.status": { pt: "Status", en: "Status" },
  "admin.plan": { pt: "Plano", en: "Plan" },
  "admin.creditsToday": { pt: "Créditos Hoje", en: "Credits Today" },
  "admin.country": { pt: "País", en: "Country" },
  "admin.registered": { pt: "Cadastro", en: "Registered" },
  "admin.actions": { pt: "Ações", en: "Actions" },
  "admin.blocked": { pt: "Bloqueado", en: "Blocked" },
  "admin.active": { pt: "Ativo", en: "Active" },
  "admin.details": { pt: "Detalhes do Usuário", en: "User Details" },
  "admin.phone": { pt: "Celular", en: "Phone" },
  "admin.notProvided": { pt: "Não informado", en: "Not provided" },
  "admin.lastLogin": { pt: "Último login", en: "Last login" },
  "admin.never": { pt: "Nunca", en: "Never" },
  "admin.roles": { pt: "Roles", en: "Roles" },
  "admin.none": { pt: "Nenhuma", en: "None" },
  "admin.changePlan": { pt: "Alterar Plano", en: "Change Plan" },
  "admin.user": { pt: "Usuário", en: "User" },
  "admin.confirm": { pt: "Confirmar", en: "Confirm" },
  "admin.cancel": { pt: "Cancelar", en: "Cancel" },
  "admin.addCredits": { pt: "Adicionar Créditos", en: "Add Credits" },
  "admin.currentCredits": { pt: "Créditos atuais", en: "Current credits" },
  "admin.creditsAmount": { pt: "Quantidade de créditos", en: "Credits amount" },
  "admin.add": { pt: "Adicionar", en: "Add" },
  "admin.deleteUser": { pt: "Excluir usuário", en: "Delete user" },
  "admin.blockUser": { pt: "Bloquear usuário", en: "Block user" },
  "admin.deleteConfirm": { pt: "Tem certeza que deseja excluir o usuário", en: "Are you sure you want to delete the user" },
  "admin.deleteWarning": { pt: "Esta ação não pode ser desfeita.", en: "This action cannot be undone." },
  "admin.blockConfirm": { pt: "Tem certeza que deseja bloquear o usuário", en: "Are you sure you want to block the user" },
  "admin.delete": { pt: "Excluir", en: "Delete" },
  "admin.block": { pt: "Bloquear", en: "Block" },
  "admin.unblock": { pt: "Desbloquear", en: "Unblock" },
  "admin.success": { pt: "Sucesso", en: "Success" },
  "admin.error": { pt: "Erro", en: "Error" },
  "admin.actionExecuted": { pt: "Ação executada.", en: "Action executed." },
  "admin.totalUsers": { pt: "Total de Usuários", en: "Total Users" },
  "admin.freePlan": { pt: "Plano Gratuito", en: "Free Plan" },
  "admin.startPlan": { pt: "Plano Start", en: "Start Plan" },
  "admin.proPlan": { pt: "Plano Pró", en: "Pro Plan" },
  "admin.premiumPlan": { pt: "Plano Premium", en: "Premium Plan" },
  "admin.summary": { pt: "Resumo", en: "Summary" },
  "admin.paidSubscribers": { pt: "Assinantes (pagos)", en: "Paid subscribers" },
  "admin.freeUsers": { pt: "Gratuitos", en: "Free users" },
  "admin.conversionRate": { pt: "Taxa de conversão", en: "Conversion rate" },
  "admin.accessingNow": { pt: "Acessando agora", en: "Currently online" },
  "admin.connectedRealtime": { pt: "usuários conectados em tempo real", en: "users connected in real-time" },
  "admin.realtimeUpdate": { pt: "Atualizado automaticamente a cada 30 segundos via Realtime.", en: "Automatically updated every 30 seconds via Realtime." },

  // Auth
  "auth.loginTitle": { pt: "Entrar na sua conta", en: "Sign in to your account" },
  "auth.signupTitle": { pt: "Criar uma conta", en: "Create an account" },
  "auth.forgotTitle": { pt: "Recuperar senha", en: "Reset password" },
  "auth.login": { pt: "Entrar", en: "Sign In" },
  "auth.signup": { pt: "Cadastrar", en: "Sign Up" },
  "auth.sendEmail": { pt: "Enviar e-mail", en: "Send email" },
  "auth.loading": { pt: "Aguarde...", en: "Please wait..." },
  "auth.backToLogin": { pt: "Voltar ao login", en: "Back to login" },
  "auth.forgotDesc": { pt: "Digite seu e-mail e enviaremos um link para redefinir sua senha.", en: "Enter your email and we'll send you a link to reset your password." },
  "auth.emailPlaceholder": { pt: "E-mail", en: "Email" },
  "auth.phonePlaceholder": { pt: "Número de Celular (opcional)", en: "Phone number (optional)" },
  "auth.passwordPlaceholder": { pt: "Senha", en: "Password" },
  "auth.forgotPassword": { pt: "Esqueci minha senha", en: "Forgot my password" },
  "auth.noAccount": { pt: "Não tem uma conta?", en: "Don't have an account?" },
  "auth.hasAccount": { pt: "Já tem uma conta?", en: "Already have an account?" },
  "auth.create": { pt: "Criar", en: "Create" },
  "auth.enter": { pt: "Entrar", en: "Sign In" },
  "auth.emailSent": { pt: "E-mail enviado!", en: "Email sent!" },
  "auth.checkInbox": { pt: "Verifique sua caixa de entrada para redefinir sua senha.", en: "Check your inbox to reset your password." },
  "auth.recoverySent": { pt: "✅ E-mail de recuperação enviado! Verifique sua caixa de entrada.", en: "✅ Recovery email sent! Check your inbox." },
  "auth.loginSuccess": { pt: "✅ Login realizado com sucesso!", en: "✅ Login successful!" },
  "auth.loginDone": { pt: "Login realizado!", en: "Logged in!" },
  "auth.redirecting": { pt: "Redirecionando...", en: "Redirecting..." },
  "auth.accountCreated": { pt: "✅ Conta criada com sucesso!", en: "✅ Account created successfully!" },
  "auth.accountDone": { pt: "Conta criada!", en: "Account created!" },
  "auth.accountCreatedLogin": { pt: "✅ Conta criada! Faça login para continuar.", en: "✅ Account created! Sign in to continue." },
  "auth.invalidCredentials": { pt: "E-mail ou senha incorretos", en: "Invalid email or password" },
  "auth.validationError": { pt: "Erro de validação", en: "Validation error" },
  "auth.invalidEmail": { pt: "E-mail inválido", en: "Invalid email" },
  "auth.emailTooLong": { pt: "E-mail muito longo", en: "Email too long" },
  "auth.passwordMin": { pt: "Senha deve ter no mínimo 6 caracteres", en: "Password must be at least 6 characters" },
  "auth.passwordTooLong": { pt: "Senha muito longa", en: "Password too long" },
  "auth.invalidPhone": { pt: "Número de celular inválido", en: "Invalid phone number" },
  "auth.namePlaceholder": { pt: "Seu nome completo", en: "Your full name" },

  // Confirm Email
  "confirmEmail.title": { pt: "Verifique seu e-mail", en: "Check your email" },
  "confirmEmail.description": { pt: "Enviamos um e-mail de confirmação para você. Clique no botão de confirmação no e-mail para ativar sua conta.", en: "We sent you a confirmation email. Click the confirm button in the email to activate your account." },
  "confirmEmail.step1": { pt: "1. Abra seu e-mail", en: "1. Open your email" },
  "confirmEmail.step2": { pt: "2. Clique no botão \"Confirmar\" no e-mail que enviamos", en: "2. Click the \"Confirm\" button in the email we sent" },
  "confirmEmail.spam": { pt: "Não encontrou? Verifique a pasta de spam ou lixo eletrônico.", en: "Can't find it? Check your spam or junk folder." },
  "confirmEmail.backToLogin": { pt: "Voltar ao login", en: "Back to login" },

  // Dashboard
  "dashboard.title": { pt: "Dashboard", en: "Dashboard" },
  "dashboard.signOut": { pt: "Sair", en: "Sign Out" },
  "dashboard.dailyCredits": { pt: "Créditos Diários", en: "Daily Credits" },
  "dashboard.dailyCreditsDesc": { pt: "Seus créditos de geração de código restantes para hoje", en: "Your remaining code generation credits for today" },
  "dashboard.used": { pt: "usados", en: "used" },
  "dashboard.creditsReset": { pt: "Os créditos reiniciam todos os dias à meia-noite.", en: "Credits reset every day at midnight." },
  "dashboard.subscriptionStatus": { pt: "Status da Assinatura", en: "Subscription Status" },
  "dashboard.subscriptionDesc": { pt: "Detalhes da sua assinatura atual", en: "Your current subscription details" },
  "dashboard.plan": { pt: "Plano", en: "Plan" },
  "dashboard.status": { pt: "Status", en: "Status" },
  "dashboard.periodStart": { pt: "Início do Período", en: "Current Period Start" },
  "dashboard.periodEnd": { pt: "Fim do Período", en: "Current Period End" },
  "dashboard.manageSubscription": { pt: "Gerenciar Assinatura", en: "Manage Subscription" },
  "dashboard.noSubscription": { pt: "Nenhuma assinatura ativa encontrada", en: "No active subscription found" },
  "dashboard.viewPlans": { pt: "Ver Planos", en: "View Plans" },
  "dashboard.billing": { pt: "Informações de Cobrança", en: "Billing Information" },
  "dashboard.billingDesc": { pt: "Gerencie seus dados de cobrança", en: "Manage your billing details" },

  // Gallery
  "gallery.title": { pt: "Galeria de Projetos", en: "Project Gallery" },
  "gallery.subtitle": { pt: "Explore projetos incríveis criados pela nossa comunidade de desenvolvedores", en: "Explore amazing projects created by our developer community" },
  "gallery.search": { pt: "Buscar projetos...", en: "Search projects..." },
  "gallery.noResults": { pt: "Nenhum projeto encontrado com esse termo.", en: "No projects found with that term." },
  "gallery.empty": { pt: "Ainda não há projetos publicados.", en: "No published projects yet." },
  "gallery.view": { pt: "Visualizar", en: "View" },
  "gallery.published": { pt: "Publicado", en: "Published" },
  "gallery.noDescription": { pt: "Sem descrição", en: "No description" },

  // Profile
  "profile.back": { pt: "Voltar", en: "Back" },
  "profile.title": { pt: "Editar Perfil", en: "Edit Profile" },
  "profile.photo": { pt: "Foto do Perfil", en: "Profile Photo" },
  "profile.photoDesc": { pt: "Clique na foto para alterar", en: "Click the photo to change" },
  "profile.personalInfo": { pt: "Informações Pessoais", en: "Personal Information" },
  "profile.displayName": { pt: "Nome de exibição", en: "Display name" },
  "profile.namePlaceholder": { pt: "Seu nome", en: "Your name" },
  "profile.changePassword": { pt: "Alterar Senha", en: "Change Password" },
  "profile.keepPassword": { pt: "Deixe em branco para manter a senha atual", en: "Leave blank to keep current password" },
  "profile.newPassword": { pt: "Nova Senha", en: "New Password" },
  "profile.confirmPassword": { pt: "Confirmar Nova Senha", en: "Confirm New Password" },
  "profile.save": { pt: "Salvar Alterações", en: "Save Changes" },
  "profile.saved": { pt: "Perfil salvo!", en: "Profile saved!" },
  "profile.savedDesc": { pt: "Suas alterações foram salvas com sucesso.", en: "Your changes have been saved successfully." },
  "profile.saveError": { pt: "Erro ao salvar", en: "Error saving" },
  "profile.passwordMismatch": { pt: "As senhas não coincidem.", en: "Passwords don't match." },
  "profile.passwordTooShort": { pt: "A senha deve ter pelo menos 6 caracteres.", en: "Password must be at least 6 characters." },

  // Projects / Workspace
  "projects.workspace": { pt: "Espaço de trabalho do Cursos Criey", en: "Criey Courses Workspace" },
  "projects.viewAll": { pt: "Ver tudo", en: "View all" },
  "projects.search": { pt: "Pesquisar projetos...", en: "Search projects..." },
  "projects.lastEdit": { pt: "Última edição", en: "Last edited" },
  "projects.newest": { pt: "Mais recentes primeiro", en: "Newest first" },
  "projects.nameAZ": { pt: "Nome (A-Z)", en: "Name (A-Z)" },
  "projects.allCreators": { pt: "Todos os criadores", en: "All creators" },
  "projects.myProjects": { pt: "Apenas meus projetos", en: "My projects only" },
  "projects.noResults": { pt: "Nenhum projeto encontrado com esse nome", en: "No projects found with that name" },
  "projects.empty": { pt: "Você ainda não tem projetos", en: "You don't have any projects yet" },
  "projects.startCreating": { pt: "Comece criando seu primeiro projeto acima", en: "Start by creating your first project above" },
  "projects.loadError": { pt: "Erro ao carregar projetos", en: "Error loading projects" },
  "projects.loadErrorDesc": { pt: "Não foi possível carregar seus projetos", en: "Could not load your projects" },
  "projects.loading": { pt: "Carregando projetos...", en: "Loading projects..." },
  "projects.edit": { pt: "Editar", en: "Edit" },
  "projects.edited": { pt: "Editado", en: "Edited" },
  "projects.share": { pt: "Compartilhar", en: "Share" },
  "projects.delete": { pt: "Excluir", en: "Delete" },
  "projects.copied": { pt: "Copiado!", en: "Copied!" },
  "projects.linkCopied": { pt: "Link copiado!", en: "Link copied!" },
  "projects.linkCopiedDesc": { pt: "O link do projeto foi copiado para a área de transferência", en: "The project link has been copied to clipboard" },
  "projects.copyError": { pt: "Erro ao copiar link", en: "Error copying link" },
  "projects.copyErrorDesc": { pt: "Não foi possível copiar o link", en: "Could not copy the link" },
  "projects.deleted": { pt: "Projeto excluído", en: "Project deleted" },
  "projects.deletedDesc": { pt: "O projeto foi removido com sucesso", en: "The project was successfully removed" },
  "projects.deleteError": { pt: "Erro ao excluir", en: "Error deleting" },
  "projects.deleteErrorDesc": { pt: "Não foi possível excluir o projeto", en: "Could not delete the project" },
  "projects.published": { pt: "Publicado", en: "Published" },

  // Chat
  "chat.welcome": { pt: "Olá! 👋 Estou pronto para criar seu app. Me diga o que você precisa!", en: "Hello! 👋 I'm ready to create your app. Tell me what you need!" },
  "chat.placeholder": { pt: "Descreva o que você quer criar...", en: "Describe what you want to create..." },
  "chat.suggestion": { pt: "💡 Comece com uma sugestão:", en: "💡 Start with a suggestion:" },
  "chat.analyzing": { pt: "🤔 Analisando sua solicitação...", en: "🤔 Analyzing your request..." },
  "chat.codeGenerated": { pt: "✅ Código gerado com sucesso! Veja o preview ao lado.", en: "✅ Code generated successfully! See the preview." },
  "chat.codeToast": { pt: "Código gerado!", en: "Code generated!" },
  "chat.codeToastDesc": { pt: "O código foi gerado com sucesso.", en: "The code was generated successfully." },
  "chat.error": { pt: "Erro", en: "Error" },
  "chat.errorDesc": { pt: "Não foi possível gerar o código.", en: "Could not generate the code." },
  "chat.imagesLoaded": { pt: "Imagens carregadas", en: "Images loaded" },
  "chat.imagesAdded": { pt: "imagem(ns) adicionada(s)", en: "image(s) added" },
  "chat.generateFromImages": { pt: "Gere código baseado nas imagens enviadas", en: "Generate code based on uploaded images" },
  "chat.fixError": { pt: "Por favor, corrija o seguinte erro de compilação no código:", en: "Please fix the following compilation error in the code:" },
  "chat.fixCode": { pt: "Por favor, corrija o seguinte erro no código:", en: "Please fix the following error in the code:" },
  "chat.tryFix": { pt: "Tentar corrigir", en: "Try to fix" },
  "chat.shiftEnter": { pt: "Shift+Enter para nova linha • Enter para enviar", en: "Shift+Enter for new line • Enter to send" },
  "chat.sessionExpired": { pt: "Sessão expirada. Faça login novamente.", en: "Session expired. Please sign in again." },
  "chat.history": { pt: "Histórico", en: "History" },
  "chat.noHistory": { pt: "Nenhuma conversa salva", en: "No saved conversations" },
  "chat.errorOccurred": { pt: "Ocorreu um erro ao gerar o código.", en: "An error occurred while generating the code." },
  "chat.creditsExhausted": { pt: "Seus créditos diários acabaram.", en: "Your daily credits have run out." },

  // Chat suggestions
  "chat.sug1": { pt: "Loja virtual com carrinho", en: "Online store with cart" },
  "chat.sug2": { pt: "Dashboard de tarefas", en: "Task dashboard" },
  "chat.sug3": { pt: "Login com email e senha", en: "Login with email and password" },
  "chat.sug4": { pt: "Gráficos de analytics", en: "Analytics charts" },
  "chat.sug5": { pt: "Chat em tempo real", en: "Real-time chat" },
  "chat.sug6": { pt: "Melhore o design", en: "Improve the design" },

  // Credits Exhausted Alert
  "credits.exhausted": { pt: "Créditos Esgotados", en: "Credits Exhausted" },
  "credits.resetInfo": { pt: "Seus créditos diários reiniciam automaticamente todos os dias à meia-noite (00:00). Para ter mais créditos, faça upgrade do seu plano.", en: "Your daily credits reset automatically every day at midnight (00:00). For more credits, upgrade your plan." },
  "credits.viewPlans": { pt: "Ver Planos e Preços", en: "View Plans & Pricing" },
  "credits.close": { pt: "Fechar", en: "Close" },

  // Marketplace Admin
  "marketplace.title": { pt: "Marketplace", en: "Marketplace" },
  "marketplace.products": { pt: "Produtos do Marketplace", en: "Marketplace Products" },
  "marketplace.addProduct": { pt: "Adicionar Produto", en: "Add Product" },
  "marketplace.editProduct": { pt: "Editar Produto", en: "Edit Product" },
  "marketplace.edit": { pt: "Editar", en: "Edit" },
  "marketplace.delete": { pt: "Excluir", en: "Delete" },
  "marketplace.empty": { pt: "Nenhum produto cadastrado.", en: "No products registered." },
  "marketplace.image": { pt: "Imagem do Produto", en: "Product Image" },
  "marketplace.uploadImage": { pt: "Enviar Imagem", en: "Upload Image" },
  "marketplace.titleField": { pt: "Título", en: "Title" },
  "marketplace.titlePlaceholder": { pt: "Nome do produto", en: "Product name" },
  "marketplace.titleRequired": { pt: "Título é obrigatório", en: "Title is required" },
  "marketplace.description": { pt: "Descrição", en: "Description" },
  "marketplace.descriptionPlaceholder": { pt: "Descreva o produto...", en: "Describe the product..." },
  "marketplace.buttonText": { pt: "Texto do Botão", en: "Button Text" },
  "marketplace.buttonTextPlaceholder": { pt: "Ex: Comprar, Saiba Mais", en: "E.g.: Buy, Learn More" },
  "marketplace.buttonLink": { pt: "Link do Botão", en: "Button Link" },
  "marketplace.buttonColor": { pt: "Cor do Botão", en: "Button Color" },
  "marketplace.activeProduct": { pt: "Produto ativo (visível no marketplace)", en: "Active product (visible on marketplace)" },
  "marketplace.sortOrder": { pt: "Ordem de exibição", en: "Display order" },
  "marketplace.save": { pt: "Salvar", en: "Save" },
  "marketplace.saved": { pt: "Produto salvo com sucesso!", en: "Product saved successfully!" },
  "marketplace.deleted": { pt: "Produto excluído.", en: "Product deleted." },
  "marketplace.deleteConfirm": { pt: "Excluir produto?", en: "Delete product?" },
  "marketplace.deleteWarning": { pt: "Esta ação não pode ser desfeita.", en: "This action cannot be undone." },
  "marketplace.inactive": { pt: "Inativo", en: "Inactive" },

  // Common
  "common.error": { pt: "Erro", en: "Error" },
  "common.authError": { pt: "Erro de autenticação", en: "Authentication error" },
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
