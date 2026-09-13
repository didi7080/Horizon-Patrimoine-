import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className={`w-full ${wide ? "max-w-xl" : "max-w-sm"}`}>
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <Card className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}
