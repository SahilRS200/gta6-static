// Every visible FAQ on the site, and its FAQPage JSON-LD, comes from these lists — one entry feeds
// both, so they can never drift apart. Answers may use <a> and <b>; the JSON-LD gets the same text
// with the tags stripped. Every answer must be backed by a linked post or page (sources live there).

// Homepage FAQ (also the FAQPage JSON-LD on /).
const HOME_FAQ = [
  ['Is GTA 6 out in India?', 'Yes. GTA 6 came out on Thursday, 19 November 2026, on PS5 and Xbox Series X|S. In India it unlocked at 12:00 AM IST. <a href="/gta-6-india/">GTA 6 India hub →</a>'],
  ['GTA 6 kab aaya India mein?', 'GTA 6 India mein aa chuka hai: 19 November 2026 ko raat 12:00 baje IST pe unlock hua, PS5 aur Xbox Series X|S dono pe.'],
  ['What is the GTA 6 price in India?', 'PlayStation Store India lists GTA 6 at <b>₹5,999</b> for the Standard Edition and <b>₹7,499</b> for the Ultimate Edition, as reported by Business Today. Check the store before buying, as prices can change. <a href="/gta-6-price-in-india/">Price and where to buy →</a>'],
  ['How do I save in GTA 6?', 'GTA 6 keeps only one autosave slot, so use the 15 manual save slots. A streamer lost more than 10 hours of progress after his PS5 shut off. <a href="/news/gta-6-how-to-save-manual-save-crash-lost-progress/">How to save →</a>'],
  ['GTA 6 is locked or won\'t start on my PS5. What do I do?', 'Check you are signed in to the account that bought it, restore licences, install PS5 system software 26.07-14.23.00, and redeem your code if you bought the box. Don\'t redownload the game first. <a href="/news/gta-6-locked-not-starting-ps5-fix-india/">6 fixes →</a>'],
  ['Can GTA 6 run at 60fps on PS5?', 'No. GTA 6 runs at 30fps on every console, PS5 Pro included, with no performance mode. A free PC app, SmoovPlay, can fake 60fps with AI frame generation, but it adds about 20 ms of lag. <a href="/news/gta-6-60fps-ps5-smoovplay-frame-generation-explained/">How it works →</a>'],
  ['Does GTA 6 have online multiplayer?', 'No. GTA 6 launched as a single-player game on 19 November 2026, and Rockstar has not announced a date for GTA 6 Online. <a href="/whats-next/">What\'s next for GTA 6 →</a>'],
  ['Is GTA 6 in Hindi?', 'No. GTA 6 does not support Hindi or any Indian language at launch. It lists 13 languages for menus and subtitles, and only English has voice acting. <a href="/news/gta-6-hindi-language-support/">Full language list →</a>'],
  ['Is GTA 6 on PC, PS4, Xbox One or mobile?', 'GTA 6 is on PS5 and Xbox Series X|S only. There is no PS4 or Xbox One version, but Xbox One owners who buy the Xbox version can <a href="/news/gta-6-xbox-one-cloud-gaming-india-time/">stream it through Xbox Cloud Gaming</a>. No PC release date has been announced, and Rockstar has not announced a mobile version.'],
  ['How long is GTA 6?', 'About 50 hours for the main story, by one reviewer\'s count. Rockstar\'s Rob Nelson took 80 hours with side goals, and 100% is reported at about 200 hours. <a href="/news/gta-6-how-long-to-beat-story-hours/">The numbers →</a>'],
  ['How big is the GTA 6 download?', 'Up to <b>212 GB</b>, depending on your console, Forbes reports. Two pre-launch updates add about 1 GB and 602 MB on PS5 (more on Xbox), so keep space free for patches. <a href="/news/gta-6-day-one-patch-size-ps5-xbox/">Download size and patches →</a>'],
  ['How do I make money fast in GTA 6?', 'Early on, dive shipwrecks (about $1,400 for the first wreck), raid gang hideouts and sell cars, and check your mailbox for pay. <a href="/news/gta-6-how-to-make-money-fast-early-game/">Money guide →</a>'],
  ['Can I use cheats in GTA 6?', 'Not at first. All 61 cheats unlock only after you finish the main story, most also need a challenge, and using one disables trophies and saving. <a href="/news/gta-6-cheats-locked-until-story-complete/">How cheats work →</a>'],
  ['Is a GTA 6 free download or APK real?', 'No. GTA 6 is only on PS5 and Xbox Series X|S. Any "GTA 6 free download", PC crack or mobile APK is fake and can carry malware or steal your accounts. <a href="/news/gta-6-free-download-apk-scam-warning/">How the scams work →</a>'],
  ['Is this site official?', 'No. GTA6Info.in is a fan-run site, not affiliated with Rockstar Games or Take-Two. Every story links its sources. <a href="/about/">About us →</a>'],
];

