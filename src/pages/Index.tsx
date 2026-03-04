import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { TreePine, Leaf, Filter, Search, X } from 'lucide-react';
import { buildFamilyTree, buildSubtree, TreeNode } from '@/lib/family-tree-layout';
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas';
import { ExportPdfButton } from '@/components/tree/ExportPdfButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  // Subtree search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return members
      .filter(m => m.full_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, members]);

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

  // Handle branch filter
  useEffect(() => {
    if (selectedMemberId) return; // subtree filter takes priority
    if (selectedBranch === 'all') {
      setFilteredTrees(allTrees);
    } else {
      const branch = allTrees.find(t => t.id === selectedBranch);
      if (branch) {
        const trees = buildFamilyTree(
          members.filter(m => isMemberInTree(branch, m.id)),
          marriages
        );
        setFilteredTrees(trees);
      }
    }
  }, [selectedBranch, allTrees, members, marriages, selectedMemberId]);

  // Handle subtree filter
  useEffect(() => {
    if (!selectedMemberId) return;
    const subtree = buildSubtree(members, marriages, selectedMemberId);
    setFilteredTrees(subtree);
  }, [selectedMemberId, members, marriages]);

  const handleSelectMember = (member: FamilyMember) => {
    setSelectedMemberId(member.id);
    setSelectedMemberName(member.full_name);
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedBranch('all');
  };

  const handleShowAll = () => {
    setSelectedMemberId(null);
    setSelectedMemberName('');
    setSearchQuery('');
    setShowSuggestions(false);
    setFilteredTrees(allTrees);
    setSelectedBranch('all');
  };

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
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-foreground">Pohon Silsilah</h1>
          <p className="text-xs text-muted-foreground">
            {selectedMemberId
              ? `Menampilkan silsilah ${selectedMemberName}`
              : `${members.length} anggota • Scroll untuk zoom, drag untuk geser`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subtree search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-[200px] h-8 text-xs pl-8"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-[250px] bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map(member => (
                  <button
                    key={member.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectMember(member)}
                  >
                    <span className="font-medium text-foreground">{member.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.gender === 'male' ? '♂' : '♀'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Show all button when filtered */}
          {selectedMemberId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="h-8 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Tampilkan Semua
            </Button>
          )}

          {/* Branch filter - only show when not in subtree mode */}
          {!selectedMemberId && allTrees.length > 1 && (
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
