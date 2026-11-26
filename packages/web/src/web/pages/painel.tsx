import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Camera, Eye, Image, Images, LayoutList, LogOut, Palette, Plus, Save, Send, Settings2, UserRound } from 'lucide-react';
import { authClient } from '../lib/auth';
import { ownerOptions, saveOptions, siteOptions } from '../queries/studio';
import { blankPhoto, initialStudio, studioSchema, type Studio } from '../../shared/studio';
import { Brand, Portfolio } from '../components/portfolio';
import { Field, move, PhotoField, PhotoList, Reorder, SelectField } from '../components/studio-fields';

const tabs = [ { id:'marca', label:'Marca e rodapé', icon: Settings2 }, { id:'capa', label:'Capa', icon: Image }, { id:'portfolio', label:'Portfólio', icon: Images }, { id:'sobre', label:'Sobre', icon: UserRound }, { id:'contato', label:'Contato', icon: Send }, { id:'estilo', label:'Cores e fontes', icon: Palette }, { id:'layout', label:'Ordem das seções', icon: LayoutList } ] as const;
const sectionNames = { portfolio: 'Portfólio', sobre: 'Sobre', contato: 'Contato' };
type Tab = typeof tabs[number]['id'];
function Login({ waiting, denied, logout }: { waiting: boolean; denied: boolean; logout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function google() {
    setBusy(true); setError('');
    try {
      const result = await authClient.managedAuth.signIn({ provider: 'google' });
      if (result.error && result.error.code !== 'POPUP_CLOSED') setError('Não foi possível entrar. Use a conta Google autorizada para este estúdio.');
    } catch { setError('O login não abriu. Tente novamente em uma nova aba.'); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><div className="login-image" /><main className="login-side"><a className="panel-back" href="/"><ArrowLeft size={16} /> Voltar ao site</a><div className="login-content">
      <Brand brand={initialStudio.brand} /><p className="eyebrow">ÁREA PRIVADA</p><h1>Painel do <em>estúdio.</em></h1><p>Entre com a conta Google autorizada para personalizar o portfólio.</p>
      {waiting ? <output>Verificando acesso…</output> : denied ? <><p role="alert" className="panel-error">Esta sessão não tem permissão de edição.</p><button className="panel-secondary" onClick={logout}>Sair e usar outra conta</button></> : <button className="panel-primary google-btn" disabled={busy} onClick={google}><span aria-hidden="true">G</span>{busy ? 'Abrindo o Google…' : 'Entrar com Google'}</button>}
      {error && <p className="panel-error" role="alert">{error}</p>}
    </div></main></div>;
}
function Editor({ initial, email, logout }: { initial: Studio; email: string; logout: () => Promise<void> }) {
  const cache = useQueryClient();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<Tab>('marca');
  const [preview, setPreview] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState('');
  const mutation = useMutation(saveOptions);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const update = <K extends keyof Studio>(part: K, value: Studio[K]) => { setDraft(d => ({ ...d, [part]: value })); setMessage(''); };
  const field = <K extends keyof Studio, F extends keyof Studio[K]>(part: K, prop: F, label: string, options?: { multiline?: boolean; placeholder?: string; type?: string }) => <Field label={label} value={String(draft[part][prop])} set={value => update(part, { ...draft[part], [prop]: value })} {...options} />;
  const setBusy = (amount: number) => setUploads(n => n + amount);
  async function publish() {
    const result = studioSchema.safeParse(draft);
    if (!result.success) {
      const problem = result.error.issues[0];
      const label = { brand: 'Marca', hero: 'Capa', portfolio: 'Portfólio', about: 'Sobre', contact: 'Contato', footer: 'Rodapé', theme: 'Estilo', layout: 'Ordem das seções' }[String(problem?.path[0])];
      const detail = problem?.path.at(-1);
      setMessage(`Revise ${label || 'os dados'}${typeof detail === 'string' ? ` (${({ name:'nome', title:'título', email:'e-mail', whatsapp:'WhatsApp', instagram:'Instagram', src:'URL da foto' } as Record<string,string>)[detail] ?? 'campo inválido'})` : ''}. Verifique campos obrigatórios e o formato dos links.`);
      return;
    }
    if (!result.data.hero.photos.some(p => p.src)) { setMessage('Adicione pelo menos uma foto válida na Capa.'); return; }
    try {
      await mutation.mutateAsync(result.data);
      cache.setQueryData(siteOptions.queryKey, result.data);
      setDraft(result.data); setSaved(result.data); setMessage('Alterações publicadas no portfólio.');
    } catch { setMessage('Não foi possível publicar. Verifique sua conexão ou entre novamente.'); }
  }
  const galleryList = draft.portfolio.galleries;
  function setGallery(i: number, value: typeof galleryList[number]) { update('portfolio', { ...draft.portfolio, galleries: galleryList.map((g, j) => i === j ? value : g) }); }
  function setGalleries(value: typeof galleryList) { update('portfolio', { ...draft.portfolio, galleries: value }); }
  const blocking = uploads > 0 || mutation.isPending;
  const action = <button className="panel-primary" type="button" onClick={publish} disabled={!dirty || blocking}><Save size={16} /> {mutation.isPending ? 'Publicando…' : 'Publicar alterações'}</button>;
  if (preview) return <div className="preview-shell"><div className="preview-bar"><button className="panel-secondary" onClick={() => { setPreview(false); window.scrollTo(0,0); }}><ArrowLeft size={16} /> Voltar ao editor</button><span>Prévia não publicada</span>{action}{message && <output>{message}</output>}</div><Portfolio data={draft} preview /></div>;
  return <div className="panel-shell"><header className="panel-header"><a href="/" target="_blank" rel="noreferrer"><Brand brand={draft.brand} /></a><div><button type="button" className="panel-secondary" disabled={blocking} onClick={() => { setPreview(true); window.scrollTo(0,0); }}><Eye size={16} /> Prévia</button>{action}</div></header>
    <div className="panel-grid"><aside className="panel-nav"><p className="eyebrow">PERSONALIZAÇÃO</p>{tabs.map(({id,label,icon:Icon}) => <button key={id} type="button" disabled={blocking} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setMessage(''); }}><Icon size={17} /> {label}</button>)}<div className="panel-account"><small>{email}</small><a href="/" target="_blank" rel="noreferrer">Abrir site <ArrowUpRight size={15} /></a><button onClick={logout}><LogOut size={15} /> Sair</button></div></aside>
    <main className="panel-main"><p className="eyebrow"><Camera size={14} /> PAINEL DO ESTÚDIO</p><h1>{tabs.find(t => t.id === tab)?.label}</h1><p className="panel-hint">{dirty ? 'Você tem alterações ainda não publicadas.' : 'As mudanças só aparecem no site depois que você publicar.'}</p>
    {message && <output className={message.startsWith('Alterações') ? 'panel-success' : 'panel-error'}>{message}</output>}
    <fieldset className="editor-fields" disabled={blocking}>
      {tab === 'marca' && <div className="panel-box fields-2">{field('brand','name','Nome da marca')}{field('brand','suffix','Complemento da marca')}{field('brand','mark','Monograma (ex.: DR)')}{field('brand','location','Cidade ou região')}{field('footer','note','Frase do rodapé')}</div>}
      {tab === 'capa' && <><div className="panel-box fields-2">{field('hero','eyebrow','Linha acima do título')}{field('hero','cta','Texto do botão')}{field('hero','title','Título (opcional)')}{field('hero','emphasis','Título em destaque')}{field('hero','description','Descrição',{multiline: true})}</div><div className="panel-box"><h2>Fotos da capa</h2><p>A primeira foto é a que aparece ao abrir o site.</p><PhotoList photos={draft.hero.photos} set={photos => update('hero',{...draft.hero,photos})} setBusy={setBusy} busy={blocking} min={1} max={12}/></div></>}
      {tab === 'portfolio' && <><div className="panel-box fields-2">{field('portfolio','label','Nome no menu')}{field('portfolio','eyebrow','Linha acima do título')}{field('portfolio','title','Título')}{field('portfolio','emphasis','Título em destaque')}{field('portfolio','description','Descrição',{multiline:true})}</div><div className="panel-box"><h2>Galerias</h2><p>As fotos aparecem na grade na ordem das galerias. Os títulos das galerias viram filtros.</p>{galleryList.map((g,i) => <details className="gallery-edit" key={g.id} open={galleryList.length === 1 || undefined}><summary>{g.title || `Galeria ${i+1}`} <small>{g.photos.length} foto(s)</small></summary><div className="gallery-inner"><div className="item-top"><strong>Ordem da galeria</strong><Reorder label={`galeria ${i+1}`} index={i} total={galleryList.length} onMove={to => setGalleries(move(galleryList,i,to))} onRemove={() => setGalleries(galleryList.filter((_,j) => i !== j))} /></div><div className="fields-2"><Field label="Título da galeria" value={g.title} set={title => setGallery(i,{...g,title})} /><Field label="Subtítulo da galeria" value={g.detail} set={detail => setGallery(i,{...g,detail})} /></div><PhotoList photos={g.photos} set={photos => setGallery(i,{...g,photos})} busy={blocking} setBusy={setBusy} max={40} /></div></details>)}<button className="panel-secondary" type="button" disabled={galleryList.length >= 18} onClick={() => setGalleries([...galleryList,{id:crypto.randomUUID(),title:'Nova galeria',detail:'',photos:[blankPhoto()]}])}><Plus size={16} /> Nova galeria</button></div></>}
      {tab === 'sobre' && <><div className="panel-box fields-2">{field('about','label','Nome no menu')}{field('about','eyebrow','Linha acima do título')}{field('about','title','Título')}{field('about','emphasis','Título em destaque')}{field('about','body','Texto sobre você',{multiline:true})}</div><div className="panel-box"><h2>Foto da seção</h2><PhotoField label="foto Sobre" photo={draft.about.photo} set={photo => update('about',{...draft.about,photo})} setBusy={setBusy}/></div></>}
      {tab === 'contato' && <div className="panel-box fields-2">{field('contact','label','Nome no menu')}{field('contact','eyebrow','Linha acima do título')}{field('contact','title','Título')}{field('contact','emphasis','Título em destaque')}{field('contact','description','Descrição',{multiline:true})}{field('contact','button','Texto do botão')}{field('contact','email','E-mail público',{type:'email'})}{field('contact','whatsapp','WhatsApp com país e DDD',{placeholder:'5511999999999',type:'tel'})}{field('contact','instagram','Usuário do Instagram',{placeholder:'@seuusuario'})}</div>}
      {tab === 'estilo' && <div className="panel-box fields-2">{field('theme','background','Fundo',{type:'color'})}{field('theme','text','Texto',{type:'color'})}{field('theme','accent','Destaques',{type:'color'})}{field('theme','dark','Fundo escuro',{type:'color'})}<SelectField label="Fonte dos títulos" value={draft.theme.heading} set={value => update('theme',{...draft.theme,heading:value as Studio['theme']['heading']})} options={{editorial:'Editorial — Playfair Display',classica:'Clássica — Georgia',moderna:'Moderna — DM Sans'}}/><SelectField label="Fonte dos textos" value={draft.theme.body} set={value => update('theme',{...draft.theme,body:value as Studio['theme']['body']})} options={{moderna:'Moderna — DM Sans',neutra:'Neutra — Arial',classica:'Clássica — Georgia'}}/></div>}
      {tab === 'layout' && <div className="panel-box"><h2>Seções da página inicial</h2><p>A capa e o rodapé ficam nas extremidades. Use as setas para ordenar e desmarque o que quiser ocultar.</p>{draft.layout.map((section, i) => <div className="layout-row" key={section.id}><label><input aria-label={sectionNames[section.id]} type="checkbox" checked={section.visible} onChange={e => update('layout',draft.layout.map((s,j) => i === j ? {...s,visible:e.target.checked} : s))} /> {sectionNames[section.id]}</label><Reorder label={sectionNames[section.id]} index={i} total={draft.layout.length} onMove={to => update('layout',move(draft.layout,i,to))} /></div>)}</div>}
    </fieldset></main></div></div>;
}
export default function Painel() {
  const session = authClient.useSession();
  const cache = useQueryClient();
  const owner = useQuery({ ...ownerOptions, enabled: Boolean(session.data?.user) });
  const site = useQuery({ ...siteOptions, enabled: Boolean(owner.data && session.data?.user) });
  async function logout() { await authClient.signOut(); cache.removeQueries({ queryKey: ownerOptions.queryKey }); }
  if (!session.data?.user || !owner.data) return <Login waiting={session.isPending || Boolean(session.data && owner.isPending)} denied={Boolean(session.data && owner.isError)} logout={logout} />;
  if (site.isError) return <main className="simple-status"><p role="alert">Não foi possível carregar o portfólio.</p><button className="panel-secondary" onClick={() => site.refetch()}>Tentar novamente</button></main>;
  if (!site.data) return <main className="simple-status"><output>Carregando o editor…</output></main>;
  return <Editor key={session.data.user.id} initial={site.data} email={owner.data.email} logout={logout} />;
}
