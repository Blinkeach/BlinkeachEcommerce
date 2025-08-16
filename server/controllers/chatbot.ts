import { Request, Response } from "express";

// Chatbot response translations
const translations: Record<string, Record<string, Record<string, string>>> = {
  en: {
    responses: {
      greeting: "Hello! Welcome to Blinkeach. How can I assist you today?",
      help: "I'm here to help! You can ask me about our products, shipping policies, return policies, or payment methods. What would you like to know?",
      delivery: "We offer free shipping on orders above ₹499. Standard delivery takes 3-5 business days depending on your location. You can track your order through the 'Track Order' section in your account.",
      return: "We have a 10-day return policy. If you're not satisfied with your purchase, you can return it within 10 days for a full refund. Please ensure the item is in its original condition with all tags attached.",
      payment: "We accept various payment methods including Credit/Debit cards, Net Banking, UPI, Wallets, and COD (Cash on Delivery). All payments are securely processed through Razorpay payment gateway.",
      order: "You can track your order by logging into your account and visiting the 'My Orders' section. If you have any specific queries about your order, please provide your order ID.",
      cancel: "You can cancel your order before it is shipped. Please go to 'My Orders' in your account and select the order you wish to cancel. If it's already shipped, you'll need to return it after delivery.",
      discount: "We regularly run promotions and offer discounts. Please check our homepage for current offers. You can also subscribe to our newsletter to stay updated on the latest deals.",
      contact: "You can reach our customer service team at +91 98765 43210 or email us at support@blinkeach.com. Our office is located at KB Lane, Panchayati Akhara, Gaya, Bihar - 823001.",
      livechat: "Our live chat support is available Monday to Saturday from 10:00 AM to 6:00 PM IST. Just click on the chat icon at the bottom right corner of the screen to start a conversation with our customer support team.",
      callme: "We offer callback services! You can request a call from our team by clicking on the chat icon at the bottom right of the screen and selecting the 'Call Me' option. Please provide your phone number and preferred language (English or Hindi).",
      email: "You can send us an email at blinkeach@gmail.com or use our contact form by clicking on the chat icon at the bottom right of your screen. Our team typically responds to emails within 24 hours.",
      support: "We offer multiple support options: 1) Live chat (Mon-Sat, 10AM-6PM), 2) Email support at blinkeach@gmail.com, 3) Request a callback through our chat widget. How would you like to contact us?",
      default: "Thank you for your message. I'm not quite sure how to help with that. Could you please rephrase your question or ask about our products, shipping, returns, or payment methods?"
    }
  },
  hi: {
    responses: {
      greeting: "नमस्ते! ब्लिंकईच में आपका स्वागत है। मैं आज आपकी कैसे सहायता कर सकता हूँ?",
      help: "मैं मदद करने के लिए यहां हूं! आप हमारे उत्पादों, शिपिंग नीतियों, वापसी नीतियों, या भुगतान विधियों के बारे में पूछ सकते हैं। आप क्या जानना चाहेंगे?",
      delivery: "हम ₹499 से ऊपर के ऑर्डर पर मुफ्त शिपिंग प्रदान करते हैं। मानक डिलीवरी आपके स्थान के आधार पर 3-5 कार्य दिवसों में होती है। आप अपने खाते में 'ऑर्डर ट्रैक करें' अनुभाग के माध्यम से अपने ऑर्डर को ट्रैक कर सकते हैं।",
      return: "हमारी 10 दिनों की वापसी नीति है। यदि आप अपनी खरीद से संतुष्ट नहीं हैं, तो आप इसे पूर्ण धनवापसी के लिए 10 दिनों के भीतर वापस कर सकते हैं। कृपया सुनिश्चित करें कि आइटम अपनी मूल स्थिति में सभी टैग लगे हुए हैं।",
      payment: "हम क्रेडिट/डेबिट कार्ड, नेट बैंकिंग, UPI, वॉलेट, और COD (कैश ऑन डिलीवरी) सहित विभिन्न भुगतान विधियों को स्वीकार करते हैं। सभी भुगतान रेज़रपे पेमेंट गेटवे के माध्यम से सुरक्षित रूप से संसाधित किए जाते हैं।",
      order: "आप अपने खाते में लॉग इन करके और 'मेरे ऑर्डर' अनुभाग पर जाकर अपने ऑर्डर को ट्रैक कर सकते हैं। यदि आपके पास अपने ऑर्डर के बारे में कोई विशिष्ट प्रश्न है, तो कृपया अपना ऑर्डर आईडी प्रदान करें।",
      cancel: "आप अपने ऑर्डर को शिप होने से पहले रद्द कर सकते हैं। कृपया अपने खाते में 'मेरे ऑर्डर' पर जाएं और उस ऑर्डर का चयन करें जिसे आप रद्द करना चाहते हैं। यदि यह पहले से ही शिप हो चुका है, तो आपको डिलीवरी के बाद इसे वापस करने की आवश्यकता होगी।",
      discount: "हम नियमित रूप से प्रमोशन चलाते हैं और छूट प्रदान करते हैं। वर्तमान ऑफर के लिए कृपया हमारे होमपेज देखें। आप नवीनतम डील्स के बारे में अपडेट रहने के लिए हमारे न्यूज़लेटर की सदस्यता भी ले सकते हैं।",
      contact: "आप हमारी ग्राहक सेवा टीम से +91 98765 43210 पर संपर्क कर सकते हैं या हमें support@blinkeach.com पर ईमेल कर सकते हैं। हमारा कार्यालय KB लेन, पंचायती अखाड़ा, गया, बिहार - 823001 में स्थित है।",
      livechat: "हमारा लाइव चैट सपोर्ट सोमवार से शनिवार, सुबह 10:00 बजे से शाम 6:00 बजे IST तक उपलब्ध है। बस स्क्रीन के नीचे दाईं ओर चैट आइकन पर क्लिक करके हमारी ग्राहक सहायता टीम के साथ बातचीत शुरू करें।",
      callme: "हम कॉलबैक सेवाएं प्रदान करते हैं! आप स्क्रीन के निचले दाएं कोने में चैट आइकन पर क्लिक करके और 'मुझे कॉल करें' विकल्प का चयन करके हमारी टीम से कॉल का अनुरोध कर सकते हैं। कृपया अपना फोन नंबर और पसंदीदा भाषा (अंग्रेजी या हिंदी) प्रदान करें।",
      email: "आप हमें blinkeach@gmail.com पर ईमेल भेज सकते हैं या अपनी स्क्रीन के निचले दाएं कोने में चैट आइकन पर क्लिक करके हमारे संपर्क फॉर्म का उपयोग कर सकते हैं। हमारी टीम आमतौर पर 24 घंटों के भीतर ईमेल का जवाब देती है।",
      support: "हम कई सपोर्ट विकल्प प्रदान करते हैं: 1) लाइव चैट (सोम-शनि, सुबह 10 बजे से शाम 6 बजे तक), 2) blinkeach@gmail.com पर ईमेल सपोर्ट, 3) हमारे चैट विजेट के माध्यम से कॉलबैक का अनुरोध करें। आप हमसे कैसे संपर्क करना चाहेंगे?",
      default: "आपके संदेश के लिए धन्यवाद। मुझे निश्चित नहीं है कि मैं इस विषय में कैसे मदद कर सकता हूँ। क्या आप कृपया अपना प्रश्न दोबारा फ्रेज़ कर सकते हैं या हमारे उत्पादों, शिपिंग, रिटर्न, या भुगतान विधियों के बारे में पूछ सकते हैं?"
    }
  },
  te: {
    responses: {
      greeting: "హలో! బ్లింకీచ్‌కి స్వాగతం. నేను మీకు ఎలా సహాయం చేయగలను?",
      help: "నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను! మీరు మా ఉత్పత్తుల, షిప్పింగ్ విధానాల, రిటర్న్ విధానాల లేదా చెల్లింపు పద్ధతుల గురించి అడగవచ్చు. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
      delivery: "మేము ₹499 పైబడిన ఆర్డర్‌లపై ఉచిత షిప్పింగ్‌ని అందిస్తాము. మీ ప్రాంతాన్ని బట్టి ప్రామాణిక డెలివరీ 3-5 పని దినాలు పడుతుంది. మీరు మీ ఖాతాలోని 'ఆర్డర్ ట్రాక్ చేయండి' విభాగం ద్వారా మీ ఆర్డర్‌ని ట్రాక్ చేయవచ్చు.",
      return: "మాకు 10 రోజుల రిటర్న్ విధానం ఉంది. మీరు మీ కొనుగోలుతో సంతృప్తి చెందకపోతే, పూర్తి వాపసు కోసం 10 రోజుల్లోపు దానిని తిరిగి ఇవ్వవచ్చు. దయచేసి అన్ని ట్యాగ్‌లు జతచేయబడిన దాని అసలు స్థితిలో వస్తువు ఉందని నిర్ధారించుకోండి.",
      payment: "మేము క్రెడిట్/డెబిట్ కార్డులు, నెట్ బ్యాంకింగ్, UPI, వాలెట్లు మరియు COD (క్యాష్ ఆన్ డెలివరీ) సహా వివిధ చెల్లింపు పద్ధతులను అంగీకరిస్తాము. అన్ని చెల్లింపులు రేజర్‌పే చెల్లింపు గేట్‌వే ద్వారా సురక్షితంగా ప్రాసెస్ చేయబడతాయి.",
      order: "మీరు మీ ఖాతాలోకి లాగిన్ అయి, 'నా ఆర్డర్‌లు' విభాగానికి వెళ్లడం ద్వారా మీ ఆర్డర్‌ని ట్రాక్ చేయవచ్చు. మీ ఆర్డర్ గురించి మీకు ఏవైనా నిర్దిష్ట ప్రశ్నలు ఉంటే, దయచేసి మీ ఆర్డర్ ID ని అందించండి.",
      cancel: "షిప్ చేయబడటానికి ముందు మీరు మీ ఆర్డర్‌ని రద్దు చేయవచ్చు. దయచేసి మీ ఖాతాలోని 'నా ఆర్డర్‌లు'కి వెళ్లి, మీరు రద్దు చేయాలనుకుంటున్న ఆర్డర్‌ని ఎంచుకోండి. ఇది ఇప్పటికే షిప్ చేయబడి ఉంటే, డెలివరీ తర్వాత మీరు దాన్ని తిరిగి ఇవ్వాల్సి ఉంటుంది.",
      discount: "మేము క్రమం తప్పకుండా ప్రమోషన్‌లను నడుపుతాము మరియు డిస్కౌంట్‌లను అందిస్తాము. ప్రస్తుత ఆఫర్‌ల కోసం దయచేసి మా హోమ్‌పేజీని తనిఖీ చేయండి. తాజా డీల్స్ గురించి అప్‌డేట్‌గా ఉండటానికి మీరు మా వార్తాలేఖకు సబ్‌స్క్రైబ్ కూడా చేయవచ్చు.",
      contact: "మీరు మా కస్టమర్ సర్వీస్ టీమ్‌ను +91 98765 43210 వద్ద సంప్రదించవచ్చు లేదా support@blinkeach.com వద్ద మాకు ఇమెయిల్ చేయవచ్చు. మా కార్యాలయం KB లేన్, పంచాయతీ అఖారా, గయా, బిహార్ - 823001 లో ఉంది.",
      livechat: "మా లైవ్ చాట్ సపోర్ట్ సోమవారం నుండి శనివారం వరకు ఉదయం 10:00 నుండి సాయంత్రం 6:00 IST వరకు అందుబాటులో ఉంటుంది. మా కస్టమర్ సపోర్ట్ టీమ్‌తో సంభాషణను ప్రారంభించడానికి స్క్రీన్ దిగువ కుడి మూలన ఉన్న చాట్ చిహ్నంపై క్లిక్ చేయండి.",
      callme: "మేము కాల్‌బ్యాక్ సేవలను అందిస్తాము! మీరు మీ స్క్రీన్ దిగువ కుడి మూలన ఉన్న చాట్ చిహ్నంపై క్లిక్ చేసి, 'నన్ను కాల్ చేయండి' ఎంపికను ఎంచుకోవడం ద్వారా మా బృందం నుండి కాల్‌ను అభ్యర్థించవచ్చు. దయచేసి మీ ఫోన్ నంబర్ మరియు ప్రాధాన్య భాష (ఇంగ్లీష్ లేదా హిందీ) ని అందించండి.",
      email: "మీరు మాకు blinkeach@gmail.com వద్ద ఇమెయిల్ చేయవచ్చు లేదా మీ స్క్రీన్ దిగువ కుడి మూలన ఉన్న చాట్ చిహ్నంపై క్లిక్ చేయడం ద్వారా మా సంప్రదింపు ఫారమ్‌ను ఉపయోగించవచ్చు. మా బృందం సాధారణంగా 24 గంటల్లోపు ఇమెయిల్‌లకు స్పందిస్తుంది.",
      support: "మేము బహుళ మద్దతు ఎంపికలను అందిస్తాము: 1) లైవ్ చాట్ (సోమ-శని, ఉదయం 10-సాయంత్రం 6), 2) blinkeach@gmail.com వద్ద ఇమెయిల్ సపోర్ట్, 3) మా చాట్ విడ్జెట్ ద్వారా కాల్‌బ్యాక్‌ను అభ్యర్థించండి. మీరు మమ్మల్ని ఎలా సంప్రదించాలనుకుంటున్నారు?",
      default: "మీ సందేశానికి ధన్యవాదాలు. దాంతో నేను ఎలా సహాయం చేయాలో నాకు ఖచ్చితంగా తెలియదు. దయచేసి మీ ప్రశ్నను మళ్లీ చెప్పగలరా లేదా మా ఉత్పత్తుల, షిప్పింగ్, రిటర్న్స్ లేదా చెల్లింపు పద్ధతుల గురించి అడగగలరా?"
    }
  },
  mr: {
    responses: {
      greeting: "नमस्कार! ब्लिंकईचमध्ये आपले स्वागत आहे. मी आज आपली कशी मदत करू शकतो?",
      help: "मी मदत करण्यासाठी येथे आहे! आपण आमच्या उत्पादनांबद्दल, शिपिंग धोरणांबद्दल, परतावा धोरणांबद्दल किंवा पेमेंट पद्धतींबद्दल विचारू शकता. आपल्याला काय जाणून घ्यायचे आहे?",
      delivery: "आम्ही ₹499 वरील ऑर्डरवर मोफत शिपिंग प्रदान करतो. आपल्या स्थानानुसार मानक डिलिव्हरी 3-5 कार्यदिवसांत होते. आपण आपल्या खात्यातील 'ऑर्डर ट्रॅक करा' विभागातून आपला ऑर्डर ट्रॅक करू शकता.",
      return: "आमचे 10 दिवसांचे परतावा धोरण आहे. जर आपण आपल्या खरेदीने समाधानी नसाल, तर आपण पूर्ण परताव्यासाठी 10 दिवसांच्या आत ते परत करू शकता. कृपया सर्व टॅग सोबत असलेल्या त्याच्या मूळ स्थितीत आयटम असल्याची खात्री करा.",
      payment: "आम्ही क्रेडिट/डेबिट कार्ड, नेट बँकिंग, UPI, वॉलेट्स आणि COD (कॅश ऑन डिलिव्हरी) सह विविध पेमेंट पद्धती स्वीकारतो. सर्व पेमेंट्स रेझरपे पेमेंट गेटवेद्वारे सुरक्षितपणे प्रक्रिया केली जातात.",
      order: "आपण आपल्या खात्यात लॉग इन करून आणि 'माझे ऑर्डर्स' विभागास भेट देऊन आपला ऑर्डर ट्रॅक करू शकता. जर आपल्याला आपल्या ऑर्डरबद्दल काही विशिष्ट प्रश्न असतील, तर कृपया आपला ऑर्डर आयडी प्रदान करा.",
      cancel: "शिपिंग होण्यापूर्वी आपण आपला ऑर्डर रद्द करू शकता. कृपया आपल्या खात्यात 'माझे ऑर्डर्स' वर जा आणि आपण रद्द करू इच्छित असलेला ऑर्डर निवडा. ते आधीच शिप केले असल्यास, डिलिव्हरीनंतर आपल्याला ते परत करणे आवश्यक असेल.",
      discount: "आम्ही नियमितपणे प्रमोशन चालवतो आणि सवलती देतो. वर्तमान ऑफर्ससाठी कृपया आमचे होमपेज तपासा. नवीनतम डील्सबद्दल अपडेट राहण्यासाठी आपण आमच्या न्यूजलेटरला सबस्क्राइब करू शकता.",
      contact: "आपण आमच्या ग्राहक सेवा टीमला +91 98765 43210 वर संपर्क करू शकता किंवा आम्हाला support@blinkeach.com वर ईमेल करू शकता. आमचे कार्यालय KB Lane, पंचायती अखाडा, गया, बिहार - 823001 येथे आहे.",
      livechat: "आमचे लाइव्ह चॅट सपोर्ट सोमवार ते शनिवार सकाळी 10:00 ते संध्याकाळी 6:00 IST पर्यंत उपलब्ध आहे. आमच्या ग्राहक सपोर्ट टीमशी संभाषण सुरू करण्यासाठी स्क्रीनच्या खालील उजव्या कोपऱ्यातील चॅट आयकॉनवर क्लिक करा.",
      callme: "आम्ही कॉलबॅक सेवा प्रदान करतो! स्क्रीनच्या खालील उजव्या कोपऱ्यातील चॅट आयकॉनवर क्लिक करून आणि 'मला कॉल करा' पर्याय निवडून आपण आमच्या टीमकडून कॉलची विनंती करू शकता. कृपया आपला फोन नंबर आणि पसंतीची भाषा (इंग्रजी किंवा हिंदी) प्रदान करा.",
      email: "आपण आम्हाला blinkeach@gmail.com वर ईमेल पाठवू शकता किंवा आपल्या स्क्रीनच्या खालील उजव्या कोपऱ्यातील चॅट आयकॉनवर क्लिक करून आमचा संपर्क फॉर्म वापरू शकता. आमची टीम सामान्यत: 24 तासांच्या आत ईमेल्सना प्रतिसाद देते.",
      support: "आम्ही अनेक सपोर्ट पर्याय प्रदान करतो: 1) लाइव्ह चॅट (सोम-शनि, सकाळी 10-संध्याकाळी 6), 2) blinkeach@gmail.com वर ईमेल सपोर्ट, 3) आमच्या चॅट विजेटद्वारे कॉलबॅकची विनंती करा. आपण आम्हाला कसे संपर्क करू इच्छिता?",
      default: "आपल्या संदेशाबद्दल धन्यवाद. मला त्याबाबत कशी मदत करावी याची मला नक्की खात्री नाही. कृपया आपला प्रश्न पुन्हा मांडू शकता किंवा आमच्या उत्पादनांबद्दल, शिपिंग, परतावा किंवा पेमेंट पद्धतींबद्दल विचारू शकता?"
    }
  }
};

