import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const handleApiError = (error: unknown, context: string) => {
  if (!(error instanceof TRPCClientError)) {
    console.error(`[${context}] Non-TRPC error:`, error);
    return;
  }

  if (typeof window === "undefined") return;

  // Error de autorización (401/403)
  if (error.message === UNAUTHED_ERR_MSG) {
    window.location.href = getLoginUrl();
    return;
  }

  // Error de red o timeout
  if (error.cause && error.cause instanceof TypeError) {
    console.error(`[${context}] Network error:`, error.cause);
    // Aquí podrías mostrar un toast o notificación al usuario
    return;
  }

  // Errores del servidor (500)
  if (error.data?.code === "INTERNAL_SERVER_ERROR") {
    console.error(`[${context}] Server error (500):`, error.data);
    // Mostrar mensaje genérico de error del servidor
    return;
  }

  // Errores de validación (400)
  if (error.data?.code === "BAD_REQUEST") {
    console.error(`[${context}] Validation error (400):`, error.data);
    // Los errores de validación suelen manejarse en el componente específico
    return;
  }

  // Otros errores no especificados
  console.error(`[${context}] Unknown TRPC error:`, error);
};

// Suscribirse a errores en queries
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    handleApiError(error, "QUERY");
  }
});

// Suscribirse a errores en mutations
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    handleApiError(error, "MUTATION");
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </trpc.Provider>
);
