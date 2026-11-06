// Pet drawings (SVG), moods, hunger bar.
// Loaded as a classic script: top-level consts are shared with the other files.

/* ---------- Pets ---------- */
const KINDS = {
  cat:{label:'Curious cat',name:'Pip'}, owl:{label:'Night owl',name:'Hoot'}, sprout:{label:'Calm sprout',name:'Moss'},
  fox:{label:'Quick fox',name:'Juniper'}, frog:{label:'Patient frog',name:'Bo'}
};
const EYES={happy:'M35 58 Q40 52 45 58 M55 58 Q60 52 65 58',ok:'M40 55.5 L40 57.5 M60 55.5 L60 57.5',hungry:'M40 56 L40 58 M60 56 L60 58 M34 50 L44 47 M66 50 L56 47',faint:'M36 52 L44 60 M44 52 L36 60 M56 52 L64 60 M64 52 L56 60'};
const MOUTH={happy:'M43 68 Q50 76 57 68',ok:'M45 70 Q50 73 55 70',hungry:'M44 73 Q50 67 56 73',faint:'M44 71 Q47 68 50 71 Q53 74 56 71'};
const INK='#2E2C25';
function moodFor(h){ return h>=7?'happy':(h>=4?'ok':(h>=1?'hungry':'faint')); }
function petSVG(kind, mood, size, hat, faded){
  const st=`stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`;
  const face=(dy=0)=>`<g transform="translate(0,${dy})"><path d="${EYES[mood]}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="${MOUTH[mood]}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  let b='';
  if (kind==='cat') b=`<path d="M20 44 L24 12 L46 30 Z M80 44 L76 12 L54 30 Z" fill="#EFD6B6" ${st}/><ellipse cx="50" cy="60" rx="34" ry="30" fill="#EFD6B6" ${st}/><circle cx="31" cy="68" r="4.5" fill="#E9B4A0"/><circle cx="69" cy="68" r="4.5" fill="#E9B4A0"/><path d="M48 62 L52 62 L50 64.5 Z" fill="${INK}"/>${face()}`;
  if (kind==='owl') b=`<path d="M22 36 L26 18 L38 30 Z M78 36 L74 18 L62 30 Z" fill="#C8B79E" ${st}/><ellipse cx="50" cy="60" rx="31" ry="34" fill="#C8B79E" ${st}/><ellipse cx="50" cy="76" rx="17" ry="13" fill="#EEE5D3"/><circle cx="40" cy="56" r="10" fill="#FBF8F0" stroke="${INK}" stroke-width="2"/><circle cx="60" cy="56" r="10" fill="#FBF8F0" stroke="${INK}" stroke-width="2"/><path d="M47 63 L53 63 L50 68 Z" fill="#D9A243" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>${face(6)}`;
  if (kind==='sprout') b=`<path d="M50 30 C42 16 30 16 26 22 C34 28 42 30 50 30 Z M50 30 C58 14 72 14 76 20 C68 28 58 30 50 30 Z" fill="#9DB873" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M50 30 L50 36" stroke="${INK}" stroke-width="2.2"/><circle cx="50" cy="58" r="25" fill="#CDDDB0" ${st}/><path d="M30 80 L70 80 L65 97 L35 97 Z" fill="#C99A72" ${st}/>${face()}`;
  if (kind==='fox') b=`<path d="M18 46 L22 10 L44 32 Z M82 46 L78 10 L56 32 Z" fill="#D9A06A" ${st}/><path d="M24 40 L25 22 L36 33 Z M76 40 L75 22 L64 33 Z" fill="#F4E6D2"/><ellipse cx="50" cy="60" rx="34" ry="29" fill="#D9A06A" ${st}/><ellipse cx="50" cy="73" rx="19" ry="12" fill="#F6ECDD"/><circle cx="50" cy="65" r="3" fill="${INK}"/>${face(4)}`;
  if (kind==='frog') b=`<circle cx="36" cy="40" r="12" fill="#AFC487" ${st}/><circle cx="64" cy="40" r="12" fill="#AFC487" ${st}/><ellipse cx="50" cy="64" rx="38" ry="26" fill="#AFC487" ${st}/><circle cx="36" cy="40" r="7" fill="#FBF8F0"/><circle cx="64" cy="40" r="7" fill="#FBF8F0"/><circle cx="26" cy="70" r="4.5" fill="#E2B49C"/><circle cx="74" cy="70" r="4.5" fill="#E2B49C"/><g transform="translate(-4,-16) scale(1.08)"><path d="${EYES[mood]}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g><path d="${MOUTH[mood]}" transform="translate(0,2)" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  let h='';
  if (hat==='cap') h=`<path d="M34 22 L34 32 Q50 38 66 32 L66 22 Z" fill="${INK}"/><path d="M50 6 L84 18 L50 30 L16 18 Z" fill="#3A382F" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M50 18 L80 22 L80 36" fill="none" stroke="#D9A243" stroke-width="2.2" stroke-linecap="round"/><circle cx="80" cy="37" r="2.6" fill="#D9A243"/>`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${KINDS[kind].label}, ${mood}" style="display:block;${faded?'filter:grayscale(1);opacity:.45':''}">${b}${h}</svg>`;
}
function hungerBar(h){ const cls=h<=2?'crit':(h<=3?'low':''); let s=''; for(let i=0;i<10;i++) s+=`<i class="${i<h?'f':''}"></i>`; return `<span class="hunger ${cls}" title="Fed ${h} of 10">${s}</span>`; }
