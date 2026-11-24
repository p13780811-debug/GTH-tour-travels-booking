import {REPORT_KINDS,type TrafficZone} from "./traffic";
import {trafficLabels,type TrafficLanguage} from "./traffic-language";

const normalize=(value:string)=>value.normalize("NFKC").toLocaleLowerCase("en")
  .replace(/[^\p{L}\p{M}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const common={
  jam:["traffic","jam","slow","जाम","कोंडी","যানজট","நெரிசல்","జామ్","ದಟ್ಟಣೆ","കുരുക്ക്","જામ","ਜਾਮ","ଜାମ","যানজঁট","جام"],
  closure:["closed","closure","blocked","बंद","बन्द","বন্ধ","மூடல்","మూసివేత","ಮುಚ್ಚಿದೆ","അടച്ചു","બંધ","ਬੰਦ","ବନ୍ଦ","বন্ধ","بند"],
  hazard:["hazard","flooding","pothole","accident","खतरा","धोका","বিপদ","ஆபத்து","ప్రమాదం","ಅಪಾಯ","അപകടം","જોખમ","ਖ਼ਤਰਾ","ବିପଦ","বিপদ","خطرہ"],
  clear:["clear","reopened","साफ","मोकळा","খালি","தெளிவு","ఖాళీ","ತೆರವಾಗಿದೆ","തുറന്നിരിക്കുന്നു","ખુલ્લો","ਸਾਫ਼","ସଫା","মুকলি","صاف"],
} as const;
const aliases:Record<string,readonly string[]>={
  "western-express":["weh","western express","வெஸ்டர்ன் எக்ஸ்பிரஸ்","वेस्टर्न एक्सप्रेस","पश्चिम द्रुतगती"],
  "eastern-express":["eeh","eastern express","ஈஸ்டர்ன் எக்ஸ்பிரஸ்","ईस्टर्न एक्सप्रेस"],
  "andheri-airport":["andheri","अंधेरी","அந்தேரி","andheri airport"],
  bkc:["bkc","बीकेसी","பிகேசி","பி கே சி","बी के सी"],
  dadar:["dadar","दादर","தாதர்","தாதார்"],
  "eastern-freeway":["eastern freeway","ईस्टर्न फ्रीवे","ஈஸ்டர்ன் ஃப்ரீவே"],
  "atal-setu":["atal setu","अटल सेतु","அடல் சேது","अटल सेतू"],
  "thane-entry":["thane","mulund","தானே","முலுண்ட்","ठाणे","मुलुंड"],
  "em-bypass":["em bypass","ইএম বাইপাস","இ எம் பைபாஸ்"],
  "vip-road":["vip road","ভিআইপি রোড","விஐபி ரோடு"],
  sealdah:["sealdah","শিয়ালদহ","சியால்தா"],
  esplanade:["esplanade","এসপ্ল্যানেড","எஸ்பிளனேட்"],
  "science-city":["science city","সায়েন্স সিটি","சயின்ஸ் சிட்டி"],
  "howrah-bridge":["howrah bridge","হাওড়া ব্রিজ","ஹவுரா பாலம்"],
  "maa-flyover":["maa flyover","মা উড়ালপুল","மா மேம்பாலம்"],
  "park-circus":["park circus","পার্ক সার্কাস","பார்க் சர்க்கஸ்"],
};

export function trafficDraft(transcript:string,zones:TrafficZone[],language:TrafficLanguage){
  const sentence=" "+normalize(transcript.slice(0,180))+" ";
  const matches=(term:string)=>{
    const word=normalize(term);
    return word.length>=2&&sentence.includes(" "+word+" ");
  };
  const matchedZones=zones.filter(zone=>[zone.label,zone.localLabel,...(aliases[zone.id]??[])].some(matches));
  const labels=trafficLabels(language);
  const exactKinds=REPORT_KINDS.filter(kind=>[labels[kind],trafficLabels("en")[kind]].some(matches));
  const kinds=exactKinds.length?exactKinds:REPORT_KINDS.filter(kind=>common[kind].some(matches));
  return {zone:matchedZones.length===1?matchedZones[0].id:null,kind:kinds.length===1?kinds[0]:null};
}
