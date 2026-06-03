/**
 * Chat History Management
 * Utilities for exporting, importing, and managing chat history
 */

export interface ChatData {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
  lastUpdated: string;
  messages: any[];
}

export interface ChatHistoryExport {
  version: string;
  exportDate: string;
  totalChats: number;
  chats: ChatData[];
}

/**
 * Export all chat history to a JSON file
 */
export const exportChatHistory = (
  historyItems: any[],
  chatMessages: Map<string, any>
): ChatHistoryExport => {
  const chats: ChatData[] = historyItems.map((item) => {
    const messages = chatMessages.get(item.id) || [];
    return {
      id: item.id,
      title: item.title,
      timestamp: new Date(item.timestamp).toISOString(),
      messageCount: item.messageCount || messages.length,
      lastUpdated: new Date(item.lastUpdated || item.timestamp).toISOString(),
      messages,
    };
  });

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalChats: chats.length,
    chats,
  };
};

/**
 * Download exported chat history as JSON file
 */
export const downloadChatHistory = (historyExport: ChatHistoryExport): void => {
  const dataStr = JSON.stringify(historyExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bext-chat-history-${new Date().getTime()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import chat history from JSON file
 */
export const importChatHistory = (
  file: File
): Promise<ChatHistoryExport> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as ChatHistoryExport;
        
        // Validate format
        if (!imported.version || !Array.isArray(imported.chats)) {
          throw new Error('Файл форматы дұрыс емес');
        }
        
        resolve(imported);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Файл оқу қатесі'));
    reader.readAsText(file);
  });
};

/**
 * Get all chat messages from localStorage
 */
export const getAllChatMessages = (
  historyItems: any[]
): Map<string, any[]> => {
  const messagesMap = new Map<string, any[]>();
  
  historyItems.forEach((item) => {
    try {
      const messages = localStorage.getItem(`bext_chat_${item.id}`);
      if (messages) {
        messagesMap.set(item.id, JSON.parse(messages));
      }
    } catch (error) {
      console.error(`Failed to load messages for chat ${item.id}:`, error);
    }
  });
  
  return messagesMap;
};

/**
 * Restore chat history from exported data
 */
export const restoreChatHistory = (
  imported: ChatHistoryExport,
  existingHistoryItems: any[]
): { newHistoryItems: any[]; message: string } => {
  const newHistoryItems = [...existingHistoryItems];
  let addedCount = 0;

  imported.chats.forEach((chat) => {
    // Check if chat already exists
    if (!newHistoryItems.find((h) => h.id === chat.id)) {
      newHistoryItems.push({
        id: chat.id,
        title: chat.title,
        timestamp: new Date(chat.timestamp),
        messageCount: chat.messageCount,
        lastUpdated: new Date(chat.lastUpdated),
      });

      // Save messages
      if (chat.messages.length > 0) {
        localStorage.setItem(`bext_chat_${chat.id}`, JSON.stringify(chat.messages));
      }

      addedCount++;
    }
  });

  return {
    newHistoryItems: newHistoryItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    message: `${addedCount} чат сәтті импортталды`,
  };
};
