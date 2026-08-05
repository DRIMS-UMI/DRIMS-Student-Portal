import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { format, isToday, isYesterday } from 'date-fns';
import { FiSend, FiSearch, FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiX, FiMoreVertical, FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { useGetLoggedInUser } from '../../store/tanstackStore/services/queries';
import { Icon } from '@iconify/react';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_API_URL } from '../../utils/apiRequestUrl';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
//const API_URL = import.meta.env.VITE_API_URL || 'https://drimsapi.umi.ac.ug/api/v1';
const API_URL = import.meta.env.VITE_API_URL || BASE_API_URL;
// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('umi_student_auth_token') || localStorage.getItem('token');
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ========================================
// MAIN COMPONENT
// ========================================
const DirectMessages = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get current user data and query client
  const { data: userData } = useGetLoggedInUser();
  const currentUserName = userData?.user?.name || 'You';
  const currentUserId = userData?.user?.id;
  const queryClient = useQueryClient();

  // ========================================
  // API FUNCTIONS
  // ========================================
  // Fetch conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWithAuth(`${API_URL}/messages/conversations`);
      setConversations(data.conversations || []);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const loadMessages = useCallback(async (conversationId, page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      const data = await fetchWithAuth(`${API_URL}/messages/${conversationId}?page=${page}&pageSize=20`);

      if (append) {
        // Append older messages to the beginning
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        // Replace messages (first page)
        setMessages(data.messages || []);
      }

      setHasMore(data.hasMore || false);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (!selected || !hasMore || loadingMore) return;

    const nextPage = currentPage + 1;
    await loadMessages(selected.id, nextPage, true);
  }, [selected, hasMore, loadingMore, currentPage, loadMessages]);

  // Mark messages as read - defined before socket handlers
  const markMessagesAsRead = useCallback(async (conversationId) => {
    console.log('Marking messages as read for conversation:', conversationId);
    try {
      await fetchWithAuth(`${API_URL}/messages/${conversationId}/read`, {
        method: 'PUT'
      });
      console.log('Successfully marked messages as read');

      // Reload messages to get updated readBy arrays
      loadMessages(conversationId);
      // Reload conversations to clear the unread badge for this conversation
      loadConversations();
      // Invalidate unread message count
      queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [loadMessages, loadConversations, queryClient]);

  // ========================================
  // PRINT FUNCTIONALITY
  // ========================================
  const handlePrint = () => {
    if (!selected || messages.length === 0) {
      alert('No conversation selected or no messages to print');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printDate = format(new Date(), 'MMMM dd, yyyy');

    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Conversation with ${selected.otherParticipant?.name || 'Unknown'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #2563eb;
              font-size: 24px;
            }
            .header .subtitle {
              color: #666;
              margin-top: 5px;
              font-size: 14px;
            }
            .conversation-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .conversation-info h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .conversation-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .date-separator {
              text-align: center;
              margin: 30px 0 20px 0;
              position: relative;
            }
            .date-separator::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 1px;
              background: #ddd;
              z-index: 1;
            }
            .date-separator span {
              background: white;
              padding: 0 20px;
              color: #666;
              font-weight: bold;
              font-size: 12px;
              position: relative;
              z-index: 2;
            }
            .message {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .message-header {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .message-content {
              background: #f1f5f9;
              padding: 12px 15px;
              border-radius: 12px;
              border-left: 4px solid #2563eb;
              margin-left: 20px;
              font-size: 14px;
            }
            .message.own .message-content {
              background: #dbeafe;
              border-left: 4px solid #1d4ed8;
              margin-left: 0;
              margin-right: 20px;
            }
            .message.own .message-header {
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 10px; }
              .header { page-break-after: avoid; }
              .message { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Direct Message Conversation</h1>
            <div class="subtitle">UMI Student Portal - Printed on ${printDate}</div>
          </div>
          
          <div class="conversation-info">
            <h3>Conversation Details</h3>
            <p><strong>Participants:</strong> ${currentUserName} and ${selected.otherParticipant?.name || 'Unknown'}</p>
            <p><strong>Total Messages:</strong> ${messages.length}</p>
            <p><strong>Date Range:</strong> ${messages.length > 0 ? format(new Date(messages[0].createdAt), 'MMM dd, yyyy') : 'N/A'} - ${messages.length > 0 ? format(new Date(messages[messages.length - 1].createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
          </div>
          
          <div class="messages">
            ${Object.entries(messages.reduce((acc, msg) => {
      const date = formatDate(new Date(msg.createdAt));
      acc[date] = acc[date] || [];
      acc[date].push(msg);
      return acc;
    }, {})).map(([date, msgs]) => `
              <div class="date-separator">
                <span>${date}</span>
              </div>
              ${msgs.map(msg => {
      const isOwn = msg.senderId !== selected.otherParticipant?.id;
      const senderName = isOwn ? currentUserName : selected.otherParticipant?.name;
      const messageTime = format(new Date(msg.createdAt), 'h:mm a');

      return `
                  <div class="message ${isOwn ? 'own' : ''}">
                    <div class="message-header">
                      <strong>${senderName}</strong> - ${messageTime}
                    </div>
                    <div class="message-content">
                      ${msg.text.replace(/\n/g, '<br>')}
                    </div>
                  </div>
                `;
    }).join('')}
            `).join('')}
          </div>
          
          <div class="footer">
            <p>This conversation was exported from UMI Student Portal</p>
            <p>For any questions, please contact your supervisor or the system administrator</p>
          </div>
        </body>
      </html>
    `;

    // Write content to the new window and trigger print
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for the content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    // Close dropdown after printing
    setShowDropdown(false);
  };

  // ========================================
  // SOCKET EVENT HANDLERS
  // ========================================
  const handleSocketMessage = useCallback((data) => {
    console.log('Socket message received:', data);

    if (data.type === 'new_message') {
      // Only add message if it's for the currently selected conversation
      if (data.conversationId === selected?.id) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (messageExists) return prev;
          return [...prev, data.message];
        });

        // Auto-mark new message as read since user is actively viewing this conversation
        setTimeout(() => {
          markMessagesAsRead(data.conversationId);
        }, 100); // Small delay to ensure message is saved
      } else {
        // Message is for a different conversation, so invalidate unread count
        queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
      }
      // Always reload conversations to update last message
      loadConversations();
    } else if (data.type === 'message_read') {
      console.log('Processing message_read event:', data);
      if (data.conversationId === selected?.id) {
        setMessages((prev) => {
          console.log('Messages before read update:', prev.map(m => ({ id: m.id, readBy: m.readBy })));
          const updated = prev.map(msg => {
            // Add the reader to readBy array if not already present
            const readBy = msg.readBy || [];
            if (!readBy.includes(data.readBy)) {
              console.log(`Marking message ${msg.id} as read by user ${data.readBy}`);
              return {
                ...msg,
                readBy: [...readBy, data.readBy]
              };
            }
            return msg;
          });
          console.log('Messages after read update:', updated.map(m => ({ id: m.id, readBy: m.readBy })));
          return updated;
        });
      } else {
        console.log('message_read event for different conversation:', data.conversationId, 'vs current:', selected?.id);
      }
    }
  }, [selected?.id, loadConversations, markMessagesAsRead, queryClient]);

  const handleUserStatusChange = useCallback((data) => {
    console.log('User status change:', data);

    if (data.onlineUsers) {
      // Handle bulk online users update
      setOnlineUsers(new Set(data.onlineUsers));
    } else if (data.userId) {
      // Handle individual user status change
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    }
  }, []);

  const handleTyping = useCallback((data) => {
    if (data.conversationId === selected?.id && data.userId !== currentUserId) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, Date.now());
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });

      // Auto-remove typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            const timestamp = newMap.get(data.userId);
            // Only remove if it's the same typing session
            if (timestamp && Date.now() - timestamp >= 3000) {
              newMap.delete(data.userId);
              return newMap;
            }
            return prev;
          });
        }, 3000);
      }
    }
  }, [selected?.id, currentUserId]);

  // Initialize socket connection
  const { joinConversation, leaveConversation, startTyping, stopTyping } = useSocket(
    handleSocketMessage,
    handleUserStatusChange,
    handleTyping
  );

  // Send message
  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    setSending(true);
    setError('');

    // Stop typing indicator
    if (isTyping) {
      stopTyping(selected.id);
      setIsTyping(false);
    }

    try {
      const res = await fetchWithAuth(`${API_URL}/messages/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      // Add message to local state immediately for better UX
      setMessages((prev) => [...prev, res.message]);
      setMessage('');
      loadConversations();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle typing in message input
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    if (selected && e.target.value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(selected.id);
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(selected.id);
      }, 1000);
    } else if (isTyping) {
      setIsTyping(false);
      stopTyping(selected.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // ========================================
  // EFFECTS
  // ========================================
  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selected) {
      setCurrentPage(1);
      setHasMore(true);
      loadMessages(selected.id, 1, false);
      markMessagesAsRead(selected.id);
      joinConversation(selected.id);

      return () => {
        leaveConversation(selected.id);
      };
    }
  }, [selected, loadMessages, joinConversation, leaveConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch supervisors when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setLoading(true);
      setError('');
      fetch(`${API_URL}/student/supervisors-for-messaging`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('umi_student_auth_token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setSupervisors(data.supervisors || []);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load supervisors');
          setLoading(false);
        });
    }
  }, [isModalOpen]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  // Check if user is online
  const isUserOnline = (userId) => {
    const isOnline = onlineUsers.has(userId);
    console.log(`Checking online status for user ${userId}:`, isOnline, 'Online users:', Array.from(onlineUsers));
    return isOnline;
  };

  // Parse message text to make URLs clickable
  const parseMessageWithLinks = (text) => {
    // URL regex pattern to detect various URL formats
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Ensure the URL has a protocol
        let url = part;
        if (!part.startsWith('http://') && !part.startsWith('https://')) {
          url = 'https://' + part;
        }

        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Format toolbar functions
  const handleFormat = (tag) => {
    if (tag === 'bold') setMessage((m) => m + '**bold**');
    if (tag === 'italic') setMessage((m) => m + '*italic*');
    if (tag === 'underline') setMessage((m) => m + '__underline__');
    if (tag === 'list') setMessage((m) => m + '\n• ');
    if (tag === 'align') setMessage((m) => m + '\n');
  };

  // Get read status for messages
  const getReadStatus = (message) => {
    if (!message.readBy || message.readBy.length === 0) {
      console.log(`Message ${message.id} has no readBy array - returning 'sent'`);
      return 'sent';
    }

    // Check if anyone OTHER than the sender has read the message
    const otherParticipantId = selected?.otherParticipant?.id;
    console.log(`Checking read status for message ${message.id}:`, {
      readBy: message.readBy,
      otherParticipantId,
      includes: otherParticipantId && message.readBy.includes(otherParticipantId)
    });

    if (otherParticipantId && message.readBy.includes(otherParticipantId)) {
      console.log(`Message ${message.id} marked as 'read'`);
      return 'read';
    }

    console.log(`Message ${message.id} marked as 'sent'`);
    return 'sent';
  };

  // Start or open conversation
  const handleSelect = async (supervisor) => {
    setLoading(true);
    setError('');
    try {
      console.log('Creating conversation with supervisor:', supervisor);
      console.log('Supervisor ID being sent:', supervisor.id);
      console.log('Current user ID:', currentUserId);

      const res = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('umi_student_auth_token')}`
        },
        body: JSON.stringify({ participantId: supervisor.id })
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) throw new Error(data.error || 'Failed to start conversation');
      setIsModalOpen(false);
      await loadConversations();
      setSelected({
        ...data.conversation,
        otherParticipant: data.conversation.otherParticipant || supervisors.find(s => s.id === supervisor.id)
      });
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(new Date(msg.createdAt));
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  // Filter conversations and supervisors
  const filteredConversations = conversations.filter((c) =>
    c.otherParticipant?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSupervisors = supervisors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Get typing indicator text
  const getTypingIndicator = () => {
    const typingUsersList = Array.from(typingUsers.keys());
    if (typingUsersList.length === 0) return null;

    if (typingUsersList.length === 1) {
      const userName = selected?.otherParticipant?.name || 'Someone';
      return `${userName} is typing...`;
    }

    return 'Multiple people are typing...';
  };

  // ========================================
  // RENDER COMPONENT
  // ========================================
  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] bg-gray-100 p-0 md:p-4">
      {/* ========================================
          MAIN CONTAINER
          ======================================== */}
      <div className="h-full max-w-7xl mx-auto bg-white rounded-none md:rounded-lg shadow-lg overflow-hidden flex">

        {/* ========================================
            LEFT SIDEBAR - CONVERSATIONS LIST
            ======================================== */}
        <div className={`w-full md:w-80 bg-gray-50 border-r border-gray-200 flex flex-col ${selected ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Direct Messages</h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a DM, by Name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* New Message Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              New Message
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-4 text-red-500">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-gray-500">No conversations</div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${selected?.id === c.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  onClick={() => setSelected(c)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {c.otherParticipant?.name?.[0] || '?'}
                    </div>
                    {/* Online status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(c.otherParticipant?.id) ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`truncate ${c.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>{c.otherParticipant?.name}</div>
                      {isUserOnline(c.otherParticipant?.id) && (
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>

                  {/* Timestamp + Unread Count */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-400">
                      {c.lastMessage?.createdAt ? format(new Date(c.lastMessage.createdAt), 'MMM dd') : ''}
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded-full bg-[#23388F] text-white text-[10px] font-medium">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================
            MAIN CHAT AREA
            ======================================== */}
        <div className={`flex-1 flex flex-col ${selected ? 'flex' : 'hidden md:flex'}`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 bg-white">
            <div className="flex items-center gap-3">
              {selected ? (
                <>
                  {/* Back button visible only on mobile */}
                  <button
                    onClick={() => setSelected(null)}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors mr-1"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {selected.otherParticipant?.name?.[0] || '?'}
                    </div>
                    {/* Online status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(selected.otherParticipant?.id) ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selected.otherParticipant?.name}</div>
                    <div className="text-xs text-gray-500">
                      {isUserOnline(selected.otherParticipant?.id) ? (
                        <span className="text-green-600">Online</span>
                      ) : (
                        selected.otherParticipant?.email
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">Select a conversation</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                Last login: {format(new Date(), 'dd-MM-yyyy hh:mm a')}
              </div>
              <div className="flex items-center gap-1">
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                  {showDropdown && selected && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={handlePrint}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-lg"
                      >
                        <FiPrinter className="w-4 h-4" />
                        Print Messages
                      </button>
                    </div>
                  )}
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {selected ? (
              <div className="space-y-4">
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:chevron-up" className="w-4 h-4" />
                          Load More Messages
                        </>
                      )}
                    </button>
                  </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                        {date}
                      </span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Messages */}
                    {msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex gap-3 mb-4 justify-start"
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${msg.senderId === selected.otherParticipant?.id ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                          {msg.senderId === selected.otherParticipant?.id
                            ? selected.otherParticipant?.name?.[0] || '?'
                            : currentUserName?.[0] || 'Y'
                          }
                        </div>

                        <div className="flex flex-col max-w-[70%] min-w-0">
                          {/* Header: Name and Time */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {msg.senderId === selected.otherParticipant?.id
                                ? selected.otherParticipant?.name
                                : `${currentUserName} (you)`
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.createdAt), 'h:mm a')}
                            </span>
                          </div>

                          {/* Message Content */}
                          <div
                            className={`px-4 py-3 rounded-lg shadow-sm ${msg.senderId === selected.otherParticipant?.id
                              ? 'bg-white text-gray-900 border border-gray-200'
                              : 'bg-blue-50 text-gray-900 border border-blue-200'
                              }`}
                          >
                            <div className="whitespace-pre-wrap text-sm">
                              {parseMessageWithLinks(msg.text)}
                            </div>
                          </div>

                          {/* Read Receipts */}
                          {msg.senderId !== selected.otherParticipant?.id && (
                            <div className="text-xs text-gray-400 mt-1">
                              {getReadStatus(msg) === 'read' ? (
                                <Icon icon="mdi:checks" className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Icon icon="mdi:check" className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Typing Indicator */}
                {getTypingIndicator() && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {selected.otherParticipant?.name?.[0] || '?'}
                    </div>
                    <div className="bg-gray-200 px-4 py-2 rounded-lg">
                      <div className="text-sm text-gray-600 italic">
                        {getTypingIndicator()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>

          {/* Message Input Area */}
          {selected && (
            <div className="border-t border-gray-200 px-6 py-4 bg-white">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => handleFormat('bold')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiBold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormat('italic')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiItalic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormat('underline')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiUnderline className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormat('list')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormat('align')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiAlignLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Message Input */}
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 min-h-[80px] max-h-[120px] resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Type your message..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>

              {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          NEW CONVERSATION MODAL
          ======================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Start New Conversation</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search supervisors by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-6 text-gray-500">Loading...</div>
                  ) : error ? (
                    <div className="text-center py-6 text-red-500">{error}</div>
                  ) : filteredSupervisors.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">No supervisors found</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSupervisors.map(s => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => handleSelect(s)}
                        >
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {s.name[0]}
                            </div>
                            {/* Online status indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(s.id) ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500">
                              {s.email} {isUserOnline(s.id) && <span className="text-green-600 ml-1">• Online</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages;