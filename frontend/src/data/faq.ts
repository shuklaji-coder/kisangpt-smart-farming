export interface FAQItem {
  id: string;
  lang: 'hi' | 'en';
  q: string;
  a: string;
  tags: string[];
}

export const faq: FAQItem[] = [
  {
    id: 'seed-basics-hi',
    lang: 'hi',
    q: 'अच्छे बीज कैसे चुनें?',
    a: 'अच्छे बीज के लिए: (1) हमेशा प्रमाणित बीज खरीदें, (2) बीज की उम्र 6 माह से कम हो, (3) मिट्टी जाँच के बाद किस्म चुनें, (4) स्थानीय/सिफारिशी किस्म को प्राथमिकता दें, (5) बोआई से पहले ट्राइकोडर्मा/PSB से ट्रीटमेंट करें।',
    tags: ['बीज','seed','किस्म','variety']
  },
  {
    id: 'irrigation-save-hi',
    lang: 'hi',
    q: 'पानी बचाने के तरीके',
    a: 'ड्रिप/स्प्रिंकलर अपनाएँ (40–60% पानी बचता है), मल्चिंग करें, सुबह 6–8 या शाम 4–6 बजे सिंचाई करें, नमी मीटर से नमी जाँचें, बारिश के पानी का संचयन करें।',
    tags: ['पानी','सिंचाई','irrigation','water']
  },
  {
    id: 'soil-test-hi',
    lang: 'hi',
    q: 'मिट्टी जांच में क्या देखें?',
    a: 'मिट्टी जाँच में pH (6.5–7.5 आदर्श), जैविक कार्बन, NPK, जिंक/बोरॉन जैसे सूक्ष्म तत्व देखें। अम्लीय मिट्टी में चूना, क्षारीय में जिप्सम डालें, कार्बन बढ़ाने को वर्मी/हरी खाद दें।',
    tags: ['मिट्टी','soil','test','pH']
  },
  {
    id: 'pest-ipm-hi',
    lang: 'hi',
    q: 'कीट प्रबंधन कैसे करें?',
    a: 'IPM अपनाएँ: फसल चक्र, रोग‑रोधी किस्म, फेरोमोन/स्टिकी ट्रैप, सुबह/शाम निगरानी, जैविक उपाय (नीम तेल 5ml/ली., ट्राइकोडर्मा), आवश्यकता हो तो सिफारिशी कीटनाशक लेबल‑डोज़ में।',
    tags: ['कीट','रोग','pest','disease','IPM']
  },
  {
    id: 'market-enam-hi',
    lang: 'hi',
    q: 'अच्छा भाव कैसे मिले?',
    a: 'e‑NAM पर मंडी दर देखें/तुलना करें, कटाई‑ग्रेडिंग ठीक रखें, FPO/सहकारी से जुड़ें, नजदीकी प्रसंस्करण इकाई/वेयरहाउस का लाभ लें, समय पर बिक्री की रणनीति बनाएं।',
    tags: ['कीमत','भाव','मंडी','market','price']
  },
  {
    id: 'scheme-pmkisan-hi',
    lang: 'hi',
    q: 'पीएम‑किसान में मदद',
    a: 'PM‑KISAN सहायता हेतु https://pmkisan.gov.in पर e‑KYC और स्टेटस देखें। शिकायत/सहायता: हेल्पलाइन 155261/011‑24300606, ईमेल pmkisan‑ict@gov.in।',
    tags: ['योजना','PM-KISAN','scheme']
  },
  {
    id: 'weather-hi',
    lang: 'hi',
    q: 'मौसम सलाह',
    a: 'IMD/मौसम ऐप देखें, तेज बारिश/आंधी पूर्वानुमान पर स्प्रे स्थगित करें, पानी भराव से बचाएँ, कटाई‑मड़ाई मौसम अनुसार करें, भूसे/अनाज की ढकाई करें।',
    tags: ['मौसम','weather','बारिश']
  },
  {
    id: 'ndvi-info-hi',
    lang: 'hi',
    q: 'NDVI क्या बताता है?',
    a: 'NDVI उपग्रह आधारित वनस्पति सूचकांक है जो पत्तियों की हरियाली/स्वास्थ्य दिखाता है (0–1). 0.6+ अच्छा विकास, 0.3–0.5 मध्यम, 0.3 से कम तनाव/कम हरियाली।',
    tags: ['NDVI','satellite','vegetation']
  },
  {
    id: 'fertilizer-split-hi',
    lang: 'hi',
    q: 'खाद कब और कैसे?',
    a: 'DAP बोआई के समय, यूरिया/नाइट्रोजन 2–3 भागों में टॉप ड्रेसिंग, पोटाश फल/दाना भरने पर, सूक्ष्म तत्व मिट्टी जाँच अनुसार। सिंचाई/बरसात से पहले छिड़कें।',
    tags: ['fertilizer','खाद','DAP','urea']
  },
  // English variants
  {
    id: 'seed-basics-en',
    lang: 'en',
    q: 'How to choose good seeds?',
    a: 'Buy only certified seeds, check seed age (< 6 months), pick varieties after soil test, prefer locally recommended varieties, and treat seeds with Trichoderma/PSB.',
    tags: ['seed','variety']
  },
  {
    id: 'irrigation-en',
    lang: 'en',
    q: 'Smart irrigation tips',
    a: 'Adopt drip/sprinkler, mulch to retain moisture, irrigate at 6–8 AM or 4–6 PM, use moisture meter, harvest rainwater via ponds/ditches.',
    tags: ['irrigation','water']
  }
];
