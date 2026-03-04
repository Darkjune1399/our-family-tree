import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Leaf, User, MapPin, Calendar, Phone, Heart, TreePine, ArrowLeft, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [father, setFather] = useState<FamilyMember | null>(null);
  const [mother, setMother] = useState<FamilyMember | null>(null);
  const [spouses, setSpouses] = useState<{ member: FamilyMember; marriage: Marriage }[]>([]);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: m } = await supabase.from('family_members').select('*').eq('id', id).single();
      if (!m) { setLoading(false); return; }
      setMember(m);

      // Parents
      if (m.father_id) {
        const { data } = await supabase.from('family_members').select('*').eq('id', m.father_id).single();
        if (data) setFather(data);
      }
      if (m.mother_id) {
        const { data } = await supabase.from('family_members').select('*').eq('id', m.mother_id).single();
        if (data) setMother(data);
      }

      // Spouses
      const { data: marriageData } = await supabase.from('marriages').select('*').or(`spouse1_id.eq.${id},spouse2_id.eq.${id}`);
      if (marriageData) {
        const sp: { member: FamilyMember; marriage: Marriage }[] = [];
        for (const mar of marriageData) {
          const spouseId = mar.spouse1_id === id ? mar.spouse2_id : mar.spouse1_id;
          const { data: s } = await supabase.from('family_members').select('*').eq('id', spouseId).single();
          if (s) sp.push({ member: s, marriage: mar });
        }
        setSpouses(sp);
      }

      // Children
      const { data: childData } = await supabase.from('family_members').select('*').or(`father_id.eq.${id},mother_id.eq.${id}`);
      if (childData) setChildren(childData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Leaf className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Anggota tidak ditemukan.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/members"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/members"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-display font-bold text-foreground">Profil Anggota</h1>
      </div>

      {/* Main Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-display font-bold text-foreground">{member.full_name}</h2>
                <Badge variant={member.gender === 'male' ? 'default' : 'secondary'}>
                  {member.gender === 'male' ? '♂ Laki-laki' : '♀ Perempuan'}
                </Badge>
                {member.death_date && <Badge variant="outline">Almarhum/ah</Badge>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {member.birth_place && (
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Lahir di {member.birth_place}</div>
                )}
                {member.birth_date && (
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {formatDate(member.birth_date)}</div>
                )}
                {member.death_date && (
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Wafat: {formatDate(member.death_date)}{member.death_place ? `, ${member.death_place}` : ''}</div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {member.phone}</div>
                )}
                {member.address && (
                  <div className="flex items-center gap-2 col-span-full"><MapPin className="h-3.5 w-3.5" /> {member.address}</div>
                )}
              </div>
              {member.bio && <p className="text-sm text-foreground/80 mt-3">{member.bio}</p>}
            </div>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to={`/tree?focus=${member.id}`}>
                <TreePine className="mr-2 h-4 w-4" /> Lihat di Pohon Silsilah
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parents */}
      {(father || mother) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Orang Tua
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {father && <MemberLink member={father} label="Ayah" />}
              {mother && <MemberLink member={mother} label="Ibu" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spouses */}
      {spouses.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Pasangan
            </h3>
            <div className="space-y-3">
              {spouses.map(({ member: sp, marriage }) => (
                <div key={sp.id} className="flex items-center justify-between">
                  <MemberLink member={sp} />
                  <div className="text-xs text-muted-foreground">
                    {marriage.marriage_date && `Nikah: ${formatDate(marriage.marriage_date)}`}
                    {marriage.divorce_date && ` • Cerai: ${formatDate(marriage.divorce_date)}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children */}
      {children.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Anak ({children.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {children.sort((a, b) => (a.birth_date || '').localeCompare(b.birth_date || '')).map(child => (
                <MemberLink key={child.id} member={child} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function MemberLink({ member, label }: { member: FamilyMember; label?: string }) {
  return (
    <Link to={`/member/${member.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
        {member.photo_url ? (
          <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-primary" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{member.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {label ? `${label} • ` : ''}{member.gender === 'male' ? '♂' : '♀'}
          {member.birth_date ? ` • ${new Date(member.birth_date).getFullYear()}` : ''}
        </p>
      </div>
    </Link>
  );
}

export default MemberProfile;
