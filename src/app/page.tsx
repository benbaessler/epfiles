import { AppShell } from "@/components/layout/AppShell";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DocumentViewer } from "@/components/evidence/DocumentViewer";
import { LayoutProvider } from "@/lib/layout-context";

export default function Home() {
  return (
    <LayoutProvider>
      <AppShell
        evidence={<DocumentViewer />}
      >
        <ChatInterface />
      </AppShell>
    </LayoutProvider>
  );
}
