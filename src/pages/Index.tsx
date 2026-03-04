import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { TreePine, Leaf, Filter } from 'lucide-react';
import { buildFamilyTree, TreeNode } from '@/lib/family-tree-layout';
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas';
import { ExportPdfButton } from '@/components/tree/ExportPdfButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

const Index = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTrees, setAllTrees] = useState<TreeNode[]>([]);
  const [filteredTrees, setFilteredTrees] = useState<TreeNode[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const focusMemberId = searchParams.get('focus');

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
        const trees = buildFamilyTree(m, mar);
        setAllTrees(trees);
        setFilteredTrees(trees);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBranch === 'all') {
      setFilteredTrees(allTrees);
    } else {
      const branch = allTrees.find(t => t.id === selectedBranch);
      if (branch) {
        // Re-layout single branch from x=0
        const trees = buildFamilyTree(
          members.filter(m => isMemberInTree(branch, m.id)),
          marriages
        );
        setFilteredTrees(trees);
      }
    }
  }, [selectedBranch, allTrees, members, marriages]);

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
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Pohon Silsilah</h1>
          <p className="text-xs text-muted-foreground">{members.length} anggota • Scroll untuk zoom, drag untuk geser</p>
        </div>
        <div className="flex items-center gap-2">
          {allTrees.length > 1 && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Semua cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua cabang</SelectItem>
                {allTrees.map(tree => (
                  <SelectItem key={tree.id} value={tree.id}>
                    {tree.member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ExportPdfButton members={members} marriages={marriages} trees={filteredTrees} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FamilyTreeCanvas trees={filteredTrees} focusMemberId={focusMemberId} />
      </div>
    </div>
  );
};

function isMemberInTree(node: TreeNode, memberId: string): boolean {
  if (node.id === memberId) return true;
  if (node.spouses.some(s => s.member.id === memberId)) return true;
  return node.children.some(c => isMemberInTree(c, memberId));
}

export default Index;
