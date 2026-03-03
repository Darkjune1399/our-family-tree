import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { TreePine, Leaf } from 'lucide-react';
import { buildFamilyTree, TreeNode } from '@/lib/family-tree-layout';
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

const Index = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [loading, setLoading] = useState(true);
  const [trees, setTrees] = useState<TreeNode[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [membersRes, marriagesRes] = await Promise.all([
        supabase.from('family_members').select('*'),
        supabase.from('marriages').select('*'),
      ]);
      const m = membersRes.data || [];
      const mar = marriagesRes.data || [];
      setMembers(m);
      setMarriages(mar);
      if (m.length > 0) {
        setTrees(buildFamilyTree(m, mar));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Leaf className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <TreePine className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">
          Pohon Silsilah Keluarga
        </h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Belum ada anggota keluarga. Masuk dan mulai tambahkan anggota pertama untuk membangun pohon silsilah keluarga Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Pohon Silsilah</h1>
          <p className="text-xs text-muted-foreground">{members.length} anggota • Scroll untuk zoom, drag untuk geser</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FamilyTreeCanvas trees={trees} />
      </div>
    </div>
  );
};

export default Index;
