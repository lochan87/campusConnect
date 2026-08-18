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
  const { openConversation, closeConversation, activeConversationId, loadConversations } = useDM();

  const [showSearch, setShowSearch] = useState(false);
  const [inboxQuery, setInboxQuery] = useState('');
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');

  // Sync conversation with URL route parameter
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (routeConvId) {
      openConversation(routeConvId);
      setMobileView('chat');
    } else {
      closeConversation();
      setMobileView('list');
    }
  }, [routeConvId]); // eslint-disable-line

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
    <div className="fixed inset-0 top-28 md:top-16 bg-slate-100 dark:bg-slate-950 p-0 xl:p-4 overflow-hidden z-10 flex items-center justify-center">
      <div className="w-full max-w-[1440px] h-full xl:h-[calc(100vh-5.5rem)] flex bg-white dark:bg-gray-900 xl:rounded-3xl xl:border xl:border-gray-200/80 dark:xl:border-gray-800 xl:shadow-2xl overflow-hidden relative">
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
