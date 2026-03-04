import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, X } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

type Marriage = Tables<'marriages'>;

type Props = {
  members: FamilyMember[];
  marriages: Marriage[];
  userId: string | undefined;
  onAdded: () => void;
};

export function AddMemberDialog({ members, marriages, userId, onAdded }: Props) {
  const [open, setOpen] = useState(false);
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

  const males = members.filter(m => m.gender === 'male');
  const females = members.filter(m => m.gender === 'female');

  // Auto-fill spouse based on marriages
  useEffect(() => {
    if (!fatherId || fatherId === 'none') return;
    const marriage = marriages.find(m => m.spouse1_id === fatherId || m.spouse2_id === fatherId);
    if (marriage) {
      const spouseId = marriage.spouse1_id === fatherId ? marriage.spouse2_id : marriage.spouse1_id;
      const spouse = members.find(m => m.id === spouseId);
      if (spouse && spouse.gender === 'female') setMotherId(spouseId);
    }
  }, [fatherId]);

  useEffect(() => {
    if (!motherId || motherId === 'none') return;
    const marriage = marriages.find(m => m.spouse1_id === motherId || m.spouse2_id === motherId);
    if (marriage) {
      const spouseId = marriage.spouse1_id === motherId ? marriage.spouse2_id : marriage.spouse1_id;
      const spouse = members.find(m => m.id === spouseId);
      if (spouse && spouse.gender === 'male') setFatherId(spouseId);
    }
  }, [motherId]);

  const resetForm = () => {
    setFullName(''); setGender('male'); setBirthPlace(''); setBirthDate('');
    setDeathPlace(''); setDeathDate(''); setAddress(''); setPhone(''); setBio('');
    setFatherId(''); setMotherId(''); setPhotoFile(null); setPhotoPreview(null);
  };

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

  const uploadPhoto = async (memberId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split('.').pop();
    const path = `${memberId}.${ext}`;
    const { error } = await supabase.storage.from('profile-photos').upload(path, photoFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.from('family_members').insert({
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
      created_by: userId || null,
    }).select('id').single();

    if (error) {
      toast({ title: 'Gagal menambah', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (photoFile && data) {
      const photoUrl = await uploadPhoto(data.id);
      if (photoUrl) {
        await supabase.from('family_members').update({ photo_url: photoUrl }).eq('id', data.id);
      }
    }

    toast({ title: 'Berhasil!', description: `${fullName} ditambahkan.` });
    resetForm();
    setOpen(false);
    setLoading(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Tambah Anggota</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Tambah Anggota Keluarga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload */}
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
              <p className="text-sm text-muted-foreground">Upload foto (maks 2MB)</p>
              {photoFile && (
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <X className="h-3 w-3" /> Hapus foto
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Nama lengkap" />
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
              <Input value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="Kota/Kabupaten" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tempat Wafat</Label>
              <Input value={deathPlace} onChange={e => setDeathPlace(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Wafat</Label>
              <Input type="date" value={deathDate} onChange={e => setDeathDate(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Alamat</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap" />
            </div>
            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
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
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Catatan singkat tentang anggota keluarga" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