// Type mapping for supported keywords to response keys
const responseMapping: Record<string, string> = {
  greeting: "greeting",
  hello: "greeting",
  hi: "greeting",
  hey: "greeting",
  help: "help",
  support: "support",
  delivery: "delivery",
  shipping: "delivery",
  return: "return",
  refund: "return",
  payment: "payment",
  pay: "payment",
  order: "order",
  track: "order",
  cancel: "cancel",
  discount: "discount",
  coupon: "discount",
  offer: "discount",
  contact: "contact",
  phone: "contact",
  livechat: "livechat",
  chat: "livechat",
  live: "livechat",
  call: "callme",
  callback: "callme",
  "call me": "callme",
  email: "email",
  mail: "email",
  "support option": "support",
  "customer support": "support"
};

const chatbotController = {
  // Process a message sent to the chatbot
  processMessage: async (req: Request, res: Response) => {
    try {
      // Get message and language from request body
      // Default to English if no language is specified
      const { message, language = "en" } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          message: "Message is required",
          success: false 
        });
      }
      
      // Validate that the language is supported
      if (!translations[language]) {
        console.warn(`Unsupported language requested: ${language}, falling back to English`);
      }
      
      // Process the message and generate a response in the requested language
      // In a real application, this would connect to an AI model with translation
      const botResponse = generateBotResponse(message, language);
      
      // Return the response with the original language for client reference
      res.json({ 
        reply: botResponse,
        language: translations[language] ? language : "en",
        success: true
      });
    } catch (error) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ 
        message: "Failed to process message",
        success: false
      });
    }
  }
};

// Helper function to generate chatbot responses in the requested language
function generateBotResponse(message: string, language: string): string {
  // Default to English if the requested language is not supported
  if (!translations[language]) {
    language = "en";
  }
  
  // Convert message to lowercase for easier matching
  const messageLower = message.toLowerCase();
  
  // Check each keyword pattern and return the appropriate response in the requested language
  for (const [keyword, responseKey] of Object.entries(responseMapping)) {
    if (messageLower.includes(keyword)) {
      // Check if the response key exists in the translation
      if (translations[language].responses[responseKey]) {
        return translations[language].responses[responseKey];
      } else {
        // Fallback to default response if key not found
        return translations[language].responses.default;
      }
    }
  }
  
  // Default response for unrecognized queries
  return translations[language].responses.default;
}

export default chatbotController;
