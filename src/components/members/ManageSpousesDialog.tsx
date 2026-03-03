import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, Trash2 } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

type Props = {
  member: FamilyMember;
  members: FamilyMember[];
  marriages: Marriage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function ManageSpousesDialog({ member, members, marriages, open, onOpenChange, onUpdated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [spouseId, setSpouseId] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [divorceDate, setDivorceDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);

  // Get marriages for this member
  const memberMarriages = marriages.filter(
    m => m.spouse1_id === member.id || m.spouse2_id === member.id
  );

  // Get the spouse from a marriage record
  const getSpouse = (marriage: Marriage): FamilyMember | undefined => {
    const spouseId = marriage.spouse1_id === member.id ? marriage.spouse2_id : marriage.spouse1_id;
    return members.find(m => m.id === spouseId);
  };

  // Candidates: opposite gender, not already married to this member
  const existingSpouseIds = memberMarriages.map(m =>
    m.spouse1_id === member.id ? m.spouse2_id : m.spouse1_id
  );
  const candidates = members.filter(
    m => m.id !== member.id &&
    m.gender !== member.gender &&
    !existingSpouseIds.includes(m.id)
  );

  const resetForm = () => {
    setSpouseId('');
    setMarriageDate('');
    setDivorceDate('');
    setIsCurrent(true);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!spouseId) {
      toast({ title: 'Pilih pasangan', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('marriages').insert({
      spouse1_id: member.id,
      spouse2_id: spouseId,
      marriage_date: marriageDate || null,
      divorce_date: divorceDate || null,
      is_current: isCurrent,
    });
    if (error) {
      toast({ title: 'Gagal menambah pasangan', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil!', description: 'Data pasangan ditambahkan.' });
      resetForm();
      onUpdated();
    }
    setLoading(false);
  };

  const handleDelete = async (marriageId: string) => {
    setLoading(true);
    const { error } = await supabase.from('marriages').delete().eq('id', marriageId);
    if (error) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil dihapus' });
      onUpdated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Pasangan — {member.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Existing marriages */}
        <div className="space-y-3">
          {memberMarriages.length === 0 && !showAddForm && (
            <p className="text-sm text-muted-foreground">Belum ada data pasangan.</p>
          )}

          {memberMarriages.map(marriage => {
            const spouse = getSpouse(marriage);
            return (
              <div key={marriage.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{spouse?.full_name || 'Tidak diketahui'}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {marriage.marriage_date && (
                      <span className="text-xs text-muted-foreground">
                        Nikah: {new Date(marriage.marriage_date).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    {marriage.divorce_date && (
                      <span className="text-xs text-destructive">
                        Cerai: {new Date(marriage.divorce_date).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${marriage.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {marriage.is_current ? 'Aktif' : 'Berakhir'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(marriage.id)} disabled={loading}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add form */}
        {showAddForm ? (
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-2">
              <Label>Pasangan *</Label>
              <Select value={spouseId} onValueChange={setSpouseId}>
                <SelectTrigger><SelectValue placeholder="Pilih pasangan" /></SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal Nikah</Label>
                <Input type="date" value={marriageDate} onChange={e => setMarriageDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Cerai</Label>
                <Input type="date" value={divorceDate} onChange={e => setDivorceDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isCurrent} onCheckedChange={setIsCurrent} />
              <Label>Masih aktif</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={loading} className="flex-1">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Tambah Pasangan
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
