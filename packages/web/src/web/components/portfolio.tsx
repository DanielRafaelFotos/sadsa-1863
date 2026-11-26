import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Instagram, MessageCircle, X } from 'lucide-react';
import type { Photo, Studio } from '../../shared/studio';

export function Brand({ brand }: { brand: Studio['brand'] }) {
  return <span className="wordmark">{brand.mark && <span className="monogram" aria-hidden="true">{brand.mark}</span>}<span className="wordmark-text"><span>{brand.name}</span>{brand.suffix && <small>{brand.suffix}</small>}</span></span>;
}
function Heading({ title, emphasis }: { title: string; emphasis: string }) {
  return <>{title}{title && emphasis && ' '}{emphasis && <em>{emphasis}</em>}</>;
}
function count(n: number) { return String(n).padStart(2, '0'); }
type Gallery = Studio['portfolio']['galleries'][number];
type PhotoEntry = { photo: Photo; album: Gallery };
function Lightbox({ photos, start, close }: { photos: PhotoEntry[]; start: number; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(start);
  const item = photos[index];
  function step(delta: number) { setIndex(i => (i + delta + photos.length) % photos.length); }
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => { el?.close(); }; }, []);
  useEffect(() => {
    const el = dialog.current;
    const next = (event: KeyboardEvent) => {
      if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      setIndex(i => (i + delta + photos.length) % photos.length);
    };
    el?.addEventListener('keydown', next);
    return () => el?.removeEventListener('keydown', next);
  }, [photos.length]);
  if (!item) return null;
  return <dialog className="lightbox" ref={dialog} aria-label="Visualização de fotografias" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="light-inner"><div className="light-header"><div><p className="eyebrow">{item.album.title}</p>{item.album.detail && <small>{item.album.detail}</small>}</div><button type="button" autoFocus className="icon-btn" aria-label="Fechar fotografia" onClick={close}><X size={21}/></button></div>
    <img src={item.photo.src} alt={item.photo.alt} />
    <div className="light-controls"><button type="button" className="icon-btn" aria-label="Foto anterior" disabled={photos.length < 2} onClick={() => step(-1)}><ArrowLeft size={18} /></button><span aria-live="polite">{count(index + 1)} / {count(photos.length)}</span><button type="button" className="icon-btn" aria-label="Próxima foto" disabled={photos.length < 2} onClick={() => step(1)}><ArrowRight size={18} /></button></div></div>
  </dialog>;
}
const fonts = { editorial: 'Playfair Display, Georgia, serif', classica: 'Georgia, serif', moderna: 'DM Sans, sans-serif', neutra: 'Arial, sans-serif' };
export function Portfolio({ data, preview = false }: { data: Studio; preview?: boolean }) {
  const [slide, setSlide] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const { brand, hero, portfolio, about, contact, footer, theme } = data;
  const visible = data.layout.filter(s => s.visible);
  const slides = hero.photos.filter(p => p.src);
  const index = slides.length ? slide % slides.length : 0;
  const labels = { portfolio: portfolio.label, sobre: about.label, contato: contact.label };
  const igHandle = contact.instagram.replace(/^@/, '');
  const ig = igHandle ? `https://www.instagram.com/${igHandle}/` : '';
  const tel = contact.whatsapp.replace(/\D/g, '');
  const wa = tel ? `https://wa.me/${tel}` : '';
  const mail = contact.email ? `mailto:${contact.email}` : '';
  const mainContact = wa || mail || ig;
  const heroTarget = visible.some(s => s.id === 'portfolio') ? '#portfolio' : visible[0] ? `#${visible[0].id}` : '';
  const style = { '--paper': theme.background, '--ink': theme.text, '--accent': theme.accent, '--dark': theme.dark, '--heading': fonts[theme.heading], '--body': fonts[theme.body] } as CSSProperties;
  const galleries = portfolio.galleries.filter(g => g.photos.some(p => p.src));
  const activeFilter = galleries.some(g => g.id === filter) ? filter : null;
  const photos = galleries.filter(g => !activeFilter || g.id === activeFilter).flatMap(album => album.photos.filter(p => p.src).map(photo => ({ photo, album })));
  const hasHeroText = Boolean(hero.title || hero.emphasis || hero.description || hero.eyebrow);
  return <div className="site" style={style} id="inicio">
    <section className="hero" aria-label="Apresentação">
      {slides.map((photo, i) => <img key={`${i}-${photo.src}`} src={photo.src} alt={i === index ? photo.alt : ''} aria-hidden={i !== index} className={`hero-photo ${photo.src === '/images/daniel-capa.webp' ? 'daniel-portrait' : ''} ${i === index ? 'active' : ''}`} fetchPriority={i === 0 ? 'high' : 'auto'} loading={i === 0 ? 'eager' : 'lazy'} />)}
      <div className="hero-shade" />
      <header className="site-header"><nav aria-label="Navegação principal">{visible.map(s => labels[s.id] && <a key={s.id} href={`#${s.id}`}>{labels[s.id]}</a>)}</nav><a className="header-brand" href="#inicio" aria-label={`${brand.name} ${brand.suffix} — início`}><Brand brand={brand} /></a><div className="header-social">{ig && <a href={ig} aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={17} /></a>}{wa && <a href={wa} aria-label="WhatsApp" target="_blank" rel="noreferrer"><MessageCircle size={17} /></a>}</div></header>
      {hasHeroText ? <div className="hero-main wrap">{hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}<h1><Heading title={hero.title || (!hero.emphasis ? brand.name : '')} emphasis={hero.emphasis} /></h1>{hero.description && <p className="hero-description">{hero.description}</p>}</div> : <h1 className="sr-only">{brand.name} {brand.suffix}</h1>}
      <div className="hero-bottom">{heroTarget && <a className="scroll-link" href={heroTarget} aria-label={hero.cta || 'Ver portfólio'}>{hero.cta && <span>{hero.cta}</span>}<ChevronDown size={27} strokeWidth={1.2} /></a>}
      {slides.length > 1 && <div className="hero-controls" aria-label="Fotos da capa"><button className="icon-btn" aria-label="Foto anterior da capa" onClick={() => setSlide((index - 1 + slides.length) % slides.length)}><ArrowLeft size={16} /></button><span aria-live="polite">{count(index+1)} / {count(slides.length)}</span><button className="icon-btn" aria-label="Próxima foto da capa" onClick={() => setSlide((index + 1) % slides.length)}><ArrowRight size={16} /></button></div>}</div>
    </section>
    <main>{visible.map(s => {
      if (s.id === 'portfolio') return <section key={s.id} id="portfolio" className="work wrap">
        <div className="section-intro">{portfolio.eyebrow && <p className="eyebrow">{portfolio.eyebrow}</p>}<h2><Heading title={portfolio.title || (!portfolio.emphasis ? portfolio.label : '')} emphasis={portfolio.emphasis} /></h2>{portfolio.description && <p>{portfolio.description}</p>}
        {galleries.length > 1 && <fieldset className="work-filters"><legend className="sr-only">Filtrar fotografias</legend><button type="button" aria-pressed={activeFilter === null} onClick={() => setFilter(null)}>Todas</button>{galleries.map(g => <button type="button" key={g.id} aria-pressed={activeFilter === g.id} onClick={() => setFilter(g.id)}>{g.title}</button>)}</fieldset>}</div>
        {photos.length ? <div className="work-grid">{photos.map(({photo,album},i) => <button type="button" className="work-card" key={`${album.id}-${i}-${photo.src}`} onClick={() => setOpened(i)} aria-label={`Ampliar: ${photo.alt || `${album.title} — foto ${i+1}`}`}><img src={photo.src} alt={photo.alt} loading="lazy" /><span className="work-expand" aria-hidden="true"><ArrowUpRight size={19} /></span></button>)}</div> : <p className="gallery-empty">Ainda não há fotos no portfólio.</p>}
      </section>;
      if (s.id === 'sobre') return <section key={s.id} id="sobre" className="about wrap"><div className="about-grid">
        {about.photo.src && <img className="about-image" src={about.photo.src} alt={about.photo.alt} loading="lazy" />}
        <div>{about.eyebrow && <p className="eyebrow">{about.eyebrow}</p>}<h2><Heading title={about.title || (!about.emphasis ? about.label : '')} emphasis={about.emphasis} /></h2><div className="about-body">{about.body.split('\n\n').filter(Boolean).map((paragraph,i) => <p key={i}>{paragraph}</p>)}</div></div>
      </div></section>;
      return <section key={s.id} id="contato" className="contact"><div className="wrap contact-wrap">{contact.eyebrow && <p className="eyebrow">{contact.eyebrow}</p>}<h2><Heading title={contact.title || (!contact.emphasis ? contact.label : '')} emphasis={contact.emphasis} /></h2>{contact.description && <p>{contact.description}</p>}
        {mainContact ? <a className="contact-button" href={mainContact} target={mainContact === mail ? undefined : '_blank'} rel="noreferrer">{contact.button || 'Entrar em contato'}<ArrowUpRight size={16} /></a> : <p className="contact-pending">Canais de atendimento em breve.</p>}
        <div className="contact-links">{wa && mainContact !== wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}{mail && mainContact !== mail && <a href={mail}>E-mail</a>}{ig && mainContact !== ig && <a href={ig} target="_blank" rel="noreferrer">Instagram</a>}</div>
      </div></section>;
    })}</main>
    <footer className="site-footer"><div className="wrap footer-wrap"><a href="#inicio" aria-label="Voltar ao início"><Brand brand={brand} /></a><p>{[footer.note, brand.location].filter(Boolean).join(' · ')}</p><div className="footer-right"><small>© {new Date().getFullYear()} {brand.name} {brand.suffix}</small>{!preview && <a href="/painel">Área privada <ArrowUpRight size={12} /></a>}</div></div></footer>
    {opened !== null && <Lightbox photos={photos} start={opened} close={() => setOpened(null)} />}
  </div>;
}
