import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
} from 'firebase/database';
import { realtimeDb } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const messagesListRef = useRef(null);

  useEffect(() => {
    if (!auctionId) {
      return undefined;
    }

    // UC-11: Listens for the latest chat messages for this auction.
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

  useEffect(() => {
    const messagesList = messagesListRef.current;

    if (!messagesList) {
      return;
    }

    // UC-11: Auto-scrolls so the newest chat message stays visible.
    messagesList.scrollTo({
      top: messagesList.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  function showAuthMessage() {
    setAuthMessage('You must be logged in to perform this action.');
  }

  function goToLogin() {
    navigate('/login', { state: { from: location } });
  }

  // UC-11: Validates and sends a new live chat message.
  async function handleSendMessage(event) {
    event.preventDefault();

    if (!user) {
      showAuthMessage();
      return;
    }

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

      const messagesRef = ref(realtimeDb, `auctionChats/${auctionId}/messages`);

      // UC-11: Saves the chat message to Firebase for everyone listening.
      await push(messagesRef, {
        auctionId,
        userId: user.uid,
        userName: getDisplayName(user),
        userAvatarUrl: user.photoURL || '',
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

      {/* UC-11: Renders the live chat message feed. */}
      <ul className="live-chat__messages" ref={messagesListRef}>
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

      {authMessage && (
        <div className="live-chat__auth-notice" role="alert">
          <p>{authMessage}</p>
          <button type="button" onClick={goToLogin}>Log In</button>
        </div>
      )}

      {errorMessage && <p className="live-chat__error">{errorMessage}</p>}

      {/* UC-11: Chat input for typing and submitting a message. */}
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder={user ? 'Type a message...' : 'Log in to join the chat'}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onFocus={!user ? showAuthMessage : undefined}
          readOnly={!user}
          maxLength={300}
        />

        <button type="submit" disabled={isSending || (user && !messageText.trim())}>
          {isSending ? '...' : '➤'}
        </button>
      </form>
    </section>
  );
}

export default LiveChat;