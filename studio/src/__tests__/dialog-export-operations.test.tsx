import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportDialog } from "../components/ui/dialog-export-operations";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMutation } from "@connectrpc/connect-query";
import { APISpecificationType } from "@wundergraph/cosmo-connect/dist/platform/v1/platform_pb";

vi.mock("@connectrpc/connect-query", () => {
  return {
    useMutation: vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("ExportDialog", () => {
  const defaultProps = {
    federatedGraphName: "test-graph",
    namespace: "test-namespace",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it("renders without crashing", async () => {
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ExportDialog {...defaultProps} />
        </TooltipProvider>
      </QueryClientProvider>
    );

    const downloadButton = screen.getByRole("button", { name: "Export Operations" });
    fireEvent.click(downloadButton);
    
    const title = await screen.findByText("Operations Export");
    expect(title).toBeInTheDocument();
  });

  it("generates correct filename for graph-only export", async () => {
    const mutateFn = vi.fn();

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mutateFn,
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ExportDialog {...defaultProps} />
        </TooltipProvider>
      </QueryClientProvider>
    );

    const downloadButton = screen.getByRole("button", { name: "Export Operations" });
    fireEvent.click(downloadButton);
    
    const title = await screen.findByText("Operations Export");
    expect(title).toBeInTheDocument();

    const exportButton = screen.getByRole("button", { name: "Export" });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mutateFn).toHaveBeenCalledWith({
        federatedGraphName: "test-graph",
        namespace: "test-namespace",
        format: APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN,
        operationId: undefined,
        clientId: undefined,
      });
    });
  });

  it("generates correct filename for client-only export", async () => {
    const mutateFn = vi.fn();

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mutateFn,
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ExportDialog {...defaultProps} clientId="test-client" clientName="Test Client" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    const downloadButton = screen.getByRole("button", { name: "Export Operations" });
    fireEvent.click(downloadButton);
    
    const title = await screen.findByText("Operations Export");
    expect(title).toBeInTheDocument();

    const exportButton = screen.getByRole("button", { name: "Export" });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mutateFn).toHaveBeenCalledWith({
        federatedGraphName: "test-graph",
        namespace: "test-namespace",
        format: APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN,
        operationId: undefined,
        clientId: "test-client",
      });
    });
  });

  it("generates correct filename for operation-only export", async () => {
    const mutateFn = vi.fn();

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: mutateFn,
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ExportDialog 
            {...defaultProps} 
            operation={{ 
              id: "test-operation-id", 
              operationNames: ["TestOperation"] 
            }} 
          />
        </TooltipProvider>
      </QueryClientProvider>
    );

    const downloadButton = screen.getByRole("button", { name: "Export Operations" });
    fireEvent.click(downloadButton);
    
    const title = await screen.findByText("Operations Export");
    expect(title).toBeInTheDocument();

    expect(screen.getByText("Export this operation in your preferred format.")).toBeInTheDocument();

    const exportButton = screen.getByRole("button", { name: "Export" });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mutateFn).toHaveBeenCalledWith({
        federatedGraphName: "test-graph",
        namespace: "test-namespace",
        format: APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN,
        operationId: "test-operation-id",
        clientId: undefined,
      });
    });
  });

  describe("OpenAPI format", () => {
    it("exports graph operations in OpenAPI format", async () => {
      const mutateFn = vi.fn();
  
      (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      });
  
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ExportDialog {...defaultProps} />
          </TooltipProvider>
        </QueryClientProvider>
      );
  
      const downloadButton = screen.getByRole("button", { name: "Export Operations" });
      fireEvent.click(downloadButton);
      
      const title = await screen.findByText("Operations Export");
      expect(title).toBeInTheDocument();
      
      const openApiRadio = await screen.findByRole("radio", { name: "OpenAPI Specification" });
      fireEvent.click(openApiRadio);
  
      const exportButton = await screen.findByRole("button", { name: "Export" });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith({
          federatedGraphName: "test-graph",
          namespace: "test-namespace",
          format: APISpecificationType.API_SPECIFICATION_TYPE_OPENAPI,
          operationId: undefined,
          clientId: undefined,
        });
      });
    });
  
    it("exports client operations in OpenAPI format", async () => {
      const mutateFn = vi.fn();
  
      (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      });
  
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ExportDialog {...defaultProps} clientId="test-client" clientName="Test Client" />
          </TooltipProvider>
        </QueryClientProvider>
      );
  
      const downloadButton = screen.getByRole("button", { name: "Export Operations" });
      fireEvent.click(downloadButton);
      
      const title = await screen.findByText("Operations Export");
      expect(title).toBeInTheDocument();
      
      const openApiRadio = await screen.findByRole("radio", { name: "OpenAPI Specification" });
      fireEvent.click(openApiRadio);
  
      const exportButton = await screen.findByRole("button", { name: "Export" });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith({
          federatedGraphName: "test-graph",
          namespace: "test-namespace",
          format: APISpecificationType.API_SPECIFICATION_TYPE_OPENAPI,
          operationId: undefined,
          clientId: "test-client",
        });
      });
    });
  
    it("exports single operation in OpenAPI format", async () => {
      const mutateFn = vi.fn();
  
      (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      });
  
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ExportDialog 
              {...defaultProps} 
              operation={{ 
                id: "test-operation-id", 
                operationNames: ["TestOperation"] 
              }} 
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
  
      const downloadButton = screen.getByRole("button", { name: "Export Operations" });
      fireEvent.click(downloadButton);
      
      const title = await screen.findByText("Operations Export");
      expect(title).toBeInTheDocument();
      
      const openApiRadio = await screen.findByRole("radio", { name: "OpenAPI Specification" });
      fireEvent.click(openApiRadio);
  
      const exportButton = await screen.findByRole("button", { name: "Export" });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith({
          federatedGraphName: "test-graph",
          namespace: "test-namespace",
          format: APISpecificationType.API_SPECIFICATION_TYPE_OPENAPI,
          operationId: "test-operation-id",
          clientId: undefined,
        });
      });
    });
  });
});
