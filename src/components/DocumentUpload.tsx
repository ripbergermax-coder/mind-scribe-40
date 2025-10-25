import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

interface DocumentUploadProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

const DocumentUpload = ({ files, onRemoveFile }: DocumentUploadProps) => {
  if (files.length === 0) return null;

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "bg-secondary border border-border",
                "hover:border-primary transition-colors group"
              )}
            >
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
