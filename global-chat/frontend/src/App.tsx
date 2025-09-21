import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {

  const [socket, setSocket] = useState<null | WebSocket>(null)
  const [messages, setMessages] = useState<{type: string, text: string, username?: string}[]>([]);
  const [message, setMessage] = useState("")
  const [username, setUsername] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0) // Hardcoded for now

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if user is scrolled up to show scroll button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setShowScrollButton(!isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Function to logout (clear localStorage)
  const handleLogout = () => {
    localStorage.removeItem("username")
    localStorage.removeItem("userId")
    window.location.reload() // Reload to show login screen
  }

  // Function to purge chat messages
  const handlePurge = () => {
    setMessages([])
  }

  useEffect(() => {
    const ws = new WebSocket("wss://global-chat-backend-91mq.onrender.com")

    ws.onopen = () => {
      setSocket(ws)
      setIsConnected(true)
      
      const storedUsername = localStorage.getItem("username")
      if(storedUsername) {
        ws.send(JSON.stringify({"type":"register", "username": storedUsername}))
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = () => {
      setIsConnected(false)
    }

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data)

      if (data.type === "register_success"){
        localStorage.setItem("username", data.username)
        localStorage.setItem("userId", data.userId)
      } else if(data.type === "chat"){
        setMessages(prev => [...prev, { type: "chat", text: data.message, username: data.username }]);
      } else if (data.type === "system"){
        setMessages(prev => [...prev, {type:"system", text: data.message}])
      } else if (data.type === "online_count"){
        setOnlineUsers(data.count)
      } else {
        console.log("Unknown event:", data);
      }
    };

    return () => {
      ws.close()
    }

  }, [])

  if (!socket) {
    return (
      <div className="bg-[#0A0A0A] md:h-[100vh] h-[90vh] flex items-center justify-center relative overflow-hidden">
        <div className="matrix-rain opacity-10"></div>
        <div className="text-center relative z-10">
          <div className="text-[#33CD32] text-2xl font-mono robotic-pulse cyber-glow-text">
            [SYSTEM] INITIALIZING CONNECTION...
          </div>
          <div className="text-[#33CD32]/60 text-sm font-mono mt-2 terminal-cursor">
            Establishing secure channel...
          </div>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-[#33CD32] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#33CD32] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#33CD32] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!localStorage.getItem("username")) {
    return (
      <div className="bg-[#0A0A0A] md:h-[100vh] h-[90vh] flex items-center justify-center relative overflow-hidden">
        <div className="matrix-rain opacity-5"></div>
        <div className="text-center max-w-md w-full p-6 relative z-10">
          <div className="text-[#33CD32] text-3xl font-mono mb-8" data-text="[AUTH_REQUIRED]">
            [AUTH_REQUIRED]
          </div>
          <div className="text-[#33CD32]/80 text-lg font-mono mb-6 terminal-cursor">
            Enter your username to access the global chat network
          </div>
          {onlineUsers > 0 && (
            <div className="text-[#33CD32]/60 text-sm font-mono mb-4">
              {onlineUsers} user{onlineUsers !== 1 ? 's' : ''} currently online
            </div>
          )}
          <div className="space-y-4">
            <input 
              className="w-full bg-[#0A0A0A] border-2 border-[#33CD32] text-[#33CD32] p-3 font-mono focus:outline-none focus:border-[#33CD32]/80 focus:shadow-[0_0_10px_#33CD32/30] transition-all duration-300 terminal-cursor" 
              type="text" 
              placeholder="[USERNAME]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && socket.send(JSON.stringify({type: "register", "username":username}))}
            />
            <button 
              className="w-full bg-[#33CD32] text-black py-3 px-6 font-mono font-bold hover:bg-[#33CD32]/80 hover:shadow-[0_0_15px_#33CD32/50] transition-all duration-300 transform hover:scale-105 holographic" 
              onClick={() => socket.send(JSON.stringify({type: "register", "username":username}))}
            >
              [CONNECT]
            </button>
          </div>
          <div className="mt-6 text-[#33CD32]/40 text-xs">
            <div className="flex justify-center space-x-4">
              <span>SECURE CONNECTION</span>
              <span>•</span>
              <span>ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#0A0A0A] md:h-[100vh] h-[90vh] flex flex-col font-mono relative overflow-hidden w-full max-w-full'>
      {/* Matrix rain background effect */}
      <div className="matrix-rain opacity-5"></div>
      
      {/* Header with connection status */}
      <div className="bg-[#0A0A0A] border-b border-[#33CD32]/30 p-4 flex justify-between items-center relative z-10 hacker-terminal">
        <div className="flex flex-col">
          <div className="text-[#33CD32] font-bold cyber-glow-text">
            [OPEN-CHAT]
          </div>
          <div className="text-xs text-[#33CD32]/70 mt-1">
            ONLINE: {onlineUsers}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#33CD32]' : 'bg-red-500'} robotic-pulse`}></div>
          <div className="flex space-x-2">
            <button
              onClick={handlePurge}
              className="border border-[#33CD32] text-[#33CD32] bg-transparent py-1 px-3 text-xs font-mono hover:bg-[#33CD32]/10 transition-all duration-300"
              title="Clear chat messages"
            >
              [PURGE]
            </button>
            <button
              onClick={handleLogout}
              className="border border-[#33CD32] text-[#33CD32] bg-transparent py-1 px-3 text-xs font-mono hover:bg-[#33CD32]/10 transition-all duration-300"
              title="Logout and clear session"
            >
              [EXIT]
            </button>
          </div>
        </div>
      </div>

      {/* Messages container with proper scrolling */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10 w-full max-w-full chat-messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`${msg.type === "system" ? 'text-[#33CD32]/70' : 'text-[#33CD32]'} group w-full`}>
            {msg.type === "system" ? (
              <div className="p-2 rounded border-[#33CD32]/30 bg-[#33CD32]/5 w-full">
                <span className="text-[#33CD32]/50 text-xs font-bold">[SYSTEM] </span>
                <span className="italic" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{msg.text}</span>
              </div>
            ) : (
              <div className="hover:bg-[#33CD32]/5 p-3 rounded transition-colors duration-200 w-full">
                <span className="text-[#33CD32]/80 font-bold">
                  &lt;{msg.username}&gt; 
                </span>
                <span className="text-[#33CD32]" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{msg.text}</span>
                <span className="text-[#33CD32]/30 text-xs opacity-0 group-hover:opacity-100 transition-opacity block mt-1">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-6 bg-[#33CD32] text-black p-2 rounded-full hover:bg-[#33CD32]/80 transition-all duration-300 z-20 shadow-lg"
            title="Scroll to latest message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Fixed input area at bottom */}
      <div className="bg-[#0A0A0A] border-t border-[#33CD32]/30 p-4 relative z-10">
        <div className="flex space-x-3">
          <input
            className="flex-1 bg-[#0A0A0A] border-2 border-[#33CD32] text-[#33CD32] p-3 focus:outline-none focus:border-[#33CD32]/80 focus:shadow-[0_0_10px_#33CD32/30] transition-all duration-300 placeholder-[#33CD32]/50 terminal-cursor"
            type="text"
            placeholder='[MESSAGE_INPUT]'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && socket && message.trim()) {
                socket.send(JSON.stringify({ type: "chat", message }));
                setMessage("");
                // Force scroll to bottom when sending message
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          />
          <button
            className="bg-[#33CD32] text-black py-3 px-6 font-bold hover:bg-[#33CD32]/80 hover:shadow-[0_0_15px_#33CD32/50] transition-all duration-300 transform hover:scale-105 active:scale-95 holographic"
            onClick={() => {
              if (socket && message.trim()) {
                socket.send(JSON.stringify({ type: "chat", message }));
                setMessage("");
                // Force scroll to bottom when sending message
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          >
            [SEND]
          </button>
        </div>
        <div className="text-[#33CD32]/40 text-xs mt-2 flex justify-between">
          <span>Press ENTER to send • Connected as: {localStorage.getItem("username")}</span>
          <span className="terminal-cursor">READY</span>
        </div>
      </div>
    </div>
  )
}

export default App
