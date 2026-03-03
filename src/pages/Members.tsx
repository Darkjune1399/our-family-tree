import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';
import { MemberFilters } from '@/components/members/MemberFilters';
import { MemberCard } from '@/components/members/MemberCard';
import { AddMemberDialog } from '@/components/members/AddMemberDialog';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

const PAGE_SIZE = 24;

const Members = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchData = async () => {
    const [membersRes, marriagesRes] = await Promise.all([
      supabase.from('family_members').select('*').order('full_name'),
      supabase.from('marriages').select('*'),
    ]);
    setMembers(membersRes.data || []);
    setMarriages(marriagesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let result = members;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.full_name.toLowerCase().includes(q));
    }
    if (statusFilter === 'alive') result = result.filter(m => !m.death_date);
    if (statusFilter === 'deceased') result = result.filter(m => !!m.death_date);
    if (genderFilter !== 'all') result = result.filter(m => m.gender === genderFilter);
    return result;
  }, [members, searchQuery, statusFilter, genderFilter]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Leaf className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Anggota Keluarga</h1>
        {user && <AddMemberDialog members={members} userId={user.id} onAdded={fetchData} />}
      </div>

      <MemberFilters
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        genderFilter={genderFilter} onGenderChange={setGenderFilter}
      />

      <p className="text-sm text-muted-foreground mb-4">
        Menampilkan {visible.length} dari {filtered.length} anggota
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada anggota yang sesuai filter.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((member) => (
              <MemberCard key={member.id} member={member} members={members} marriages={marriages} canEdit={!!user} onRefresh={fetchData} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                Muat lebih banyak
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Members;
