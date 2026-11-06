// Exercise content, help levels, rules, unlock questions, check logic.
// Loaded as a classic script: top-level consts are shared with the other files.

/* ---------- Content (carried over from the P.E.T.S prototype) ---------- */
const START_CODE = "def binary_search(arr, target):\n    left = 0\n    right = len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        # what now?\n";
const LEVELS = [
  { short:'Nudge',    name:'Minimal help',         does:'Only guiding questions. Hard mode.' },
  { short:'Hint',     name:'Small hint',           does:'One short hint at a time. No steps, no code.' },
  { short:'Steps',    name:'Guided steps',         does:'The next steps as a list. You do the work.' },
  { short:'Explain',  name:'Detailed explanation', does:'The concept and reasoning in detail, but not your code.' },
  { short:'Solution', name:'Full solution',        does:'The complete worked solution if you ask. Easy mode.' }
];
const LEVEL_TYPE = ['question','hint','step','concept','full'];
const TYPE_MIN = { question:0, hint:1, step:2, concept:3, full:4 };
const TYPE_NAME = { question:'a guiding question', hint:'a hint', step:'guided steps', concept:'a detailed explanation', full:'the full solution' };
const STRICT_RANK = { remind:1, warn:2, block:3 };
const STRICT_ORDER = ['remind','warn','block'];
const STRICT_HELP = { remind:'goes ahead, costs a snack', warn:'asks you first', block:'refuses and asks you a question instead' };
const CAT_TYPES = { offtopic:['offtopic'], full:['concept','full'], solve:['step','full'] };
const ON_TOPIC = /binary|search|mid|left|right|arr|array|loop|complex|code|index|target|sort|log|python|hint|step|solution|answer|explain|help|this|exercise|bug|test|return|while|pointer|half|compare|o\(/i;
const PLAN = [
  { id:'understand', label:'Understand the problem', ai:'explanations' },
  { id:'implement',  label:'Implement the algorithm', ai:'hints' },
  { id:'analyze',    label:'Analyse time complexity', ai:'hints' },
  { id:'check',      label:'Check correctness', ai:'review' }
];
const RULE_SUGGESTIONS = [
  { text:'Only stuff from the lecture slides, no rabbit holes.', cat:'offtopic', strict:'warn' },
  { text:'Give me hints, not the full answer.', cat:'full', strict:'warn' },
  { text:'Never solve graded exercises for me.', cat:'solve', strict:'block' },
  { text:'Remind me before explaining a whole concept.', cat:'full', strict:'remind' }
];
const WARMUPS = [
  { q:'arr = [2, 4, 6, 8, 10, 12], target = 10. With left = 0 and right = 5, what is mid?', a:['2'], wrong:'Close. mid = (left + right) // 2. What is (0 + 5) // 2?' },
  { q:'arr[2] = 6 is smaller than 10. What is the new value of left?', a:['3'], wrong:'Close. The target is right of mid, so left moves just past mid.' },
  { q:'Now left = 3 and right = 5. What is the new mid index?', a:['4'], wrong:'Close. (3 + 5) // 2 = ?' },
  { q:'At most how many comparisons does binary search need for 16 elements?', a:['4','5'], wrong:'Close. Each comparison halves the range: 16 → 8 → 4 → 2 → 1.' }
];
const QUESTIONS = {
  incomplete:['What property of a sorted array lets you throw away half of the search space after one comparison?','Compare the target with arr[mid]. What are the possible outcomes?','If target is larger than arr[mid], can the answer be at mid or to its left?'],
  loop:['Look at how you update left and right. If left == mid, does the window ever shrink?','Trace arr = [1, 3], target = 3 by hand. What happens to left and right?'],
  missing:['What should the function return when the loop ends without finding the target?'],
  ok:['Your logic looks complete. How many times can the loop run for n elements?']
};
const SMALL_HINTS = {
  incomplete:['Compare target with arr[mid]: equal, smaller or larger. Each case needs its own branch.','If target is larger than arr[mid], the answer can only be right of mid.'],
  loop:['Pointers must move past mid: use mid + 1 and mid - 1.'],
  missing:['After the loop, return a value that clearly means "not found".'],
  ok:['Everything is handled. Run a check, then count loop iterations for n = 16.']
};
const GUIDED = {
  incomplete:'1. Compare target with arr[mid].\n2. If they are equal, return mid.\n3. If target is smaller, move right to just before mid.\n4. Otherwise, move left to just after mid.\nWhat do you get?',
  loop:'1. Find the lines where you update left and right.\n2. Ask: does each update exclude mid?\n3. Change them so the window always shrinks.',
  missing:'1. Think about the loop ending without a match.\n2. Pick a return value that cannot be a valid index.\n3. Add it after the loop.',
  ok:'1. Check your code.\n2. Count how often the range halves for n = 16.\n3. Generalise to n.'
};
const CONCEPT = 'Binary search only works on sorted data. Look at the middle element: if it equals the target you are done; if the target is smaller, everything right of mid can be ignored; if larger, everything left of mid can be ignored.\n\nBecause the range halves every time, n elements need at most about log2(n) + 1 comparisons. For n = 16 that is 5. So the time complexity is O(log n), with O(1) extra space.';
const FULL = 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif target < arr[mid]:\n            right = mid - 1\n        else:\n            left = mid + 1\n    return -1\n\nRuns in O(log n): the window halves every iteration.';

function lineOf(code, re){ const l = code.split('\n'); for (let i=0;i<l.length;i++) if (re.test(l[i])) return i+1; return l.length; }
function evaluate(code){
  const hasLoop=/while\s+left\s*<=?\s*right/.test(code), hasMid=/mid\s*=/.test(code), hasCompare=/arr\s*\[\s*mid\s*\]/.test(code);
  const badLeft=/left\s*=\s*mid\s*(#.*)?$/m.test(code), badRight=/right\s*=\s*mid\s*(#.*)?$/m.test(code);
  const incLeft=/left\s*=\s*mid\s*\+\s*1/.test(code), decRight=/right\s*=\s*mid\s*-\s*1/.test(code);
  const retMid=/return\s+mid/.test(code), retMissing=/return\s+-\s*1/.test(code);
  if (!hasLoop||!hasMid||!hasCompare) return {status:'incomplete',line:lineOf(code,/what now|mid\s*=/),msg:'After computing mid you still need to compare arr[mid] with the target and decide which half to keep.'};
  if (badLeft||badRight) return {status:'loop',line:lineOf(code,badLeft?/left\s*=\s*mid\s*(#.*)?$/:/right\s*=\s*mid\s*(#.*)?$/),msg:'The loop can run forever: if a pointer is set to mid (instead of mid ± 1), the window can stop shrinking.'};
  if (!incLeft||!decRight||!retMid) return {status:'incomplete',line:lineOf(code,/arr\s*\[\s*mid\s*\]/),msg:'Not every case is handled yet. Comparing target with arr[mid] has three outcomes: equal, smaller, larger.'};
  if (!retMissing) return {status:'missing',line:code.split('\n').length,msg:'When the target is not in the array the loop ends and the function returns None. What should it return instead?'};
  return {status:'ok',line:0,msg:''};
}
const TESTS = {
  calls:['search([1,3,5,7,9], 7)','search([1,3,5,7,9], 1)','search([1,3,5,7,9], 4)','search([], 3)'],
  ok:[['3',1],['0',1],['-1',1],['-1',1]], loop:[['3',1],['timeout',0],['timeout',0],['-1',1]],
  missing:[['3',1],['0',1],['None',0],['None',0]], incomplete:[['None',0],['None',0],['None',0],['None',0]]
};
