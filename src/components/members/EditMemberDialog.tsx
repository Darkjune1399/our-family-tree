import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

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

export function EditMemberDialog({ member, members, marriages, open, onOpenChange, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');

  useEffect(() => {
    if (open && member) {
      setFullName(member.full_name);
      setGender(member.gender);
      setBirthPlace(member.birth_place || '');
      setBirthDate(member.birth_date || '');
      setDeathPlace(member.death_place || '');
      setDeathDate(member.death_date || '');
      setAddress(member.address || '');
      setPhone(member.phone || '');
      setBio(member.bio || '');
      setFatherId(member.father_id || 'none');
      setMotherId(member.mother_id || 'none');
      setPhotoPreview(member.photo_url || null);
      setPhotoFile(null);
    }
  }, [open, member]);

  const males = members.filter(m => m.gender === 'male' && m.id !== member.id);
  const females = members.filter(m => m.gender === 'female' && m.id !== member.id);

  // Auto-fill spouse based on marriages (skip on initial load)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => { if (open) setTimeout(() => setInitialized(true), 100); else setInitialized(false); }, [open]);

  useEffect(() => {
    if (!initialized || !fatherId || fatherId === 'none') return;
    const marriage = marriages.find(m => m.spouse1_id === fatherId || m.spouse2_id === fatherId);
    if (marriage) {
      const spouseId = marriage.spouse1_id === fatherId ? marriage.spouse2_id : marriage.spouse1_id;
      const spouse = members.find(m => m.id === spouseId);
      if (spouse && spouse.gender === 'female') setMotherId(spouseId);
    }
  }, [fatherId, initialized]);

  useEffect(() => {
    if (!initialized || !motherId || motherId === 'none') return;
    const marriage = marriages.find(m => m.spouse1_id === motherId || m.spouse2_id === motherId);
    if (marriage) {
      const spouseId = marriage.spouse1_id === motherId ? marriage.spouse2_id : marriage.spouse1_id;
      const spouse = members.find(m => m.id === spouseId);
      if (spouse && spouse.gender === 'male') setFatherId(spouseId);
    }
  }, [motherId, initialized]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File terlalu besar', description: 'Maksimal 2MB', variant: 'destructive' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split('.').pop();
    const path = `${member.id}.${ext}`;
    const { error } = await supabase.storage.from('profile-photos').upload(path, photoFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl + '?t=' + Date.now();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let photoUrl = member.photo_url;
    if (photoFile) {
      const url = await uploadPhoto();
      if (url) photoUrl = url;
    }

    const { error } = await supabase.from('family_members').update({
      full_name: fullName,
      gender,
      birth_place: birthPlace || null,
      birth_date: birthDate || null,
      death_place: deathPlace || null,
      death_date: deathDate || null,
      address: address || null,
      phone: phone || null,
      bio: bio || null,
      father_id: fatherId && fatherId !== 'none' ? fatherId : null,
      mother_id: motherId && motherId !== 'none' ? motherId : null,
      photo_url: photoUrl,
    }).eq('id', member.id);

    if (error) {
      toast({ title: 'Gagal mengupdate', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil!', description: `${fullName} diperbarui.` });
      onOpenChange(false);
      onUpdated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Anggota Keluarga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Ganti foto (maks 2MB)</p>
              {photoFile && (
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(member.photo_url || null); }} className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <X className="h-3 w-3" /> Batal ganti
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin *</Label>
              <Select value={gender} onValueChange={(v: 'male' | 'female') => setGender(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tempat Lahir</Label>
              <Input value={birthPlace} onChange={e => setBirthPlace(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tempat Wafat</Label>
              <Input value={deathPlace} onChange={e => setDeathPlace(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Wafat</Label>
              <Input type="date" value={deathDate} onChange={e => setDeathDate(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Alamat</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ayah</Label>
              <Select value={fatherId} onValueChange={setFatherId}>
                <SelectTrigger><SelectValue placeholder="Pilih ayah" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {males.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ibu</Label>
              <Select value={motherId} onValueChange={setMotherId}>
                <SelectTrigger><SelectValue placeholder="Pilih ibu" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {females.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
