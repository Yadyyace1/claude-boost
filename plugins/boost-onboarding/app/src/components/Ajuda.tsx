import { Popover } from "radix-ui"
import { CircleHelp } from "lucide-react"
import { cn } from "@/lib/utils"

/** Botão "?" que abre uma explicação curta ao lado. Abre com clique ou Enter e fecha com Esc. */
export function Ajuda({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Ajuda: ${titulo}`}
          className={cn("inline-grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", className)}>
          <CircleHelp className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" align="center" sideOffset={6} collisionPadding={12}
          className="z-50 w-72 rounded-xl border bg-popover p-3 text-sm leading-relaxed text-popover-foreground shadow-xl shadow-black/30 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <p className="mb-1 font-medium">{titulo}</p>
          <div className="text-muted-foreground [&_b]:text-foreground">{children}</div>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
