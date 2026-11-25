import React from 'react';
import './ContentPages.css';

export default function AskRajesh({ onBack }) {
  const [messages] = React.useState([
    { role: 'rajesh', text: "Namaste! I am Rajesh Sharma, your guide on this Brahmaputra Expedition." },
    { role: 'rajesh', text: "How can I assist you with your journey through our digital compartment today?" }
  ]);

  return (
    <div className="content-page ask-rajesh-page">
      <button className="back-btn" onClick={onBack}>← BACK TO SEAT</button>

      <div className="chat-interface-container animate-fade-in">
        <div className="rajesh-sidebar">
          <img src="/assets/TT_master_wbg.png" alt="Rajesh Sharma" />
        </div>

        <div className="chat-window-box glass">
          <header className="chat-header">
            <h3>ASK RAJESH <span>ACTIVE SESSION</span></h3>
          </header>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <input type="text" placeholder="Ask about the platform..." readOnly />
            <button className="send-btn">SEND</button>
          </div>
        </div>
      </div>
    </div>
  );
}
