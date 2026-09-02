import React, { useState } from 'react';
import { useConversation } from '../hooks/useConversation';
import { replyService } from '../services/replyService';
import { formatDate, getStatusLabel, getStatusColor, getInitials } from '../lib/utils';

interface ConversationViewPageProps {
  conversationId: string;
}

export const ConversationViewPage: React.FC<ConversationViewPageProps> = ({
  conversationId,
}) => {
  const { customer, brand, orders, messages, loading, error, refetch } =
    useConversation(conversationId);

  const [aiResponse, setAiResponse] = useState('');
  const [retrievedContext, setRetrievedContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setLocalError('');
    setAiResponse('');
    setRetrievedContext('');

    try {
      const data = await replyService.generateReply(conversationId);
      setAiResponse(data.reply);
      setRetrievedContext(data.retrieved_context);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to generate reply');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    setGenerating(true);
    setLocalError('');

    try {
      await replyService.approveReply(conversationId, aiResponse);
      await refetch();
      setAiResponse('');
      setRetrievedContext('');
      setShowContext(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to approve reply');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="spinner-indigo"></div>
        <p className="mt-5 text-gray-500 font-medium">Loading conversation...</p>
      </div>
    );
  }

  if (!customer || !brand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 font-semibold">Failed to load conversation</p>
      </div>
    );
  }

  const latestOrder = orders[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom py-8">
        {/* Customer Info Card */}
        <div className="card-premium p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-indigo-700 font-extrabold text-2xl">
                  {getInitials(customer.name)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {customer.name}
                </h1>
                <p className="text-sm font-medium text-gray-500">{customer.email}</p>
              </div>
            </div>
            <span className="badge badge-primary text-sm">{brand.name}</span>
          </div>

          {latestOrder && (
            <div className="mt-5 p-5 bg-gray-50 rounded-xl border-2 border-gray-100/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="label">Product</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {latestOrder.product_name}
                  </p>
                </div>
                <div>
                  <p className="label">Delivered</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {formatDate(latestOrder.delivery_date)}
                  </p>
                </div>
                <div>
                  <p className="label">Status</p>
                  <span className={`badge mt-1 ${getStatusColor(latestOrder.status)}`}>
                    {getStatusLabel(latestOrder.status)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="card-premium mt-5 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Conversation
            </h2>
            <span className="badge badge-gray">{messages.length} messages</span>
          </div>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 font-medium py-8">
                No messages yet
              </p>
            ) : (
              messages.map((msg, index) => {
                const isCustomer = msg.sender === 'customer';
                const isLatest = index === messages.length - 1;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
                        isCustomer
                          ? isLatest
                            ? 'message-customer-latest'
                            : 'message-customer'
                          : msg.sender === 'agent'
                          ? 'message-agent'
                          : 'message-ai'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-xs font-bold tracking-wide ${
                            isCustomer ? 'text-indigo-700' : 'text-emerald-700'
                          }`}
                        >
                          {isCustomer ? 'Customer' : msg.sender === 'agent' ? 'Agent' : 'AI'}
                        </span>
                        {isCustomer && isLatest && (
                          <span className="badge bg-indigo-500 text-white text-[10px] tracking-wide">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-2">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {(localError || error) && (
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-4 animate-fade-in">
              <p className="text-sm font-semibold text-red-800">
                {localError || error}
              </p>
            </div>
          )}

          {/* AI Reply */}
          {!aiResponse ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full flex items-center justify-center gap-3 text-base py-3.5"
            >
              {generating ? (
                <>
                  <div className="spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Reply
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4 mt-5 border-t-2 border-gray-200 pt-5 animate-fade-in">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="badge badge-primary text-xs">AI Generated</span>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                    Edit Response
                  </h3>
                </div>
                <textarea
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  className="input-field min-h-40 resize-y font-medium"
                  placeholder="Edit the AI response here..."
                />
                <p className="text-xs text-gray-400 font-medium mt-1.5 text-right">
                  {aiResponse.length} characters
                </p>
              </div>

              <button
                onClick={() => setShowContext(!showContext)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2 transition-colors"
              >
                <span className="text-lg">{showContext ? '▼' : '▶'}</span>
                {showContext ? 'Hide' : 'View'} Retrieved Context
              </button>

              {showContext && retrievedContext && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 overflow-auto max-h-60 animate-fade-in">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {retrievedContext}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <div className="spinner"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={generating || !aiResponse.trim()}
                  className="btn-success flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <div className="spinner"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Approve & Send
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};