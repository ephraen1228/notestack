"use client";

import { Download, FileText, FileImage, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stripHtml } from "@/lib/note-utils";

interface ExportMenuProps {
  title: string;
  body: string;
  editorRef: React.RefObject<HTMLDivElement>;
}

export function ExportMenu({ title, body, editorRef }: ExportMenuProps) {
  const exportAsText = () => {
    const text = `${title}\n${"=".repeat(title.length)}\n\n${stripHtml(body)}`;
    downloadBlob(text, `${title}.txt`, "text/plain");
  };

  const exportAsHTML = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}h1{border-bottom:2px solid #333;padding-bottom:10px}</style></head><body><h1>${title}</h1>${body}</body></html>`;
    downloadBlob(html, `${title}.html`, "text/html");
  };

  const exportAsWord = () => {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"><meta name=Originator content="Microsoft Word 15"><title>${title}</title><style>body{font-family:Calibri,sans-serif;font-size:12pt;line-height:1.5} h1{font-size:18pt} table{border-collapse:collapse} td,th{border:1px solid #999;padding:6px}</style></head><body><h1>${title}</h1>${body}</body></html>`;
    downloadBlob(html, `${title}.doc`, "application/msword");
  };

  const exportAsPDF = () => {
    const content = editorRef.current?.innerHTML || body;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>@page{margin:2cm}body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;max-width:800px;margin:0 auto}h1{font-size:20pt;margin-bottom:20px}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const downloadBlob = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsPDF}>
          <File className="h-4 w-4 mr-2" />
          PDF (via print dialog)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsWord}>
          <FileText className="h-4 w-4 mr-2" />
          Word Document (.doc)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML}>
          <FileImage className="h-4 w-4 mr-2" />
          Web Page (.html)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText}>
          <FileText className="h-4 w-4 mr-2" />
          Plain Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}