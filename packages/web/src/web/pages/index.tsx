import { useQuery } from '@tanstack/react-query';
import { siteOptions } from '../queries/studio';
import { Portfolio } from '../components/portfolio';
import { initialStudio } from '../../shared/studio';
export default function Index() {
  const site = useQuery(siteOptions);
  return <><Portfolio data={site.data ?? initialStudio} />{site.isPending && <output className="sr-only">Carregando portfólio…</output>}{site.isError && <aside className="offline-note"><output>Mostrando a versão inicial.</output> <button onClick={() => site.refetch()}>Tentar novamente</button></aside>}</>;
}
