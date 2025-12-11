import { AppShell } from "@/components/layout/AppShell";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ErrorBoundary } from "@/components/error-boundary";
import { LayoutProvider } from "@/lib/layout-context";

export default function Home() {
  return (
    <LayoutProvider>
      <AppShell>
        <ErrorBoundary>
          <ChatInterface />
        </ErrorBoundary>
      </AppShell>
    </LayoutProvider>
  );
}
