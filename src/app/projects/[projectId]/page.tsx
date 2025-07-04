import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

interface Props {
  params: Promise<{
    projectId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { projectId } = await params;

  // [TRPC] (use server) Fetching data messages for the project
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    })
  );
  // [TRPC] (use server) Fetching data project
  void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  );

  return (
    // [TanStack Query] HydrationBoundary SSR para receber os dados do cache serializados
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* [React] Suspense para carregamento assíncrono de componentes ou dados, permitindo que você mostre um fallback (ex: um spinner, loading) enquanto algo está sendo carregado */}
      <Suspense fallback={<p>Loading...</p>}>
        <ProjectView projectId={projectId} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
