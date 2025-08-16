import { apiRequest } from './queryClient';

/**
 * Sends a message to the chatbot with the current language preference
 * @param message The message to send to the chatbot
 * @param language The language code (en, hi, te, mr)
 * @returns The chatbot's response
 */
export async function sendChatMessage(message: string, language: string = 'en'): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/chatbot', { 
      message,
      language // Include the language preference
    });
    
    const data = await response.json();
    
    if (data.success === false) {
      throw new Error(data.message || 'Failed to get response from chatbot');
    }
    
    return data.reply;
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    // Return error message in the same language if possible
    if (language === 'hi') {
      return "मुझे खेद है, मैं अभी कनेक्ट होने में परेशानी हो रही है। कृपया बाद में पुनः प्रयास करें।";
    } else if (language === 'te') {
      return "క్షమించండి, నేను ప్రస్తుతం కనెక్ట్ చేయడంలో సమస్య ఉంది. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.";
    } else if (language === 'mr') {
      return "मला माफ करा, मला आत्ता कनेक्ट होण्यात अडचण येत आहे. कृपया नंतर पुन्हा प्रयत्न करा.";
    } else {
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }
}
