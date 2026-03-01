import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import { Search, ExternalLink, Eye, Calendar, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

interface PublishedProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  share_token: string | null;
  created_at: string;
}

const Gallery = () => {
  const [projects, setProjects] = useState<PublishedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => { fetchPublishedProjects(); }, []);

  const fetchPublishedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, thumbnail, share_token, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const handleViewProject = (shareToken: string | null) => {
    if (shareToken) window.open(`/shared/${shareToken}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            {t("gallery.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("gallery.subtitle")}</p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("gallery.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? t("gallery.noResults") : t("gallery.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <span className="text-4xl font-bold text-primary/40">{project.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <Button size="sm" variant="secondary" onClick={() => handleViewProject(project.share_token)} disabled={!project.share_token}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t("gallery.view")}
                    </Button>
                    <Button size="sm" variant="outline" className="bg-background/20 border-white/30 text-white hover:bg-background/40" onClick={() => { if (project.share_token) window.open(`${window.location.origin}/shared/${project.share_token}`, "_blank"); }} disabled={!project.share_token}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                    <Badge variant="secondary" className="shrink-0">{t("gallery.published")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description || t("gallery.noDescription")}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(project.created_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <WhatsAppFloatingButton />
    </div>
  );
};

export default Gallery;
