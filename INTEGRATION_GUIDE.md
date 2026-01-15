# Integrating Jeff into Your Apps - Customer Chat

This guide shows you how to add Jeff as a customer support chat widget to your applications (ShopWare, Dealio, Quotely, etc.).

## 🎯 Quick Overview

1. **Add a chat widget** to your app (floating button in bottom-right)
2. **Generate a session ID** for each user conversation
3. **Send messages** to Jeff's API
4. **Display responses** in the chat UI

## 📦 Step 1: Add Chat Widget HTML/CSS

Add this to your app's HTML (before `</body>`):

```html
<!-- Jeff Chat Widget -->
<div id="jeff-chat-widget" style="display: none;">
  <div id="jeff-chat-container">
    <div id="jeff-chat-header">
      <h3>Chat with Jeff</h3>
      <button id="jeff-chat-close">×</button>
    </div>
    <div id="jeff-chat-messages"></div>
    <div id="jeff-chat-input-container">
      <input type="text" id="jeff-chat-input" placeholder="Type your message...">
      <button id="jeff-chat-send">Send</button>
    </div>
  </div>
</div>
<button id="jeff-chat-toggle" class="jeff-chat-button">💬 Chat</button>

<style>
  /* Chat Toggle Button */
  .jeff-chat-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #000;
    color: #fff;
    border: none;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    transition: transform 0.2s;
  }
  
  .jeff-chat-button:hover {
    transform: scale(1.1);
  }
  
  /* Chat Widget */
  #jeff-chat-widget {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  #jeff-chat-header {
    background: #000;
    color: #fff;
    padding: 16px;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  #jeff-chat-header h3 {
    margin: 0;
    font-size: 18px;
  }
  
  #jeff-chat-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
  }
  
  #jeff-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .jeff-message {
    max-width: 80%;
    padding: 12px;
    border-radius: 8px;
    word-wrap: break-word;
  }
  
  .jeff-message.user {
    align-self: flex-end;
    background: #000;
    color: #fff;
  }
  
  .jeff-message.assistant {
    align-self: flex-start;
    background: #f5f5f5;
    color: #000;
  }
  
  .jeff-message.thinking {
    align-self: flex-start;
    background: #f5f5f5;
    color: #666;
    font-style: italic;
  }
  
  #jeff-chat-input-container {
    padding: 16px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 8px;
  }
  
  #jeff-chat-input {
    flex: 1;
    padding: 12px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    font-size: 14px;
  }
  
  #jeff-chat-send {
    padding: 12px 24px;
    background: #000;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  
  #jeff-chat-send:hover {
    background: #333;
  }
  
  #jeff-chat-send:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    #jeff-chat-widget {
      width: 100%;
      height: 100%;
      bottom: 0;
      right: 0;
      border-radius: 0;
    }
  }
</style>
```

## 🔧 Step 2: Add JavaScript Integration

Add this JavaScript code to handle the chat:

