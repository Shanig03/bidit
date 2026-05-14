import './LiveChat.css';

function LiveChat({ messages }) {
  return (
    <section className="live-chat card">
      <h3>Live Chat</h3>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            <span>👤</span>
            <div>
              <p>{message.username}</p>
              <small>{message.message}</small>
            </div>
          </li>
        ))}
      </ul>
      <div className="chat-input">
        <input placeholder="Type a message..." />
        <button type="button">➤</button>
      </div>
    </section>
  );
}

export default LiveChat;
