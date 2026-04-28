import React, { useState, useEffect, useRef } from 'react'; 
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  // --- WEEK 4: DYNAMIC CHAT HISTORY ---
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('opsmind_history');
    return savedHistory ? JSON.parse(savedHistory) : [
      { id: 1, title: "Agile Discussion", msgs: [{role: "AI", text: "### Agile SOP\nAgile points are saved here."}] },
      { id: 2, title: "DBMS Queries", msgs: [{role: "AI", text: "### DBMS SOP\nNormalization rules stored."}] }
    ];
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [view, setView] = useState("chat");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ msg: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sourceData, setSourceData] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const savedChat = localStorage.getItem('opsmind_session');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    }
  }, []);

  // Save current active messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('opsmind_session', JSON.stringify(messages));
    }
  }, [messages]);

  // --- WEEK 4: SAVE SIDEBAR HISTORY ---
  useEffect(() => {
    localStorage.setItem('opsmind_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Response copied to clipboard!");
  };

  const loadChatFromHistory = (chat) => {
    setMessages(chat.msgs);
    setView("chat");
  };

  const handleSend = async () => {
    if (!input) return;

    const userMsg = { role: "user", text: input };
    const currentMsgs = [...messages, userMsg];
    const chatTitle = input.length > 20 ? input.substring(0, 20) + "..." : input;
    
    setMessages(currentMsgs);
    setInput("");
    setIsLoading(true);

    let finalAiMsg;

    try {
      const res = await axios.post("http://localhost:5000/api/chat", { question: input });
      finalAiMsg = { 
        role: "AI", 
        text: res.data.answer,
        sources: res.data.sources 
      };
    } catch (err) {
      finalAiMsg = { 
        role: "AI", 
        text: `⚠️ **Server Connection Pending.**\n\nDatabase indexing logic check cheyali.`,
        sources: [{ file: "System_Check.pdf", page: "01", snippet: "Check backend connectivity." }] 
      };
    } finally {
      const updatedMessages = [...currentMsgs, finalAiMsg];
      setMessages(updatedMessages);
      setIsLoading(false);

      // --- WEEK 4: UPDATE SIDEBAR AUTOMATICALLY ---
      const newHistoryItem = {
        id: Date.now(),
        title: chatTitle,
        msgs: updatedMessages
      };
      
      setChatHistory(prev => {
        const filtered = prev.filter(item => item.title !== chatTitle);
        return [newHistoryItem, ...filtered].slice(0, 10); // Keep last 10 chats
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus({ msg: "⏳ Indexing...", type: "loading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("http://localhost:5000/api/upload", formData);
      setUploadStatus({ msg: "✅ Success! Document Indexed.", type: "success" });
      setFile(null);
    } catch (err) {
      setUploadStatus({ msg: "❌ Upload Error. Check Backend.", type: "error" });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>OpsMind AI</div>
        <button onClick={() => { setMessages([]); localStorage.removeItem('opsmind_session'); }} style={styles.newChatBtn}>+ New Chat</button>
        <div style={styles.historySection}>
          <p style={styles.historyLabel}>Recent Conversations</p>
          {chatHistory.map(chat => (
            <div key={chat.id} onClick={() => loadChatFromHistory(chat)} style={styles.historyItem}>
              💬 {chat.title}
            </div>
          ))}
        </div>
        <div style={{marginTop: 'auto'}}>
            <button onClick={() => setView("chat")} 
                    style={view === 'chat' ? styles.activeNav : styles.navBtn}>
              🤖 Chat Agent
            </button>
            <button onClick={() => setView("admin")} 
                    style={view === 'admin' ? styles.activeNav : styles.navBtn}>
              📂 Knowledge Base
            </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {view === "chat" ? (
          <div style={styles.chatWrapper}>
            <div style={styles.messageBox}>
              {messages.length === 0 && (
                <div style={styles.emptyState}>
                  <h2>Welcome to OpsMind AI</h2>
                  <p>How can I help you today?</p>
                  <div style={styles.suggestionGrid}>
                    <button onClick={() => {setInput("How do I process a refund?");}} style={styles.suggestBtn}>"Refund Process?"</button>
                    <button onClick={() => {setInput("Explain the onboarding SOP.");}} style={styles.suggestBtn}>"Onboarding SOP?"</button>
                  </div>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} style={m.role === 'user' ? styles.userRow : styles.aiRow}>
                  <div style={m.role === 'user' ? styles.userBubble : styles.aiBubble}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                    {m.role === 'AI' && (
                      <div style={styles.aiActions}>
                        <button onClick={() => copyToClipboard(m.text)} style={styles.actionBtn}>📋 Copy Response</button>
                        {m.sources && m.sources.map((src, idx) => (
                          <button key={idx} onClick={() => { setSourceData(src); setShowModal(true); }} style={styles.actionBtn}>
                            🔍 View Source {src.file ? `: ${src.file}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <div style={styles.loadingPulse}>AI is analyzing...</div>}
              <div ref={messagesEndRef} />
            </div>
            
            <div style={styles.inputArea}>
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your AI assistant..." 
                style={styles.inputField} 
              />
              <button onClick={handleSend} style={styles.sendBtn}>Send</button>
            </div>
          </div>
        ) : (
          <div style={styles.adminWrapper}>
              <h2 style={{color: '#1e293b'}}>Knowledge Management</h2>
              <div style={styles.uploadCard}>
                <div style={styles.fileBox}>
                   <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <button onClick={handleUpload} style={styles.primaryBtn}>Upload & Index Document</button>
                {uploadStatus.msg && (
                  <div style={{marginTop: '20px', color: uploadStatus.type === 'success' ? '#166534' : '#991b1b', fontWeight: '600'}}>
                    {uploadStatus.msg}
                  </div>
                )}
              </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3 style={{margin: 0}}>Source Citation</h3>
                <button onClick={() => setShowModal(false)} style={styles.xBtn}>&times;</button>
            </div>
            <p style={{fontSize: '14px', color: '#64748b', marginTop: '10px'}}>
                <b>Document:</b> {sourceData?.file || "Reference"} | <b>Page:</b> {sourceData?.page || "N/A"}
            </p>
            <div style={styles.snippetBox}>{sourceData?.snippet || "Content loading..."}</div>
            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { width: '280px', backgroundColor: '#0f172a', padding: '24px 16px', display: 'flex', flexDirection: 'column' },
  logo: { color: '#38bdf8', fontSize: '24px', fontWeight: '800', marginBottom: '35px', textAlign: 'center' },
  newChatBtn: { padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: 'none', color: '#fff', cursor: 'pointer', marginBottom: '25px' },
  historySection: { flex: 1, overflowY: 'auto' },
  historyLabel: { color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '15px' },
  historyItem: { color: '#94a3b8', padding: '12px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', marginBottom: '5px', backgroundColor: 'rgba(255,255,255,0.05)' },
  navBtn: { width: '100%', padding: '14px', border: 'none', background: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer' },
  activeNav: { width: '100%', padding: '14px', border: 'none', backgroundColor: '#1e293b', color: '#fff', textAlign: 'left', borderRadius: '10px', borderLeft: '4px solid #38bdf8' },
  mainContent: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  chatWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messageBox: { flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column' },
  userRow: { alignSelf: 'flex-end', marginBottom: '20px', maxWidth: '80%' },
  aiRow: { alignSelf: 'flex-start', marginBottom: '20px', maxWidth: '80%' },
  userBubble: { backgroundColor: '#3b82f6', color: '#fff', padding: '12px 20px', borderRadius: '20px 20px 4px 20px' },
  aiBubble: { backgroundColor: '#f8fafc', color: '#1e293b', padding: '12px 20px', borderRadius: '20px 20px 20px 4px', border: '1px solid #e2e8f0' },
  aiActions: { marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' },
  actionBtn: { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  inputArea: { padding: '20px 30px', display: 'flex', gap: '15px', borderTop: '1px solid #f1f5f9' },
  inputField: { flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  sendBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '0 30px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  adminWrapper: { textAlign: 'center', paddingTop: '40px' },
  uploadCard: { backgroundColor: '#fff', padding: '50px', borderRadius: '24px', display: 'inline-block', minWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  fileBox: { border: '2px dashed #e2e8f0', padding: '30px', borderRadius: '15px', marginBottom: '25px' },
  primaryBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' },
  loadingPulse: { color: '#3b82f6', fontSize: '13px', fontStyle: 'italic', marginTop: '10px' },
  emptyState: { textAlign: 'center', marginTop: '100px', color: '#64748b' },
  suggestionGrid: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' },
  suggestBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #38bdf8', backgroundColor: '#f0f9ff', color: '#0369a1', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '20px', width: '420px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' },
  xBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' },
  snippetBox: { padding: '15px', borderLeft: '4px solid #38bdf8', backgroundColor: '#f8fafc', fontStyle: 'italic', margin: '20px 0', lineHeight: '1.5', color: '#334155' },
  closeBtn: { width: '100%', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }
};

export default App;