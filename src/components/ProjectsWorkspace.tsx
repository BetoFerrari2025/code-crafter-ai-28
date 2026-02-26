import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProjectCard from './ProjectCard';
import { useLanguage } from '@/contexts/LanguageContext';

const ProjectsWorkspace = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [creatorFilter, setCreatorFilter] = useState('me');
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProjects([]); setLoading(false); return; }
      let query = supabase.from('projects').select('*');
      if (creatorFilter === 'me') {
        query = query.eq('user_id', user.id);
      } else {
        query = query.or(`user_id.eq.${user.id},is_published.eq.true`);
      }
      if (sortBy === 'updated') query = query.order('updated_at', { ascending: false });
      else if (sortBy === 'created') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'name') query = query.order('name', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({ title: t("projects.loadError"), description: t("projects.loadErrorDesc"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [sortBy, creatorFilter]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border p-8">
          <div className="text-center text-muted-foreground">{t("projects.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">{t("projects.workspace")}</h2>
          <Button variant="link" className="md:ml-auto">{t("projects.viewAll")}</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("projects.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">{t("projects.lastEdit")}</SelectItem>
              <SelectItem value="created">{t("projects.newest")}</SelectItem>
              <SelectItem value="name">{t("projects.nameAZ")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("projects.allCreators")}</SelectItem>
              <SelectItem value="me">{t("projects.myProjects")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchQuery ? t("projects.noResults") : t("projects.empty")}
            </p>
            <p className="text-muted-foreground text-sm">{t("projects.startCreating")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={fetchProjects} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsWorkspace;
