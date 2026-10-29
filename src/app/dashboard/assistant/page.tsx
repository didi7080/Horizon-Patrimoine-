import { AssistantChat } from "@/components/dashboard/assistant/chat";
import { Card } from "@/components/ui/card";
import { assistantConfigure } from "@/lib/assistant/client";

export const revalidate = 0;

export default function AssistantPage() {
  if (!assistantConfigure()) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assistant IA</h1>
          <p className="mt-1 text-muted">Questions administratives, juridiques, techniques — et actions automatisées.</p>
        </div>
        <Card className="p-6 text-sm text-muted-foreground">
          L’assistant IA n’est pas encore configuré sur cette instance ArtisanRDV.
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Assistant IA</h1>
        <p className="mt-1 text-muted">Questions administratives, juridiques, techniques — et actions automatisées.</p>
      </div>
      <AssistantChat />
    </div>
  );
}