```javascript
// Jeff Chat Integration
(function() {
  'use strict';
  
  // Configuration - UPDATE THESE!
  const JEFF_API_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app'; // Get from Super Admin dashboard
  const CHANNEL = 'support'; // or 'sales', 'onboarding'
  
  // Generate or retrieve session ID
  function getSessionId() {
    let sessionId = localStorage.getItem('jeff_session_id');
    if (!sessionId) {
      // Generate UUID v4
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('jeff_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Initialize chat
  function initChat() {
    const toggle = document.getElementById('jeff-chat-toggle');
    const widget = document.getElementById('jeff-chat-widget');
    const close = document.getElementById('jeff-chat-close');
    const sendBtn = document.getElementById('jeff-chat-send');
    const input = document.getElementById('jeff-chat-input');
    const messages = document.getElementById('jeff-chat-messages');
    
    // Toggle chat
    toggle.addEventListener('click', () => {
      widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
      if (widget.style.display === 'flex') {
        input.focus();
      }
    });
    
    close.addEventListener('click', () => {
      widget.style.display = 'none';
    });
    
    // Send message
    function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage('user', message);
      input.value = '';
      sendBtn.disabled = true;
      
      // Show thinking indicator
      const thinkingId = addMessage('thinking', 'Jeff is thinking...');
      
      // Send to Jeff
      fetch(`${JEFF_API_URL}/v1/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          mode: 'operator',
          channel: CHANNEL,
          message: message,
        }),
      })
      .then(response => response.json())
      .then(data => {
        // Remove thinking message
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();
        
        // Add Jeff's response
        addMessage('assistant', data.reply);
        
        // Handle actions (e.g., create ticket)
        if (data.actions && data.actions.length > 0) {
          handleActions(data.actions);
        }
        
        sendBtn.disabled = false;
        input.focus();
      })
      .catch(error => {
        // Remove thinking message
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();
        
        addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        sendBtn.disabled = false;
        console.error('Jeff API error:', error);
      });
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Add welcome message
    addMessage('assistant', 'Hi! I\'m Jeff, your AI assistant. How can I help you today?');
  }
  
  // Add message to chat
  function addMessage(role, content) {
    const messages = document.getElementById('jeff-chat-messages');
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const messageEl = document.createElement('div');
    messageEl.id = messageId;
    messageEl.className = `jeff-message ${role}`;
    messageEl.textContent = content;
    messages.appendChild(messageEl);
    messages.scrollTop = messages.scrollHeight;
    return messageId;
  }
  
  // Handle actions from Jeff
  function handleActions(actions) {
    actions.forEach(action => {
      switch (action.type) {
        case 'create_ticket':
          addMessage('assistant', '✓ I\'ve created a support ticket for you. Our team will follow up soon.');
          break;
        case 'suggest_plan':
          addMessage('assistant', `💡 Based on your needs, I recommend the ${action.payload.tier} plan.`);
          break;
        // Add more action handlers as needed
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
```

## 🎨 Step 3: React Component (For React Apps)

If you're using React (like ShopWare might be), here's a React component:

```tsx
// components/JeffChat.tsx
import React, { useState, useEffect, useRef } from 'react';

const JEFF_API_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app';
const CHANNEL = 'support'; // or 'sales', 'onboarding'

interface Message {
  role: 'user' | 'assistant' | 'thinking';
  content: string;
}

export function JeffChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Jeff, your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const getSessionId = () => {
    let sessionId = localStorage.getItem('jeff_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('jeff_session_id', sessionId);
    }
    return sessionId;
  };
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${JEFF_API_URL}/v1/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          mode: 'operator',
          channel: CHANNEL,
          message: userMessage,
        }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Handle actions
      if (data.actions?.length > 0) {
        handleActions(data.actions);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleActions = (actions: any[]) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'create_ticket':
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '✓ I\'ve created a support ticket for you.'
          }]);
          break;
      }
    });
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:scale-110 transition-transform z-50"
      >
        💬
      </button>
      
      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-black text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Chat with Jeff</h3>
            <button onClick={() => setIsOpen(false)} className="text-2xl">×</button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-black text-white ml-auto'
                    : msg.role === 'thinking'
                    ? 'bg-gray-100 text-gray-600 italic'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-600 italic">
                Jeff is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg font-semibold disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

## 🔌 Step 4: Determine Channel Based on Context

You can dynamically set the channel based on where the user is in your app:

```javascript
function getChannel() {
  // Check current page/route
  const path = window.location.pathname;
  
  if (path.includes('/billing') || path.includes('/pricing')) {
    return 'sales';
  } else if (path.includes('/onboarding') || path.includes('/getting-started')) {
    return 'onboarding';
  } else {
    return 'support'; // Default
  }
}

// Use it when sending messages
fetch(`${JEFF_API_URL}/v1/agent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: getSessionId(),
    mode: 'operator',
    channel: getChannel(), // Dynamic channel
    message: message,
  }),
})
```

## 📱 Step 5: Add to Your Apps

### ShopWare (Next.js/React)
1. Add the React component to your layout
2. Import and use: `<JeffChat />`
3. Update `JEFF_API_URL` with actual URL

### Dealio
1. Add the HTML/CSS/JS code to your main HTML file
2. Update `JEFF_API_URL` 
3. Set `CHANNEL` based on page context

### Quotely
1. Same as Dealio - add HTML/CSS/JS
2. Consider using 'sales' channel for pricing questions

## 🔐 Step 6: Get Jeff's URL

1. Go to **Super Admin Dashboard** → **Employees** section
2. Find Jeff's card
3. Copy the URL (or check DigitalOcean dashboard)
4. Update `JEFF_API_URL` in your code

## ✅ Testing

1. Open your app
2. Click the chat button (bottom-right)
3. Send a test message: "How do I post an RFQ?"
4. You should get a response from Jeff!

## 🎯 Example Use Cases

### Support Questions
- "How do I post an RFQ?"
- "I'm getting an error when submitting a bid"
- "How do I upgrade my plan?"

### Sales Questions
- "What are your pricing plans?"
- "Do you offer custom integrations?" (Jeff will refuse)
- "What's included in the Premium plan?"

### Onboarding
- "I just signed up, what's next?"
- "How do I complete my profile?"
- "Where do I find my first RFQ?"

## 🚀 That's It!

Once you add this code to your apps, customers will see a chat button and can start conversations with Jeff immediately. Each conversation maintains context through the session ID stored in localStorage.

