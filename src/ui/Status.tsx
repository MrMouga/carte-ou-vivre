import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type Message = 'chargement' | 'erreur' | 'fond-indisponible' | null;

// Message carte (Figma « Message carte » : Chargement · Erreur · Fond indisponible ; tableau des états 9:514).
// Une zone annoncée (aria-live), toujours présente, pour que les lecteurs d'écran lisent chaque changement ;
// sans le rôle `status`, déjà porté par le compte des communes.
// Chargement et erreur au centre de la zone de carte ; fond indisponible en haut (à 390 px, en bas de la bande
// visible, juste au-dessus de la feuille, ouverte ou repliée (H50 d'interface-telephone) : le haut est pris par la légende
// et le zoom).
export function Status({ message, onReessayer, repliee = false }: { message: Message; onReessayer: () => void; repliee?: boolean }) {
  return (
    <div className={cn('pointer-events-none absolute inset-4 flex gap-4', repliee ? 'max-bureau:bottom-(--hauteur-repliee)' : 'max-bureau:bottom-feuille')}>
      <div className="w-reglages shrink-0 max-bureau:hidden" />
      <div
        aria-live="polite"
        data-testid="message-carte"
        className={
          message === 'fond-indisponible' ? 'flex flex-1 items-start justify-center max-bureau:items-end' : 'flex flex-1 flex-col items-center justify-center gap-2'
        }
      >
        {message === 'chargement' && <p className="rounded-base border border-border bg-card px-4 py-2 text-texte text-muted-foreground">Chargement de la carte…</p>}
        {message === 'erreur' && (
          <>
            <p className="rounded-base border border-border bg-card px-4 py-2 text-texte">La carte n'a pas pu se charger.</p>
            <Button className="pointer-events-auto" onClick={onReessayer}>
              Réessayer
            </Button>
          </>
        )}
        {message === 'fond-indisponible' && (
          <p className="rounded-base border border-border bg-card px-2 py-1 text-secondaire text-muted-foreground">Fond de carte indisponible</p>
        )}
      </div>
      <div className="w-liste shrink-0 max-bureau:hidden" />
    </div>
  );
}
