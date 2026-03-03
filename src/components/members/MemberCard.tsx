import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Phone, Calendar } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

export function MemberCard({ member }: { member: FamilyMember }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-base font-display">{member.full_name}</CardTitle>
            <p className="text-xs text-muted-foreground">{member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        {member.birth_place && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{member.birth_place}</span>
          </div>
        )}
        {member.birth_date && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(member.birth_date).toLocaleDateString('id-ID')}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.death_date && (
          <span className="inline-block px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">Wafat</span>
        )}
      </CardContent>
    </Card>
  );
}
