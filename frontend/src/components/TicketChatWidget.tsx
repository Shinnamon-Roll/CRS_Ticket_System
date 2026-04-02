import { useMemo, useRef, useState } from 'react';
import { ImagePlus, MessageCircle, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TicketChatWidget() {
  const {
    tickets,
    users,
    currentUser,
    currentRole,
    activeChatTicketId,
    closeTicketChat,
    getTicketChatMessages,
    sendTicketChatMessage,
    canCurrentUserChat,
  } = useApp();

  const [messageText, setMessageText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ticket = useMemo(
    () => tickets.find((item) => item.id === activeChatTicketId),
    [activeChatTicketId, tickets]
  );

  const messages = ticket ? getTicketChatMessages(ticket.id) : [];
  const canChat = ticket ? canCurrentUserChat(ticket) : false;

  const participantText = useMemo(() => {
    if (!ticket) return '-';

    const requester = users.find((u) => u.id === ticket.reportedBy)?.name || ticket.reportedByName;
    const assignee = ticket.assignedTo
      ? users.find((u) => u.id === ticket.assignedTo)?.name || ticket.assignedToName || `User #${ticket.assignedTo}`
      : 'ยังไม่มีผู้รับงาน';

    return `${requester} x ${assignee}`;
  }, [ticket, users]);

  const handleSend = async () => {
    if (!ticket || !canChat || sending) return;

    setSending(true);
    try {
      await sendTicketChatMessage(ticket.id, {
        text: messageText,
        images: selectedImages,
      });
      setMessageText('');
      setSelectedImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (!ticket) {
    return (
      <div className="fixed bottom-5 right-5 z-[60]">
        <div className="flex items-center gap-2 rounded-full bg-brown-700 text-cream-50 px-4 py-2.5 shadow-lg shadow-brown-900/20">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">คลิกที่การ์ดเพื่อเปิดแชท</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] h-[520px] max-h-[75vh] bg-white border border-brown-200 rounded-2xl shadow-2xl shadow-brown-900/15 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-brown-100 bg-cream-100/90">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-brown-500 font-semibold">Ticket Chat</p>
            <h3 className="text-sm font-bold text-brown-800 truncate">
              {ticket.code} - {ticket.title}
            </h3>
            <p className="text-[11px] text-brown-500 mt-1 line-clamp-1">ผู้คุย: {participantText}</p>
          </div>
          <button
            onClick={closeTicketChat}
            className="shrink-0 p-1.5 rounded-lg hover:bg-brown-100 text-brown-500 hover:text-brown-700 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gradient-to-b from-cream-50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs text-brown-400">ยังไม่มีข้อความในแชทนี้ เริ่มบทสนทนาได้เลย</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm border ${
                    isMine
                      ? 'bg-brown-700 text-cream-50 border-brown-700 rounded-br-sm'
                      : 'bg-white text-brown-800 border-brown-100 rounded-bl-sm'
                  }`}
                >
                  <p className={`text-[10px] mb-1 ${isMine ? 'text-cream-100/85' : 'text-brown-400'}`}>
                    {msg.senderName}
                  </p>
                  {msg.text ? <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p> : null}
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="chat upload"
                      className="mt-2 rounded-lg max-h-48 w-full object-cover border border-black/5"
                    />
                  ) : null}
                  <p className={`text-[10px] mt-1.5 ${isMine ? 'text-cream-100/80' : 'text-brown-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-brown-100 px-3 py-2.5 bg-white">
        {!canChat ? (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2">
            แชทนี้คุยได้เฉพาะผู้แจ้งปัญหาและผู้รับงานเท่านั้น (บทบาทปัจจุบัน: {currentRole})
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg border border-brown-200 text-brown-600 hover:bg-brown-50 transition-colors"
                aria-label="Upload image"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedImages(files);
                }}
              />
              {selectedImages.length > 0 ? (
                <span className="text-[11px] text-brown-500 truncate">แนบรูป {selectedImages.length} รูป</span>
              ) : (
                <span className="text-[11px] text-brown-400">แนบรูปได้หลายรูปต่อข้อความ</span>
              )}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="พิมพ์ข้อความ..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-brown-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-300"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!messageText.trim() && selectedImages.length === 0)}
                className="h-[42px] px-3 rounded-lg bg-brown-700 text-cream-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brown-800 transition-colors inline-flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-semibold">ส่ง</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
