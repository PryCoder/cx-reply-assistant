import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { ConversationListPage } from './pages/ConversationListPage';
import { ConversationViewPage } from './pages/ConversationViewPage';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (selectedConversation) {
    return (
      <>
        <button
          onClick={() => setSelectedConversation(null)}
          className="fixed top-4 left-4 z-50 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          ← Back
        </button>
        <ConversationViewPage conversationId={selectedConversation} />
      </>
    );
  }

  return <ConversationListPage onSelectConversation={setSelectedConversation} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;