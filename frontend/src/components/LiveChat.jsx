import { useEffect, useState } from 'react';
import {
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
} from 'firebase/database';
import { auth, realtimeDb } from '../firebase/firebaseConfig';
import './LiveChat.css';

function getDisplayName(user) {
  if (!user) {
    return 'Guest User';
  }

  if (user.displayName) {
    return user.displayName;
  }

  if (user.email) {
    return user.email;
  }

  return 'Bidit User';
}

function formatMessageTime(createdAt) {
  if (!createdAt) {
    return '';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LiveChat({ auctionId }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!auctionId) {
      return undefined;
    }

    const messagesRef = ref(realtimeDb, `auctionChats/${auctionId}/messages`);
    const messagesQuery = query(
      messagesRef,
      orderByChild('createdAt'),
      limitToLast(50)
    );

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const parsedMessages = Object.entries(data)
        .map(([messageId, value]) => ({
          messageId,
          ...value,
        }))
        .sort((a, b) => {
          const aTime = a.createdAt || 0;
          const bTime = b.createdAt || 0;
          return aTime - bTime;
        });

      setMessages(parsedMessages);
    });

    return () => unsubscribe();
  }, [auctionId]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const cleanText = messageText.trim();

    if (!cleanText) {
      return;
    }

    if (!auctionId) {
      setErrorMessage('Auction ID is missing.');
      return;
    }

    if (cleanText.length > 300) {
      setErrorMessage('Message is too long. Please use up to 300 characters.');
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage('');

      const currentUser = auth.currentUser;
      const messagesRef = ref(realtimeDb, `auctionChats/${auctionId}/messages`);

      await push(messagesRef, {
        auctionId,
        userId: currentUser?.uid || 'guest-user',
        userName: getDisplayName(currentUser),
        userAvatarUrl: currentUser?.photoURL || '',
        text: cleanText,
        createdAt: serverTimestamp(),
      });

      setMessageText('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="live-chat card">
      <div className="live-chat__header">
        <h3>Live Chat</h3>
        <span>{messages.length} messages</span>
      </div>

      <ul className="live-chat__messages">
        {messages.length === 0 && (
          <li className="live-chat__empty">No messages yet. Start the conversation.</li>
        )}

        {messages.map((message) => (
          <li className="live-chat__message" key={message.messageId}>
            <div className="live-chat__avatar">
              {message.userAvatarUrl ? (
                <img src={message.userAvatarUrl} alt={message.userName || 'User'} />
              ) : (
                <span>{(message.userName || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="live-chat__bubble">
              <div className="live-chat__meta">
                <strong>{message.userName || 'User'}</strong>
                <span>{formatMessageTime(message.createdAt)}</span>
              </div>

              <p>{message.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {errorMessage && <p className="live-chat__error">{errorMessage}</p>}

      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          maxLength={300}
        />

        <button type="submit" disabled={isSending || !messageText.trim()}>
          {isSending ? '...' : '➤'}
        </button>
      </form>
    </section>
  );
}

export default LiveChat;