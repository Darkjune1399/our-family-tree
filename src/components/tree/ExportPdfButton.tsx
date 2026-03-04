import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { TreeNode } from '@/lib/family-tree-layout';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

type Props = {
  members: FamilyMember[];
  marriages: Marriage[];
  trees: TreeNode[];
};

export function ExportPdfButton({ members, marriages }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);

    // Build print-friendly HTML
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    const marriageMap = new Map<string, { spouse: FamilyMember; date: string | null }[]>();
    marriages.forEach(mar => {
      const s1 = members.find(m => m.id === mar.spouse1_id);
      const s2 = members.find(m => m.id === mar.spouse2_id);
      if (s1 && s2) {
        if (!marriageMap.has(s1.id)) marriageMap.set(s1.id, []);
        marriageMap.get(s1.id)!.push({ spouse: s2, date: mar.marriage_date });
        if (!marriageMap.has(s2.id)) marriageMap.set(s2.id, []);
        marriageMap.get(s2.id)!.push({ spouse: s1, date: mar.marriage_date });
      }
    });

    const memberMap = new Map(members.map(m => [m.id, m]));

    const rows = members.map(m => {
      const father = m.father_id ? memberMap.get(m.father_id)?.full_name || '-' : '-';
      const mother = m.mother_id ? memberMap.get(m.mother_id)?.full_name || '-' : '-';
      const spouseList = marriageMap.get(m.id)?.map(s => s.spouse.full_name).join(', ') || '-';
      
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd;">${m.full_name}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${m.gender === 'male' ? 'L' : 'P'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${m.birth_place || '-'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${formatDate(m.birth_date)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${m.death_date ? formatDate(m.death_date) : '-'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${father}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${mother}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${spouseList}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Data Silsilah Keluarga</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p { font-size: 12px; color: #666; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th { background: #f0f4f8; padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 600; }
  @media print { body { margin: 10mm; } }
</style></head><body>
<h1>Data Silsilah Keluarga</h1>
<p>Total ${members.length} anggota • Diekspor ${new Date().toLocaleDateString('id-ID')}</p>
<table>
<thead><tr>
  <th>Nama</th><th>JK</th><th>Tempat Lahir</th><th>Tgl Lahir</th><th>Tgl Wafat</th><th>Ayah</th><th>Ibu</th><th>Pasangan</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setExporting(false);
      };
      // Fallback if onload doesn't fire
      setTimeout(() => setExporting(false), 3000);
    } else {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="h-8 text-xs">
      <FileDown className="h-3.5 w-3.5 mr-1" />
      {exporting ? 'Mengekspor...' : 'Export PDF'}
    </Button>
  );
}
