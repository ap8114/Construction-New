import { useState, useEffect, useRef } from 'react';
import { Send, Search, Paperclip, Smile, MessageSquare, Users as UsersIcon, Circle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Chat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Socket
    useEffect(() => {
        // Connect to Socket server
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
        socketRef.current = io(socketUrl);

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            // Register user with socket
            socketRef.current.emit('register_user', user);
        });

        socketRef.current.on('online_users_count', (count) => {
            setOnlineCount(count);
        });

        socketRef.current.on('new_message', (chat) => {
            // Check if the message belongs to the active project chat or private chat
            const isProjectMatch = activeChat?.isGroup && chat.projectId === activeChat.id;
            const isPrivateMatch = !activeChat?.isGroup && (
                (chat.sender._id === activeChat?.id && chat.receiverId === user?._id) ||
                (chat.sender._id === user?._id && chat.receiverId === activeChat?.id)
            );

            if (isProjectMatch || isPrivateMatch) {
                const formattedMsg = {
                    id: chat._id,
                    sender: chat.sender.fullName,
                    role: chat.sender.role,
                    text: chat.message,
                    time: new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: chat.sender._id === user?._id || chat.sender === user?._id
                };

                setMessages(prev => {
                    if (prev.find(m => m.id === chat._id)) return prev;
                    return [...prev, formattedMsg];
                });
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user, activeChat?.id]); // Re-subscribe if user or active chat changes (rooms)

    // Join Project Room when active chat changes
    useEffect(() => {
        if (activeChat && socketRef.current) {
            socketRef.current.emit('join_project', activeChat.id);
        }
    }, [activeChat]);

    // Fetch Projects and Users as "Chat Groups"
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const [projRes, teamRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/auth/users')
                ]);

                const projectChats = projRes.data.map(p => ({
                    id: p._id,
                    name: p.name,
                    lastMessage: 'Project Room',
                    isGroup: true,
                    status: p.status,
                    role: 'Project'
                }));

                const userChats = teamRes.data
                    .filter(u => u._id !== user?._id)
                    .map(u => ({
                        id: u._id,
                        name: u.fullName,
                        lastMessage: 'Direct Message',
                        isGroup: false,
                        status: 'online', // Placeholder
                        role: u.role
                    }));

                setConversations([...projectChats, ...userChats]);

                if (!activeChat && projectChats.length > 0) {
                    setActiveChat(projectChats[0]);
                }
            } catch (error) {
                console.error('Error fetching chat entities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [user?._id]);

    // Fetch Messages History for Active Chat
    useEffect(() => {
        if (!activeChat) return;

        const fetchMessages = async () => {
            try {
                const endpoint = activeChat.isGroup
                    ? `/chat/${activeChat.id}`
                    : `/chat/private/${activeChat.id}`;

                const res = await api.get(endpoint);
                const formattedMessages = res.data.map(msg => ({
                    id: msg._id,
                    sender: msg.sender?.fullName || 'Unknown',
                    role: msg.sender?.role || 'User',
                    text: msg.message,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: msg.sender?._id === user?._id || msg.sender === user?._id
                }));
                setMessages(formattedMessages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();
    }, [activeChat, user?._id]);

    const handleSend = async () => {
        if (!newMessage.trim() || !activeChat) return;

        const messageContent = newMessage;
        setNewMessage('');

        try {
            const payload = activeChat.isGroup
                ? { projectId: activeChat.id, message: messageContent }
                : { receiverId: activeChat.id, message: messageContent };

            await api.post('/chat', payload);
            // The socket 'new_message' event will handle the UI update
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading chats...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
            {/* Sidebar - Chat List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Messages</h2>
                        <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest shadow-sm border border-emerald-200">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {onlineCount} Online
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-white transition-all flex gap-3 group
                        ${activeChat?.id === chat.id ? 'bg-white border-blue-500 shadow-sm' : ''}
                    `}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-slate-500 transition-all shadow-sm
                                    ${activeChat?.id === chat.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 group-hover:bg-slate-50'}
                                `}>
                                    {chat.name.charAt(0)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-50 ${chat.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm truncate transition-colors ${activeChat?.id === chat.id ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {chat.name}
                                    </h4>
                                </div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{chat.role || chat.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 shadow-sm sticky top-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-xl shadow-slate-200">
                                    {activeChat.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{activeChat.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                            {activeChat.isGroup ? 'Active Project Room' : `${activeChat.role} • Personal Chat`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {/* Actions removed as requested */}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar relative">
                            {/* Background Watermark/Logo */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none grayscale">
                                <span className="text-[20vw] font-black italic">KAAL</span>
                            </div>

                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40">
                                    <div className="p-4 bg-slate-100 rounded-full">
                                        <MessageSquare size={48} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-10">
                                        {activeChat.isGroup ? 'Starting the project transmission...' : 'Secure end-to-end site coordination...'}
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                    <div className={`max-w-[70%] group relative`}>
                                        {!msg.isMe && (
                                            <div className="flex items-center gap-2 mb-1.5 ml-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{msg.sender}</span>
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tighter">{msg.role}</span>
                                            </div>
                                        )}
                                        <div className={`rounded-2xl p-4 shadow-sm transition-all duration-200 border
                                            ${msg.isMe
                                                ? 'bg-blue-600 text-white border-blue-500 rounded-br-none shadow-blue-100'
                                                : 'bg-white text-slate-700 border-slate-100 rounded-bl-none shadow-slate-100 overflow-hidden'}
                                        `}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                                                <span className={`text-[9px] font-bold uppercase ${msg.isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {msg.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
                            <div className="flex gap-3 items-center">
                                <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition shadow-sm border border-slate-100">
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1 relative group">
                                    <input
                                        type="text"
                                        placeholder="Type a construction site transmission..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-3.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                                    />
                                    <div className="absolute right-4 top-3.5 flex items-center gap-2">
                                        <button className="text-slate-300 hover:text-slate-600 transition-colors"><Smile size={20} /></button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                    className={`p-3.5 rounded-2xl transition-all shadow-xl font-bold flex items-center justify-center
                                        ${newMessage.trim()
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 scale-105 active:scale-95'
                                            : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'}
                                    `}
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-6 text-center animate-pulse">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                            <UsersIcon size={48} className="text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Command Center</h3>
                            <p className="text-slate-400 text-sm max-w-xs font-semibold leading-relaxed">Select a project from the left to begin real-time site coordination.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
