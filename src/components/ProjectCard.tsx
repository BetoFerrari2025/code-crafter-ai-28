import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Share2, Trash2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import ProjectThumbnailPreview from './ProjectThumbnailPreview';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    code: string | null;
    is_published: boolean;
    share_token: string | null;
    updated_at: string;
  };
  onDelete: () => void;
}

const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { t, language } = useLanguage();

  const shareUrl = project.share_token ? `${window.location.origin}/project/${project.share_token}` : null;

  const handleEdit = () => { navigate('/editor', { state: { projectId: project.id } }); };

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: t("projects.linkCopied"), description: t("projects.linkCopiedDesc") });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: t("projects.copyError"), description: t("projects.copyErrorDesc"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      toast({ title: t("projects.deleted"), description: t("projects.deletedDesc") });
      onDelete();
    } catch (error) {
      toast({ title: t("projects.deleteError"), description: t("projects.deleteErrorDesc"), variant: "destructive" });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: language === "pt" ? ptBR : enUS,
  });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden" onClick={handleEdit}>
          <ProjectThumbnailPreview code={project.code} projectName={project.name} />
          {project.is_published && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm z-10">
              {t("projects.published")}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0" onClick={handleEdit}>
              <h3 className="font-semibold text-lg truncate mb-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{t("projects.edited")} {timeAgo}</p>
            </div>
            <Button variant="default" size="sm" onClick={handleEdit} className="shrink-0">
              <Edit className="w-4 h-4 mr-1" />
              {t("projects.edit")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t("projects.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  {copied ? (<><Check className="w-4 h-4 mr-2" />{t("projects.copied")}</>) : (<><Share2 className="w-4 h-4 mr-2" />{t("projects.share")}</>)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("projects.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
