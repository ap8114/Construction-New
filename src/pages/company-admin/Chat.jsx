import { useState, useEffect, useRef } from 'react';
import { Send, Search, Paperclip, Smile, MessageSquare, Users as UsersIcon, Circle, Shield, User as UserIcon, HardHat, X } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Chat = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('INTERNAL'); // INTERNAL, CLIENT, SUB
    const [showDirectory, setShowDirectory] = useState(false);
    const [directoryUsers, setDirectoryUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const notificationSound = useRef(new Audio('/assets/sounds/notification.mp3'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Socket
    useEffect(() => {
        const token = localStorage.getItem('token');
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://construction-backend-production-b192.up.railway.app';

        socketRef.current = io(socketUrl, {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            socketRef.current.emit('register_user', user);
        });

        socketRef.current.on('online_users_count', (count) => {
            setOnlineCount(count);
        });

        socketRef.current.on('new_message', (payload) => {
            // Update sidebar preview for EVERY room that receives a message
            setRooms(prev => prev.map(r => {
                if (r.id === payload.roomId) {
                    return {
                        ...r,
                        lastMessage: {
                            text: payload.message,
                            sender: payload.sender.fullName,
                            time: payload.createdAt
                        },
                        // Only increment unread if not actively viewing this room
                        unreadCount: (activeRoom?.id === payload.roomId) ? 0 : (r.unreadCount || 0) + 1
                    };
                }
                return r;
            }));

            // If the message is for the active room, add it to the list
            if (activeRoom && payload.roomId === activeRoom.id) {
                setMessages(prev => {
                    // Check if message already exists (from optimistic UI)
                    if (prev.some(m => m.id === payload._id)) return prev;

                    return [...prev, {
                        id: payload._id,
                        sender: payload.sender.fullName,
                        role: payload.sender.role,
                        text: payload.message,
                        time: new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: payload.sender._id === user?._id || payload.sender === user?._id
                    }];
                });

                // Mark as read if active
                api.put(`/chat/mark-read/${activeRoom.id}`).catch(console.error);
            } else {
                // Play sound if not in focus
                notificationSound.current.play().catch(() => { });
            }
        });

        socketRef.current.on('new_notification', (notif) => {
            if (notif.type === 'chat') {
                // If it's a new message in a room we are NOT in, or not actively viewing
                if (!activeRoom || notif.roomId !== activeRoom.id) {
                    setRooms(prev => {
                        const roomExists = prev.some(r => r.id === notif.roomId);
                        if (roomExists) {
                            return prev.map(r => {
                                if (r.id === notif.roomId) {
                                    return { ...r, unreadCount: (r.unreadCount || 0) + 1 };
                                }
                                return r;
                            });
                        } else {
                            // Fetch fresh room list if we get a notification for a room we don't know about yet
                            fetchRooms();
                            return prev;
                        }
                    });
                    notificationSound.current.play().catch(() => { });
                }
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user, activeRoom?.id]);

    const fetchDirectoryUsers = async () => {
        try {
            const res = await api.get('/chat/users');
            setDirectoryUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const startDirectChat = async (targetUserId) => {
        try {
            const res = await api.post('/chat/direct', { targetUserId });
            const room = res.data;

            // Format room for display if not already in rooms list
            if (!rooms.find(r => r.id === room.id)) {
                setRooms(prev => [room, ...prev]);
            }

            setActiveRoom(room);
            setShowDirectory(false);

            // Auto-switch tab based on target user's role
            if (room.otherRole === 'CLIENT') setActiveTab('CLIENT');
            else if (room.otherRole === 'SUBCONTRACTOR') setActiveTab('SUB');
            else setActiveTab('INTERNAL');
        } catch (error) {
            console.error('Error starting direct chat:', error);
        }
    };

    // Fetch rooms
    const fetchRooms = async () => {
        try {
            const res = await api.get('/chat/rooms');
            setRooms(res.data);

            // Dynamically join all rooms to receive real-time messages
            if (socketRef.current?.connected) {
                res.data.forEach(room => {
                    socketRef.current.emit('join_room', room.id);
                });
            }

            // Auto-select first room if none selected
            if (!activeRoom && res.data.length > 0) {
                // Try to find a room matching the current tab
                const tabRooms = filterRoomsByTab(res.data, activeTab);
                if (tabRooms.length > 0) setActiveRoom(tabRooms[0]);
            }
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [user?._id]);

    // Fetch Messages for Active Room
    useEffect(() => {
        if (!activeRoom?.id) return;

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/chat/${activeRoom.id}`);
                const formattedMessages = res.data.map(msg => ({
                    id: msg._id,
                    sender: msg.sender?.fullName || 'Unknown',
                    role: msg.sender?.role || 'User',
                    text: msg.message,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: msg.sender?._id === user?._id || msg.sender === user?._id
                }));
                setMessages(formattedMessages);

                // Clear unread count for this room in state
                setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, unreadCount: 0 } : r));

                // Mark as read in DB
                await api.put(`/chat/mark-read/${activeRoom.id}`);
            } catch (error) {
                console.error('Error fetching room messages:', error);
            }
        };
        fetchMessages();
    }, [activeRoom?.id]);

    const handleSend = async () => {
        if (!newMessage.trim() || !activeRoom) return;

        const messageContent = newMessage;
        const tempId = Date.now().toString();

        // Optimistic UI Update
        const optimisticMsg = {
            id: tempId,
            sender: user?.fullName || 'Me',
            role: user?.role || 'User',
            text: messageContent,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            pending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            const res = await api.post('/chat', {
                roomId: activeRoom.id,
                message: messageContent
            });

            // Reconcile optimistic message with server response
            const serverMsg = res.data;
            setMessages(prev => prev.map(msg => msg.id === tempId ? {
                ...msg,
                id: serverMsg._id,
                time: new Date(serverMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                pending: false
            } : msg));

            // Also update the short-list preview in sidebar
            setRooms(prev => prev.map(r => r.id === activeRoom.id ? {
                ...r,
                lastMessage: {
                    text: serverMsg.message,
                    sender: serverMsg.sender?.fullName || user?.fullName,
                    time: serverMsg.createdAt
                }
            } : r));
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setNewMessage(messageContent); // Restore text
            alert('Failed to send message. Please check your connection.');
        }
    };

    const filterRoomsByTab = (allRooms, tab) => {
        return allRooms.filter(room => {
            if (tab === 'INTERNAL') {
                // Return internal group rooms, project rooms, or direct messages with internal staff
                if (room.roomType === 'INTERNAL' || room.roomType === 'PROJECT_GROUP') return true;
                if (room.roomType === 'DIRECT') {
                    // Internal staff roles
                    const internalRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM', 'FOREMAN', 'WORKER'];
                    return internalRoles.includes(room.otherRole);
                }
            }
            if (tab === 'CLIENT') {
                if (room.roomType === 'ADMIN_CLIENT' || room.roomType === 'SUB_CLIENT') return true;
                if (room.roomType === 'DIRECT' && room.otherRole === 'CLIENT') return true;
                if (room.roomType === 'PROJECT_GROUP' && room.hasClient) return true;
            }
            if (tab === 'SUB') {
                if (room.roomType === 'ADMIN_SUB') return true;
                if (room.roomType === 'DIRECT' && room.otherRole === 'SUBCONTRACTOR') return true;
                if (room.roomType === 'PROJECT_GROUP' && room.hasSub) return true;
            }
            return false;
        });
    };

    const displayRooms = (['COMPANY_OWNER', 'SUPER_ADMIN', 'PM', 'FOREMAN', 'WORKER'].includes(user?.role)
        ? filterRoomsByTab(rooms, activeTab)
        : rooms
    ).filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.projectName && room.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-10 text-center">Loading encrypted frequencies...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in shadow-2xl">
            {/* Sidebar - Chat List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">
                            COMMUNICATIONS
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowDirectory(true);
                                    fetchDirectoryUsers();
                                }}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                title="New Chat"
                            >
                                <UsersIcon size={16} />
                            </button>
                            <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest shadow-sm border border-emerald-200">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {onlineCount} ACTIVE
                            </div>
                        </div>
                    </div>

                    {/* Room Category Tabs - Only for roles that need them */}
                    {['COMPANY_OWNER', 'SUPER_ADMIN', 'PM', 'FOREMAN', 'WORKER'].includes(user?.role) && (
                        <div className="flex p-1 bg-slate-200/50 rounded-2xl gap-1">
                            {[
                                { id: 'INTERNAL', label: 'Internal', icon: Shield },
                                { id: 'CLIENT', label: 'Clients', icon: UserIcon, adminOnly: true },
                                { id: 'SUB', label: 'Subs', icon: HardHat, adminOnly: true }
                            ].filter(tab => {
                                if (tab.adminOnly) {
                                    return ['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role);
                                }
                                return true;
                            }).map(tab => {
                                const count = filterRoomsByTab(rooms, tab.id).length;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <tab.icon size={14} className="mb-0.5" />
                                        <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
                                        {count > 0 && (
                                            <span className="absolute top-1 right-2 bg-blue-500 text-white text-[8px] px-1 rounded-full shadow-sm">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter transmissions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {displayRooms.length > 0 ? displayRooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => setActiveRoom(room)}
                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-white transition-all flex gap-3 group relative
                        ${activeRoom?.id === room.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''}
                    `}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-sm
                                    ${activeRoom?.id === room.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 group-hover:bg-slate-50 text-slate-500'}
                                `}>
                                    {room.avatar ? (
                                        <img src={room.avatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                                    ) : (room.name?.[0] || '?')}
                                </div>
                                {room.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-lg animate-bounce">
                                        {room.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className={`font-bold text-sm truncate transition-colors ${activeRoom?.id === room.id ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {room.name}
                                    </h4>
                                    {room.lastMessage && (
                                        <span className="text-[8px] font-bold text-slate-400">
                                            {new Date(room.lastMessage.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0">
                                        {room.projectId ? room.projectName : (room.roomType === 'DIRECT' ? 'Private' : room.roomType)}
                                    </span>
                                    {room.lastMessage && (
                                        <p className="text-[10px] text-slate-400 truncate font-medium border-l border-slate-200 pl-1.5 italic">
                                            {room.lastMessage.sender}: {room.lastMessage.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 text-center space-y-4">
                            <MessageSquare size={32} className="mx-auto text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-wrap">No active frequencies in this sector.</p>
                            <button
                                onClick={() => {
                                    setShowDirectory(true);
                                    fetchDirectoryUsers();
                                }}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                                Start a new transmission
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeRoom ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 shadow-sm sticky top-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl
                                    ${activeRoom.roomType === 'INTERNAL' ? 'bg-blue-600' : 'bg-slate-900'}
                                `}>
                                    {activeRoom.name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{activeRoom.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                            {activeRoom.roomType.replace('_', ' ')} • SECURE CHANNEL
                                        </p>
                                    </div>
                                </div>
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
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-10 text-center">
                                        Channel frequency open.<br />Awaiting transmission.
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
                                        placeholder={`Transmission to ${activeRoom.name}...`}
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
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Transmission Center</h3>
                            <p className="text-slate-400 text-sm max-w-xs font-semibold leading-relaxed">Select a secure frequency from the left to begin coordination.</p>
                        </div>
                    </div>
                )}
            </div>
            {/* User Directory Modal */}
            {showDirectory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-scale-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">New Direct Frequency</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select a contact to initiate secure line</p>
                            </div>
                            <button
                                onClick={() => setShowDirectory(false)}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or role..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                            {directoryUsers
                                .filter(u => {
                                    const matchesSearch = u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                        u.role.toLowerCase().includes(userSearchTerm.toLowerCase());

                                    const admins = ['COMPANY_OWNER', 'SUPER_ADMIN'];
                                    const internalOnlyRoles = ['FOREMAN', 'WORKER'];

                                    if (['CLIENT', 'SUBCONTRACTOR'].includes(user?.role)) {
                                        // Clients/Subs can only initiate chats with Admins
                                        return matchesSearch && admins.includes(u.role);
                                    }

                                    if (internalOnlyRoles.includes(user?.role)) {
                                        // Foreman/Worker can only initiate chats with internal team members
                                        const allInternal = ['COMPANY_OWNER', 'SUPER_ADMIN', 'PM', 'FOREMAN', 'WORKER'];
                                        return matchesSearch && allInternal.includes(u.role);
                                    }

                                    // Admins and PMs can initiate chats with anyone (Internal, Client, Sub)
                                    return matchesSearch;
                                })
                                .map(u => (
                                    <div
                                        key={u._id}
                                        onClick={() => startDirectChat(u._id)}
                                        className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-100 group"
                                    >
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            {u.avatar ? (
                                                <img src={u.avatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                                            ) : (u.fullName?.[0] || '?')}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 text-sm">{u.fullName}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                                        </div>
                                        <MessageSquare size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors mr-2" />
                                    </div>
                                ))}
                            {directoryUsers.length === 0 && (
                                <div className="p-10 text-center opacity-40">
                                    <UsersIcon size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Scanning network...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ensuring end-to-end encryption</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
