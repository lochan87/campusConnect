import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDM } from '../context/DMContext';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import EmptyChatState from '../components/messaging/EmptyChatState';
import UserSearchModal from '../components/messaging/UserSearchModal';

const Messages = () => {
  const { conversationId: routeConvId } = useParams();
  const navigate = useNavigate();
  const { openConversation, activeConversationId, loadConversations } = useDM();

  const [showSearch, setShowSearch] = useState(false);
  const [inboxQuery, setInboxQuery] = useState('');
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');

  // Open conversation from URL param on mount
  useEffect(() => {
    loadConversations();
    if (routeConvId) {
      openConversation(routeConvId);
      setMobileView('chat');
    }
  }, []); // eslint-disable-line

  // Sync URL when active conversation changes
  useEffect(() => {
    if (activeConversationId && activeConversationId !== routeConvId) {
      navigate(`/messages/${activeConversationId}`, { replace: true });
      setMobileView('chat');
    }
  }, [activeConversationId]); // eslint-disable-line

  const handleNewChat = () => setShowSearch(true);

  const handleConversationStarted = (convId) => {
    openConversation(convId);
    setMobileView('chat');
  };

  const handleMobileBack = () => {
    setMobileView('list');
    navigate('/messages', { replace: true });
  };

  return (
    <div className="fixed inset-0 top-16 md:top-16 flex bg-gray-50 dark:bg-gray-900" style={{ zIndex: 10 }}>
      {/* ── Conversation list pane ── */}
      <div
        className={`
          flex-shrink-0 w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 overflow-hidden
          ${mobileView === 'chat' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}
      >
        <ConversationList
          onNewChat={handleNewChat}
          searchQuery={inboxQuery}
          onSearchChange={setInboxQuery}
        />
      </div>

      {/* ── Chat area ── */}
      <div
        className={`
          flex-1 overflow-hidden relative
          ${mobileView === 'list' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}
      >
        {activeConversationId ? (
          <motion.div
            key={activeConversationId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="h-full flex flex-col"
          >
            <ChatWindow onBack={handleMobileBack} />
          </motion.div>
        ) : (
          <EmptyChatState onNewChat={handleNewChat} />
        )}
      </div>

      {/* ── User search modal ── */}
      <AnimatePresence>
        {showSearch && (
          <UserSearchModal
            onClose={() => setShowSearch(false)}
            onConversationStarted={handleConversationStarted}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
