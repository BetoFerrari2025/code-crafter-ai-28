import { MessageCircle } from "lucide-react";

const WhatsAppFloatingButton = () => {
  return (
    <a
      href="https://wa.me/5515997109182"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

export default WhatsAppFloatingButton;
