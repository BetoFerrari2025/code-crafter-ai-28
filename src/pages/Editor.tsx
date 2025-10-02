import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/CodePreview";
import Header from "@/components/Header";

const Editor = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex pt-16 overflow-hidden">
        <ChatSidebar />
        <CodePreview />
      </div>
    </div>
  );
};

export default Editor;
