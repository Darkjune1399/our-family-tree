import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

type MemberFiltersProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  genderFilter: string;
  onGenderChange: (v: string) => void;
};

export function MemberFilters({
  searchQuery, onSearchChange,
  statusFilter, onStatusChange,
  genderFilter, onGenderChange,
}: MemberFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="alive">Masih Hidup</SelectItem>
          <SelectItem value="deceased">Sudah Wafat</SelectItem>
        </SelectContent>
      </Select>
      <Select value={genderFilter} onValueChange={onGenderChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Jenis Kelamin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          <SelectItem value="male">Laki-laki</SelectItem>
          <SelectItem value="female">Perempuan</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
