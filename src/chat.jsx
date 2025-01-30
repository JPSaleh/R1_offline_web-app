import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Loading from "react-loading"; // Typing animation

const renderers = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

const Chat = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...currentMessages, { role: "user", content: input }];
    setCurrentMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post("http://localhost:5001/chat", { message: input });
      const reply = res.data.choices[0].message.content;
      setCurrentMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-container">
      <div className="main-chat">
        <div className="chat-header">
          <h1>DeepSeek Chat</h1>
        </div>
        
        <div className="chat-box">
          <div className="messages-container">
            {currentMessages.map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role === "user" ? "user" : "assistant"}`}>
                <div className="message-bubble">
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content">
                    <ReactMarkdown
                      children={msg.content}
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={renderers}
                    />
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-wrapper assistant">
                <div className="message-bubble">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content typing">
                    <Loading type="bubbles" color="#666" height={30} width={40} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send)"
              className="message-input"
              rows="3"
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;