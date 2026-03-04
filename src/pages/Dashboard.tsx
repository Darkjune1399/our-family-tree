import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Heart, HeartPulse, Cross, UserPlus, TreePine, Search, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user } = useAuth();
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalMarriages, setTotalMarriages] = useState(0);
  const [aliveMembers, setAliveMembers] = useState(0);
  const [deceasedMembers, setDeceasedMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const [membersRes, marriagesRes, profileRes] = await Promise.all([
        supabase.from('family_members').select('id, death_date'),
        supabase.from('marriages').select('id'),
        user ? supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const members = membersRes.data || [];
      const marriages = marriagesRes.data || [];

      setTotalMembers(members.length);
      setTotalMarriages(marriages.length);
      setAliveMembers(members.filter(m => !m.death_date).length);
      setDeceasedMembers(members.filter(m => m.death_date).length);
      setProfileName(profileRes.data?.full_name || null);
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Leaf className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profileName || user?.email?.split('@')[0] || 'Pengguna';

  const stats = [
    {
      label: 'Total Anggota',
      value: totalMembers,
      icon: Users,
      bgClass: 'bg-primary',
    },
    {
      label: 'Total Pernikahan',
      value: totalMarriages,
      icon: Heart,
      bgClass: 'bg-[hsl(var(--stat-green))]',
    },
    {
      label: 'Anggota Hidup',
      value: aliveMembers,
      icon: HeartPulse,
      bgClass: 'bg-[hsl(var(--stat-cyan))]',
    },
    {
      label: 'Anggota Meninggal',
      value: deceasedMembers,
      icon: Cross,
      bgClass: 'bg-[hsl(var(--stat-gray))]',
    },
  ];

  const quickActions = [
    { label: 'Tambah Anggota Baru', icon: UserPlus, to: '/members', bgClass: 'bg-primary hover:bg-primary/90' },
    { label: 'Lihat Silsilah', icon: TreePine, to: '/tree', bgClass: 'bg-[hsl(var(--stat-green))] hover:opacity-90' },
    { label: 'Cari Anggota', icon: Search, to: '/search', bgClass: 'bg-[hsl(var(--stat-cyan))] hover:opacity-90' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Selamat Datang, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Berikut adalah ringkasan data silsilah keluarga
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className={`${stat.bgClass} border-0 text-primary-foreground shadow-md`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className="h-10 w-10 opacity-60" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  className={`${action.bgClass} text-primary-foreground h-12 text-sm font-medium`}
                >
                  <Link to={action.to}>
                    <action.icon className="mr-2 h-5 w-5" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Silsilah Keluarga Djojowinoto
      </footer>
    </div>
  );
};

export default Dashboard;
