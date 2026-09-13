/**
 * Locale name maps for crops and districts.
 *
 * Marathi follows the state's official usage (Gazetteer / Krishi Vibhag);
 * Hindi follows central-government usage. English ids stay as-is when the
 * form is identical or the term is commonly used untranslated.
 */

const CROP_NAMES: Record<string, { hi: string; mr: string }> = {
  onion: { hi: "प्याज़", mr: "कांदा" },
  tomato: { hi: "टमाटर", mr: "टोमॅटो" },
  potato: { hi: "आलू", mr: "बटाटा" },
  brinjal: { hi: "बैंगन", mr: "वांगी" },
  cabbage: { hi: "पत्ता गोभी", mr: "कोबी" },
  cauliflower: { hi: "फूल गोभी", mr: "फ्लॉवर" },
  okra: { hi: "भिंडी", mr: "भेंडी" },
  "green-chilli": { hi: "हरी मिर्च", mr: "हिरवी मिरची" },
  garlic: { hi: "लहसुन", mr: "लसूण" },
  "green-peas": { hi: "हरी मटर", mr: "मटार" },
  "bitter-gourd": { hi: "करेला", mr: "कारले" },
  "bottle-gourd": { hi: "लौकी", mr: "दुधी भोपळा" },
  radish: { hi: "मूली", mr: "मुळा" },
  carrot: { hi: "गाजर", mr: "गाजर" },
  capsicum: { hi: "शिमला मिर्च", mr: "ढोबळी मिरची" },
};

const DISTRICT_NAMES: Record<string, { hi: string; mr: string }> = {
  nashik: { hi: "नाशिक", mr: "नाशिक" },
  ahmednagar: { hi: "अहमदनगर", mr: "अहिल्यानगर" },
  pune: { hi: "पुणे", mr: "पुणे" },
  solapur: { hi: "सोलापुर", mr: "सोलापूर" },
  satara: { hi: "सातारा", mr: "सातारा" },
  jalna: { hi: "जालना", mr: "जालना" },
  beed: { hi: "बीड", mr: "बीड" },
  aurangabad: { hi: "औरंगाबाद", mr: "छत्रपती संभाजीनगर" },
  latur: { hi: "लातूर", mr: "लातूर" },
  dharashiv: { hi: "धाराशिव", mr: "धाराशिव" },
  nanded: { hi: "नांदेड़", mr: "नांदेड" },
  parbhani: { hi: "परभणी", mr: "परभणी" },
  hingoli: { hi: "हिंगोली", mr: "हिंगोली" },
  sangli: { hi: "सांगली", mr: "सांगली" },
  kolhapur: { hi: "कोल्हापुर", mr: "कोल्हापूर" },
  dhule: { hi: "धुले", mr: "धुळे" },
  nandurbar: { hi: "नंदुरबार", mr: "नंदुरबार" },
  jalgaon: { hi: "जलगाँव", mr: "जळगाव" },
  buldhana: { hi: "बुलढाणा", mr: "बुलढाणा" },
  akola: { hi: "अकोला", mr: "अकोला" },
  amravati: { hi: "अमरावती", mr: "अमरावती" },
  washim: { hi: "वाशिम", mr: "वाशिम" },
  yavatmal: { hi: "यवतमाल", mr: "यवतमाल" },
  wardha: { hi: "वर्धा", mr: "वर्धा" },
  nagpur: { hi: "नागपुर", mr: "नागपूर" },
  bhandara: { hi: "भंडारा", mr: "भंडारा" },
  gondia: { hi: "गोंदिया", mr: "गोंदिया" },
  chandrapur: { hi: "चंद्रपुर", mr: "चंद्रपूर" },
  gadchiroli: { hi: "गडचिरोली", mr: "गडचिरोली" },
  raigad: { hi: "रायगड", mr: "रायगड" },
  palghar: { hi: "पालघर", mr: "पालघर" },
  thane: { hi: "ठाणे", mr: "ठाणे" },
  ratnagiri: { hi: "रत्नागिरी", mr: "रत्नागिरी" },
  sindhudurg: { hi: "सिंधुदुर्ग", mr: "सिंधुदुर्ग" },
};

export function cropName(cropId: string, lang: string): string {
  const entry = CROP_NAMES[cropId];
  if (entry && lang === "hi") return entry.hi;
  if (entry && lang === "mr") return entry.mr;
  return cropId;
}

export function districtName(districtId: string, lang: string): string {
  const entry = DISTRICT_NAMES[districtId];
  if (entry && lang === "hi") return entry.hi;
  if (entry && lang === "mr") return entry.mr;
  return districtId;
}
