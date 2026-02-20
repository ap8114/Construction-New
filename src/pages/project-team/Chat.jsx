import { useState } from 'react';
import {
    Send, Paperclip, MoreVertical, Search,
    Phone, Video, Smile, CheckCheck, Circle
} from 'lucide-react';

const TEAM_MEMBERS = [
    { id: 1, name: 'Mike Ross', role: 'Site Foreman', online: true, avatar: 'M' },
    { id: 2, name: 'Sarah Jen', role: 'Project Manager', online: true, avatar: 'S' },
    { id: 3, name: 'Dave Miller', role: 'Safety Officer', online: false, avatar: 'D' },
    { id: 4, name: 'Construction Bot', role: 'AI Assistant', online: true, avatar: 'AI' },
];

const Chat = () => {
    const [message, setMessage] = useState('');
    const [activeChat, setActiveChat] = useState(TEAM_MEMBERS[0]);

    const messages = [
        { id: 1, sender: 'Mike Ross', text: "Have the reinforcement checks for Level 3 started?", time: '10:12 AM', self: false },
        { id: 2, sender: 'Me', text: "Yes Mike, just finishing Section B now. Everything looks solid so far.", time: '10:14 AM', self: true },
        { id: 3, sender: 'Mike Ross', text: "Great, let me know when you've uploaded the photos.", time: '10:15 AM', self: false },
        { id: 4, sender: 'Sarah Jen', text: "Morning team! Remember the high wind alert for this afternoon.", time: '10:20 AM', self: false },
    ];

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">

            {/* Sidebar - Contacts */}
            <div className="w-80 border-r border-slate-100 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search chat..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {TEAM_MEMBERS.map((member) => (
                        <div
                            key={member.id}
                            onClick={() => setActiveChat(member)}
                            className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-l-4
                ${activeChat.id === member.id
                                    ? 'bg-blue-50 border-blue-600'
                                    : 'border-transparent hover:bg-slate-50'
                                }`}
                        >
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${member.id === 4 ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    {member.avatar}
                                </div>
                                {member.online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm">{member.name}</p>
                                <p className="text-xs text-slate-500 truncate">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/30">

                {/* Chat Header */}
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 md:hidden">
                            {activeChat.avatar}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{activeChat.name}</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <button className="hover:text-blue-600 transition"><Phone size={20} /></button>
                        <button className="hover:text-blue-600 transition"><Video size={20} /></button>
                        <button className="hover:text-blue-600 transition md:block hidden"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Message Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.self ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm relative
                ${m.self
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                }`}
                            >
                                {!m.self && <p className="text-[10px] font-bold text-slate-400 mb-1">{m.sender}</p>}
                                <p className="text-sm leading-relaxed">{m.text}</p>
                                <div className={`flex items-center gap-1 mt-1 justify-end ${m.self ? 'text-blue-100' : 'text-slate-400'}`}>
                                    <span className="text-[9px]">{m.time}</span>
                                    {m.self && <CheckCheck size={12} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition"><Smile size={20} /></button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition"><Paperclip size={20} /></button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write a message..."
                            className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-slate-700"
                        />
                        <button
                            className={`p-2.5 rounded-xl transition-all
                ${message.trim() ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}
              `}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
