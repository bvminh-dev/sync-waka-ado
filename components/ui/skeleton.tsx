import { cn } from "@/lib/format";

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-line-soft/60", className)}
      {...rest}
    />
  );
}
