import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { GlassCard, Button, Input, Badge } from '../../components/ui';
import { speakText, stopSpeaking } from '../../utils/tts';

const ConsultationRoom = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [prescription, setPrescription] = useState('');
    const [activeTab, setActiveTab] = useState('chat');
    const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
    const ttsEnabled = user?.accessibilitySettings?.ttsEnabled || false;
    const socketRef = useRef();
    const jitsiContainerRef = useRef(null);

    useEffect(() => {
        // Connect to Socket.io
        socketRef.current = io('http://localhost:5000');
        socketRef.current.emit('join_room', id);

        socketRef.current.on('receive_message', (data) => {
            setChatHistory((prev) => [...prev, data]);
        });

        socketRef.current.on('receive_note', (data) => {
            setNotes((prev) => [...prev, data]);
        });

        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/consultation/${id}/chat`);
                const formatted = data.map(chat => ({
                    author: chat.sender._id,
                    authorName: chat.sender.name,
                    message: chat.message,
                    time: chat.createdAt
                }));
                setChatHistory(formatted);
            } catch (error) {
                console.error("Error fetching chat history", error);
            }
        };

        const fetchNotes = async () => {
            try {
                const { data } = await api.get(`/consultation/${id}/notes`);
                setNotes(data);
            } catch (error) {
                console.error("Error fetching notes", error);
            }
        };

        const fetchPrescription = async () => {
            try {
                const { data } = await api.get(`/consultation/${id}/prescription`);
                if (data && data.medications) {
                    setPrescription(JSON.stringify(data.medications, null, 2));
                }
            } catch (error) {
                console.error("Error fetching prescription", error);
            }
        };

        fetchHistory();
        fetchNotes();
        fetchPrescription();

        const loadJitsiScript = () => {
            if (!window.JitsiMeetExternalAPI) {
                const script = document.createElement('script');
                script.src = 'https://meet.jit.si/external_api.js';
                script.async = true;
                script.onload = initJitsi;
                document.body.appendChild(script);
            } else {
                initJitsi();
            }
        };

        const initJitsi = () => {
            if (jitsiContainerRef.current) {
                jitsiContainerRef.current.innerHTML = '';
                const domain = 'meet.jit.si';
                const options = {
                    roomName: `MediFusionVision-${id}`,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiContainerRef.current,
                    userInfo: {
                        displayName: user.name
                    },
                    configOverwrite: {
                        startWithAudioMuted: true,
                        startWithVideoMuted: true
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                    }
                };
                new window.JitsiMeetExternalAPI(domain, options);
            }
        };

        loadJitsiScript();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, user.name]);

    const sendMessage = async () => {
        if (message.trim() !== '') {
            const messageData = {
                room: id,
                author: user._id,
                authorName: user.name,
                message: message,
                appointmentId: id,
                time: new Date().toISOString(),
            };

            await socketRef.current.emit('send_message', messageData);
            setChatHistory((prev) => [...prev, messageData]);
            setMessage('');
        }
    };

    const sendNote = async () => {
        if (newNote.trim() !== '') {
            const noteData = {
                room: id,
                author: user._id,
                content: newNote,
                appointmentId: id,
            };
            await socketRef.current.emit('send_note', noteData);
            setNewNote('');
        }
    };

    const savePrescriptionHandler = async () => {
        try {
            let medicationsData;
            try {
                medicationsData = JSON.parse(prescription);
            } catch (e) {
                medicationsData = { text: prescription };
            }
            await api.post(`/consultation/${id}/prescription`, { medications: medicationsData });
            toast.success('Prescription saved successfully!');
        } catch (error) {
            console.error("Error saving prescription", error);
            toast.error('Failed to save prescription.');
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
            {/* Back Button Overlay */}
            <div className="absolute top-4 left-4 z-20">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/patient/dashboard')}
                    className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                >
                    ← Back to Dashboard
                </Button>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 flex flex-col p-4 relative z-10">
                <div className="bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden flex-1 border border-white/10 relative">
                    <div ref={jitsiContainerRef} className="w-full h-full" />
                </div>
            </div>

            {/* Sidebar (Glassmorphism) */}
            <div className="w-96 p-4 relative z-10">
                <GlassCard className="h-full flex flex-col overflow-hidden border-l border-white/20 shadow-2xl">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 bg-white/5">
                        {['chat', 'notes', 'prescription'].map((tab) => (
                            <button
                                key={tab}
                                className={`flex-1 py-4 font-medium text-sm transition-all relative ${activeTab === tab
                                    ? 'text-primary-blue'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30">
                        <AnimatePresence mode="wait">
                            {activeTab === 'chat' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {chatHistory.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.author === user._id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm ${msg.author === user._id
                                                ? 'bg-primary-blue text-white rounded-br-none'
                                                : 'bg-white/80 text-gray-800 rounded-bl-none border border-white/40'
                                                }`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs opacity-75 font-medium">{msg.authorName}</p>
                                                    {ttsEnabled && (
                                                        <button
                                                            onClick={() => {
                                                                if (speakingMsgIdx === index) {
                                                                    stopSpeaking();
                                                                    setSpeakingMsgIdx(null);
                                                                } else {
                                                                    speakText(msg.message);
                                                                    setSpeakingMsgIdx(index);
                                                                }
                                                            }}
                                                            className="text-xs opacity-60 hover:opacity-100 ml-2"
                                                            title={speakingMsgIdx === index ? "Stop" : "Listen"}
                                                        >
                                                            {speakingMsgIdx === index ? "⏹" : "🔊"}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'notes' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {notes.map((note, index) => (
                                        <div key={index} className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/40 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-sm text-gray-800">{note.author.name}</span>
                                                <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                        </div>
                                    ))}
                                    {notes.length === 0 && (
                                        <div className="text-center text-gray-400 mt-10">
                                            <p>No clinical notes yet</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'prescription' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/40 shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span>💊</span> Prescription
                                        </h3>
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white/50 p-3 rounded-lg border border-white/20">
                                            {prescription || "No prescription details available yet."}
                                        </pre>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/20">
                        {activeTab === 'chat' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 rounded-xl bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 text-sm placeholder-gray-500"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <Button size="sm" onClick={sendMessage} className="rounded-xl px-3">
                                    ➤
                                </Button>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            user.role === 'doctor' ? (
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full px-4 py-2 rounded-xl bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 text-sm resize-none placeholder-gray-500"
                                        rows="3"
                                        placeholder="Add a clinical note..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    ></textarea>
                                    <Button size="sm" onClick={sendNote} className="w-full">
                                        Add Note
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-500 italic">
                                    Only doctors can add notes.
                                </p>
                            )
                        )}

                        {activeTab === 'prescription' && (
                            user.role === 'doctor' ? (
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full px-4 py-2 rounded-xl bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 text-sm resize-none font-mono placeholder-gray-500"
                                        rows="6"
                                        placeholder='Enter prescription details...'
                                        value={prescription}
                                        onChange={(e) => setPrescription(e.target.value)}
                                    ></textarea>
                                    <Button size="sm" onClick={savePrescriptionHandler} className="w-full bg-purple-600 hover:bg-purple-700">
                                        Save Prescription
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-500 italic">
                                    View-only mode for patients.
                                </p>
                            )
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ConsultationRoom;
