import { useState } from "react";
import { useMutation } from "@connectrpc/connect-query";
import { exportPersistedOperations } from "@wundergraph/cosmo-connect/dist/platform/v1/platform-PlatformService_connectquery";
import { APISpecificationType } from "@wundergraph/cosmo-connect/dist/platform/v1/platform_pb";
import { EnumStatusCode } from "@wundergraph/cosmo-connect/dist/common/common_pb";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../dialog";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { toast } from "../use-toast";

interface ExportDialogProps {
  operation?: { 
    id: string; 
    operationNames: string[]; 
  };
  clientId?: string | null;
  clientName?: string;
  federatedGraphName: string;
  namespace: string;
}

export const ExportDialog = ({ 
  operation, 
  clientId,
  clientName,
  federatedGraphName,
  namespace
}: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<APISpecificationType>(APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN);

  const { mutate: exportOps, isPending } = useMutation(exportPersistedOperations, {
    onSuccess(data) {
      if (data.response?.code !== EnumStatusCode.OK) {
        toast({
          variant: "destructive",
          title: "Could not export operations",
          description: data.response?.details ?? "Please try again",
        });
        return;
      }

      // Generate filename based on context
      let fileName = `${federatedGraphName}.json`;
      if (clientId && clientName) {
        fileName = `${federatedGraphName}-${clientName}.json`;
      }
      if (operation?.operationNames?.length) {
        fileName = `${operation.operationNames[0]}.json`;
      }

      try {
        const blob = new Blob([data.exportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Operation Exported",
          description: `Exported as ${fileName}, please check your downloads folder`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "Could not download the file. Please try again.",
        });
      }

      setIsOpen(false);
    },
    onError(error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  });

  const handleExport = () => {
    if (!namespace || !federatedGraphName) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Missing required parameters. Please try again.",
      });
      return;
    }

    exportOps({
      federatedGraphName,
      namespace,
      format,
      operationId: operation?.id,
      clientId: clientId || undefined,
    });
  };

  const tooltipContent = operation 
    ? "Export Operation" 
    : clientId 
      ? "Export Client Operations" 
      : "Export All Operations";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setTimeout(() => setIsOpen(true), 0);
            }}
            aria-label="Export Operations"
          >
            <DownloadIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Operations Export</DialogTitle>
          <DialogDescription>
            {operation ? (
              <>Export this operation in your preferred format.</>
            ) : clientId ? (
              <>Export client operations in your preferred format.</>
            ) : (
              <>Export operations for <code className="text-primary">{federatedGraphName}</code> in your preferred format.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            defaultValue={APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN.toString()}
            value={format.toString()}
            onValueChange={(value) => setFormat(parseInt(value) as APISpecificationType)}
            className="grid gap-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem 
                id="postman" 
                value={APISpecificationType.API_SPECIFICATION_TYPE_POSTMAN.toString()}
              />
              <Label htmlFor="postman" className="font-normal cursor-pointer">
                Postman Collection
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem 
                id="openapi" 
                value={APISpecificationType.API_SPECIFICATION_TYPE_OPENAPI.toString()}
              />
              <Label htmlFor="openapi" className="font-normal cursor-pointer">
                OpenAPI Specification
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 