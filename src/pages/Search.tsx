import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search as SearchIcon, User, MapPin, Calendar } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FamilyMember[]>([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setSearched(true);
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .or(`full_name.ilike.%${q}%,address.ilike.%${q}%`)
      .order('full_name')
      .limit(20);
    setResults(data || []);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">Pencarian</h1>
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau alamat..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      {searched && results.length === 0 && (
        <p className="text-muted-foreground text-center">Tidak ditemukan hasil untuk "{query}"</p>
      )}
      <div className="space-y-3">
        {results.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/member/${member.id}`)}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base font-display">{member.full_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm flex gap-4 text-muted-foreground">
              {member.birth_place && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{member.birth_place}</span>}
              {member.birth_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(member.birth_date).toLocaleDateString('id-ID')}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