// /gta-6-india/ — Hinglish FAQ (also its FAQPage JSON-LD).
const INDIA_FAQ = [
  ['GTA 6 India mein aa gaya?', 'Haan. GTA 6 India mein <b>19 November 2026</b> ko raat <b>12:00 baje IST</b> pe unlock hua, PS5 aur Xbox Series X|S dono pe.'],
  ['GTA 6 ka price kitna hai India mein?', 'PlayStation Store India par Standard Edition <b>₹5,999</b> aur Ultimate Edition <b>₹7,499</b> listed hai (Business Today ke mutabik). <a href="/gta-6-price-in-india/">Poora breakdown →</a>'],
  ['GTA 6 kahan se khareedein?', 'PlayStation Store India ya Xbox Store se digital, ya Blinkit, Zepto aur stores se code-in-box. Box mein disc nahi, download code hota hai, aur 212 GB download karna padega. <a href="/news/blinkit-zepto-gta-6-delivery-10-minutes-india/">Order karne se pehle padho →</a>'],
  ['GTA 6 start nahi ho raha, padlock dikh raha hai?', 'Sahi PSN account check karo, Restore Licenses chalao, PS5 system update install karo aur box wala code redeem karo. Pehle game delete mat karo. <a href="/news/gta-6-locked-not-starting-ps5-fix-india/">6 fixes →</a>'],
  ['GTA 6 mein save kaise karein?', 'GTA 6 mein sirf ek autosave slot hai, isliye 15 manual save slots use karo. Ek streamer ka 10+ ghante ka progress PS5 band hone se chala gaya. <a href="/news/gta-6-how-to-save-manual-save-crash-lost-progress/">Save kaise karein →</a>'],
  ['GTA 6 PC ya mobile pe aayega?', 'Abhi nahi. GTA 6 sirf PS5 aur Xbox Series X|S pe hai. PC ki date announce nahi hui hai, aur mobile version announce nahi hua hai.'],
  ['GTA 6 Online kab aayega?', 'Abhi koi date nahi hai. GTA 6 launch pe sirf single-player hai, aur Rockstar ne GTA 6 Online ki date announce nahi ki hai. <a href="/whats-next/">Aage kya aa raha hai →</a>'],
  ['GTA 6 mein paise kaise kamayein?', 'Shuru mein shipwreck dives (pehle wreck se lagbhag $1,400), gang hideout raids aur gaadiyan bechna sabse accha hai. Mailbox bhi check karo. <a href="/news/gta-6-how-to-make-money-fast-early-game/">Money guide →</a>'],
  ['GTA 6 free download ya APK real hai?', 'Bilkul nahi. Har "GTA 6 APK", free download ya PC crack fake hai aur malware ho sakta hai. <a href="/news/gta-6-free-download-apk-scam-warning/">Scams se kaise bachein →</a>'],
  ['Kya GTA 6 Hindi mein hai?', 'Nahi. GTA 6 mein 13 languages listed hain, lekin Hindi ya koi Indian language nahi hai. Voice acting sirf English mein hai. <a href="/news/gta-6-hindi-language-support/">Poori list →</a>'],
];

// Floating "Quick answers" popup on every page: [question, short answer, link, link label]. Plain text.
const QUICK_FAQ = [
  ['How do I save in GTA 6?', 'Use the 15 manual save slots. There is only one autosave slot.', '/news/gta-6-how-to-save-manual-save-crash-lost-progress/', 'How to save'],
  ['GTA 6 locked or not starting?', 'Check the account, restore licences, update the PS5 and redeem your code.', '/news/gta-6-locked-not-starting-ps5-fix-india/', '6 fixes'],
  ['Is PlayStation Network down?', 'Check PS Live Status at the top of the page, and our Fixes page for known problems.', '/fixes/', 'All fixes'],
  ['What is the GTA 6 price in India?', '₹5,999 Standard and ₹7,499 Ultimate on PlayStation Store India.', '/gta-6-price-in-india/', 'Price and where to buy'],
  ['Can GTA 6 run at 60fps?', '30fps on every console, PS5 Pro included. A PC app can fake 60fps, with extra lag.', '/news/gta-6-60fps-ps5-smoovplay-frame-generation-explained/', '60fps explained'],
  ['Is GTA 6 Online out?', 'No. GTA 6 is single-player at launch, with no Online date yet.', '/whats-next/', "What's next"],
  ['How do I make money fast?', 'Shipwreck dives, gang hideout raids and selling cars pay best early on.', '/news/gta-6-how-to-make-money-fast-early-game/', 'Money guide'],
  ['How do I lose the cops?', 'Change your outfit, swap cars or split up: police remember what you look like.', '/news/gta-6-wanted-level-heat-system-explained/', 'Wanted level explained'],
  ['Is GTA 6 in Hindi?', 'No. 13 languages, none of them Indian; voice acting is English only.', '/news/gta-6-hindi-language-support/', 'Language list'],
  ['How long is GTA 6?', 'About 50 hours for the story, around 200 for 100%.', '/news/gta-6-how-long-to-beat-story-hours/', 'The numbers'],
  ['Is a GTA 6 free download or APK real?', 'No. GTA 6 is only on PS5 and Xbox Series X|S. APKs and cracks are scams.', '/news/gta-6-free-download-apk-scam-warning/', 'How the scams work'],
];

const ENTITIES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };

const plainText = (html) => html.replace(/<[^>]+>/g, '').replace(/&(amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m]).replace(/\s+/g, ' ').trim();

// The visible answer drops a trailing "Read more →" link from the JSON-LD so the text stays an answer.
const answerText = (html) => plainText(html.replace(/\s*<a [^>]*>[^<]*→<\/a>\s*$/, ''));

const faqDetailsHtml = (items, openFirst = false) => items
  .map(([q, a], i) => `<details${openFirst && i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`)
  .join('\n    ');

const faqJsonLd = (items) => `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: plainText(q), acceptedAnswer: { '@type': 'Answer', text: answerText(a) } })),
}).replace(/</g, '\\u003c')}</script>`;

export { HOME_FAQ, INDIA_FAQ, QUICK_FAQ, faqDetailsHtml, faqJsonLd, plainText };
