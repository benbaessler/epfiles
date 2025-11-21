import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DocumentViewer } from "@/components/evidence/DocumentViewer";

export default function Home() {
  return (
    <AppShell
      sidebar={<Sidebar />}
      evidence={<DocumentViewer />}
    >
      <ChatInterface />
    </AppShell>
  );
}
