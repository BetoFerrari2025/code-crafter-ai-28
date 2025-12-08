import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Share2, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
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

  const shareUrl = project.share_token 
    ? `${window.location.origin}/project/${project.share_token}`
    : null;

  const handleEdit = () => {
    navigate('/editor', { state: { projectId: project.id } });
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do projeto foi copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido com sucesso",
      });
      onDelete();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o projeto",
        variant: "destructive",
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div 
          className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
          onClick={handleEdit}
        >
          {project.thumbnail ? (
            <img 
              src={project.thumbnail} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl font-bold text-muted-foreground/20">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {project.is_published && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
            >
              Publicado
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0" onClick={handleEdit}>
              <h3 className="font-semibold text-lg truncate mb-1">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Editado {timeAgo}
              </p>
            </div>

            <Button 
              variant="default" 
              size="sm"
              onClick={handleEdit}
              className="shrink-0"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
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