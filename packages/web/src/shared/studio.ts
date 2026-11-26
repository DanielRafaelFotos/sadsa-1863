import { z } from 'zod';
const line = z.string().trim().max(150);
const paragraph = z.string().trim().max(4000);
const image = z.string().trim().max(1500).refine(value => !value || /^\/images\/[a-z\d.-]+$/i.test(value) || /^https:\/\/[^\s]+$/i.test(value), 'Use uma URL HTTPS para a imagem.');
const color = z.string().regex(/^#[a-f\d]{6}$/i);
const photo = z.object({ src: image, alt: line });
export const sections = ['portfolio', 'sobre', 'contato'] as const;
export const studioSchema = z.object({
  brand: z.object({ name: line.min(1), suffix: line, mark: line, location: line }),
  hero: z.object({ eyebrow: line, title: line, emphasis: line, description: paragraph, cta: line, photos: z.array(photo).min(1).max(12) }),
  portfolio: z.object({ label: line, eyebrow: line, title: line, emphasis: line, description: paragraph, galleries: z.array(z.object({ id: z.string().max(80), title: line.min(1), detail: line, photos: z.array(photo).max(40) })).max(18) }),
  about: z.object({ label: line, eyebrow: line, title: line, emphasis: line, body: paragraph, photo }),
  contact: z.object({ label: line, eyebrow: line, title: line, emphasis: line, description: paragraph, email: z.union([z.literal(''), z.email().max(150)]), whatsapp: z.string().regex(/^\+?[\d ()-]{0,26}$/), instagram: z.string().regex(/^@?[a-z\d._]{0,30}$/i), button: line }),
  footer: z.object({ note: line }),
  theme: z.object({ background: color, text: color, accent: color, dark: color, heading: z.enum(['editorial','classica','moderna']), body: z.enum(['moderna','neutra','classica']) }),
  layout: z.array(z.object({ id: z.enum(sections), visible: z.boolean() })).length(3).refine(value => new Set(value.map(s => s.id)).size === 3),
});
export type Studio = z.infer<typeof studioSchema>;
export type Photo = z.infer<typeof photo>;
export const blankPhoto = (): Photo => ({ src: '', alt: '' });
const pic = (name: string, alt: string): Photo => ({ src: `/images/${name}.webp`, alt });
const shot = (id: number, alt: string) => pic(`daniel-foto-${id}`, alt);
export const initialStudio: Studio = {
  brand: { name: 'Daniel Rafael', suffix: 'Studio', mark: 'DR', location: 'Delmiro Gouveia, AL' },
  hero: { eyebrow: '', title: '', emphasis: '', description: '', cta: 'Ver fotografias', photos: [pic('daniel-capa', 'Retrato de Daniel Rafael de perfil, sobre fundo escuro')] },
  portfolio: { label: 'Fotografias', eyebrow: '', title: 'Fotografias', emphasis: '', description: '', galleries: [
    { id: 'casamentos', title: 'Casamentos', detail: 'Registros do dia', photos: [shot(0,'Noiva de costas vista de um corredor'), shot(1,'Noiva sentada próxima à janela'), shot(2,'Véu de noiva em movimento'), shot(3,'Noiva com buquê em preto e branco'), shot(8,'Noivos em meio à comemoração'), shot(25,'Noivo em retrato em preto e branco'), shot(34,'Casal em um retrato em preto e branco'), shot(15,'Cerimônia de casamento na igreja')] },
    { id: 'retratos', title: 'Retratos', detail: 'Retratos de casamento', photos: [shot(7,'Noiva com buquê de flores brancas'), shot(37,'Retrato de noiva ao ar livre'), shot(42,'Noiva em um momento de preparação'), shot(45,'Noiva de perfil ao lado da janela')] },
    { id: 'detalhes', title: 'Detalhes', detail: 'Pequenas memórias do dia', photos: [shot(5,'Detalhe de uma aliança em preto e branco'), shot(9,'Sapatos de noiva em preto e branco'), shot(30,'Detalhe das mãos dos noivos'), shot(35,'Duas alianças em preto e branco')] },
  ] },
  about: { label: 'Sobre', eyebrow: '', title: 'Sobre o estúdio', emphasis: '', body: 'Sou Daniel Rafael, fotógrafo de casamentos em Delmiro Gouveia, Alagoas.', photo: blankPhoto() },
  contact: { label: 'Contato', eyebrow: '', title: 'Vamos conversar?', emphasis: '', description: 'Conte um pouco sobre seu casamento.', email: '', whatsapp: '5582982316284', instagram: 'danielrafts', button: 'Falar no WhatsApp' },
  footer: { note: 'Fotografia de casamento' },
  theme: { background: '#090909', text: '#f3f1ed', accent: '#cfbd97', dark: '#101010', heading: 'moderna', body: 'moderna' },
  layout: sections.map(id => ({ id, visible: true })),
};
