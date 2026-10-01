import { mediaUrl } from "@/lib/format";
import type { HomeAd } from "@/lib/settings";

/**
 * Faixa de publicidade da página inicial (proporção 1063 × 139).
 * Anúncio ativo → imagem com link do anunciante. Sem anúncio → "Anuncie aqui" (se houver contato) ou nada.
 */
export function HomeAdBanner({ ad, preview = false }: { ad: HomeAd; preview?: boolean }) {
  const url = mediaUrl(ad.image);

  if (ad.active && url) {
    // eslint-disable-next-line @next/next/no-img-element
    const img = <img src={url} alt={ad.alt} className="aspect-[1063/139] w-full rounded-xl object-cover" />;
    return (
      <div className="relative mb-6">
        {ad.link ? (
          <a href={ad.link} target="_blank" rel="sponsored noopener" className="block">
            {img}
          </a>
        ) : (
          img
        )}
        <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">
          Publicidade
        </span>
      </div>
    );
  }

  if (ad.contact) {
    return (
      <a
        href={ad.contact}
        target="_blank"
        rel="noopener"
        className="mb-6 flex aspect-[1063/139] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-cream-2 px-4 text-center transition hover:border-tomato/50"
      >
        <span className="text-sm font-bold sm:text-lg">Anuncie aqui no Meu PetTube</span>
        <span className="mt-0.5 text-xs text-muted sm:text-sm">Seu negócio na página inicial de quem ama pets · fale com a gente</span>
      </a>
    );
  }

  return preview ? <p className="text-sm text-muted">Nada aparece: não há anúncio ativo nem contato para “Anuncie aqui”.</p> : null;
}
