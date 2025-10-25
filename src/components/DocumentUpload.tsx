import { FileText, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  content?: string;
}

interface DocumentUploadProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onUploadFiles: (files: File[]) => void;
}

const DocumentUpload = ({ files, onRemoveFile, onUploadFiles }: DocumentUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onUploadFiles(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Documents for RAG</h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
        {files.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
