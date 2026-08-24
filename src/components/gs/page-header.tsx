import { locationLabel } from "@/lib/gs/format";
import { useGreenShield } from "@/lib/gs/store";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  showLocation = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  showLocation?: boolean;
}) {
  const { location, hydrated } = useGreenShield();
  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="label-micro">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
        {showLocation ? (
          <p className="num text-muted-foreground mt-3 text-[10px] uppercase">
            Location · <span className="text-foreground font-bold">{hydrated ? locationLabel(location) : "loading"}</span>
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
