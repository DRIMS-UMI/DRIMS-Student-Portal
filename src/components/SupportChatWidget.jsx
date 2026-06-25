import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import apiRequest, { BASE_API_URL } from '../utils/apiRequestUrl';
import { FiMessageSquare, FiX, FiSend, FiPaperclip, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

const SupportChatWidget = () => {
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSupportOnline, setIsSupportOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [isRegisteredGuest, setIsRegisteredGuest] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Check initial support status via REST or a quick socket connection
  useEffect(() => {
    // Quick socket connection to check status
    const socketUrl = BASE_API_URL.replace('/api/v1', '');
    const tempSocket = io(socketUrl, {
      query: { isGuest: 'true' }, // Minimal connection just to check status
      transports: ["websocket", "polling"],
    });

    tempSocket.on('connect', () => {
      tempSocket.emit('check_support_status');
    });

    tempSocket.on('support_status_changed', (data) => {
      setIsSupportOnline(data.isOnline);
    });

    // Cleanup temp socket when we open the real one
    return () => {
      tempSocket.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartChat = async (e) => {
    if (e) e.preventDefault();
    
    // Create ticket via REST API
    try {
      setIsSending(true);
      const token = localStorage.getItem('umi_student_auth_token') || localStorage.getItem('token');
      
      const ticketData = {
        subject: 'Live Chat Request',
        priority: 'MEDIUM',
      };

      if (!token) {
        if (!guestInfo.name || !guestInfo.email) {
          toast.error("Name and Email are required");
          return;
        }
        ticketData.guestName = guestInfo.name;
        ticketData.guestEmail = guestInfo.email;
        ticketData.guestPhone = guestInfo.phone;
      }

      // We'll use axios directly if no token, otherwise apiRequest
      const res = await apiRequest.post('/tickets', ticketData);
      
      const newTicket = res.data.ticket;
      setTicketId(newTicket.id);
      setTicketNumber(newTicket.ticketNumber);
      setIsRegisteredGuest(true);
      
      // Now connect actual socket to the ticket room
      const socketUrl = BASE_API_URL.replace('/api/v1', '');
      const authOpts = token ? { auth: { token } } : { query: { isGuest: 'true', guestId: newTicket.guestEmail || 'guest' } };
      
      const chatSocket = io(socketUrl, {
        ...authOpts,
        transports: ["websocket", "polling"],
      });

      chatSocket.on('connect', () => {
        chatSocket.emit('join_ticket', { ticketId: newTicket.id });
      });

      chatSocket.on('new_support_message', (data) => {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      });

      setSocket(chatSocket);

      // Add welcome message depending on status
      const welcomeMsg = isSupportOnline 
        ? "Hello! A support agent will be with you shortly." 
        : "Hello! Our support team is currently offline. We have received your request and will reply via email soon. You can still leave additional messages here.";
        
      setMessages([{
        id: 'welcome',
        message: "Hello! An administrator has been notified and will be with you shortly.",
        createdAt: new Date().toISOString(),
        senderAdminId: 'system' // mark as system/admin
      }]);

    } catch (err) {
      toast.error('Failed to start chat. Please try again later.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('message', newMessage);
      if (file) formData.append('attachment', file);
      
      // Note: For guest users without a token, we might need a specific endpoint or guest token.
      // But we mapped apiRequest which sends `umi_student_token` if exists.
      // Assuming backend allows public message posting if guestEmail matches, 
      // or we just send it and if it fails due to auth we need a guest ticket token.
      // For now, we'll send it via REST. If REST needs auth, we'll need a guest-specific route.
      
      const res = await apiRequest.post(`/tickets/${ticketId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const sentMsg = res.data.data;
      setNewMessage('');
      setFile(null);

      if (socket) {
        socket.emit('support_message', { ticketId: ticketId, message: sentMsg });
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const hasToken = !!(localStorage.getItem('umi_student_auth_token') || localStorage.getItem('token'));
  const needsGuestForm = !hasToken && !isRegisteredGuest;

  if (location.pathname.includes('/direct-messages')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-lg shadow-2xl border border-gray-200 mb-4 overflow-hidden flex flex-col h-[500px] max-h-[80vh] transition-all duration-300 transform origin-bottom-right">
          {/* Header */}
          <div className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-semibold text-lg">IT Support Chat</h3>
              <p className="text-[10px] text-blue-100 font-medium uppercase tracking-wide mt-0.5 mb-1">
                Help from the IT for any issues
              </p>
              <div className="flex items-center text-xs opacity-90">
                <span className={`w-2 h-2 rounded-full mr-2 ${isSupportOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                {isSupportOnline ? 'Agents Online' : 'Agents Offline (Email Mode)'}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 p-1 rounded-md transition-colors self-start mt-1">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {needsGuestForm ? (
              // Guest Form
              <div className="p-6 flex flex-col justify-center h-full">
                <div className="text-center mb-6">
                  <FiMessageSquare className="w-12 h-12 text-blue-800 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-gray-600">Please provide your details to start the chat.</p>
                </div>
                <form onSubmit={handleStartChat} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Name *</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                        type="text" required
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                        type="email" required
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                        type="tel"
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full bg-blue-800 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-900 transition-colors mt-2"
                  >
                    {isSending ? 'Starting...' : 'Start Chat'}
                  </button>
                </form>
              </div>
            ) : !ticketId ? (
              // Logged in user, hasn't clicked start yet
              <div className="p-6 flex flex-col justify-center items-center h-full text-center">
                <FiMessageSquare className="w-16 h-16 text-blue-800 mx-auto mb-4 opacity-20" />
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-6">Start a conversation with our support team.</p>
                <button 
                  onClick={handleStartChat}
                  disabled={isSending}
                  className="bg-blue-800 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-900 transition-colors"
                >
                  {isSending ? 'Starting...' : 'Start Conversation'}
                </button>
              </div>
            ) : (
              // Chat Interface
              <>
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center text-xs text-gray-400 my-2">
                    Ticket #{ticketNumber} created
                  </div>
                  {messages.map((msg, idx) => {
                  const isSystemOrAdmin = msg.senderAdminId || msg.id === 'welcome';
                  return (
                      <div key={idx} className={`flex ${isSystemOrAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${isSystemOrAdmin ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm' : 'bg-blue-800 text-white rounded-tr-none shadow-sm'}`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.attachmentUrl && (
                            <a href={BASE_API_URL.replace('/api/v1', '') + msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 block text-xs underline ${isSystemOrAdmin ? 'text-blue-600' : 'text-blue-200'}`}>
                              <FiPaperclip className="inline mr-1" /> Attachment
                            </a>
                          )}
                          <div className={`text-[9px] mt-1 text-right ${isSystemOrAdmin ? 'text-gray-400' : 'text-blue-200'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                    {file && (
                      <div className="flex items-center justify-between text-xs text-blue-800 bg-blue-50 p-2 rounded-md">
                        <span className="truncate flex items-center"><FiPaperclip className="mr-1 flex-shrink-0" /> {file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 ml-2">
                          <FiX />
                        </button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 bg-gray-100 rounded-lg flex items-end p-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-24 min-h-[40px] text-sm py-2 px-3 text-gray-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                        <label className="p-2 text-gray-400 hover:text-blue-800 cursor-pointer transition-colors flex-shrink-0">
                          <FiPaperclip className="w-5 h-5" />
                          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
                        </label>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSending || (!newMessage.trim() && !file)}
                        className="bg-blue-800 hover:bg-blue-900 disabled:opacity-50 disabled:hover:bg-blue-800 text-white rounded-full p-3 flex-shrink-0 transition-colors shadow-md"
                      >
                        <FiSend className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-blue-800 hover:bg-blue-900 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center relative ${isOpen ? 'rotate-90 scale-90' : 'rotate-0'}`}
        aria-label="Support Chat"
      >
        {isOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMessageSquare className="w-6 h-6" />
        )}
        
        {/* Status Indicator Dot */}
        {!isOpen && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSupportOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${isSupportOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default SupportChatWidget;
