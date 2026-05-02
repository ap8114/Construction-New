import { useState, useEffect, useRef } from 'react';
import { Send, Search, Paperclip, Smile, MessageSquare, Users as UsersIcon, Circle, Shield, User as UserIcon, HardHat, X, Loader, Download, ChevronLeft, Menu } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { playSound } from '../../utils/notificationSound';
import toast from 'react-hot-toast';

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
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const isImage = (url) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase().split('?')[0]; // Remove query params for better detection
        return /\.(jpeg|jpg|gif|png|webp)$/.test(lowerUrl);
    };

    const commonEmojis = [
        '😊', '😂', '👍', '🙏', '🔥', '❤️', '👏', '🙌',
        '🏠', '🏗️', '📐', '🔧', '🔨', '⛏️', '🚧', '🚜',
        '✅', '❌', '⚠️', '🏢', '📅', '⏰', '💰', '✉️'
    ];
    const fileInputRef = useRef(null);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // Handled globally in App.jsx

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Use a ref for activeRoom to access it in the socket listener without causing re-connections
    const activeRoomRef = useRef(activeRoom);
    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://construction-backend-production-b192.up.railway.app';

        // Initialize socket only if it doesn't exist
        if (!socketRef.current) {
            socketRef.current = io(socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'], // Fallback mechanism
                reconnection: true
            });
        }

        const socket = socketRef.current;

        const handleConnect = () => {
            console.log('Real-time channel established');
            socket.emit('register_user', user);
            // Re-join known rooms if we reconnect
            rooms.forEach(room => {
                socket.emit('join_room', room.id || room._id);
            });
        };

        const handleNewMessage = (payload) => {
            const payloadRoomId = String(
                typeof payload.roomId === 'object' && payload.roomId !== null
                    ? payload.roomId._id
                    : payload.roomId || ''
            );

            // Update rooms preview list regardless of active room
            setRooms(prev => {
                const currentRooms = Array.isArray(prev) ? prev : [];
                const roomIndex = currentRooms.findIndex((r) => String(r.id || r._id) === payloadRoomId);
                if (roomIndex === -1) {
                    fetchRooms().catch(() => {});
                    return currentRooms;
                }

                const room = { ...currentRooms[roomIndex] };
                room.lastMessage = {
                    text: payload.message,
                    sender: payload.sender?.fullName || 'Unknown',
                    time: payload.createdAt
                };

                const currentActiveRoom = activeRoomRef.current;
                const activeId = currentActiveRoom ? String(currentActiveRoom.id || currentActiveRoom._id) : '';
                room.unreadCount = activeId === payloadRoomId ? 0 : (room.unreadCount || 0) + 1;

                const otherRooms = currentRooms.filter((r) => String(r.id || r._id) !== payloadRoomId);
                return [room, ...otherRooms];
            });

            const senderRaw = payload.sender?._id || payload.sender;
            const isIncoming = String(senderRaw) !== String(user?._id);

            const currentActiveRoom = activeRoomRef.current;
            const activeId = currentActiveRoom ? String(currentActiveRoom.id || currentActiveRoom._id) : '';

            if (currentActiveRoom && payloadRoomId === activeId) {
                setMessages(prev => {
                    const currentMessages = Array.isArray(prev) ? prev : [];

                    if (currentMessages.some(m => m.id === payload._id)) return currentMessages;

                    if (!isIncoming) {
                        const pendingIndex = currentMessages.findIndex(m => m.pending && m.text === payload.message);
                        if (pendingIndex !== -1) {
                            const updated = [...currentMessages];
                            updated[pendingIndex] = {
                                ...updated[pendingIndex],
                                id: payload._id,
                                pending: false,
                                time: new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            return updated;
                        }
                    }

                    return [...currentMessages, {
                        id: payload._id,
                        sender: payload.sender?.fullName || 'Unknown',
                        role: payload.sender?.role || 'System',
                        text: payload.message,
                        attachments: payload.attachments || [],
                        time: new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: !isIncoming
                    }];
                });
                api.put(`/chat/mark-read/${currentActiveRoom.id}`).catch(() => { });
                if (isIncoming) playSound('MESSAGE_RECEIVED');
            } else if (isIncoming) {
                playSound('MESSAGE_RECEIVED');
                const name = payload.sender?.fullName || 'Someone';
                const snippet = (payload.message || '').trim().slice(0, 90) || 'New message';
                toast(`${name}: ${snippet}`, { icon: '💬', duration: 5000 });
            }
        };

        const handleNotification = (notif) => {
            if (notif.type === 'chat') {
                // Unread + sound are handled by `new_message` when socket rooms are wired correctly.
                fetchRooms().catch(() => {});
            }
        };

        const handleOnlineCount = (count) => setOnlineCount(count);

        // Register listeners
        socket.on('connect', handleConnect);
        socket.on('new_message', handleNewMessage);
        socket.on('new_notification', handleNotification);
        socket.on('online_users_count', handleOnlineCount);

        // If already connected, register user immediately
        if (socket.connected) handleConnect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('new_message', handleNewMessage);
            socket.off('new_notification', handleNotification);
            socket.off('online_users_count', handleOnlineCount);
            // We only fully disconnect if the user or component unmounts
            // This allows the socket to persist across room changes
        };
    }, [user?._id]);

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
            const formattedRoom = { ...room, id: room.id || room._id };
            setRooms(prev => {
                const currentRooms = Array.isArray(prev) ? prev : [];
                if (currentRooms.find(r => r.id === formattedRoom.id)) return currentRooms;
                return [formattedRoom, ...currentRooms];
            });
            setActiveRoom(formattedRoom);
            setShowDirectory(false);
            const role = formattedRoom.otherRole?.toUpperCase();
            if (role === 'CLIENT') setActiveTab('CLIENT');
            else if (role === 'SUBCONTRACTOR') setActiveTab('SUB');
            else setActiveTab('INTERNAL');
        } catch (error) {
            console.error('Error starting direct chat:', error);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get('/chat/rooms');
            setRooms(res.data || []);
            if (socketRef.current?.connected) {
                res.data.forEach(room => {
                    socketRef.current.emit('join_room', room.id);
                });
            }
            if (!activeRoom && res.data.length > 0) {
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
        fetchDirectoryUsers();
    }, [user?._id]);

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
                    attachments: msg.attachments || [],
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: msg.sender?._id === user?._id || msg.sender === user?._id
                }));
                setMessages(formattedMessages);
                setRooms(prev => Array.isArray(prev) ? prev.map(r => r.id === activeRoom.id ? { ...r, unreadCount: 0 } : r) : []);
                await api.put(`/chat/mark-read/${activeRoom.id}`);
            } catch (error) {
                console.error('Error fetching room messages:', error);
            }
        };
        fetchMessages();
    }, [activeRoom?.id]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeRoom) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const tempId = 'uploading-' + Date.now();
            setMessages(prev => [...prev, {
                id: tempId,
                sender: user?.fullName || 'Me',
                role: user?.role || 'User',
                text: `Uploading: ${file.name}...`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: true,
                uploading: true
            }]);
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const attachment = res.data;
            setMessages(prev => prev.filter(m => m.id !== tempId));

            // For images, we don't necessarily need the "(Attached: ...)" text if the preview is clear
            const combinedMessage = newMessage.trim() ? newMessage : "";
            await handleSend(combinedMessage, [attachment]);
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async (messageText = null, attachments = []) => {
        let messageContent = messageText !== null ? messageText : newMessage;
        if (!messageContent.trim() && attachments.length > 0) messageContent = `Sent ${attachments.length} attachment(s)`;
        if (!messageContent.trim() || !activeRoom) return;

        const tempId = 'optimistic-' + Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            sender: user?.fullName || 'Me',
            role: user?.role || 'User',
            text: messageContent,
            attachments: attachments,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            pending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        if (messageText === null) setNewMessage('');
        if (showEmojiPicker) setShowEmojiPicker(false);

        try {
            const res = await api.post('/chat', {
                roomId: activeRoom.id,
                message: messageContent,
                attachments: attachments
            });
            const serverMsg = res.data;
            setMessages(prev => prev.map(msg => msg.id === tempId ? {
                ...msg,
                id: serverMsg._id,
                time: new Date(serverMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                pending: false
            } : msg));

            setRooms(prev => {
                const currentRooms = Array.isArray(prev) ? prev : [];
                const roomIndex = currentRooms.findIndex(r => r.id === activeRoom.id);
                const otherRooms = currentRooms.filter(r => r.id !== activeRoom.id);
                const updatedRoom = roomIndex !== -1 ? { ...currentRooms[roomIndex] } : { ...activeRoom };
                updatedRoom.lastMessage = {
                    text: serverMsg.message,
                    sender: serverMsg.sender?.fullName || user?.fullName,
                    time: serverMsg.createdAt
                };
                return [updatedRoom, ...otherRooms];
            });

            playSound('MESSAGE_SENT');
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
    };

    const downloadFile = async (url, name) => {
        try {
            const response = await api.get(`/chat/download`, { params: { url, name }, responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = blobUrl; link.download = name;
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) { alert('Download failed'); }
    };

    const filterRoomsByTab = (allRooms, tab) => {
        if (!Array.isArray(allRooms)) return [];
        return allRooms.filter(room => {
            if (tab === 'INTERNAL') {
                if (room.roomType === 'INTERNAL' || room.roomType === 'PROJECT_GROUP') return true;
                if (room.roomType === 'DIRECT') {
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

    if (loading) return <div className="p-10 text-center uppercase font-black text-slate-300">Loading Frequencies...</div>;

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in shadow-2xl">
            <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">COMMUNICATIONS</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setShowDirectory(true); fetchDirectoryUsers(); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UsersIcon size={16} /></button>
                            <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">{onlineCount} ACTIVE</div>
                        </div>
                    </div>
                    {['COMPANY_OWNER', 'SUPER_ADMIN', 'PM', 'FOREMAN', 'WORKER'].includes(user?.role) && (
                        <div className="flex p-1 bg-slate-200/50 rounded-2xl gap-1">
                            {[{ id: 'INTERNAL', label: 'Internal', icon: Shield }, { id: 'CLIENT', label: 'Clients', icon: UserIcon, adminOnly: true, pmAllowed: true }, { id: 'SUB', label: 'Subs', icon: HardHat, pmAllowed: true }].filter(tab => !tab.adminOnly || tab.pmAllowed || ['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)).map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                    <tab.icon size={14} className="mb-0.5" /><span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Filter transmissions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {displayRooms.map(room => (
                        <div key={room.id} onClick={() => setActiveRoom(room)} className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-white transition-all flex gap-3 ${activeRoom?.id === room.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''}`}>
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${activeRoom?.id === room.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{room.name?.[0] || '?'}</div>
                                {room.unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">{room.unreadCount}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className={`font-bold text-sm truncate ${activeRoom?.id === room.id ? 'text-blue-600' : 'text-slate-700'}`}>{room.name}</h4>
                                    {room.lastMessage && <span className="text-[8px] font-bold text-slate-400">{new Date(room.lastMessage.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                                {room.lastMessage && <div className="flex items-center gap-1.5 italic text-[10px] text-slate-400 truncate"><span className="px-1 py-0.5 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase">{room.lastMessage.sender.split(' ')[0]}</span>{room.lastMessage.text}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`flex-1 flex flex-col bg-white ${activeRoom ? 'flex' : 'hidden md:flex'}`}>
                {activeRoom ? (
                    <>
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => setActiveRoom(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-white shadow-xl ${activeRoom.roomType === 'INTERNAL' ? 'bg-blue-600' : 'bg-slate-900'}`}>
                                    {activeRoom.name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-base md:text-lg uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                                        {activeRoom.name}
                                    </h3>
                                    <p className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        SECURE CHANNEL
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                    <div className="max-w-[70%] group relative">
                                        {!msg.isMe && <div className="flex items-center gap-2 mb-1 px-1"><span className="text-[10px] font-black text-slate-800 uppercase">{msg.sender}</span><span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black italic">{msg.role}</span></div>}
                                        <div className={`rounded-2xl overflow-hidden shadow-sm border ${msg.isMe ? 'bg-blue-600 text-white border-blue-500 rounded-br-none' : 'bg-white text-slate-700 border-slate-100 rounded-bl-none'} ${msg.attachments?.some(a => isImage(a.url)) && !msg.text ? 'p-1' : 'p-3'}`}>
                                            {msg.attachments?.map((att, i) => {
                                                const isImg = isImage(att.url);
                                                if (isImg) {
                                                    return (
                                                        <div key={i} className="mb-2 last:mb-0 relative group/img cursor-pointer" onClick={() => downloadFile(att.url, att.name)}>
                                                            <img
                                                                src={att.url}
                                                                alt={att.name}
                                                                className="max-w-full rounded-xl object-contain bg-slate-100 max-h-96 w-full"
                                                                loading="lazy"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                                                                <Download className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" size={32} />
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Document/File UI (WhatsApp Document Style)
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => downloadFile(att.url, att.name)}
                                                        className={`flex items-center gap-3 p-3 mb-2 last:mb-0 rounded-xl border cursor-pointer transition-all hover:bg-opacity-80 active:scale-[0.98] ${msg.isMe ? 'bg-blue-700/50 border-blue-400/30' : 'bg-slate-50 border-slate-100'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${msg.isMe ? 'bg-blue-500' : 'bg-white shadow-sm border border-slate-200'}`}>
                                                            <Paperclip size={18} className={msg.isMe ? 'text-white' : 'text-slate-400'} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-[11px] font-black truncate leading-tight ${msg.isMe ? 'text-white' : 'text-slate-800'}`}>
                                                                {att.name}
                                                            </div>
                                                            <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${msg.isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                                {att.name.split('.').pop() || 'FILE'} • Download
                                                            </div>
                                                        </div>
                                                        <Download size={16} className={msg.isMe ? 'text-blue-200' : 'text-slate-300'} />
                                                    </div>
                                                );
                                            })}

                                            {msg.text && (
                                                <p className={`text-sm font-semibold leading-relaxed ${msg.attachments?.length > 0 ? 'mt-2 border-t pt-2 ' + (msg.isMe ? 'border-blue-500/30' : 'border-slate-50') : ''}`}>
                                                    {msg.text}
                                                </p>
                                            )}

                                            <div className={`text-[8px] font-black uppercase tracking-widest opacity-60 text-right mt-1 ${msg.attachments?.some(a => isImage(a.url)) && !msg.text ? 'absolute bottom-3 right-3 px-2 py-1 bg-black/30 backdrop-blur-md rounded text-white shadow-sm border border-white/10' : ''}`}>
                                                {msg.time}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 md:p-6 bg-white border-t border-slate-100 sticky bottom-0">
                            <div className="flex gap-2 md:gap-3 items-center">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl md:rounded-2xl border border-slate-100 transition-all"><Paperclip size={18} className="md:w-5 md:h-5" /></button>
                                <div className="flex-1 relative">
                                    <input type="text" placeholder="Transmission..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl pl-4 pr-10 md:pl-5 md:pr-12 py-3 md:py-3.5 text-xs md:text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" />
                                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-3 top-3 md:right-4 md:top-4 text-slate-300 hover:text-slate-600 transition-colors"><Smile size={18} className="md:w-5 md:h-5" /></button>
                                    {showEmojiPicker && <div className="absolute bottom-full right-0 mb-4 p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 grid grid-cols-6 gap-2 z-[100] scale-up">{commonEmojis.map(e => <button key={e} onClick={() => { setNewMessage(p => p + e); setShowEmojiPicker(false); }} className="text-lg hover:bg-slate-50 p-1 rounded-lg transition-all active:scale-125">{e}</button>)}</div>}
                                </div>
                                <button onClick={() => handleSend()} className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl shadow-xl transition-all ${newMessage.trim() || uploading ? 'bg-blue-600 text-white scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}><Send size={18} className="md:w-5 md:h-5" /></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-50"><UsersIcon size={48} className="text-slate-200" /><p className="text-slate-500 font-bold uppercase text-xs mt-4">Select a secure frequency to begin coordination.</p></div>
                )}
            </div>
            <Modal 
                isOpen={showDirectory} 
                onClose={() => { setShowDirectory(false); setUserSearchTerm(''); }} 
                title="New Direct Frequency"
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <div className="px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            Secure Line Initiation • Direct Personnel Access
                        </p>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or role..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold uppercase outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {directoryUsers
                            .filter(u => 
                                u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
                            )
                            .map(u => (
                                <div 
                                    key={u._id} 
                                    onClick={() => { startDirectChat(u._id); setUserSearchTerm(''); }} 
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[24px] cursor-pointer border border-transparent hover:border-slate-100 group transition-all duration-300 active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-blue-600 group-hover:rotate-3 transition-all duration-300">
                                        {u.fullName[0]}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                            {u.fullName}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            {u.role}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                        <ChevronLeft size={16} className="text-blue-600 rotate-180" />
                                    </div>
                                </div>
                            ))}
                        {directoryUsers.filter(u => 
                                u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
                            ).length === 0 && (
                            <div className="py-10 text-center opacity-40">
                                <Search size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No personnel found</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Chat;
