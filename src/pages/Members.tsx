import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, User, MapPin, Phone, Calendar, Leaf } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

const Members = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, isSuperadmin } = useAuth();
  const { toast } = useToast();

  // Form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [fatherId, setFatherId] = useState<string>('');
  const [motherId, setMotherId] = useState<string>('');

  const fetchMembers = async () => {
    const { data } = await supabase.from('family_members').select('*').order('full_name');
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const resetForm = () => {
    setFullName(''); setGender('male'); setBirthPlace(''); setBirthDate('');
    setDeathPlace(''); setDeathDate(''); setAddress(''); setPhone(''); setBio('');
    setFatherId(''); setMotherId('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('family_members').insert({
      full_name: fullName,
      gender,
      birth_place: birthPlace || null,
      birth_date: birthDate || null,
      death_place: deathPlace || null,
      death_date: deathDate || null,
      address: address || null,
      phone: phone || null,
      bio: bio || null,
      father_id: fatherId || null,
      mother_id: motherId || null,
      created_by: user?.id || null,
    });
    if (error) {
      toast({ title: 'Gagal menambah', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil!', description: `${fullName} ditambahkan.` });
      resetForm();
      setDialogOpen(false);
      fetchMembers();
    }
  };

  const males = members.filter(m => m.gender === 'male');
  const females = members.filter(m => m.gender === 'female');

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Leaf className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Anggota Keluarga</h1>
        {user && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Tambah Anggota</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Anggota Keluarga</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
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
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {members.length === 0 ? (
        <p className="text-muted-foreground">Belum ada anggota keluarga.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Members;
