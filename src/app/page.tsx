import { AppShell } from "@/components/layout/AppShell";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { LayoutProvider } from "@/lib/layout-context";

export default function Home() {
  return (
    <LayoutProvider>
      <AppShell>
        <ChatInterface />
      </AppShell>
    </LayoutProvider>
  );
}
