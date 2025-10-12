import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex pt-16 overflow-hidden">
        {/* Sidebar com o chat/gerador */}
        <ChatSidebar onCodeGenerated={setGeneratedCode} />
        {/* Preview do código */}
        <CodePreview generatedCode={generatedCode} />
      </div>
    </div>
  );
};

export default Editor;

