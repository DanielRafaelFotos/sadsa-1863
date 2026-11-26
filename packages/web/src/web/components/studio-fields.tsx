import { useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { blankPhoto, type Photo } from '../../shared/studio';
import { client } from '../lib/api';

export function Field({ label, value, set, multiline = false, placeholder, type = 'text' }: { label: string; value: string; set: (value: string) => void; multiline?: boolean; placeholder?: string; type?: string }) {
  return <label className="field"><span>{label}</span>{multiline ? <textarea aria-label={label} rows={4} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} /> : <input aria-label={label} type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />}</label>;
}
export function SelectField({ label, value, set, options }: { label: string; value: string; set: (value: string) => void; options: Record<string, string> }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={e => set(e.target.value)}>{Object.entries(options).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>;
}
export function move<T>(items: T[], index: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const list = [...items]; const item = list.splice(index, 1)[0]; list.splice(to, 0, item); return list;
}
export function Reorder({ index, total, onMove, onRemove, label }: { index: number; total: number; onMove: (to: number) => void; onRemove?: () => void; label: string }) {
  return <span className="reorder"><button type="button" className="panel-icon" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp size={16} /></button><button type="button" className="panel-icon" aria-label={`Descer ${label}`} disabled={index === total - 1} onClick={() => onMove(index + 1)}><ArrowDown size={16} /></button>{onRemove && <button type="button" className="panel-icon remove" aria-label={`Remover ${label}`} onClick={onRemove}><Trash2 size={16} /></button>}</span>;
}
const accepted = ['image/jpeg','image/png','image/webp','image/avif'] as const;
export function PhotoField({ photo, set, setBusy, label }: { photo: Photo; set: (photo: Photo) => void; setBusy: (delta: number) => void; label: string }) {
  const [busy, setLocalBusy] = useState(false);
  const [error, setError] = useState('');
  function update(patch: Partial<Photo>) { set({ ...photo, ...patch }); }
  async function pick(file: File) {
    const type = accepted.find(t => t === file.type);
    setError('');
    if (!type || !file.size || file.size > 15_000_000) { setError('Escolha uma foto JPG, PNG, WebP ou AVIF de até 15 MB.'); return; }
    setLocalBusy(true); setBusy(1);
    try {
      const { url, publicUrl } = await client.studio.presign({ type, size: file.size });
      const res = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': type, 'x-amz-acl': 'public-read' } });
      if (!res.ok) throw new Error('Upload recusado');
      update({ src: publicUrl });
    } catch { setError('Não foi possível enviar a foto. Tente novamente ou use uma URL HTTPS.'); }
    finally { setLocalBusy(false); setBusy(-1); }
  }
  return <div className="photo-field"><div className="photo-thumb">{photo.src ? <img src={photo.src} alt={photo.alt} /> : <ImagePlus size={24} />}</div><fieldset disabled={busy}>
    <label className="upload-trigger"><Upload size={15} /> {busy ? 'Enviando…' : 'Enviar foto'}<input type="file" aria-label={`Enviar ${label}`} accept={accepted.join(',')} onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (file) void pick(file); }} /></label>
    <Field label="URL da foto (opcional)" value={photo.src} set={src => update({ src })} placeholder="https://…" /><Field label="Descrição da foto (texto alternativo)" value={photo.alt} set={alt => update({ alt })} />{error && <p className="panel-error" role="alert">{error}</p>}
  </fieldset></div>;
}
export function PhotoList({ photos, set, setBusy, busy, min = 0, max }: { photos: Photo[]; set: (photos: Photo[]) => void; busy: boolean; setBusy: (delta: number) => void; min?: number; max: number }) {
  return <div className="photo-list">{photos.map((photo, i) => <div className="photo-item" key={i}><div className="item-top"><strong>Foto {i + 1}</strong><Reorder label={`foto ${i+1}`} index={i} total={photos.length} onMove={to => set(move(photos, i, to))} onRemove={photos.length > min && !busy ? () => set(photos.filter((_, j) => j !== i)) : undefined} /></div>
    <PhotoField label={`foto ${i+1}`} photo={photo} set={value => set(photos.map((p, j) => i === j ? value : p))} setBusy={setBusy} />
  </div>)}<button type="button" className="panel-secondary" disabled={busy || photos.length >= max} onClick={() => set([...photos, blankPhoto()])}><Plus size={16} /> Adicionar foto</button></div>;
}
