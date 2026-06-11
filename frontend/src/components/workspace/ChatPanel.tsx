'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Message, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Send, Paperclip, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  workspaceId: string;
  currentUser: User;
}

export default function ChatPanel({ workspaceId, currentUser }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/chat/${workspaceId}/messages/`)
      .then((res) => setMessages(res.data.results || res.data));
  }, [workspaceId]);

  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; message?: Message; user_id?: number; username?: string; is_typing?: boolean };
    if (msg.type === 'chat_message' && msg.message) {
      setMessages((prev) => [...prev, msg.message!]);
    } else if (msg.type === 'typing') {
      const name = msg.username!;
      if (msg.is_typing) {
        setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
        setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u !== name)), 3000);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== name));
      }
    }
  }, []);

  const { send, isConnected } = useWebSocket(`ws/chat/${workspaceId}/`, handleWsMessage);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    send({ type: 'chat_message', content: text });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      send({ type: 'typing', is_typing: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => send({ type: 'typing', is_typing: false }), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post(`/chat/${workspaceId}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => [...prev, data]);
      toast.success('File shared!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isImage = (name: string) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);

  const avatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-teal-100 text-teal-700',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Connection status bar */}
      {!isConnected && (
        <div className="flex items-center justify-center gap-2 py-2 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs font-semibold">
          <WifiOff className="w-3.5 h-3.5" />
          Reconnecting to chat…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 gradient-brand-soft rounded-2xl flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isOwn && (
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${avatarColor(msg.sender_name)}`}>
                  {msg.sender_name[0]?.toUpperCase()}
                </div>
              )}

              <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-xs font-semibold text-gray-500 ml-1">{msg.sender_name}</span>
                )}
                {msg.message_type === 'file' && isImage(msg.file_name) ? (
                  <a
                    href={msg.file_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block rounded-2xl overflow-hidden shadow-sm border ${
                      isOwn ? 'rounded-br-sm border-green-200' : 'rounded-bl-sm border-gray-200'
                    } hover:opacity-90 transition-opacity`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.file_url || ''}
                      alt={msg.file_name}
                      className="max-w-[260px] max-h-[300px] object-cover block"
                    />
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                      isOwn ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <Paperclip className="w-3 h-3" />
                      {msg.file_name}
                    </div>
                  </a>
                ) : msg.message_type === 'file' ? (
                  <a
                    href={msg.file_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 font-medium shadow-sm ${
                      isOwn
                        ? 'gradient-brand text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {msg.file_name || 'File'}
                  </a>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isOwn
                      ? 'gradient-brand text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                )}
                <span className="text-[11px] text-gray-400 px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">…</span>
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="text-xs text-gray-500 ml-1.5">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 hover:border-green-300 focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(22,163,74,0.1)] px-3.5 py-2.5 transition-all">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-gray-400 hover:text-green-600 transition-colors shrink-0"
            title="Attach file"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              : <Paperclip className="w-4 h-4" />
            }
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            className="gradient-brand disabled:opacity-0 text-white p-1.5 rounded-xl transition-all disabled:scale-0 scale-100 shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end mt-1.5 px-1">
          <span className={`flex items-center gap-1 text-[11px] ${isConnected ? 'text-green-500' : 'text-amber-500'}`}>
            {isConnected
              ? <><Wifi className="w-3 h-3" /> Connected</>
              : <><WifiOff className="w-3 h-3" /> Reconnecting…</>
            }
          </span>
        </div>
      </div>
    </div>
  );
}
