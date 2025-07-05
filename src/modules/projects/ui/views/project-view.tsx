"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CrownIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrowserViewer } from "@/components/browser-view";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "browser">("preview");

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p>Loading project header...</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>

          <Suspense fallback={<p>Loading messages...</p>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle className="hover:bg-primary transition-colors" />

        <ResizablePanel defaultSize={65} minSize={50}>
          <div className="w-full flex items-center p-2 border-b gap-x-2">
            <div className="flex-1" />
            <Button asChild size="sm" variant="tertiary">
              <Link href="/pricing">
                <CrownIcon /> Upgrade
              </Link>
            </Button>
          </div>
          <div className="h-full w-full flex items-center justify-center">
            {!!activeFragment?.sandboxUrl ? (
              // <BrowserView url={activeFragment.sandboxUrl} />
              <BrowserViewer projectId={projectId} />
            ) : (
              <p className="text-muted-foreground">
                Nenhum resultado de browser disponível.
              </p>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
