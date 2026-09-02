import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface ConversationWithDetails {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  brand: {
    name: string;
  };
  latestMessage: {
    content: string;
    created_at: string;
  };
}

export function ConversationListPage({
  onSelectConversation,
}: {
  onSelectConversation: (id: string) => void;
}) {
  const { logout, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("conversations")
          .select(`
            id,
            customer_id,
            brand_id,
            customers(name, email),
            brands(name)
          `)
          .order("updated_at", { ascending: false });

        if (queryError) throw queryError;

        if (!data) {
          setConversations([]);
          return;
        }

        const enrichedConversations = await Promise.all(
          data.map(async (conv: any) => {
            const { data: messages } = await supabase
              .from("messages")
              .select("content, created_at")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1);

            return {
              id: conv.id,
              customer: conv.customers,
              brand: conv.brands,
              latestMessage: messages?.[0] || { content: "No messages", created_at: "" },
            };
          })
        );

        setConversations(enrichedConversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-gray-100 sticky top-0 z-10">
        <div className="container-wide py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Logo & User */}
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  CX Reply Assistant
                </h1>
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <span className="status-dot status-dot-online"></span>
                  {user?.email}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <button onClick={logout} className="btn-danger text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-wide py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Conversations
            </h2>
            <span className="badge badge-gray">
              {filteredConversations.length}
            </span>
          </div>
          <div className="relative w-full sm:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 mb-6 animate-fade-in">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* Conversation List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner-indigo"></div>
            <p className="mt-5 text-gray-500 font-medium">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-5">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No conversations found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredConversations.map((conv, index) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="card-hover p-6 text-left group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Customer Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-indigo-700 font-extrabold text-lg">
                          {conv.customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                            {conv.customer.name}
                          </h3>
                          <span className="badge badge-gray text-xs">
                            {conv.brand.name}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 truncate">{conv.customer.email}</p>
                      </div>
                    </div>
                    
                    {/* Latest Message */}
                    <div className="mt-3 ml-16">
                      <p className="text-sm text-gray-700 line-clamp-2 font-medium leading-relaxed">
                        {conv.latestMessage.content}
                      </p>
                      {conv.latestMessage.created_at && (
                        <p className="text-xs text-gray-400 mt-1.5 font-medium">
                          {new Date(conv.latestMessage.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
                      View →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}