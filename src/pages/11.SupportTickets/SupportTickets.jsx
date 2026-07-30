import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useGetStudentTickets, useCreateSupportTicket, useReplyToTicket, useGetLoggedInUser } from '../../store/tanstackStore/services/queries';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { BASE_API_URL } from '../../utils/apiRequestUrl';
import { useQueryClient } from '@tanstack/react-query';

const SupportTickets = () => {
  const queryClient = useQueryClient();
  const { data: ticketsData, isLoading } = useGetStudentTickets();
  const { data: userData } = useGetLoggedInUser();
  const createMutation = useCreateSupportTicket();
  const replyMutation = useReplyToTicket();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New ticket state
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');

  // Live messages updated via socket
  const [liveMessages, setLiveMessages] = useState([]);
  const socketRef = useRef(null);
  const currentTicketIdRef = useRef(null);

  // Connect socket on mount, listen for new support messages
  useEffect(() => {
    const token = localStorage.getItem('umi_student_auth_token') || localStorage.getItem('token');
    if (!token) return;

    const socketUrl = BASE_API_URL.replace('/api/v1', '');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('new_support_message', (data) => {
      if (data?.message && data.message.ticketId === currentTicketIdRef.current) {
        setLiveMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    });

    socket.on('connect', () => {
      if (currentTicketIdRef.current) {
        socket.emit('join_ticket', { ticketId: currentTicketIdRef.current });
      }
    });

    socket.on('ticket_status_updated', (data) => {
      if (data?.ticketId) {
        // Update ticket list badge
        queryClient.invalidateQueries({ queryKey: ['studentTickets'] });
        // If modal is open for this ticket, update its status in real-time
        if (data.ticketId === currentTicketIdRef.current) {
          setSelectedTicket((prev) => prev ? { ...prev, status: data.status } : prev);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join/leave ticket room when modal opens/closes
  useEffect(() => {
    const socket = socketRef.current;
    if (selectedTicket?.id) {
      currentTicketIdRef.current = selectedTicket.id;
      setLiveMessages(selectedTicket.messages || []);
      socket?.emit('join_ticket', { ticketId: selectedTicket.id });
    } else {
      if (currentTicketIdRef.current) {
        socket?.emit('leave_ticket', { ticketId: currentTicketIdRef.current });
      }
      currentTicketIdRef.current = null;
      setLiveMessages([]);
    }
  }, [selectedTicket?.id]);

  const tickets = ticketsData?.tickets || [];

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject || !newMessage) {
      toast.error('Subject and message are required');
      return;
    }

    const formData = new FormData();
    formData.append('subject', newSubject);
    formData.append('message', newMessage);
    formData.append('priority', newPriority);
    formData.append('source', 'STUDENT_PORTAL');

    try {
      const result = await createMutation.mutateAsync(formData);
      toast.success('Ticket created successfully');
      setIsCreating(false);
      setNewSubject('');
      setNewMessage('');
      setNewPriority('MEDIUM');
      const newTicket = result?.ticket;
      if (newTicket) {
        setSelectedTicket(newTicket);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create ticket');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage) return;

    try {
      const formData = new FormData();
      formData.append('message', replyMessage);
      
      const response = await replyMutation.mutateAsync({ id: selectedTicket.id, data: formData });

      toast.success('Reply sent');
      setReplyMessage('');
      // Keep modal open — new message arrives via socket
      // Optimistic fallback in case socket event is delayed
      if (response?.data) {
        setLiveMessages((prev) => {
          if (prev.some(m => m.id === response.data.id)) return prev;
          return [...prev, response.data];
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send reply');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.OPEN}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500">View and manage your support requests.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-[#23398B] hover:bg-[#1a2b69] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Icon icon="mdi:plus" className="text-lg" />
          New Ticket
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Icon icon="mdi:loading" className="animate-spin text-4xl text-[#23398B]" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-[#23398B] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:ticket-outline" className="text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You haven't created any support tickets yet. If you need assistance, please create a new ticket.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 bg-white border border-[#23398B] text-[#23398B] hover:bg-blue-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Icon icon="mdi:plus" />
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{ticket.ticketNumber}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      <div className="font-medium">{ticket.subject}</div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-4 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-[#23398B] hover:text-[#1a2b69] text-sm font-medium inline-flex items-center gap-1"
                      >
                        <Icon icon="mdi:eye" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Create Support Ticket</h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23398B]/50 focus:border-[#23398B]"
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23398B]/50 focus:border-[#23398B]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23398B]/50 focus:border-[#23398B]"
                    placeholder="Provide detailed information about your request..."
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#23398B] hover:bg-[#1a2b69] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending ? <Icon icon="mdi:loading" className="animate-spin" /> : null}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Reply Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Ticket {selectedTicket.ticketNumber} • Created on {format(new Date(selectedTicket.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-gray-50 space-y-4">
              {liveMessages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.senderName !== (userData?.user?.name || 'Student') ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                    msg.senderName !== (userData?.user?.name || 'Student')
                      ? 'bg-white border border-gray-100 text-gray-800' 
                      : 'bg-[#23398B] text-white'
                  }`}>
                    <div className="text-xs font-semibold mb-1 opacity-80 flex items-center gap-2">
                      {msg.senderName || 'Unknown'}
                      <span className="font-normal opacity-70">• {format(new Date(msg.createdAt), 'h:mm a')}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleReplySubmit} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23398B]/50"
                  />
                  <button
                    type="submit"
                    disabled={replyMutation.isPending}
                    className="px-6 py-2 bg-[#23398B] hover:bg-[#1a2b69] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {replyMutation.isPending ? (
                      <Icon icon="mdi:loading" className="animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <Icon icon="mdi:send" className="text-sm" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
