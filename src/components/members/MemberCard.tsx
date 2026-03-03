import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MapPin, Phone, Calendar, Pencil, Trash2 } from 'lucide-react';
import { EditMemberDialog } from './EditMemberDialog';
import { DeleteMemberDialog } from './DeleteMemberDialog';

type FamilyMember = Tables<'family_members'>;

type Props = {
  member: FamilyMember;
  members: FamilyMember[];
  canEdit?: boolean;
  onRefresh: () => void;
};

export function MemberCard({ member, members, canEdit, onRefresh }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
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
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-display truncate">{member.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            {canEdit && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
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

      <EditMemberDialog
        member={member}
        members={members}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onRefresh}
      />
      <DeleteMemberDialog
        memberId={member.id}
        memberName={member.full_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onRefresh}
      />
    </>
  );
}
