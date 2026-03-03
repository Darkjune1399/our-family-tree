import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TreePine, LogIn, Eye, Users, Heart, Shield } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-leaf/5" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <TreePine className="h-7 w-7 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">Silsilah Keluarga</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/tree">
                <Eye className="mr-2 h-4 w-4" />
                Lihat Pohon
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <TreePine className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-5 leading-tight">
            Jelajahi Akar<br />Keluarga Anda
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8">
            Sistem silsilah keluarga digital — dokumentasikan, hubungkan, dan visualisasikan pohon keluarga Anda dalam satu tempat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/tree">
                <Eye className="mr-2 h-5 w-5" />
                Lihat Pohon Silsilah
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link to="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Masuk / Daftar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-center text-foreground mb-12">Fitur Utama</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: TreePine,
              title: 'Pohon Silsilah',
              desc: 'Visualisasi interaktif pohon keluarga yang bisa dilihat siapa saja tanpa login.',
            },
            {
              icon: Users,
              title: 'Kelola Anggota',
              desc: 'Tambah, edit, dan hapus anggota keluarga beserta foto dan data lengkap.',
            },
            {
              icon: Heart,
              title: 'Data Pasangan',
              desc: 'Catat riwayat pernikahan lengkap dengan tanggal dan status.',
            },
            {
              icon: Shield,
              title: 'Aman & Terkontrol',
              desc: 'Hanya pengguna terdaftar yang bisa mengelola data keluarga.',
            },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center border-t">
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">Mulai Sekarang</h2>
        <p className="text-muted-foreground mb-6">Daftar gratis dan bangun pohon silsilah keluarga Anda.</p>
        <Button asChild size="lg">
          <Link to="/auth">Daftar Sekarang</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Silsilah Keluarga. Semua hak dilindungi.
      </footer>
    </div>
  );
};

export default Landing;
