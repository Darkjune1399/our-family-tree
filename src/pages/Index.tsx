import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { TreePine, Leaf } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

const Index = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('family_members').select('*');
      setMembers(data || []);
      setLoading(false);
    };
    fetchMembers();
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
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">Pohon Silsilah</h1>
      <p className="text-muted-foreground">
        Visualisasi pohon keluarga akan ditampilkan di sini. ({members.length} anggota terdaftar)
      </p>
    </div>
  );
};

export default Index;
