import { Send, User, MessageCircle, Search, Paperclip, Phone, MoreVertical, Menu, Loader, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null); // projectId
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchChatHistory(activeChat);
      fetchMembers(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0) {
        setActiveChat(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchChatHistory = async (projectId) => {
    try {
      setLoadingChat(true);
      const res = await api.get(`/chat/${projectId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !activeChat) return;

    try {
      const res = await api.post('/chat', {
        projectId: activeChat,
        message: newMessage
      });

      // Manually add to list for instant feedback (or wait for socket)
      const myMsg = {
        ...res.data,
        sender: { _id: user._id, fullName: user.fullName, role: user.role }
      };
      setMessages([...messages, myMsg]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentProject = projects.find(p => p._id === activeChat);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader className="animate-spin text-blue-600" size={40} />
          <p className="font-medium animate-pulse">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Sidebar List */}
      <div className={`absolute md:static inset-y-0 left-0 z-20 w-80 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex justify-between items-center">
            Messages
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400"><MoreVertical size={20} /></button>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              onClick={() => { setActiveChat(project._id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeChat === project._id ? 'bg-white shadow-sm border border-slate-100' : 'hover:bg-slate-100 border border-transparent'}`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border border-white/20 ${activeChat === project._id ? 'bg-blue-600' : 'bg-slate-400'}`}>
                  {project.name?.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-sm font-semibold truncate ${activeChat === project._id ? 'text-slate-900' : 'text-slate-700'}`}>{project.name}</h3>
                </div>
                <p className={`text-xs truncate ${activeChat === project._id ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                  Project Channel
                </p>
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400">No projects found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white w-full relative z-10 md:z-0">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-50 shadow-sm">
                {currentProject?.name?.charAt(0) || 'P'}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{currentProject?.name || 'Select Project'}</h3>
              <div className="flex items-center gap-2">
                <Users size={12} className="text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium">
                  {members.length} team members
                </p>
              </div>
            </div>
          </div>
        
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
          {loadingChat ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader className="animate-spin text-blue-400" size={24} />
              <p className="text-xs font-medium">Syncing messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <MessageCircle size={32} />
              </div>
              <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMe = msg.sender?._id === user?._id;
                const showSender = idx === 0 || messages[idx - 1].sender?._id !== msg.sender?._id;

                return (
                  <div key={msg._id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end max-w-[85%] md:max-w-[70%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mb-1 bg-slate-400 border border-white shadow-sm">
                          {msg.sender?.fullName?.charAt(0)}
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && showSender && (
                          <span className="text-[10px] font-bold text-slate-500 mb-1 px-1">
                            {msg.sender?.fullName} <span className="font-medium text-slate-400">({msg.sender?.role})</span>
                          </span>
                        )}
                        <div className={`px-5 py-3 rounded-2xl text-sm shadow-sm leading-relaxed
                                              ${isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                          }`}>
                          {msg.message}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/20 flex flex-col gap-1">
                              {msg.attachments.map((att, i) => (
                                <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] bg-black/10 p-1.5 rounded-lg hover:bg-black/20 transition">
                                  <Paperclip size={12} /> {att.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] mt-1.5 px-1 font-medium ${isMe ? 'text-blue-600/60' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-4xl mx-auto">
            <button type="button" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Paperclip size={20} />
            </button>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden">
              <input
                type="text"
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
