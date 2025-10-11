import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectCard from './ProjectCard';

const ProjectsWorkspace = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Apply sorting
      if (sortBy === 'updated') {
        query = query.order('updated_at', { ascending: false });
      } else if (sortBy === 'created') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'name') {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar seus projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [sortBy]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border p-8">
          <div className="text-center text-muted-foreground">
            Carregando projetos...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">
            Espaço de trabalho do Cursos Criey
          </h2>
          <Button variant="link" className="md:ml-auto">
            Ver tudo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Última edição</SelectItem>
              <SelectItem value="created">Mais recentes primeiro</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os criadores</SelectItem>
              <SelectItem value="me">Apenas meus projetos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchQuery 
                ? "Nenhum projeto encontrado com esse nome" 
                : "Você ainda não tem projetos"}
            </p>
            <p className="text-muted-foreground text-sm">
              Comece criando seu primeiro projeto acima
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={fetchProjects}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsWorkspace;