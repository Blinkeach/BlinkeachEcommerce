import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendChatMessage } from '@/lib/chatbot';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

const Chatbot: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatbot.welcome'),
      isBot: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Pass the current language to the chatbot API
      const botResponse = await sendChatMessage(inputValue, currentLanguage);
      
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          isBot: true
        }
      ]);
    } catch (error) {
      // Get translated error message
      const errorMessage = t('chatbot.error_connecting');
      
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          id: (Date.now() + 1).toString(),
          text: errorMessage,
          isBot: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-secondary hover:bg-secondary-dark text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      
      <div 
        className={cn(
          "absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-secondary text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-secondary mr-2">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{t('chatbot.bot_name')}</h3>
              <div className="flex items-center text-xs">
                <span className="bg-green-500 rounded-full w-2 h-2 mr-1"></span>
                <span>{t('chatbot.status_online')}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="h-80 p-4 overflow-y-auto bg-neutral-50" id="chatMessages">
          {messages.map((message) => (
            <div key={message.id} className={`flex mb-4 ${message.isBot ? '' : 'justify-end'}`}>
              {message.isBot && (
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white flex-shrink-0 mr-2">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={cn(
                "rounded-lg p-3 max-w-[80%]",
                message.isBot 
                  ? "bg-neutral-200 rounded-tl-none"
                  : "bg-secondary text-white rounded-tr-none"
              )}>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex mb-4">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white flex-shrink-0 mr-2">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-neutral-200 rounded-lg rounded-tl-none p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="p-3 border-t">
          <div className="flex">
            <Input
              type="text"
              placeholder={t('chatbot.message_placeholder')}
              className="flex-1 border border-neutral-300 rounded-l-md"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              type="submit"
              className="bg-secondary hover:bg-secondary-dark text-white rounded-r-md px-4 transition-colors"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
