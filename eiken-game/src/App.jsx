import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ======== localStorage 永続化 ========
const STORAGE_KEY = 'eiken_quest_data';
const loadSaveData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const saveSaveData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};
const getDefaultSaveData = () => ({
  highScores: { 5: 0, 4: 0, 3: 0 },
  idiomHighScores: { 5: 0, 4: 0, 3: 0 },
  totalXP: 0,
  level: 1,
  gamesPlayed: 0,
  streak: { current: 0, lastDate: null, best: 0 },
  dailyChallenge: { date: null, completed: false, grade: null },
  wrongHistory: [],
});

// ======== XP / レベルシステム ========
const XP_PER_LEVEL = 500;
const calcLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const xpToNextLevel = (xp) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);
const xpProgress = (xp) => ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

// ======== ストリーク管理 ========
const getTodayStr = () => new Date().toISOString().slice(0, 10);
const updateStreak = (streak) => {
  const today = getTodayStr();
  if (streak.lastDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const newCurrent = streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
  return { current: newCurrent, lastDate: today, best: Math.max(streak.best, newCurrent) };
};

// ======== デイリーチャレンジ ========
const getDailyChallenge = (saved) => {
  const today = getTodayStr();
  if (saved.dailyChallenge.date === today) return saved.dailyChallenge;
  const seed = today.split('-').join('');
  const grade = [5, 4, 3][parseInt(seed) % 3];
  return { date: today, completed: false, grade };
};

// ======== 間違えた問題の記録 ========
const MAX_WRONG_HISTORY = 100;
const addWrongQuestions = (history, questions) => {
  const newHistory = [...history];
  for (const q of questions) {
    const exists = newHistory.findIndex(h => h.question === q.question);
    if (exists >= 0) {
      newHistory[exists].wrongCount = (newHistory[exists].wrongCount || 1) + 1;
      newHistory[exists].lastWrong = Date.now();
    } else {
      newHistory.push({ ...q, wrongCount: 1, lastWrong: Date.now() });
    }
  }
  return newHistory.slice(-MAX_WRONG_HISTORY);
};

// ======== 正解チャイム音 ========
const playCorrectChime = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch {}
};

const playLevelUpSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
};

const playStreakSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    [392, 523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch {}
};

// ======== 英検5級の問題（100問）========
const grade5Questions = [
  { type: 'vocab', question: '「りんご」は英語で？', options: ['apple', 'orange', 'banana', 'grape'], answer: 0, hint: '🍎' },
  { type: 'vocab', question: '「オレンジ」は英語で？', options: ['apple', 'orange', 'lemon', 'peach'], answer: 1, hint: '🍊' },
  { type: 'vocab', question: '「バナナ」は英語で？', options: ['melon', 'grape', 'banana', 'cherry'], answer: 2, hint: '🍌' },
  { type: 'vocab', question: '「ぶどう」は英語で？', options: ['strawberry', 'peach', 'cherry', 'grape'], answer: 3, hint: '🍇' },
  { type: 'vocab', question: '「いちご」は英語で？', options: ['strawberry', 'blueberry', 'raspberry', 'blackberry'], answer: 0, hint: '🍓' },
  { type: 'vocab', question: '「レモン」は英語で？', options: ['lime', 'lemon', 'orange', 'grapefruit'], answer: 1, hint: '🍋' },
  { type: 'vocab', question: '「すいか」は英語で？', options: ['melon', 'pumpkin', 'watermelon', 'cucumber'], answer: 2, hint: '🍉' },
  { type: 'vocab', question: '「もも」は英語で？', options: ['plum', 'pear', 'cherry', 'peach'], answer: 3, hint: '🍑' },
  { type: 'vocab', question: '「パン」は英語で？', options: ['bread', 'rice', 'noodle', 'cake'], answer: 0, hint: '🍞' },
  { type: 'vocab', question: '「ご飯」は英語で？', options: ['bread', 'rice', 'pasta', 'cereal'], answer: 1, hint: '🍚' },
  { type: 'vocab', question: '「犬」は英語で？', options: ['cat', 'dog', 'bird', 'fish'], answer: 1, hint: '🐕' },
  { type: 'vocab', question: '「猫」は英語で？', options: ['cat', 'dog', 'mouse', 'rabbit'], answer: 0, hint: '🐱' },
  { type: 'vocab', question: '「鳥」は英語で？', options: ['fish', 'frog', 'bird', 'bee'], answer: 2, hint: '🐦' },
  { type: 'vocab', question: '「魚」は英語で？', options: ['bird', 'bear', 'bee', 'fish'], answer: 3, hint: '🐟' },
  { type: 'vocab', question: '「うさぎ」は英語で？', options: ['rabbit', 'hamster', 'mouse', 'squirrel'], answer: 0, hint: '🐰' },
  { type: 'vocab', question: '「ねずみ」は英語で？', options: ['rat', 'mouse', 'hamster', 'guinea pig'], answer: 1, hint: '🐭' },
  { type: 'vocab', question: '「くま」は英語で？', options: ['lion', 'tiger', 'bear', 'wolf'], answer: 2, hint: '🐻' },
  { type: 'vocab', question: '「ライオン」は英語で？', options: ['tiger', 'bear', 'wolf', 'lion'], answer: 3, hint: '🦁' },
  { type: 'vocab', question: '「ぞう」は英語で？', options: ['elephant', 'giraffe', 'hippo', 'rhino'], answer: 0, hint: '🐘' },
  { type: 'vocab', question: '「きりん」は英語で？', options: ['zebra', 'giraffe', 'camel', 'deer'], answer: 1, hint: '🦒' },
  { type: 'vocab', question: '「本」は英語で？', options: ['pen', 'desk', 'book', 'chair'], answer: 2, hint: '📚' },
  { type: 'vocab', question: '「ペン」は英語で？', options: ['pen', 'pencil', 'eraser', 'ruler'], answer: 0, hint: '🖊️' },
  { type: 'vocab', question: '「えんぴつ」は英語で？', options: ['pen', 'pencil', 'marker', 'crayon'], answer: 1, hint: '✏️' },
  { type: 'vocab', question: '「消しゴム」は英語で？', options: ['ruler', 'scissors', 'eraser', 'glue'], answer: 2, hint: '消すもの' },
  { type: 'vocab', question: '「机」は英語で？', options: ['chair', 'bed', 'sofa', 'desk'], answer: 3, hint: '勉強する場所' },
  { type: 'vocab', question: '「いす」は英語で？', options: ['chair', 'table', 'desk', 'bench'], answer: 0, hint: '座るもの' },
  { type: 'vocab', question: '「かばん」は英語で？', options: ['box', 'bag', 'basket', 'case'], answer: 1, hint: '👜' },
  { type: 'vocab', question: '「時計」は英語で？', options: ['calendar', 'phone', 'clock', 'watch'], answer: 2, hint: '⏰' },
  { type: 'vocab', question: '「窓」は英語で？', options: ['door', 'wall', 'floor', 'window'], answer: 3, hint: '外が見える' },
  { type: 'vocab', question: '「ドア」は英語で？', options: ['door', 'gate', 'window', 'wall'], answer: 0, hint: '🚪' },
  { type: 'vocab', question: '「学校」は英語で？', options: ['school', 'house', 'park', 'store'], answer: 0, hint: '🏫' },
  { type: 'vocab', question: '「家」は英語で？', options: ['school', 'house', 'hospital', 'hotel'], answer: 1, hint: '🏠' },
  { type: 'vocab', question: '「公園」は英語で？', options: ['pool', 'gym', 'park', 'garden'], answer: 2, hint: '🌳' },
  { type: 'vocab', question: '「病院」は英語で？', options: ['school', 'station', 'store', 'hospital'], answer: 3, hint: '🏥' },
  { type: 'vocab', question: '「駅」は英語で？', options: ['station', 'airport', 'port', 'stop'], answer: 0, hint: '🚉' },
  { type: 'vocab', question: '「図書館」は英語で？', options: ['museum', 'library', 'theater', 'gallery'], answer: 1, hint: '📖がたくさん' },
  { type: 'vocab', question: '「レストラン」は英語で？', options: ['cafe', 'bar', 'restaurant', 'kitchen'], answer: 2, hint: '🍽️' },
  { type: 'vocab', question: '「スーパー」は英語で？', options: ['shop', 'store', 'mall', 'supermarket'], answer: 3, hint: '🛒' },
  { type: 'vocab', question: '「映画館」は英語で？', options: ['cinema', 'theater', 'stadium', 'hall'], answer: 0, hint: '🎬' },
  { type: 'vocab', question: '「プール」は英語で？', options: ['pond', 'pool', 'lake', 'river'], answer: 1, hint: '🏊' },
  { type: 'vocab', question: '「先生」は英語で？', options: ['student', 'teacher', 'doctor', 'nurse'], answer: 1, hint: '👩‍🏫' },
  { type: 'vocab', question: '「生徒」は英語で？', options: ['student', 'teacher', 'parent', 'child'], answer: 0, hint: '学ぶ人' },
  { type: 'vocab', question: '「友達」は英語で？', options: ['family', 'brother', 'friend', 'sister'], answer: 2, hint: '👫' },
  { type: 'vocab', question: '「医者」は英語で？', options: ['nurse', 'dentist', 'patient', 'doctor'], answer: 3, hint: '👨‍⚕️' },
  { type: 'vocab', question: '「お母さん」は英語で？', options: ['mother', 'father', 'sister', 'aunt'], answer: 0, hint: '👩' },
  { type: 'vocab', question: '「お父さん」は英語で？', options: ['mother', 'father', 'brother', 'uncle'], answer: 1, hint: '👨' },
  { type: 'vocab', question: '「兄・弟」は英語で？', options: ['sister', 'cousin', 'brother', 'uncle'], answer: 2, hint: '男の兄弟' },
  { type: 'vocab', question: '「姉・妹」は英語で？', options: ['brother', 'cousin', 'aunt', 'sister'], answer: 3, hint: '女の兄弟' },
  { type: 'vocab', question: '「赤ちゃん」は英語で？', options: ['baby', 'child', 'kid', 'teen'], answer: 0, hint: '👶' },
  { type: 'vocab', question: '「おじいさん」は英語で？', options: ['uncle', 'grandfather', 'father', 'brother'], answer: 1, hint: '👴' },
  { type: 'vocab', question: '「赤」は英語で？', options: ['red', 'blue', 'green', 'yellow'], answer: 0, hint: '🔴' },
  { type: 'vocab', question: '「青」は英語で？', options: ['red', 'blue', 'green', 'purple'], answer: 1, hint: '🔵' },
  { type: 'vocab', question: '「緑」は英語で？', options: ['yellow', 'orange', 'green', 'brown'], answer: 2, hint: '🟢' },
  { type: 'vocab', question: '「黄色」は英語で？', options: ['orange', 'pink', 'gold', 'yellow'], answer: 3, hint: '🟡' },
  { type: 'vocab', question: '「白」は英語で？', options: ['white', 'black', 'gray', 'silver'], answer: 0, hint: '⚪' },
  { type: 'vocab', question: '「黒」は英語で？', options: ['white', 'black', 'brown', 'navy'], answer: 1, hint: '⚫' },
  { type: 'vocab', question: '「ピンク」は英語で？', options: ['purple', 'red', 'pink', 'rose'], answer: 2, hint: '🩷' },
  { type: 'vocab', question: '「オレンジ色」は英語で？', options: ['red', 'yellow', 'brown', 'orange'], answer: 3, hint: '🟠' },
  { type: 'vocab', question: '「紫」は英語で？', options: ['purple', 'violet', 'blue', 'pink'], answer: 0, hint: '🟣' },
  { type: 'vocab', question: '「茶色」は英語で？', options: ['tan', 'brown', 'beige', 'gold'], answer: 1, hint: '🟤' },
  { type: 'vocab', question: '「1」は英語で？', options: ['one', 'two', 'three', 'four'], answer: 0, hint: '☝️' },
  { type: 'vocab', question: '「2」は英語で？', options: ['one', 'two', 'three', 'five'], answer: 1, hint: '✌️' },
  { type: 'vocab', question: '「3」は英語で？', options: ['one', 'two', 'three', 'four'], answer: 2, hint: '☝️+✌️' },
  { type: 'vocab', question: '「5」は英語で？', options: ['three', 'four', 'six', 'five'], answer: 3, hint: '片手の指' },
  { type: 'vocab', question: '「10」は英語で？', options: ['ten', 'eleven', 'twelve', 'nine'], answer: 0, hint: '🔟' },
  { type: 'vocab', question: '「12」は英語で？', options: ['eleven', 'twelve', 'thirteen', 'ten'], answer: 1, hint: '1ダース' },
  { type: 'vocab', question: '「20」は英語で？', options: ['twelve', 'fifteen', 'twenty', 'thirty'], answer: 2, hint: '10×2' },
  { type: 'vocab', question: '「100」は英語で？', options: ['ten', 'thousand', 'fifty', 'hundred'], answer: 3, hint: '💯' },
  { type: 'vocab', question: '「0」は英語で？', options: ['zero', 'one', 'none', 'null'], answer: 0, hint: '何もない' },
  { type: 'vocab', question: '「7」は英語で？', options: ['six', 'seven', 'eight', 'nine'], answer: 1, hint: 'ラッキー' },
  { type: 'vocab', question: '「日曜日」は英語で？', options: ['Monday', 'Saturday', 'Sunday', 'Friday'], answer: 2, hint: '☀️の日' },
  { type: 'vocab', question: '「月曜日」は英語で？', options: ['Monday', 'Tuesday', 'Sunday', 'Friday'], answer: 0, hint: '🌙の日' },
  { type: 'vocab', question: '「金曜日」は英語で？', options: ['Thursday', 'Friday', 'Saturday', 'Wednesday'], answer: 1, hint: '週末前' },
  { type: 'vocab', question: '「朝」は英語で？', options: ['night', 'evening', 'morning', 'afternoon'], answer: 2, hint: '🌅' },
  { type: 'vocab', question: '「夜」は英語で？', options: ['morning', 'afternoon', 'evening', 'night'], answer: 3, hint: '🌙' },
  { type: 'vocab', question: '「今日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'now'], answer: 0, hint: 'この日' },
  { type: 'vocab', question: '「明日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'later'], answer: 1, hint: '次の日' },
  { type: 'vocab', question: '「昨日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'before'], answer: 2, hint: '前の日' },
  { type: 'vocab', question: '「大きい」は英語で？', options: ['small', 'big', 'tall', 'short'], answer: 1, hint: '🐘' },
  { type: 'vocab', question: '「小さい」は英語で？', options: ['small', 'big', 'wide', 'narrow'], answer: 0, hint: '🐜' },
  { type: 'vocab', question: '「新しい」は英語で？', options: ['old', 'young', 'new', 'fresh'], answer: 2, hint: '✨' },
  { type: 'vocab', question: '「古い」は英語で？', options: ['new', 'young', 'fresh', 'old'], answer: 3, hint: '昔の' },
  { type: 'vocab', question: '「熱い・暑い」は英語で？', options: ['hot', 'cold', 'warm', 'cool'], answer: 0, hint: '🔥' },
  { type: 'vocab', question: '「冷たい・寒い」は英語で？', options: ['hot', 'cold', 'warm', 'cool'], answer: 1, hint: '❄️' },
  { type: 'vocab', question: '「良い」は英語で？', options: ['bad', 'nice', 'good', 'great'], answer: 2, hint: '👍' },
  { type: 'vocab', question: '「悪い」は英語で？', options: ['good', 'nice', 'great', 'bad'], answer: 3, hint: '👎' },
  { type: 'vocab', question: '「食べる」は英語で？', options: ['eat', 'drink', 'cook', 'make'], answer: 0, hint: '🍽️' },
  { type: 'vocab', question: '「飲む」は英語で？', options: ['eat', 'drink', 'pour', 'swallow'], answer: 1, hint: '🥤' },
  { type: 'vocab', question: '「走る」は英語で？', options: ['walk', 'jump', 'run', 'skip'], answer: 2, hint: '🏃' },
  { type: 'vocab', question: '「歩く」は英語で？', options: ['run', 'jump', 'skip', 'walk'], answer: 3, hint: '🚶' },
  { type: 'vocab', question: '「見る」は英語で？', options: ['see', 'hear', 'smell', 'taste'], answer: 0, hint: '👀' },
  { type: 'vocab', question: '「聞く」は英語で？', options: ['see', 'hear', 'smell', 'touch'], answer: 1, hint: '👂' },
  { type: 'vocab', question: '「読む」は英語で？', options: ['write', 'speak', 'read', 'listen'], answer: 2, hint: '📖' },
  { type: 'vocab', question: '「書く」は英語で？', options: ['read', 'speak', 'listen', 'write'], answer: 3, hint: '✍️' },
  { type: 'grammar', question: 'I ___ a student.', options: ['is', 'am', 'are', 'be'], answer: 1, hint: '「私は〜です」' },
  { type: 'grammar', question: 'She ___ happy.', options: ['am', 'are', 'is', 'be'], answer: 2, hint: '「彼女は〜です」' },
  { type: 'grammar', question: 'They ___ my friends.', options: ['is', 'am', 'are', 'was'], answer: 2, hint: '「彼らは〜です」' },
  { type: 'grammar', question: '___ you like music?', options: ['Are', 'Is', 'Do', 'Does'], answer: 2, hint: '「あなたは〜が好きですか？」' },
  { type: 'grammar', question: 'I have ___ apple.', options: ['a', 'an', 'the', '-'], answer: 1, hint: '母音の前は...' },
  { type: 'grammar', question: 'This is ___ pen.', options: ['a', 'an', 'the', '-'], answer: 0, hint: '子音の前は...' },
  { type: 'grammar', question: 'He ___ tennis every day.', options: ['play', 'plays', 'playing', 'played'], answer: 1, hint: '三人称単数は...' },
  { type: 'grammar', question: 'I can ___ English.', options: ['speak', 'speaks', 'speaking', 'spoke'], answer: 0, hint: 'canの後は原形' },
  { type: 'grammar', question: '___ is your name?', options: ['Who', 'What', 'Where', 'When'], answer: 1, hint: '「何」を聞いている' },
  { type: 'grammar', question: '___ do you live?', options: ['Who', 'What', 'Where', 'When'], answer: 2, hint: '「どこ」を聞いている' },
];

// ======== 英検4級の問題（100問）========
const grade4Questions = [
  { type: 'vocab', question: '「経験」は英語で？', options: ['experience', 'example', 'exercise', 'excuse'], answer: 0, hint: '体験すること' },
  { type: 'vocab', question: '「決める」は英語で？', options: ['design', 'decide', 'depend', 'describe'], answer: 1, hint: '選択する' },
  { type: 'vocab', question: '「環境」は英語で？', options: ['entrance', 'energy', 'environment', 'enemy'], answer: 2, hint: '🌍' },
  { type: 'vocab', question: '「成功」は英語で？', options: ['surprise', 'support', 'suppose', 'success'], answer: 3, hint: '🏆' },
  { type: 'vocab', question: '「問題」は英語で？', options: ['problem', 'program', 'progress', 'project'], answer: 0, hint: '困ること' },
  { type: 'vocab', question: '「理由」は英語で？', options: ['result', 'reason', 'research', 'review'], answer: 1, hint: 'なぜ？の答え' },
  { type: 'vocab', question: '「意見」は英語で？', options: ['fact', 'idea', 'opinion', 'thought'], answer: 2, hint: '考え' },
  { type: 'vocab', question: '「違い」は英語で？', options: ['distance', 'different', 'difficult', 'difference'], answer: 3, hint: '異なる点' },
  { type: 'vocab', question: '「方法」は英語で？', options: ['method', 'manner', 'meaning', 'matter'], answer: 0, hint: 'やり方' },
  { type: 'vocab', question: '「機会」は英語で？', options: ['change', 'chance', 'choice', 'charge'], answer: 1, hint: 'チャンス' },
  { type: 'vocab', question: '「abroad」の意味は？', options: ['国内で', '海外で', '屋外で', '地下で'], answer: 1, hint: '✈️🌏' },
  { type: 'vocab', question: '「century」の意味は？', options: ['10年', '50年', '100年', '1000年'], answer: 2, hint: '1世紀は...' },
  { type: 'vocab', question: '「suddenly」の意味は？', options: ['ゆっくりと', '突然に', '静かに', '注意深く'], answer: 1, hint: '⚡' },
  { type: 'vocab', question: '「expensive」の意味は？', options: ['安い', '高価な', '無料の', '特別な'], answer: 1, hint: '💰💰💰' },
  { type: 'vocab', question: '「cheap」の意味は？', options: ['安い', '高い', '無料の', '普通の'], answer: 0, hint: '💰が少ない' },
  { type: 'vocab', question: '「usually」の意味は？', options: ['時々', '普通は', '決して〜ない', '常に'], answer: 1, hint: 'いつもではないが多い' },
  { type: 'vocab', question: '「probably」の意味は？', options: ['絶対に', 'たぶん', '決して', 'ほとんど'], answer: 1, hint: '多分そう' },
  { type: 'vocab', question: '「especially」の意味は？', options: ['普通に', '一般的に', '特に', '完全に'], answer: 2, hint: '特別に' },
  { type: 'vocab', question: '「actually」の意味は？', options: ['最近', '実際に', '最終的に', '自動的に'], answer: 1, hint: '本当は' },
  { type: 'vocab', question: '「recently」の意味は？', options: ['最近', '以前', '将来', '現在'], answer: 0, hint: 'この頃' },
  { type: 'vocab', question: '「believe」の意味は？', options: ['信じる', '達成する', '受け取る', '気づく'], answer: 0, hint: '本当だと思う' },
  { type: 'vocab', question: '「imagine」の意味は？', options: ['覚える', '想像する', '忘れる', '思い出す'], answer: 1, hint: '頭の中で描く' },
  { type: 'vocab', question: '「improve」の意味は？', options: ['悪化する', '維持する', '改善する', '変化する'], answer: 2, hint: 'より良くなる' },
  { type: 'vocab', question: '「prepare」の意味は？', options: ['始める', '終える', '続ける', '準備する'], answer: 3, hint: '用意する' },
  { type: 'vocab', question: '「continue」の意味は？', options: ['続ける', '始める', '終わる', '止まる'], answer: 0, hint: '続行する' },
  { type: 'vocab', question: '「discover」の意味は？', options: ['隠す', '発見する', '失う', '探す'], answer: 1, hint: '見つける' },
  { type: 'vocab', question: '「provide」の意味は？', options: ['受け取る', '拒否する', '提供する', '要求する'], answer: 2, hint: '与える' },
  { type: 'vocab', question: '「require」の意味は？', options: ['提供する', '拒否する', '許可する', '必要とする'], answer: 3, hint: '求める' },
  { type: 'vocab', question: '「suggest」の意味は？', options: ['提案する', '拒否する', '同意する', '反対する'], answer: 0, hint: '勧める' },
  { type: 'vocab', question: '「explain」の意味は？', options: ['質問する', '説明する', '答える', '理解する'], answer: 1, hint: '分かりやすく言う' },
  { type: 'vocab', question: '「culture」の意味は？', options: ['農業', '文化', '構造', '自然'], answer: 1, hint: '国や地域の特色' },
  { type: 'vocab', question: '「society」の意味は？', options: ['科学', '社会', '歴史', '地理'], answer: 1, hint: '人々の集まり' },
  { type: 'vocab', question: '「government」の意味は？', options: ['経済', '教育', '政府', '産業'], answer: 2, hint: '国を治める' },
  { type: 'vocab', question: '「temperature」の意味は？', options: ['天気', '気圧', '湿度', '温度'], answer: 3, hint: '暑さ寒さ' },
  { type: 'vocab', question: '「population」の意味は？', options: ['人口', '面積', '高さ', '深さ'], answer: 0, hint: '人の数' },
  { type: 'vocab', question: '「traffic」の意味は？', options: ['事故', '交通', '道路', '信号'], answer: 1, hint: '車の流れ' },
  { type: 'vocab', question: '「habit」の意味は？', options: ['趣味', '性格', '習慣', '能力'], answer: 2, hint: 'いつもすること' },
  { type: 'vocab', question: '「memory」の意味は？', options: ['想像', '感情', '知識', '記憶'], answer: 3, hint: '覚えていること' },
  { type: 'vocab', question: '「ability」の意味は？', options: ['能力', '可能性', '責任', '義務'], answer: 0, hint: 'できること' },
  { type: 'vocab', question: '「purpose」の意味は？', options: ['原因', '目的', '結果', '理由'], answer: 1, hint: '何のために' },
  { type: 'grammar', question: 'I have ___ to Kyoto twice.', options: ['go', 'went', 'been', 'going'], answer: 2, hint: '経験を表す現在完了' },
  { type: 'grammar', question: 'I have ___ my homework yet.', options: ['finish', 'finished', 'finishing', 'not finished'], answer: 3, hint: 'まだ〜していない' },
  { type: 'grammar', question: 'She has ___ here for five years.', options: ['live', 'lived', 'living', 'lives'], answer: 1, hint: '継続を表す現在完了' },
  { type: 'grammar', question: 'Have you ever ___ sushi?', options: ['eat', 'ate', 'eaten', 'eating'], answer: 2, hint: '経験を尋ねる' },
  { type: 'grammar', question: 'I have just ___ lunch.', options: ['have', 'had', 'having', 'has'], answer: 1, hint: '完了を表す' },
  { type: 'grammar', question: 'He has ___ to America three times.', options: ['go', 'went', 'been', 'gone'], answer: 2, hint: '行ったことがある' },
  { type: 'grammar', question: 'How long have you ___ English?', options: ['study', 'studied', 'studying', 'studies'], answer: 1, hint: 'どのくらい〜していますか' },
  { type: 'grammar', question: 'I have never ___ such a beautiful place.', options: ['see', 'saw', 'seen', 'seeing'], answer: 2, hint: '一度も〜ない' },
  { type: 'grammar', question: 'This book is ___ than that one.', options: ['interesting', 'more interesting', 'most interesting', 'interestingly'], answer: 1, hint: '比較級' },
  { type: 'grammar', question: 'He is the ___ student in our class.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 2, hint: '最上級' },
  { type: 'grammar', question: 'She runs ___ than her brother.', options: ['fast', 'faster', 'fastest', 'more fast'], answer: 1, hint: '比較級' },
  { type: 'grammar', question: 'This is the ___ movie I have ever seen.', options: ['good', 'better', 'best', 'most good'], answer: 2, hint: '最上級' },
  { type: 'grammar', question: 'Tom is as ___ as his father.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 0, hint: '同等比較 as...as' },
  { type: 'grammar', question: 'Which is ___, dogs or cats?', options: ['popular', 'more popular', 'most popular', 'popularer'], answer: 1, hint: '2つの比較' },
  { type: 'grammar', question: 'The movie ___ by many people.', options: ['watch', 'watches', 'watched', 'was watched'], answer: 3, hint: '受動態' },
  { type: 'grammar', question: 'I want ___ a doctor.', options: ['be', 'being', 'to be', 'been'], answer: 2, hint: 'want to ~' },
  { type: 'grammar', question: 'He enjoys ___ tennis.', options: ['play', 'plays', 'playing', 'to play'], answer: 2, hint: 'enjoy ~ing' },
  { type: 'grammar', question: 'This letter was ___ by my mother.', options: ['write', 'wrote', 'written', 'writing'], answer: 2, hint: '受動態の過去分詞' },
  { type: 'grammar', question: 'She asked me ___ her.', options: ['help', 'helped', 'helping', 'to help'], answer: 3, hint: 'ask 人 to ~' },
  { type: 'grammar', question: 'I finished ___ my homework.', options: ['do', 'did', 'doing', 'to do'], answer: 2, hint: 'finish ~ing' },
  { type: 'grammar', question: 'If it ___ tomorrow, I will stay home.', options: ['rain', 'rains', 'rained', 'raining'], answer: 1, hint: '条件節は現在形' },
  { type: 'grammar', question: 'She ___ cooking when I arrived.', options: ['is', 'was', 'were', 'been'], answer: 1, hint: '過去進行形' },
  { type: 'grammar', question: '___ it was raining, we went out.', options: ['Because', 'Although', 'If', 'When'], answer: 1, hint: '〜だけれども' },
  { type: 'grammar', question: 'I was tired ___ I went to bed early.', options: ['so', 'but', 'or', 'and'], answer: 0, hint: 'だから' },
  { type: 'grammar', question: '___ he is rich, he is not happy.', options: ['Because', 'Although', 'If', 'When'], answer: 1, hint: '〜にもかかわらず' },
  { type: 'idiom', question: '"look forward to" の意味は？', options: ['〜を見る', '〜を楽しみにする', '〜を探す', '〜を調べる'], answer: 1, hint: '😊🎉' },
  { type: 'idiom', question: '"get along with" の意味は？', options: ['〜と喧嘩する', '〜と別れる', '〜と仲良くする', '〜と競争する'], answer: 2, hint: '👫' },
  { type: 'idiom', question: '"take care of" の意味は？', options: ['〜を捨てる', '〜の世話をする', '〜を無視する', '〜を壊す'], answer: 1, hint: '👶🍼' },
  { type: 'idiom', question: '"run out of" の意味は？', options: ['〜を見つける', '〜が切れる', '〜を始める', '〜を続ける'], answer: 1, hint: '😱💨' },
  { type: 'idiom', question: '"by the way" の意味は？', options: ['その結果', 'ところで', '〜によって', 'いずれにせよ'], answer: 1, hint: '話題を変える時' },
  { type: 'idiom', question: '"put off" の意味は？', options: ['着る', '脱ぐ', '延期する', '始める'], answer: 2, hint: '後にする' },
  { type: 'idiom', question: '"pick up" の意味は？', options: ['落とす', '拾う', '投げる', '置く'], answer: 1, hint: '持ち上げる' },
  { type: 'idiom', question: '"turn on" の意味は？', options: ['消す', 'つける', '回す', '止める'], answer: 1, hint: 'スイッチを入れる' },
  { type: 'idiom', question: '"turn off" の意味は？', options: ['消す', 'つける', '回す', '始める'], answer: 0, hint: 'スイッチを切る' },
  { type: 'idiom', question: '"look for" の意味は？', options: ['〜を見る', '〜を探す', '〜を見つける', '〜を失う'], answer: 1, hint: '見て回る' },
  { type: 'idiom', question: '"give up" の意味は？', options: ['あきらめる', '続ける', '始める', '与える'], answer: 0, hint: '😩' },
  { type: 'idiom', question: '"come true" の意味は？', options: ['来る', '本当になる', '実現する', '信じる'], answer: 2, hint: '夢が〜' },
  { type: 'idiom', question: '"be interested in" の意味は？', options: ['〜に退屈する', '〜に興味がある', '〜を嫌う', '〜を忘れる'], answer: 1, hint: '好奇心' },
  { type: 'idiom', question: '"be good at" の意味は？', options: ['〜が下手だ', '〜が得意だ', '〜が嫌いだ', '〜が好きだ'], answer: 1, hint: '上手' },
  { type: 'idiom', question: '"be afraid of" の意味は？', options: ['〜を好む', '〜を怖がる', '〜を尊敬する', '〜を無視する'], answer: 1, hint: '😨' },
  { type: 'idiom', question: '"be proud of" の意味は？', options: ['〜を恥じる', '〜を誇りに思う', '〜を心配する', '〜を疑う'], answer: 1, hint: '😤✨' },
  { type: 'idiom', question: '"at first" の意味は？', options: ['最後に', '最初は', '結局', 'ついに'], answer: 1, hint: '始めは' },
  { type: 'idiom', question: '"at last" の意味は？', options: ['最初は', 'ついに', '少なくとも', '最後の'], answer: 1, hint: 'やっと' },
  { type: 'idiom', question: '"in fact" の意味は？', options: ['想像では', '実際は', '多分', 'おそらく'], answer: 1, hint: '本当は' },
  { type: 'idiom', question: '"for example" の意味は？', options: ['例として', '結果として', '原因として', '理由として'], answer: 0, hint: '具体例' },
];

// ======== 英検3級の問題（100問）========
const grade3Questions = [
  { type: 'vocab', question: '「opportunity」の意味は？', options: ['反対', '意見', '機会', '問題'], answer: 2, hint: 'チャンス' },
  { type: 'vocab', question: '「responsibility」の意味は？', options: ['可能性', '責任', '能力', '現実'], answer: 1, hint: '自分の役割' },
  { type: 'vocab', question: '「influence」の意味は？', options: ['影響', '情報', '興味', '収入'], answer: 0, hint: '他に与える効果' },
  { type: 'vocab', question: '「achievement」の意味は？', options: ['失敗', '達成', '挑戦', '努力'], answer: 1, hint: '成し遂げること' },
  { type: 'vocab', question: '「relationship」の意味は？', options: ['親戚', '関係', '友情', '結婚'], answer: 1, hint: '人と人との繋がり' },
  { type: 'vocab', question: '「knowledge」の意味は？', options: ['無知', '知識', '経験', '教育'], answer: 1, hint: '知っていること' },
  { type: 'vocab', question: '「development」の意味は？', options: ['後退', '発展', '停止', '変化'], answer: 1, hint: '成長すること' },
  { type: 'vocab', question: '「advantage」の意味は？', options: ['不利', '利点', '欠点', '特徴'], answer: 1, hint: '有利な点' },
  { type: 'vocab', question: '「disadvantage」の意味は？', options: ['利点', '特徴', '欠点', '違い'], answer: 2, hint: '不利な点' },
  { type: 'vocab', question: '「possibility」の意味は？', options: ['不可能', '可能性', '確実性', '現実'], answer: 1, hint: 'ありえること' },
  { type: 'vocab', question: '「concentrate」の意味は？', options: ['祝う', '比較する', '集中する', '続ける'], answer: 2, hint: '🎯' },
  { type: 'vocab', question: '「investigate」の意味は？', options: ['招待する', '調査する', '投資する', '発明する'], answer: 1, hint: '🔍' },
  { type: 'vocab', question: '「maintain」の意味は？', options: ['説明する', '維持する', '得る', '失う'], answer: 1, hint: 'キープする' },
  { type: 'vocab', question: '「recognize」の意味は？', options: ['無視する', '認識する', '忘れる', '拒否する'], answer: 1, hint: '分かる' },
  { type: 'vocab', question: '「represent」の意味は？', options: ['反対する', '代表する', '繰り返す', '報告する'], answer: 1, hint: '〜を表す' },
  { type: 'vocab', question: '「appreciate」の意味は？', options: ['批判する', '感謝する', '無視する', '軽視する'], answer: 1, hint: 'ありがたく思う' },
  { type: 'vocab', question: '「encourage」の意味は？', options: ['落胆させる', '励ます', '禁止する', '強制する'], answer: 1, hint: '勇気づける' },
  { type: 'vocab', question: '「establish」の意味は？', options: ['破壊する', '設立する', '終える', '変える'], answer: 1, hint: '作り上げる' },
  { type: 'vocab', question: '「determine」の意味は？', options: ['迷う', '決定する', '疑う', '後悔する'], answer: 1, hint: '決める' },
  { type: 'vocab', question: '「indicate」の意味は？', options: ['隠す', '示す', '否定する', '曖昧にする'], answer: 1, hint: '指し示す' },
  { type: 'vocab', question: '「regardless」の意味は？', options: ['〜にもかかわらず', '〜に関して', '〜の代わりに', '〜の結果'], answer: 0, hint: '関係なく' },
  { type: 'vocab', question: '「eventually」の意味は？', options: ['明らかに', '結局', '普通は', '特に'], answer: 1, hint: '最終的に' },
  { type: 'vocab', question: '「frequently」の意味は？', options: ['稀に', '頻繁に', '決して', '時々'], answer: 1, hint: 'よく' },
  { type: 'vocab', question: '「unfortunately」の意味は？', options: ['幸運にも', '残念ながら', '確かに', '明らかに'], answer: 1, hint: '😢' },
  { type: 'vocab', question: '「approximately」の意味は？', options: ['正確に', 'およそ', '完全に', '絶対に'], answer: 1, hint: 'だいたい' },
  { type: 'vocab', question: '「immediately」の意味は？', options: ['ゆっくり', 'すぐに', '後で', '時々'], answer: 1, hint: '今すぐ' },
  { type: 'vocab', question: '「properly」の意味は？', options: ['不適切に', '適切に', '部分的に', '完全に'], answer: 1, hint: '正しく' },
  { type: 'vocab', question: '「completely」の意味は？', options: ['部分的に', '完全に', '少し', 'ほとんど'], answer: 1, hint: '100%' },
  { type: 'vocab', question: '「definitely」の意味は？', options: ['たぶん', '確実に', '多分', 'おそらく'], answer: 1, hint: '絶対に' },
  { type: 'vocab', question: '「originally」の意味は？', options: ['最終的に', '元々', '現在', '将来'], answer: 1, hint: '最初は' },
  { type: 'vocab', question: '「significant」の意味は？', options: ['無意味な', '重要な', '普通の', '単純な'], answer: 1, hint: '大切な' },
  { type: 'vocab', question: '「appropriate」の意味は？', options: ['不適切な', '適切な', '余分な', '不足の'], answer: 1, hint: 'ふさわしい' },
  { type: 'vocab', question: '「available」の意味は？', options: ['不可能な', '利用可能な', '高価な', '危険な'], answer: 1, hint: '使える' },
  { type: 'vocab', question: '「essential」の意味は？', options: ['不要な', '必須の', '余分な', '普通の'], answer: 1, hint: '絶対に必要' },
  { type: 'vocab', question: '「enormous」の意味は？', options: ['小さな', '巨大な', '普通の', '細い'], answer: 1, hint: 'とても大きい' },
  { type: 'vocab', question: '「obvious」の意味は？', options: ['不明な', '明らかな', '複雑な', '曖昧な'], answer: 1, hint: 'はっきりした' },
  { type: 'vocab', question: '「previous」の意味は？', options: ['次の', '以前の', '現在の', '将来の'], answer: 1, hint: '前の' },
  { type: 'vocab', question: '「reasonable」の意味は？', options: ['不合理な', '合理的な', '感情的な', '極端な'], answer: 1, hint: '妥当な' },
  { type: 'vocab', question: '「valuable」の意味は？', options: ['無価値な', '価値のある', '安い', '普通の'], answer: 1, hint: '貴重な' },
  { type: 'vocab', question: '「various」の意味は？', options: ['同じ', '様々な', '唯一の', '特定の'], answer: 1, hint: 'いろいろな' },
  { type: 'grammar', question: 'I wish I ___ fly.', options: ['can', 'could', 'will', 'would'], answer: 1, hint: '仮定法' },
  { type: 'grammar', question: 'If I ___ you, I would study harder.', options: ['am', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: 'If I ___ rich, I would travel the world.', options: ['am', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: 'I wish I ___ speak French.', options: ['can', 'could', 'may', 'might'], answer: 1, hint: '〜できたらなあ' },
  { type: 'grammar', question: 'If she ___ here, she would help us.', options: ['is', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: "I wish it ___ raining.", options: ["isn't", "wasn't", "weren't", "doesn't"], answer: 2, hint: '雨じゃなければ' },
  { type: 'grammar', question: 'The book ___ I bought yesterday is interesting.', options: ['who', 'which', 'what', 'when'], answer: 1, hint: '関係代名詞（物）' },
  { type: 'grammar', question: 'She is the woman ___ helped me.', options: ['who', 'which', 'what', 'whom'], answer: 0, hint: '関係代名詞（人・主格）' },
  { type: 'grammar', question: 'The man ___ I met was a doctor.', options: ['who', 'whom', 'which', 'what'], answer: 1, hint: '関係代名詞（人・目的格）' },
  { type: 'grammar', question: 'This is the house ___ he lives.', options: ['which', 'where', 'when', 'what'], answer: 1, hint: '関係副詞（場所）' },
  { type: 'grammar', question: 'I remember the day ___ we first met.', options: ['which', 'where', 'when', 'what'], answer: 2, hint: '関係副詞（時）' },
  { type: 'grammar', question: 'The reason ___ he was late is unknown.', options: ['which', 'where', 'when', 'why'], answer: 3, hint: '関係副詞（理由）' },
  { type: 'grammar', question: '___ surprised me was his attitude.', options: ['That', 'What', 'Which', 'It'], answer: 1, hint: '関係代名詞what' },
  { type: 'grammar', question: "I don't know ___ to do.", options: ['how', 'what', 'which', 'where'], answer: 1, hint: '何をすべきか' },
  { type: 'grammar', question: 'He made me ___ the room.', options: ['clean', 'cleaned', 'cleaning', 'to clean'], answer: 0, hint: '使役動詞' },
  { type: 'grammar', question: 'I saw him ___ the street.', options: ['cross', 'crossed', 'crossing', 'to cross'], answer: 0, hint: '知覚動詞' },
  { type: 'grammar', question: 'She let me ___ her car.', options: ['use', 'used', 'using', 'to use'], answer: 0, hint: 'let + 原形' },
  { type: 'grammar', question: 'I heard someone ___ my name.', options: ['call', 'called', 'calling', 'to call'], answer: 0, hint: '知覚動詞' },
  { type: 'grammar', question: 'My mother had me ___ shopping.', options: ['go', 'went', 'going', 'to go'], answer: 0, hint: 'have + 原形' },
  { type: 'grammar', question: 'I watched the children ___ in the park.', options: ['play', 'played', 'playing', 'to play'], answer: 0, hint: '知覚動詞' },
  { type: 'grammar', question: 'The problem is too difficult ___ solve.', options: ['for', 'to', 'that', 'so'], answer: 1, hint: 'too ~ to ...' },
  { type: 'grammar', question: 'I have never seen ___ a beautiful sunset.', options: ['so', 'such', 'very', 'too'], answer: 1, hint: 'such a ~' },
  { type: 'grammar', question: 'Not only he but also I ___ wrong.', options: ['am', 'is', 'are', 'was'], answer: 0, hint: '近い方に合わせる' },
  { type: 'grammar', question: 'Neither Tom nor I ___ ready.', options: ['am', 'is', 'are', 'was'], answer: 0, hint: '近い方に合わせる' },
  { type: 'grammar', question: 'He is ___ kind that everyone likes him.', options: ['so', 'such', 'very', 'too'], answer: 0, hint: 'so ~ that ...' },
  { type: 'grammar', question: 'She is ___ a kind person that everyone likes her.', options: ['so', 'such', 'very', 'too'], answer: 1, hint: 'such ~ that ...' },
  { type: 'grammar', question: 'It is important ___ you to study hard.', options: ['of', 'for', 'to', 'with'], answer: 1, hint: 'It is ~ for 人 to ...' },
  { type: 'grammar', question: 'It is kind ___ you to help me.', options: ['of', 'for', 'to', 'with'], answer: 0, hint: 'It is ~ of 人 to ...' },
  { type: 'grammar', question: 'I wonder ___ he will come.', options: ['that', 'if', 'what', 'which'], answer: 1, hint: '〜かどうか' },
  { type: 'grammar', question: '___ you study hard, you will pass the exam.', options: ['If', 'Unless', 'Though', 'Because'], answer: 0, hint: 'もし〜なら' },
  { type: 'idiom', question: '"as a matter of fact" の意味は？', options: ['結果として', '実際のところ', '事実を言えば', '問題として'], answer: 1, hint: '実は...' },
  { type: 'idiom', question: '"in spite of" の意味は？', options: ['〜のために', '〜にもかかわらず', '〜に加えて', '〜の代わりに'], answer: 1, hint: 'despite' },
  { type: 'idiom', question: '"make sense" の意味は？', options: ['感覚を作る', '意味がわかる', '理由を述べる', '決断する'], answer: 1, hint: '理解できる' },
  { type: 'idiom', question: '"on purpose" の意味は？', options: ['偶然に', '目的のために', 'わざと', '理由があって'], answer: 2, hint: '意図的に' },
  { type: 'idiom', question: '"be supposed to" の意味は？', options: ['〜すべきだ', '〜することになっている', '〜かもしれない', '〜に違いない'], answer: 1, hint: '予定・義務' },
  { type: 'idiom', question: '"in advance" の意味は？', options: ['後で', '前もって', '同時に', '途中で'], answer: 1, hint: '事前に' },
  { type: 'idiom', question: '"by accident" の意味は？', options: ['わざと', '偶然に', '必然的に', '予定通りに'], answer: 1, hint: '偶然' },
  { type: 'idiom', question: '"as soon as" の意味は？', options: ['〜の前に', '〜するとすぐに', '〜の後で', '〜する間に'], answer: 1, hint: '〜したらすぐ' },
  { type: 'idiom', question: '"in order to" の意味は？', options: ['〜するために', '〜の代わりに', '〜にもかかわらず', '〜の結果'], answer: 0, hint: '目的' },
  { type: 'idiom', question: '"used to" の意味は？', options: ['〜に慣れている', '以前は〜だった', '〜するために使う', '〜に使われる'], answer: 1, hint: '昔は〜' },
  { type: 'idiom', question: '"be used to" の意味は？', options: ['以前は〜だった', '〜に慣れている', '〜するために使う', '〜に使われる'], answer: 1, hint: '慣れ' },
  { type: 'idiom', question: '"instead of" の意味は？', options: ['〜のために', '〜の代わりに', '〜に加えて', '〜にもかかわらず'], answer: 1, hint: '代替' },
  { type: 'idiom', question: '"according to" の意味は？', options: ['〜によると', '〜のために', '〜に反して', '〜にもかかわらず'], answer: 0, hint: '情報源' },
  { type: 'idiom', question: '"as well as" の意味は？', options: ['〜だけでなく', '〜よりも', '〜のように', '〜と同じく'], answer: 0, hint: 'A as well as B' },
  { type: 'idiom', question: '"so far" の意味は？', options: ['遠くまで', '今のところ', 'これからも', 'すぐに'], answer: 1, hint: '現時点まで' },
  { type: 'idiom', question: '"at least" の意味は？', options: ['最大で', '少なくとも', 'ついに', '最後に'], answer: 1, hint: '最低でも' },
  { type: 'idiom', question: '"at most" の意味は？', options: ['最大で', '少なくとも', 'ほとんど', 'ついに'], answer: 0, hint: '最高でも' },
  { type: 'idiom', question: '"no longer" の意味は？', options: ['まだ', 'もはや〜ない', 'より長く', 'ずっと'], answer: 1, hint: 'not anymore' },
  { type: 'idiom', question: '"right away" の意味は？', options: ['すぐに', '後で', '途中で', '離れて'], answer: 0, hint: '今すぐ' },
  { type: 'idiom', question: '"after all" の意味は？', options: ['結局', '最初は', '途中で', '同時に'], answer: 0, hint: '色々あったが' },
];

// ======== 熟語データ ========
const idiom5Data=[{phrase:'good morning',meaning:'おはようございます',emoji:'🌅',example:'Good morning, Mom!'},{phrase:'good night',meaning:'おやすみなさい',emoji:'🌙',example:'Good night, everyone!'},{phrase:'thank you',meaning:'ありがとう',emoji:'🙏',example:'Thank you very much!'},{phrase:'excuse me',meaning:'すみません',emoji:'🙇',example:'Excuse me, where is the station?'},{phrase:'of course',meaning:'もちろん',emoji:'👍',example:'Of course you can come!'},{phrase:'a lot of',meaning:'たくさんの',emoji:'📦',example:'I have a lot of books.'},{phrase:'come on',meaning:'さあ来て',emoji:'🏃',example:"Come on, let's go!"},{phrase:'get up',meaning:'起きる',emoji:'⏰',example:'I get up at seven.'},{phrase:'sit down',meaning:'座る',emoji:'🪑',example:'Please sit down.'},{phrase:'stand up',meaning:'立ち上がる',emoji:'🧍',example:'Stand up, please.'},{phrase:'come in',meaning:'入ってきて',emoji:'🚪',example:'Come in, please.'},{phrase:'go out',meaning:'外出する',emoji:'🚶',example:"Let's go out and play."},{phrase:'look at',meaning:'〜を見る',emoji:'👀',example:'Look at this picture!'},{phrase:'listen to',meaning:'〜を聞く',emoji:'👂',example:'Listen to this song.'},{phrase:'wait for',meaning:'〜を待つ',emoji:'⏳',example:'Wait for me, please!'},{phrase:'right now',meaning:'今すぐ',emoji:'⚡',example:'I want it right now!'},{phrase:'how many',meaning:'いくつ',emoji:'🔢',example:'How many dogs do you have?'},{phrase:'how much',meaning:'いくら',emoji:'💰',example:'How much is this?'},{phrase:'how old',meaning:'何歳',emoji:'🎂',example:'How old are you?'},{phrase:'what time',meaning:'何時',emoji:'🕐',example:'What time is it?'},{phrase:'every day',meaning:'毎日',emoji:'📅',example:'I study every day.'},{phrase:'after school',meaning:'放課後',emoji:'🏫',example:"Let's play after school."},{phrase:'at home',meaning:'家で',emoji:'🏠',example:"I'm at home now."},{phrase:'on foot',meaning:'歩いて',emoji:'👟',example:'I go to school on foot.'},{phrase:'by bus',meaning:'バスで',emoji:'🚌',example:'She goes by bus.'},{phrase:'for example',meaning:'例えば',emoji:'💡',example:'I like fruits, for example, apples.'},{phrase:'in front of',meaning:'〜の前に',emoji:'👆',example:'Stand in front of the door.'},{phrase:'next to',meaning:'〜の隣に',emoji:'↔️',example:'Sit next to me.'},{phrase:'a little',meaning:'少し',emoji:'🤏',example:"I'm a little tired."},{phrase:'one more',meaning:'もう一つ',emoji:'☝️',example:'One more time, please.'},{phrase:'go home',meaning:'帰宅する',emoji:'🏡',example:"Let's go home."},{phrase:'come back',meaning:'戻ってくる',emoji:'🔙',example:'Come back soon!'},{phrase:'take a bath',meaning:'お風呂に入る',emoji:'🛁',example:'I take a bath every night.'},{phrase:'go to bed',meaning:'寝る',emoji:'🛏️',example:'I go to bed at nine.'},{phrase:'wake up',meaning:'目を覚ます',emoji:'😴',example:"Wake up! It's morning."},{phrase:'have fun',meaning:'楽しむ',emoji:'🎉',example:'Have fun at the party!'},{phrase:'be happy',meaning:'幸せだ',emoji:'😊',example:"I'm so happy today!"},{phrase:'be hungry',meaning:'おなかがすいている',emoji:'🍕',example:"I'm very hungry."},{phrase:'be tired',meaning:'疲れている',emoji:'😫',example:"I'm so tired today."},{phrase:'be sorry',meaning:'ごめんなさい',emoji:'😔',example:"I'm sorry I'm late."},{phrase:"let's go",meaning:'行こう',emoji:'🚀',example:"Let's go to the park!"},{phrase:'see you',meaning:'またね',emoji:'👋',example:'See you tomorrow!'},{phrase:'over there',meaning:'あそこに',emoji:'👉',example:'Look over there!'},{phrase:'each other',meaning:'お互いに',emoji:'🤝',example:'They help each other.'},{phrase:'on the way',meaning:'途中で',emoji:'🛤️',example:'I met him on the way home.'},{phrase:'all day',meaning:'一日中',emoji:'☀️',example:'It rained all day.'},{phrase:'turn right',meaning:'右に曲がる',emoji:'➡️',example:'Turn right at the corner.'},{phrase:'turn left',meaning:'左に曲がる',emoji:'⬅️',example:'Turn left here.'},{phrase:'take off',meaning:'脱ぐ',emoji:'✈️',example:'Take off your shoes.'},{phrase:'put on',meaning:'着る',emoji:'👕',example:'Put on your jacket.'},{phrase:'be from',meaning:'〜出身だ',emoji:'🌍',example:"I'm from Japan."},{phrase:'how about',meaning:'〜はどう？',emoji:'🤔',example:'How about some tea?'},{phrase:'what about',meaning:'〜はどう？',emoji:'❓',example:'What about you?'},{phrase:'go shopping',meaning:'買い物に行く',emoji:'🛍️',example:"Let's go shopping!"},{phrase:'play with',meaning:'〜と遊ぶ',emoji:'🎮',example:'Can I play with you?'},{phrase:'talk to',meaning:'〜と話す',emoji:'💬',example:'I want to talk to you.'},{phrase:'belong to',meaning:'〜に属する',emoji:'🏷️',example:'This book belongs to me.'},{phrase:'think of',meaning:'〜を思いつく',emoji:'💭',example:'Think of a good idea!'},{phrase:'kind of',meaning:'ちょっと',emoji:'🤷',example:"It's kind of cold today."},{phrase:'all right',meaning:'大丈夫',emoji:'✅',example:'Are you all right?'},{phrase:'good at',meaning:'〜が得意',emoji:'🌟',example:'She is good at singing.'},{phrase:'take a walk',meaning:'散歩する',emoji:'🌸',example:"Let's take a walk in the park."},{phrase:'be late',meaning:'遅刻する',emoji:'⏰',example:"Don't be late for school!"},{phrase:'be ready',meaning:'準備ができている',emoji:'✊',example:'Are you ready?'},{phrase:'at first',meaning:'最初は',emoji:'1️⃣',example:'At first, it was hard.'},{phrase:'at last',meaning:'ついに',emoji:'🏁',example:'At last, we arrived!'},{phrase:'just now',meaning:'たった今',emoji:'🕐',example:'He left just now.'},{phrase:'no problem',meaning:'問題ない',emoji:'😎',example:"No problem! I'll help you."},{phrase:'so much',meaning:'とても',emoji:'❤️',example:'Thank you so much!'},{phrase:'not yet',meaning:'まだ',emoji:'🚫',example:"I'm not ready yet."},{phrase:'right here',meaning:'ちょうどここ',emoji:'📍',example:'Stay right here!'},{phrase:'look like',meaning:'〜のように見える',emoji:'🔍',example:'You look like a star!'},{phrase:'sound like',meaning:'〜のように聞こえる',emoji:'🎵',example:'That sounds like fun!'},{phrase:'feel like',meaning:'〜な気がする',emoji:'💫',example:'I feel like eating pizza.'},{phrase:'made of',meaning:'〜でできている',emoji:'🧱',example:'This desk is made of wood.'},{phrase:'be sure',meaning:'確信している',emoji:'💯',example:"I'm sure you can do it!"},{phrase:'be able to',meaning:'〜できる',emoji:'💪',example:"I'm able to swim well."},{phrase:'want to',meaning:'〜したい',emoji:'🙋',example:'I want to go to Tokyo.'},{phrase:'have to',meaning:'〜しなければならない',emoji:'📋',example:'I have to study tonight.'},{phrase:'try to',meaning:'〜しようとする',emoji:'🎯',example:'Try to do your best!'},{phrase:'need to',meaning:'〜する必要がある',emoji:'⚠️',example:'You need to eat breakfast.'},{phrase:'begin to',meaning:'〜し始める',emoji:'▶️',example:'It began to rain.'},{phrase:'start to',meaning:'〜し始める',emoji:'🟢',example:'She started to sing.'},{phrase:'like to',meaning:'〜するのが好き',emoji:'💕',example:'I like to read books.'},{phrase:'hope to',meaning:'〜したいと思う',emoji:'🌈',example:'I hope to see you again.'},{phrase:'from now on',meaning:'これからは',emoji:'➡️',example:"From now on, I'll study harder."},{phrase:'far away',meaning:'遠くに',emoji:'🌠',example:'The stars are far away.'},{phrase:'close to',meaning:'〜の近くに',emoji:'📏',example:'My house is close to the station.'},{phrase:'full of',meaning:'〜でいっぱい',emoji:'🫙',example:'The box is full of toys.'},{phrase:'part of',meaning:'〜の一部',emoji:'🧩',example:'This is part of the plan.'},{phrase:'one of',meaning:'〜の一つ',emoji:'☝️',example:'This is one of my favorites.'},{phrase:'lots of',meaning:'たくさんの',emoji:'🌊',example:'There are lots of flowers.'},{phrase:'both of',meaning:'両方の',emoji:'✌️',example:'Both of us like music.'},{phrase:'some of',meaning:'〜のいくつか',emoji:'🔸',example:'Some of my friends are here.'},{phrase:'most of',meaning:'ほとんどの',emoji:'📊',example:'Most of us like sports.'},{phrase:'a pair of',meaning:'一対の',emoji:'👟',example:'I need a pair of shoes.'},{phrase:'a cup of',meaning:'一杯の',emoji:'☕',example:'A cup of tea, please.'},{phrase:'a glass of',meaning:'コップ一杯の',emoji:'🥛',example:'A glass of water, please.'}];

const idiom4Data=[{phrase:'look forward to',meaning:'〜を楽しみにする',emoji:'😊',example:'I look forward to seeing you.'},{phrase:'get along with',meaning:'〜と仲良くする',emoji:'🤝',example:'I get along with my classmates.'},{phrase:'take care of',meaning:'〜の世話をする',emoji:'👶',example:'She takes care of her dog.'},{phrase:'run out of',meaning:'〜を使い果たす',emoji:'😰',example:'We ran out of milk.'},{phrase:'put off',meaning:'延期する',emoji:'📅',example:"Don't put off your homework."},{phrase:'pick up',meaning:'拾う',emoji:'🤲',example:'Pick up the trash, please.'},{phrase:'give up',meaning:'あきらめる',emoji:'🏳️',example:'Never give up your dreams!'},{phrase:'come true',meaning:'実現する',emoji:'⭐',example:'My dream came true!'},{phrase:'be interested in',meaning:'〜に興味がある',emoji:'🔎',example:"I'm interested in science."},{phrase:'be afraid of',meaning:'〜を怖がる',emoji:'😨',example:'She is afraid of spiders.'},{phrase:'be proud of',meaning:'〜を誇りに思う',emoji:'😤',example:"I'm proud of you!"},{phrase:'be surprised at',meaning:'〜に驚く',emoji:'😲',example:'I was surprised at the news.'},{phrase:'be known for',meaning:'〜で知られている',emoji:'🌟',example:'Japan is known for sushi.'},{phrase:'be different from',meaning:'〜と異なる',emoji:'↔️',example:'My idea is different from yours.'},{phrase:'be famous for',meaning:'〜で有名だ',emoji:'🏆',example:'Paris is famous for the Eiffel Tower.'},{phrase:'depend on',meaning:'〜に頼る',emoji:'🤞',example:'It depends on the weather.'},{phrase:'deal with',meaning:'〜を扱う',emoji:'🛠️',example:'We need to deal with this problem.'},{phrase:'hand in',meaning:'提出する',emoji:'📄',example:'Hand in your report by Friday.'},{phrase:'fill in',meaning:'記入する',emoji:'✍️',example:'Fill in the blanks.'},{phrase:'find out',meaning:'見つけ出す',emoji:'🔍',example:'I found out the truth.'},{phrase:'figure out',meaning:'理解する',emoji:'🧠',example:'Can you figure out this puzzle?'},{phrase:'get over',meaning:'乗り越える',emoji:'🧗',example:"You'll get over it soon."},{phrase:'grow up',meaning:'成長する',emoji:'🌱',example:'What do you want to be when you grow up?'},{phrase:'hold on',meaning:'ちょっと待つ',emoji:'✋',example:'Hold on a minute, please.'},{phrase:'keep on',meaning:'〜し続ける',emoji:'➡️',example:'Keep on trying!'},{phrase:'make up',meaning:'仲直りする',emoji:'🤗',example:"Let's make up and be friends."},{phrase:'show up',meaning:'現れる',emoji:'👋',example:'He showed up late.'},{phrase:'work out',meaning:'うまくいく',emoji:'💪',example:'Things will work out fine.'},{phrase:'break down',meaning:'壊れる',emoji:'🔧',example:'My car broke down yesterday.'},{phrase:'calm down',meaning:'落ち着く',emoji:'🧘',example:'Calm down and think clearly.'},{phrase:'catch up',meaning:'追いつく',emoji:'🏃',example:'I need to catch up with you.'},{phrase:'check out',meaning:'確認する',emoji:'✅',example:'Check out this cool video!'},{phrase:'clean up',meaning:'片付ける',emoji:'🧹',example:'Clean up your room!'},{phrase:'cut down',meaning:'削減する',emoji:'✂️',example:'We should cut down on waste.'},{phrase:'drop by',meaning:'立ち寄る',emoji:'🏠',example:'Feel free to drop by anytime.'},{phrase:'end up',meaning:'結局〜になる',emoji:'🎯',example:'We ended up staying home.'},{phrase:'fall down',meaning:'転ぶ',emoji:'🤕',example:'Be careful not to fall down.'},{phrase:'hurry up',meaning:'急ぐ',emoji:'⏩',example:"Hurry up, we're late!"},{phrase:'line up',meaning:'並ぶ',emoji:'🧑‍🤝‍🧑',example:'Please line up here.'},{phrase:'point out',meaning:'指摘する',emoji:'👆',example:'She pointed out my mistake.'},{phrase:'set up',meaning:'準備する',emoji:'🏗️',example:"Let's set up the tent."},{phrase:'slow down',meaning:'スピードを落とす',emoji:'🐢',example:"Slow down, you're driving too fast!"},{phrase:'speak up',meaning:'はっきり言う',emoji:'📢',example:"Speak up, I can't hear you."},{phrase:'stay up',meaning:'起きている',emoji:'🌙',example:"Don't stay up too late."},{phrase:'throw away',meaning:'捨てる',emoji:'🗑️',example:'Throw away the garbage.'},{phrase:'try on',meaning:'試着する',emoji:'👗',example:'Can I try on this dress?'},{phrase:'write down',meaning:'書き留める',emoji:'📝',example:'Write down your answers.'},{phrase:'according to',meaning:'〜によると',emoji:'📰',example:'According to the news, it will rain.'},{phrase:'as usual',meaning:'いつものように',emoji:'🔄',example:'He arrived late, as usual.'},{phrase:'at once',meaning:'すぐに',emoji:'⚡',example:'Do it at once!'},{phrase:'by the way',meaning:'ところで',emoji:'💭',example:'By the way, have you eaten?'},{phrase:'due to',meaning:'〜のために',emoji:'📌',example:'The game was canceled due to rain.'},{phrase:'even though',meaning:'〜にもかかわらず',emoji:'🤷',example:'I went out even though it rained.'},{phrase:'for a while',meaning:'しばらくの間',emoji:'⏰',example:"Let's rest for a while."},{phrase:'in case',meaning:'〜の場合に備えて',emoji:'☂️',example:'Take an umbrella in case it rains.'},{phrase:'in common',meaning:'共通に',emoji:'🤝',example:'We have a lot in common.'},{phrase:'in general',meaning:'一般的に',emoji:'📊',example:'In general, students like sports.'},{phrase:'in the future',meaning:'将来',emoji:'🔮',example:'What do you want to be in the future?'},{phrase:'instead of',meaning:'〜の代わりに',emoji:'🔄',example:'I had tea instead of coffee.'},{phrase:'no matter',meaning:'〜に関係なく',emoji:'🤗',example:"No matter what, I'll support you."},{phrase:'on time',meaning:'時間通りに',emoji:'⏱️',example:'Please arrive on time.'},{phrase:'so far',meaning:'今のところ',emoji:'📈',example:'So far, everything is fine.'},{phrase:'the other day',meaning:'先日',emoji:'📅',example:'I saw her the other day.'},{phrase:'turn into',meaning:'〜に変わる',emoji:'🔄',example:'The caterpillar turned into a butterfly.'},{phrase:'used to',meaning:'以前は〜だった',emoji:'📸',example:'I used to live in Osaka.'},{phrase:'would like to',meaning:'〜したいのですが',emoji:'🙋',example:'I would like to order pizza.'},{phrase:'have been to',meaning:'〜に行ったことがある',emoji:'✈️',example:'I have been to France twice.'},{phrase:'had better',meaning:'〜した方がいい',emoji:'⚠️',example:'You had better go now.'},{phrase:'make sure',meaning:'確認する',emoji:'✅',example:'Make sure you lock the door.'},{phrase:'pay attention',meaning:'注意を払う',emoji:'👀',example:'Pay attention to the teacher.'},{phrase:'take part in',meaning:'〜に参加する',emoji:'🏅',example:'I took part in the contest.'},{phrase:'take place',meaning:'行われる',emoji:'📍',example:'The festival takes place in August.'},{phrase:'make a mistake',meaning:'間違える',emoji:'❌',example:'Everyone makes mistakes.'},{phrase:'make friends',meaning:'友達になる',emoji:'👫',example:'I made friends at camp.'},{phrase:"do one's best",meaning:'全力を尽くす',emoji:'🔥',example:"I'll do my best!"},{phrase:'be worried about',meaning:'〜を心配する',emoji:'😟',example:"I'm worried about the test."},{phrase:'be excited about',meaning:'〜にワクワクする',emoji:'🤩',example:"I'm excited about the trip!"},{phrase:'look up',meaning:'調べる',emoji:'📖',example:'Look up the word in the dictionary.'},{phrase:'turn out',meaning:'〜だと分かる',emoji:'💡',example:'It turned out to be true.'},{phrase:'go on',meaning:'続ける',emoji:'⏭️',example:'Please go on with your story.'},{phrase:'come up with',meaning:'〜を思いつく',emoji:'💡',example:'She came up with a great idea.'},{phrase:'get rid of',meaning:'〜を取り除く',emoji:'🗑️',example:'I want to get rid of this old sofa.'},{phrase:'in other words',meaning:'言い換えれば',emoji:'🔄',example:'In other words, we need more time.'},{phrase:'little by little',meaning:'少しずつ',emoji:'🐌',example:"Little by little, I'm improving."},{phrase:'once in a while',meaning:'たまに',emoji:'🎲',example:'I eat out once in a while.'},{phrase:'sooner or later',meaning:'遅かれ早かれ',emoji:'⏰',example:"Sooner or later, you'll understand."},{phrase:'take a look',meaning:'見てみる',emoji:'👁️',example:'Take a look at this photo.'},{phrase:"what's wrong",meaning:'どうしたの？',emoji:'❓',example:"What's wrong with you?"},{phrase:'by oneself',meaning:'一人で',emoji:'🧑',example:'She lives by herself.'},{phrase:'all over the world',meaning:'世界中で',emoji:'🌎',example:'It is popular all over the world.'},{phrase:'day by day',meaning:'日に日に',emoji:'📈',example:"It's getting warmer day by day."},{phrase:'at the same time',meaning:'同時に',emoji:'⏱️',example:'We arrived at the same time.'},{phrase:'first of all',meaning:'まず第一に',emoji:'1️⃣',example:'First of all, let me introduce myself.'},{phrase:'on the other hand',meaning:'一方で',emoji:'🤚',example:'On the other hand, it could be fun.'}];

const idiom3Data=[{phrase:'as a matter of fact',meaning:'実際のところ',emoji:'📋',example:'As a matter of fact, I agree with you.'},{phrase:'in spite of',meaning:'〜にもかかわらず',emoji:'💪',example:'In spite of the rain, we went hiking.'},{phrase:'make sense',meaning:'意味が分かる',emoji:'🧠',example:'Does this sentence make sense?'},{phrase:'on purpose',meaning:'わざと',emoji:'🎯',example:'He did it on purpose.'},{phrase:'be supposed to',meaning:'〜することになっている',emoji:'📋',example:'You are supposed to be at school.'},{phrase:'in advance',meaning:'前もって',emoji:'📅',example:'Book your ticket in advance.'},{phrase:'by accident',meaning:'偶然に',emoji:'🎲',example:'I found this by accident.'},{phrase:'as soon as',meaning:'〜するとすぐに',emoji:'⚡',example:'Call me as soon as you arrive.'},{phrase:'in order to',meaning:'〜するために',emoji:'🎯',example:'I study hard in order to pass the test.'},{phrase:'not only... but also',meaning:'〜だけでなく…も',emoji:'➕',example:'She is not only smart but also kind.'},{phrase:'no longer',meaning:'もはや〜ない',emoji:'🚫',example:'He no longer lives here.'},{phrase:'right away',meaning:'すぐに',emoji:'⚡',example:"I'll do it right away!"},{phrase:'after all',meaning:'結局',emoji:'🤔',example:"After all, it wasn't so bad."},{phrase:'in the meantime',meaning:'その間に',emoji:'⏳',example:"In the meantime, let's have lunch."},{phrase:'at the moment',meaning:'現在',emoji:'📍',example:"I'm busy at the moment."},{phrase:'from time to time',meaning:'時々',emoji:'🔄',example:'I visit my grandparents from time to time.'},{phrase:'for the time being',meaning:'当分の間',emoji:'⏰',example:"For the time being, let's wait."},{phrase:'on behalf of',meaning:'〜を代表して',emoji:'🎤',example:'I speak on behalf of the team.'},{phrase:'with regard to',meaning:'〜に関して',emoji:'📝',example:'With regard to your question, I agree.'},{phrase:'for good',meaning:'永遠に',emoji:'♾️',example:'He left the country for good.'},{phrase:'get used to',meaning:'〜に慣れる',emoji:'🔄',example:'I got used to waking up early.'},{phrase:'come across',meaning:'偶然見つける',emoji:'🔎',example:'I came across an old photo.'},{phrase:'carry out',meaning:'実行する',emoji:'✅',example:'We carried out the plan successfully.'},{phrase:'bring about',meaning:'引き起こす',emoji:'🌊',example:'Technology brings about big changes.'},{phrase:'break out',meaning:'勃発する',emoji:'💥',example:'A fire broke out in the building.'},{phrase:'call off',meaning:'中止する',emoji:'❌',example:'The game was called off.'},{phrase:'keep up with',meaning:'〜についていく',emoji:'🏃',example:"I can't keep up with the class."},{phrase:'make up for',meaning:'〜を埋め合わせる',emoji:'🔧',example:"I'll make up for lost time."},{phrase:'put up with',meaning:'〜を我慢する',emoji:'😤',example:"I can't put up with this noise."},{phrase:'run into',meaning:'偶然出会う',emoji:'👀',example:'I ran into my old friend.'},{phrase:'stand for',meaning:'〜を意味する',emoji:'🔤',example:'What does NASA stand for?'},{phrase:'take advantage of',meaning:'〜を利用する',emoji:'🎯',example:'Take advantage of this opportunity.'},{phrase:'take for granted',meaning:'当然と思う',emoji:'🤷',example:"Don't take your family for granted."},{phrase:'turn down',meaning:'断る',emoji:'🙅',example:'She turned down the offer.'},{phrase:'turn up',meaning:'現れる',emoji:'🔊',example:'He turned up late to the meeting.'},{phrase:'be likely to',meaning:'〜しそうだ',emoji:'📊',example:'It is likely to rain tomorrow.'},{phrase:'be willing to',meaning:'喜んで〜する',emoji:'😊',example:"I'm willing to help you."},{phrase:'be worth',meaning:'〜の価値がある',emoji:'💎',example:'This book is worth reading.'},{phrase:'be responsible for',meaning:'〜に責任がある',emoji:'🏋️',example:'You are responsible for your actions.'},{phrase:'be based on',meaning:'〜に基づいている',emoji:'📚',example:'This movie is based on a true story.'},{phrase:'be concerned about',meaning:'〜を心配している',emoji:'😟',example:"I'm concerned about the environment."},{phrase:'be familiar with',meaning:'〜をよく知っている',emoji:'🧠',example:"I'm familiar with this area."},{phrase:'be involved in',meaning:'〜に関わっている',emoji:'🤝',example:'He is involved in many projects.'},{phrase:'be related to',meaning:'〜に関連がある',emoji:'🔗',example:'These problems are related to each other.'},{phrase:'be satisfied with',meaning:'〜に満足している',emoji:'😌',example:"I'm satisfied with the result."},{phrase:'contribute to',meaning:'〜に貢献する',emoji:'🤲',example:'Exercise contributes to good health.'},{phrase:'focus on',meaning:'〜に集中する',emoji:'🎯',example:'Focus on your goals.'},{phrase:'refer to',meaning:'〜を参照する',emoji:'📖',example:'Please refer to page 5.'},{phrase:'result in',meaning:'〜という結果になる',emoji:'➡️',example:'Hard work results in success.'},{phrase:'suffer from',meaning:'〜に苦しむ',emoji:'😣',example:'She suffers from headaches.'},{phrase:'to begin with',meaning:'まず第一に',emoji:'1️⃣',example:'To begin with, let me explain the rules.'},{phrase:'to be honest',meaning:'正直に言うと',emoji:'🤫',example:"To be honest, I don't like it."},{phrase:'so to speak',meaning:'いわば',emoji:'💬',example:'He is, so to speak, a walking dictionary.'},{phrase:'needless to say',meaning:'言うまでもなく',emoji:'🤐',example:'Needless to say, health is important.'},{phrase:'as far as',meaning:'〜する限り',emoji:'🔭',example:"As far as I know, he's fine."},{phrase:'as long as',meaning:'〜する限り',emoji:'📏',example:"You can go as long as you're back by 5."},{phrase:'even if',meaning:'たとえ〜でも',emoji:'🤷',example:"I'll go even if it rains."},{phrase:'as if',meaning:'まるで〜のように',emoji:'🎭',example:'He talks as if he knows everything.'},{phrase:'provided that',meaning:'〜という条件で',emoji:'📋',example:'You can go provided that you finish.'},{phrase:'rather than',meaning:'〜よりもむしろ',emoji:'⚖️',example:"I'd rather stay home than go out."},{phrase:'other than',meaning:'〜以外の',emoji:'🚫',example:'I have nothing other than my phone.'},{phrase:'thanks to',meaning:'〜のおかげで',emoji:'🙏',example:'Thanks to your help, I passed!'},{phrase:'in terms of',meaning:'〜の点で',emoji:'📐',example:"In terms of price, it's good."},{phrase:'in addition to',meaning:'〜に加えて',emoji:'➕',example:'In addition to English, she speaks French.'},{phrase:'as a result',meaning:'結果として',emoji:'📊',example:'As a result, we won the game!'},{phrase:'on the contrary',meaning:'それどころか',emoji:'↕️',example:'On the contrary, I love it!'},{phrase:'all of a sudden',meaning:'突然',emoji:'⚡',example:'All of a sudden, it started raining.'},{phrase:'by all means',meaning:'ぜひとも',emoji:'🙌',example:'By all means, come to the party!'},{phrase:'for the most part',meaning:'大部分は',emoji:'📊',example:'For the most part, I agree.'},{phrase:'in the long run',meaning:'長い目で見ると',emoji:'🏃',example:"In the long run, it'll be worth it."},{phrase:'at any rate',meaning:'とにかく',emoji:'🗣️',example:"At any rate, let's try."},{phrase:'on the whole',meaning:'概して',emoji:'🌐',example:'On the whole, it was a good day.'},{phrase:'to some extent',meaning:'ある程度',emoji:'📏',example:'I agree to some extent.'},{phrase:'in particular',meaning:'特に',emoji:'⭐',example:'I like fruits, in particular, apples.'},{phrase:'by no means',meaning:'決して〜ない',emoji:'❌',example:'This is by no means easy.'},{phrase:'at all costs',meaning:'どんな犠牲を払っても',emoji:'💰',example:'We must win at all costs.'},{phrase:'on second thought',meaning:'考え直して',emoji:'🤔',example:"On second thought, let's stay home."},{phrase:'come to terms with',meaning:'〜を受け入れる',emoji:'🤝',example:'She came to terms with the situation.'},{phrase:'keep in mind',meaning:'心に留めておく',emoji:'🧠',example:'Keep in mind that time is limited.'},{phrase:'make a difference',meaning:'違いを生む',emoji:'🌟',example:'Your help really makes a difference.'},{phrase:'take into account',meaning:'〜を考慮する',emoji:'🔍',example:'Take all factors into account.'},{phrase:'in no time',meaning:'あっという間に',emoji:'⚡',example:"We'll be there in no time!"},{phrase:'once and for all',meaning:'きっぱりと',emoji:'🏁',example:'Let\u0027s settle this once and for all.'},{phrase:'more or less',meaning:'だいたい',emoji:'📏',example:'I more or less understand it.'},{phrase:'time and again',meaning:'何度も',emoji:'🔄',example:"I've told you time and again!"},{phrase:'from scratch',meaning:'ゼロから',emoji:'📄',example:'We built it from scratch.'},{phrase:'ahead of time',meaning:'予定より早く',emoji:'⏰',example:'We finished ahead of time.'},{phrase:'side by side',meaning:'並んで',emoji:'👯',example:'They walked side by side.'},{phrase:'step by step',meaning:'一歩一歩',emoji:'👣',example:'Take it step by step.'},{phrase:'up to date',meaning:'最新の',emoji:'📱',example:'Keep your software up to date.'},{phrase:'pros and cons',meaning:'賛否両論',emoji:'⚖️',example:'Let\u0027s discuss the pros and cons.'},{phrase:'back and forth',meaning:'行ったり来たり',emoji:'↔️',example:'He walked back and forth nervously.'},{phrase:'now and then',meaning:'時々',emoji:'🎲',example:'I visit Tokyo now and then.'},{phrase:'hand in hand',meaning:'手を取り合って',emoji:'🤝',example:'They walked hand in hand.'},{phrase:'out of the question',meaning:'問題外だ',emoji:'🚫',example:'That idea is out of the question.'},{phrase:'out of order',meaning:'故障中',emoji:'🔧',example:'The elevator is out of order.'},{phrase:'at stake',meaning:'危機にある',emoji:'⚠️',example:'A lot is at stake in this game.'}];

// ======== ユーティリティ ========
const getQuestionsByGrade=(g)=>({5:grade5Questions,4:grade4Questions,3:grade3Questions}[g]||grade5Questions);
const getIdiomByGrade=(g)=>({5:idiom5Data,4:idiom4Data,3:idiom3Data}[g]||idiom5Data);
const shuffleArray=(a)=>{const s=[...a];for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;};
const shuffleOptions=(q)=>{const o=q.options.map((t,i)=>({text:t,isCorrect:i===q.answer}));const s=shuffleArray(o);return{...q,options:s.map(x=>x.text),answer:s.findIndex(x=>x.isCorrect)};};
const getRandomQuestions=(g,c=10)=>shuffleArray(getQuestionsByGrade(g)).slice(0,c).map(q=>shuffleOptions(q));
const GAME_STATES={MENU:'menu',PLAYING:'playing',RESULT:'result',IDIOM_MENU:'idiom_menu',IDIOM_LEARN:'idiom_learn',IDIOM_TEST:'idiom_test',IDIOM_RESULT:'idiom_result'};
const gradeColors={5:'#00d9ff',4:'#ffd93d',3:'#ff6b9d'};
const optLabels=['A','B','C','D'];

// ======== ユーティリティ（音声再生）========
let cachedEnVoice = null;

const findEnglishNativeVoice = () => {
  if (cachedEnVoice) return cachedEnVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // 優先順位: en-US > en-GB > en-AU > その他en
  // ネイティブ(localService)を優先、Google/Microsoftの高品質音声も可
  const preferred = [
    // iOS/macOS の高品質英語音声
    v => v.lang === 'en-US' && /samantha|ava|tom|alex/i.test(v.name),
    // Google の英語音声
    v => v.lang === 'en-US' && /google/i.test(v.name),
    // Microsoft の英語音声
    v => v.lang === 'en-US' && /microsoft/i.test(v.name),
    // en-US のローカル音声
    v => v.lang === 'en-US' && v.localService,
    // en-US の任意の音声
    v => v.lang === 'en-US',
    // en-GB のローカル音声
    v => v.lang === 'en-GB' && v.localService,
    // en-GB の任意の音声
    v => v.lang === 'en-GB',
    // en- で始まる任意の音声
    v => v.lang.startsWith('en-') && v.localService,
    v => v.lang.startsWith('en'),
  ];
  for (const test of preferred) {
    const found = voices.find(test);
    if (found) { cachedEnVoice = found; return found; }
  }
  return null;
};

// 音声リストは非同期で読み込まれるため、変更時にキャッシュ更新
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedEnVoice = null;
  };
}

const playSound = (text, lang = 'en-US') => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    const voice = findEnglishNativeVoice();
    if (voice) utterance.voice = voice;
    utterance.onerror = () => {};
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
};

let sharedAudioContext = null;
const getAudioContext = () => {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioContext;
};

const playErrorSound = () => {
  try {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {}
};

// ======== 共有コンポーネント ========
const Mascot=({emotion='happy',message=''})=>{
  const faces={happy:'(◕‿◕)',excited:'(★‿★)',thinking:'(◔_◔)',sad:'(╥_╥)'};
  return(<div className="flex flex-col items-center gap-2"><div className="relative"><div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{background:emotion==='sad'?'linear-gradient(135deg,#6b7280,#9ca3af)':'linear-gradient(135deg,#ff6b9d,#c44eff)',animation:emotion==='excited'?'bounce 0.5s infinite':'float 3s ease-in-out infinite',boxShadow:'0 10px 30px rgba(196,78,255,0.4)'}}><span className="text-2xl text-white" style={{textShadow:'0 2px 4px rgba(0,0,0,0.3)'}}>{faces[emotion]}</span></div></div>{message&&<div className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg relative"><div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"/>{message}</div>}</div>);
};
const ComboEffect=({combo})=>{if(combo<2)return null;return(<div className="fixed top-1/4 right-4 flex flex-col items-center z-50" style={{animation:'pop 0.3s ease-out'}}><span className="text-6xl font-black" style={{fontFamily:"'Dela Gothic One',sans-serif",background:'linear-gradient(45deg,#ff6b9d,#ffd93d,#00f5d4,#c44eff)',backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'rainbow 2s ease infinite'}}>{combo}</span><span className="text-2xl font-black" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#ffd93d'}}>COMBO!</span></div>);};
const ConfirmDialog=({isOpen,onConfirm,onCancel})=>{if(!isOpen)return null;return(<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"><div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 text-center" style={{animation:'pop 0.3s ease'}}><div className="text-4xl mb-4">🤔</div><h3 className="text-xl font-bold text-white mb-2">ゲームを終了しますか？</h3><p className="text-gray-400 mb-6">現在の進行状況は保存されません</p><div className="flex gap-3"><button className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-600 hover:bg-gray-500 transition-all" onClick={onCancel}>続ける</button><button className="flex-1 py-3 rounded-xl font-bold text-white transition-all" style={{background:'linear-gradient(135deg,#ff6b6b,#ff8e53)'}} onClick={onConfirm}>終了する</button></div></div></div>);};

// ======== メインメニュー ========
const MainMenu=({onStartGame,onIdiomSection,onReviewSection,highScores,saveData,daily})=>{
  const[selectedGrade,setSelectedGrade]=useState(null);
  const grades=[{level:5,name:'5級',desc:'小学校高学年〜中1',color:'#00d9ff',emoji:'🌟',q:grade5Questions.length},{level:4,name:'4級',desc:'中学2年レベル',color:'#ffd93d',emoji:'⭐',q:grade4Questions.length},{level:3,name:'3級',desc:'中学卒業レベル',color:'#ff6b9d',emoji:'💫',q:grade3Questions.length}];
  const level = saveData?.level || 1;
  const totalXP = saveData?.totalXP || 0;
  const streak = saveData?.streak || { current: 0, best: 0 };
  const wrongCount = saveData?.wrongHistory?.length || 0;
  const gradeNames = {5:'5級',4:'4級',3:'3級'};

  return(
    <div className="min-h-screen p-6 flex flex-col items-center gap-6" style={{background:'radial-gradient(circle at 20% 20%,rgba(196,78,255,0.15) 0%,transparent 40%),radial-gradient(circle at 80% 80%,rgba(255,107,157,0.15) 0%,transparent 40%),linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)'}}>
      {/* タイトル */}
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="flex flex-wrap justify-center gap-2" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>
          <span className="text-5xl md:text-6xl" style={{background:'linear-gradient(135deg,#00d9ff,#00f5d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 20px rgba(0,217,255,0.5))'}}>英検</span>
          <span className="text-5xl md:text-6xl" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 20px rgba(255,107,157,0.5))'}}>クエスト</span>
        </h1>
        <Mascot emotion="happy" message="さあ、チャレンジしよう！"/>
      </div>

      {/* プレイヤーステータス */}
      <div className="w-full max-w-3xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4" style={{background:'rgba(37,37,66,0.8)',backdropFilter:'blur(10px)'}}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black" style={{background:'linear-gradient(135deg,#ffd93d,#ff8e53)',fontFamily:"'Dela Gothic One',sans-serif",color:'#1a1a2e'}}>
            {level}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">レベル {level}</span>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${xpProgress(totalXP)}%`,background:'linear-gradient(90deg,#ffd93d,#ff8e53)'}} />
            </div>
            <span className="text-[10px] text-gray-500">{xpToNextLevel(totalXP)} XP to next</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {streak.current > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{background:'rgba(255,107,157,0.2)'}}>
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold" style={{color:'#ff6b9d'}}>{streak.current}日</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{background:'rgba(255,217,61,0.2)'}}>
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold" style={{color:'#ffd93d'}}>{totalXP.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* デイリーチャレンジ */}
      {daily && !daily.completed && (
        <button className="w-full max-w-3xl rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer" style={{background:'linear-gradient(135deg,rgba(255,217,61,0.15),rgba(255,142,83,0.15))',border:'2px solid rgba(255,217,61,0.3)',animation:'glow 2s ease-in-out infinite'}} onClick={()=>onStartGame(daily.grade)}>
          <span className="text-4xl">🎯</span>
          <div className="flex-1">
            <div className="text-lg font-black text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>今日のチャレンジ</div>
            <div className="text-sm text-gray-400">{gradeNames[daily.grade]}に挑戦してボーナスXPをゲット！</div>
          </div>
          <span className="text-2xl">→</span>
        </button>
      )}
      {daily && daily.completed && (
        <div className="w-full max-w-3xl rounded-2xl p-4 flex items-center gap-4" style={{background:'rgba(107,255,142,0.1)',border:'2px solid rgba(107,255,142,0.3)'}}>
          <span className="text-3xl">✅</span>
          <div><span className="text-white font-bold">今日のチャレンジ完了！</span><span className="text-gray-400 text-sm ml-2">明日もがんばろう！</span></div>
        </div>
      )}

      {/* 級選択 */}
      <div className="w-full max-w-3xl">
        <h2 className="text-xl text-gray-400 text-center mb-5" style={{fontFamily:"'M PLUS Rounded 1c',sans-serif"}}>レベルを選択</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {grades.map((g,i)=>(<button key={g.level} className="relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 flex flex-col items-center gap-2" style={{background:'linear-gradient(135deg,#252542 0%,#1a1a2e 100%)',borderColor:selectedGrade===g.level?g.color:'transparent',borderWidth:'3px',borderStyle:'solid',boxShadow:selectedGrade===g.level?`0 0 40px ${g.color}40`:'0 4px 20px rgba(0,0,0,0.3)',transform:selectedGrade===g.level?'scale(1.05)':'scale(1)',animation:'slideUp 0.5s ease forwards',animationDelay:`${i*0.1}s`}} onClick={()=>setSelectedGrade(g.level)}>
            <span className="text-5xl">{g.emoji}</span>
            <span className="text-3xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:g.color}}>{g.name}</span>
            <span className="text-sm text-gray-400">{g.desc}</span>
            <span className="text-xs text-gray-500">📝 {g.q}問収録</span>
            {highScores[g.level]>0&&<span className="px-3 py-1 rounded-full text-sm font-bold" style={{background:'rgba(255,217,61,0.2)',color:'#ffd93d'}}>🏆 {highScores[g.level]}</span>}
          </button>))}
        </div>
      </div>
      {selectedGrade&&<button className="flex items-center gap-4 px-12 py-5 rounded-full cursor-pointer transition-all duration-300 hover:scale-105" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)',boxShadow:'0 10px 40px rgba(196,78,255,0.4)',animation:'pop 0.3s ease'}} onClick={()=>onStartGame(selectedGrade)}><span className="text-2xl text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>ゲームスタート！</span><span className="text-3xl">🚀</span></button>}

      {/* サブメニュー */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button className="flex items-center gap-3 px-8 py-4 rounded-full cursor-pointer transition-all duration-300 hover:scale-105" style={{background:'linear-gradient(135deg,#ffd93d,#ff8e53)',boxShadow:'0 10px 40px rgba(255,142,83,0.3)'}} onClick={onIdiomSection}>
          <span className="text-2xl">📚</span><span className="text-lg text-gray-900 font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>熟語マスター</span>
        </button>
        {wrongCount > 0 && (
          <button className="flex items-center gap-3 px-8 py-4 rounded-full cursor-pointer transition-all duration-300 hover:scale-105" style={{background:'linear-gradient(135deg,#ff6b6b,#ff8e53)',boxShadow:'0 10px 40px rgba(255,107,107,0.3)'}} onClick={onReviewSection}>
            <span className="text-2xl">🔄</span><span className="text-lg text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>復習 ({wrongCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ======== ゲーム画面 ========
const GameScreen=({grade,onGameEnd,onExit,onWrong,reviewQuestions})=>{
  const[questions,setQuestions]=useState([]);const[ci,setCi]=useState(0);const[score,setScore]=useState(0);const[combo,setCombo]=useState(0);const[maxCombo,setMaxCombo]=useState(0);const[timeLeft,setTimeLeft]=useState(15);const[cc,setCc]=useState(0);const[showHint,setShowHint]=useState(false);const[fb,setFb]=useState(null);const[me,setMe]=useState('thinking');const[mm,setMm]=useState('がんばれ〜！');const[showExit,setShowExit]=useState(false);const tRef=useRef(null);const handleAnswerRef=useRef(null);
  const color=gradeColors[grade];
  useEffect(()=>{
    if (reviewQuestions && reviewQuestions.length > 0) {
      const shuffled = shuffleArray([...reviewQuestions]).slice(0, 10);
      setQuestions(shuffled);
    } else {
      setQuestions(getRandomQuestions(grade,10));
    }
  },[grade]);
  const handleAnswer=useCallback((si)=>{
    if(fb!==null)return;clearInterval(tRef.current);const cq=questions[ci];const ok=si===cq.answer;
    if(ok){const pts=100+Math.floor(timeLeft*10)+combo*50;setScore(p=>p+pts);setCombo(p=>p+1);setMaxCombo(p=>Math.max(p,combo+1));setCc(p=>p+1);setFb({type:'correct',points:pts});const ms=['すごい！','ナイス！','完璧！','その調子！','天才！'];setMm(ms[Math.floor(Math.random()*ms.length)]);setMe(combo>=2?'excited':'happy');playCorrectChime();setTimeout(()=>playSound(cq.options[cq.answer]),300);}
    else{setCombo(0);setFb({type:'wrong',correctAnswer:cq.options[cq.answer]});setMm('ドンマイ！');setMe('sad');playErrorSound();setTimeout(()=>playSound(cq.options[cq.answer]),500);if(onWrong)onWrong(cq);}
    setTimeout(()=>{setFb(null);setShowHint(false);setMe('thinking');setMm('');if(ci+1>=questions.length){onGameEnd({score:ok?score+100+Math.floor(timeLeft*10)+combo*50:score,correctCount:ok?cc+1:cc,maxCombo:Math.max(maxCombo,ok?combo+1:maxCombo),totalQuestions:questions.length});}else{setCi(p=>p+1);setTimeLeft(15);}},ok?1500:3000);
  },[ci,questions,score,combo,maxCombo,cc,timeLeft,fb,onGameEnd]);
  handleAnswerRef.current=handleAnswer;
  useEffect(()=>{if(!questions.length)return;tRef.current=setInterval(()=>{setTimeLeft(p=>{if(p<=1){handleAnswerRef.current(-1);return 15;}return p-1;});},1000);return()=>clearInterval(tRef.current);},[ci,questions.length]);
  if(!questions.length)return<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  const cq=questions[ci];const prog=((ci+1)/questions.length)*100;const tc=timeLeft<=5?'#ff6b6b':timeLeft<=10?'#ffd93d':'#6bff8e';
  return(
    <div className="min-h-screen p-4" style={{background:`radial-gradient(circle at 30% 70%,${color}15 0%,transparent 50%),linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)`}}>
      <ComboEffect combo={combo}/>
      <ConfirmDialog isOpen={showExit} onConfirm={onExit} onCancel={()=>{setShowExit(false);clearInterval(tRef.current);tRef.current=setInterval(()=>{setTimeLeft(p=>{if(p<=1){handleAnswerRef.current(-1);return 15;}return p-1;});},1000);}}/>
      <div className="flex justify-between items-center p-4 rounded-2xl mb-6" style={{background:'rgba(37,37,66,0.8)'}}>
        <button className="p-2 rounded-xl hover:bg-white/10 transition-all mr-2" onClick={()=>{clearInterval(tRef.current);setShowExit(true);}}><span className="text-2xl">←</span></button>
        <div className="flex items-center gap-4"><div className="px-4 py-2 rounded-full text-lg font-bold" style={{background:color,color:'#1a1a2e',fontFamily:"'Dela Gothic One',sans-serif"}}>{grade}級</div><div className="flex flex-col"><span className="text-xs text-gray-400">SCORE</span><span className="text-2xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#ffd93d'}}>{score.toLocaleString()}</span></div></div>
        <div className="flex-1 max-w-xs mx-4"><div className="text-center text-sm text-gray-400 mb-2">{ci+1}/{questions.length}</div><div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{width:`${prog}%`,background:`linear-gradient(90deg,${color},#c44eff)`}}/></div></div>
        <div className="relative w-14 h-14"><svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#252542" strokeWidth="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={tc} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(timeLeft/15)*100},100`} className="transition-all duration-1000"/></svg><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:tc}}>{timeLeft}</span></div>
      </div>
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_auto] gap-6">
        <div className="flex flex-col gap-5">
          <div className={`rounded-2xl p-6 text-center border-2 transition-all ${fb?.type==='correct'?'border-green-400':fb?.type==='wrong'?'border-red-400':'border-gray-600'}`} style={{background:'rgba(37,37,66,0.9)',animation:fb?.type==='wrong'?'shake 0.5s ease':undefined}}>
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold mb-4" style={{background:color,color:'#1a1a2e'}}>{cq.type==='vocab'?'単語':cq.type==='grammar'?'文法':'表現'}</span>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">{cq.question}</h2>
            {showHint&&<div className="mt-4 px-5 py-3 rounded-xl text-base" style={{background:'rgba(255,217,61,0.15)',border:'1px solid rgba(255,217,61,0.3)',color:'#ffd93d'}}>💡 ヒント: {cq.hint}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">{cq.options.map((o,i)=>(<button key={i} className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:-translate-y-1" style={{background:fb&&i===cq.answer?'rgba(107,255,142,0.15)':'rgba(37,37,66,0.9)',borderColor:fb&&i===cq.answer?'#6bff8e':'#4b5563',color:color}} onClick={()=>handleAnswer(i)} disabled={fb!==null}><span className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{background:color,color:'#1a1a2e',fontFamily:"'Dela Gothic One',sans-serif"}}>{optLabels[i]}</span><span className="text-lg text-white">{o}</span></button>))}</div>
          {!showHint&&!fb&&<button className="px-5 py-3 rounded-xl text-sm text-gray-400 border-2 border-dashed border-gray-600 hover:border-yellow-400 hover:text-yellow-400 transition-all" onClick={()=>setShowHint(true)}>💡 ヒントを見る</button>}
        </div>
        <div className="flex flex-col items-center gap-5 md:order-none order-first"><Mascot emotion={me} message={mm}/>{combo>=2&&<div className="px-5 py-3 rounded-xl flex flex-col items-center" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)'}}><span className="text-xs text-white/80">COMBO</span><span className="text-2xl text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>×{combo}</span></div>}</div>
      </div>
      {fb&&<div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"><div className="flex flex-col items-center gap-3" style={{animation:'pop 0.3s ease'}}><div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold" style={{background:fb.type==='correct'?'#6bff8e':'#ff6b6b',color:fb.type==='correct'?'#1a1a2e':'white',boxShadow:`0 0 40px ${fb.type==='correct'?'rgba(107,255,142,0.6)':'rgba(255,107,107,0.6)'}`}}>{fb.type==='correct'?'✓':'✗'}</div><span className="text-3xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:fb.type==='correct'?'#6bff8e':'#ff6b6b'}}>{fb.type==='correct'?'正解!':'不正解...'}</span>{fb.type==='correct'?<span className="text-2xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#ffd93d'}}>+{fb.points}pt</span>:<div className="flex flex-col items-center gap-2 mt-2" style={{animation:'slideUp 0.3s ease 0.2s both'}}><span className="text-sm text-gray-400">正解は</span><span className="text-2xl px-6 py-3 rounded-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#6bff8e',background:'rgba(107,255,142,0.15)',border:'2px solid #6bff8e',boxShadow:'0 0 20px rgba(107,255,142,0.3)'}}>{fb.correctAnswer}</span></div>}</div></div>}
    </div>
  );
};

// ======== リザルト画面 ========
const ResultScreen=({result,grade,onRetry,onMenu,highScore,title='結果発表',xpEarned=0,saveData})=>{
  const[sd,setSd]=useState(false);const inh=result.score>highScore;const acc=Math.round((result.correctCount/result.totalQuestions)*100);
  const getRank=()=>{if(acc>=90)return{rank:'S',color:'#ffd93d',msg:'素晴らしい！完璧に近い！'};if(acc>=70)return{rank:'A',color:'#6bff8e',msg:'すごい！よくできました！'};if(acc>=50)return{rank:'B',color:'#00d9ff',msg:'がんばりました！'};if(acc>=30)return{rank:'C',color:'#c44eff',msg:'もう少し練習しよう！'};return{rank:'D',color:'#ff6b6b',msg:'次はもっとがんばろう！'};};
  const{rank,color,msg}=getRank();
  useEffect(()=>{const t=setTimeout(()=>setSd(true),500);return()=>clearTimeout(t);},[]);
  return(
    <div className="min-h-screen p-6 flex flex-col items-center justify-center" style={{background:'radial-gradient(circle at 50% 30%,rgba(255,217,61,0.1) 0%,transparent 50%),linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)'}}>
      {inh&&<div className="px-10 py-4 rounded-full text-2xl text-white font-bold mb-8" style={{fontFamily:"'Dela Gothic One',sans-serif",background:'linear-gradient(90deg,#ff6b9d,#ffd93d,#00f5d4,#c44eff,#ff6b9d)',backgroundSize:'400% 100%',animation:'rainbow 3s linear infinite'}}>🎉 NEW HIGH SCORE! 🎉</div>}
      <div className="rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-8" style={{background:'rgba(37,37,66,0.95)',boxShadow:'0 20px 60px rgba(0,0,0,0.4)',animation:'slideUp 0.5s ease'}}>
        <h1 className="text-3xl" style={{fontFamily:"'Dela Gothic One',sans-serif",background:'linear-gradient(135deg,#ff6b9d,#c44eff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{title}</h1>
        <div className="flex flex-col items-center gap-4"><div className="w-28 h-28 rounded-full flex items-center justify-center" style={{background:`linear-gradient(135deg,${color},${color}99)`,boxShadow:`0 0 50px ${color}80`,animation:'pop 0.5s ease'}}><span className="text-6xl text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>{rank}</span></div><p className="text-lg text-gray-400">{msg}</p></div>
        <Mascot emotion={acc>=70?'excited':acc>=50?'happy':'sad'} message={acc>=70?'最高！':acc>=50?'いい感じ！':'また挑戦しよう！'}/>
        {sd&&<>
          <div className="grid grid-cols-2 gap-5 w-full" style={{animation:'slideUp 0.5s ease 0.3s both'}}>{[{label:'スコア',value:result.score.toLocaleString(),c:'#ffd93d'},{label:'正解数',value:`${result.correctCount}/${result.totalQuestions}`,c:'white'},{label:'正解率',value:`${acc}%`,c:'white'},{label:'最大コンボ',value:`${result.maxCombo}×`,c:'#ff6b9d'}].map((s,i)=>(<div key={i} className="rounded-xl p-5 flex flex-col items-center gap-2" style={{background:'rgba(15,15,26,0.5)'}}><span className="text-sm text-gray-400">{s.label}</span><span className="text-2xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:s.c}}>{s.value}</span></div>))}</div>
          {saveData && (
            <div className="w-full rounded-xl p-4 flex items-center gap-4" style={{background:'rgba(255,217,61,0.1)',border:'1px solid rgba(255,217,61,0.2)',animation:'slideUp 0.5s ease 0.5s both'}}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{background:'linear-gradient(135deg,#ffd93d,#ff8e53)',color:'#1a1a2e',fontFamily:"'Dela Gothic One',sans-serif"}}>{saveData.level}</div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1"><span style={{color:'#ffd93d'}}>+{xpEarned} XP</span><span className="text-gray-500">Lv.{saveData.level}</span></div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{width:`${xpProgress(saveData.totalXP)}%`,background:'linear-gradient(90deg,#ffd93d,#ff8e53)'}}/></div>
              </div>
            </div>
          )}
        </>}
        <div className="flex gap-5 w-full"><button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold text-white transition-all hover:-translate-y-1" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)'}} onClick={onRetry}><span>🔄</span><span>もう一度</span></button><button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold text-white border-2 border-white/20 bg-white/10 transition-all hover:-translate-y-1" onClick={onMenu}><span>🏠</span><span>メニュー</span></button></div>
      </div>
    </div>
  );
};

// ======== 熟語メニュー ========
const IdiomMenu=({onStartLearn,onStartTest,onBack})=>{
  const[sg,setSg]=useState(null);
  const grades=[{level:5,name:'5級',color:'#00d9ff',emoji:'🌈',count:idiom5Data.length,desc:'基本フレーズ'},{level:4,name:'4級',color:'#ffd93d',emoji:'⚡',count:idiom4Data.length,desc:'句動詞・イディオム'},{level:3,name:'3級',color:'#ff6b9d',emoji:'🔥',count:idiom3Data.length,desc:'高度な表現'}];
  return(
    <div className="min-h-screen p-6 flex flex-col items-center gap-8" style={{background:'radial-gradient(circle at 50% 20%,rgba(255,142,83,0.2) 0%,transparent 50%),radial-gradient(circle at 20% 80%,rgba(255,217,61,0.15) 0%,transparent 40%),linear-gradient(135deg,#1a0f2e 0%,#0f1a2e 100%)'}}>
      <button className="self-start p-3 rounded-xl hover:bg-white/10 transition-all text-2xl text-white" onClick={onBack}>← 戻る</button>
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-4xl md:text-5xl" style={{fontFamily:"'Dela Gothic One',sans-serif",background:'linear-gradient(135deg,#ffd93d,#ff8e53)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 20px rgba(255,142,83,0.5))'}}>📚 熟語マスター</h1>
        <p className="text-gray-400 text-lg">フラッシュカードで覚えて、テストで確認！</p>
        <Mascot emotion="excited" message="熟語をマスターしよう！"/>
      </div>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {grades.map((g,i)=>(<button key={g.level} className="rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer" style={{background:sg===g.level?`linear-gradient(135deg,${g.color}30,${g.color}10)`:'linear-gradient(135deg,#252542,#1a1a2e)',border:`3px solid ${sg===g.level?g.color:'transparent'}`,boxShadow:sg===g.level?`0 0 30px ${g.color}30`:'0 4px 20px rgba(0,0,0,0.3)',animation:'slideUp 0.5s ease forwards',animationDelay:`${i*0.15}s`}} onClick={()=>setSg(g.level)}>
            <span className="text-5xl">{g.emoji}</span>
            <span className="text-2xl font-black" style={{fontFamily:"'Dela Gothic One',sans-serif",color:g.color}}>{g.name}</span>
            <span className="text-sm text-gray-400">{g.desc}</span>
            <span className="text-xs text-gray-500">📝 {g.count}熟語収録</span>
          </button>))}
        </div>
      </div>
      {sg&&<div className="flex flex-col sm:flex-row gap-4" style={{animation:'pop 0.3s ease'}}>
        <button className="flex items-center gap-3 px-10 py-5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{background:'linear-gradient(135deg,#00d9ff,#00f5d4)',boxShadow:'0 10px 30px rgba(0,217,255,0.3)'}} onClick={()=>onStartLearn(sg)}>
          <span className="text-3xl">🎓</span><div className="flex flex-col items-start"><span className="text-xl text-gray-900 font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>学習モード</span><span className="text-xs text-gray-700">フラッシュカードで覚える</span></div>
        </button>
        <button className="flex items-center gap-3 px-10 py-5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)',boxShadow:'0 10px 30px rgba(196,78,255,0.3)'}} onClick={()=>onStartTest(sg)}>
          <span className="text-3xl">📝</span><div className="flex flex-col items-start"><span className="text-xl text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>テストモード</span><span className="text-xs text-white/70">実力を試す！</span></div>
        </button>
      </div>}
    </div>
  );
};

// ======== 熟語学習モード ========
const IdiomLearnMode=({grade,onExit,onFinish})=>{
  const idiomData=getIdiomByGrade(grade);
  const[batch,setBatch]=useState(0);const[phase,setPhase]=useState('flash');const[cardIdx,setCardIdx]=useState(0);const[flipped,setFlipped]=useState(false);const[qi,setQi]=useState(0);const[qfb,setQfb]=useState(null);const[bScore,setBScore]=useState(0);const[tScore,setTScore]=useState(0);const[tCorrect,setTCorrect]=useState(0);const[tQ,setTQ]=useState(0);const[showExit,setShowExit]=useState(false);const[autoPlay,setAutoPlay]=useState(false);const autoRef=useRef(null);const lastPlayedIdx=useRef(-1);
  const color=gradeColors[grade];const BS=5;
  const shuffledRef=useRef(shuffleArray(idiomData));const shuffled=shuffledRef.current;
  const totalBatches=Math.ceil(shuffled.length/BS);const curItems=shuffled.slice(batch*BS,(batch+1)*BS);

  useEffect(()=>{
    if(phase==='flash'&&autoPlay){
      autoRef.current=setTimeout(()=>{
        if(!flipped){setFlipped(true);}
        else{if(cardIdx<curItems.length-1){setCardIdx(p=>p+1);setFlipped(false);}else{setAutoPlay(false);setPhase('quiz');setQi(0);}}
      },flipped?2000:1500);
      return()=>clearTimeout(autoRef.current);
    }
  },[phase,autoPlay,flipped,cardIdx,curItems.length]);

  useEffect(()=>{
    if(phase==='flash'&&!flipped&&curItems[cardIdx]){
      const currentKey=`${batch}-${cardIdx}`;
      if(lastPlayedIdx.current!==currentKey){
        playSound(curItems[cardIdx].phrase);
        lastPlayedIdx.current=currentKey;
      }
    }
  },[phase,cardIdx,flipped,batch]);

  const handleNextCard=()=>{if(!flipped){setFlipped(true);return;}if(cardIdx<curItems.length-1){setCardIdx(p=>p+1);setFlipped(false);}else{setPhase('quiz');setQi(0);setBScore(0);quizOptionsRef.current={};}};

  const quizOptionsRef=useRef({});
  const getOpts=(item)=>{
    if(!quizOptionsRef.current[item.phrase]){
      const others=idiomData.filter(i=>i.phrase!==item.phrase);
      const opts=shuffleArray([item.meaning,...shuffleArray(others).slice(0,3).map(i=>i.meaning)]);
      quizOptionsRef.current[item.phrase]=opts;
    }
    return quizOptionsRef.current[item.phrase];
  };

  const handleQuizAns=(sel)=>{
    if(qfb)return;const item=curItems[qi];const ok=sel===item.meaning;
    if(ok){setBScore(p=>p+1);setTCorrect(p=>p+1);playSound(item.phrase);}
    else{playErrorSound();setTimeout(()=>playSound(item.phrase),500);}
    setTQ(p=>p+1);setQfb({correct:ok,answer:item.meaning,selected:sel});
    setTimeout(()=>{setQfb(null);if(qi<curItems.length-1){setQi(p=>p+1);}else{setTScore(p=>p+bScore+(ok?1:0));setPhase('batchResult');}},ok?1500:3000);
  };

  const handleNextBatch=()=>{
    if(batch+1>=totalBatches){onFinish({score:tScore*100,correctCount:tCorrect,totalQuestions:tQ,maxCombo:0});return;}
    setBatch(p=>p+1);setPhase('flash');setCardIdx(0);setFlipped(false);setBScore(0);setQuizOptions({});lastPlayedIdx.current=-1;
  };

  const prog=((batch*BS+(phase==='flash'?cardIdx:BS))/shuffled.length)*100;

  return(
    <div className="min-h-screen p-4 flex flex-col" style={{background:`radial-gradient(circle at 50% 30%,${color}20 0%,transparent 60%),linear-gradient(135deg,#0f0f2e 0%,#1a1a3e 100%)`}}>
      <ConfirmDialog isOpen={showExit} onConfirm={onExit} onCancel={()=>setShowExit(false)}/>
      <div className="flex items-center justify-between p-3 rounded-2xl mb-4" style={{background:'rgba(37,37,66,0.8)'}}>
        <button className="p-2 rounded-xl hover:bg-white/10 text-xl text-white" onClick={()=>setShowExit(true)}>←</button>
        <div className="flex items-center gap-3"><span className="text-2xl">🎓</span><span className="text-lg text-white font-bold" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>学習モード {grade}級</span></div>
        <span className="text-xs text-gray-400">セット {batch+1}/{totalBatches}</span>
      </div>
      <div className="max-w-2xl mx-auto w-full mb-4"><div className="h-3 bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${prog}%`,background:`linear-gradient(90deg,${color},#c44eff)`}}/></div></div>

      {/* フラッシュカード */}
      {phase==='flash'&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-400">カード {cardIdx+1}/{curItems.length}</span>
            <div className="flex gap-1">{curItems.map((_,i)=>(<div key={i} className="w-3 h-3 rounded-full transition-all" style={{background:i<=cardIdx?color:'#374151',boxShadow:i===cardIdx?`0 0 10px ${color}`:'none'}}/>))}</div>
            <button className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-all" onClick={(e)=>{e.stopPropagation();if(curItems[cardIdx])playSound(curItems[cardIdx].phrase);}}><span className="text-xl">🔊</span></button>
          </div>
          <div className="w-full" style={{perspective:'1000px'}}>
            <div className="relative w-full cursor-pointer" style={{minHeight:'280px',transformStyle:'preserve-3d',transform:flipped?'rotateY(180deg)':'rotateY(0deg)',transition:'transform 0.6s cubic-bezier(0.4,0,0.2,1)'}} onClick={handleNextCard}>
              <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center gap-4" style={{backfaceVisibility:'hidden',background:`linear-gradient(135deg,${color}30,${color}10)`,border:`3px solid ${color}50`,boxShadow:`0 20px 60px ${color}20`}}>
                <span className="text-6xl mb-2">{curItems[cardIdx]?.emoji}</span>
                <span className="text-3xl md:text-4xl text-white font-black text-center" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>{curItems[cardIdx]?.phrase}</span>
                <span className="text-sm text-gray-400 mt-4">タップしてめくる 👆</span>
              </div>
              <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center gap-3" style={{backfaceVisibility:'hidden',transform:'rotateY(180deg)',background:'linear-gradient(135deg,#252542,#1a1a3e)',border:`3px solid ${color}`,boxShadow:`0 20px 60px ${color}30`}}>
                <span className="text-5xl mb-1">{curItems[cardIdx]?.emoji}</span>
                <span className="text-2xl font-bold" style={{color}}>{curItems[cardIdx]?.meaning}</span>
                <div className="mt-3 px-5 py-3 rounded-xl w-full text-center" style={{background:'rgba(255,255,255,0.05)'}}>
                  <span className="text-xs text-gray-500 block mb-1">💬 例文</span>
                  <span className="text-base text-gray-300">{curItems[cardIdx]?.example}</span>
                </div>
                <span className="text-sm mt-3" style={{color}}>{cardIdx<curItems.length-1?'タップで次へ →':'タップでクイズへ 📝'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105" style={{background:autoPlay?`${color}30`:'rgba(255,255,255,0.1)',color:autoPlay?color:'#9ca3af',border:`2px solid ${autoPlay?color:'transparent'}`}} onClick={()=>setAutoPlay(!autoPlay)}>{autoPlay?'⏸ ストップ':'▶️ 自動再生'}</button>
            <button className="px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105" style={{background:`linear-gradient(135deg,${color},#c44eff)`}} onClick={()=>{setAutoPlay(false);setPhase('quiz');setQi(0);setBScore(0);}}>⏭️ クイズへスキップ</button>
          </div>
        </div>
      )}

      {/* クイズ */}
      {phase==='quiz'&&curItems[qi]&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
          <div className="flex flex-col items-center gap-2 mb-2" style={{animation:'pop 0.4s ease'}}>
            <span className="text-5xl">📝</span>
            <span className="text-2xl font-black text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>クイズタイム！</span>
            <span className="text-sm text-gray-400">{qi+1}/{curItems.length}</span>
          </div>
          <div className="w-full rounded-2xl p-8 text-center" style={{background:'rgba(37,37,66,0.9)',border:`2px solid ${color}40`}}>
            <span className="text-5xl block mb-4">{curItems[qi].emoji}</span>
            <span className="text-3xl text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>{curItems[qi].phrase}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full">
            {getOpts(curItems[qi]).map((opt,i)=>{
              const isCA=qfb&&opt===curItems[qi].meaning;
              const isWA=qfb&&opt===qfb.selected&&!qfb.correct;
              return(<button key={i} className="w-full p-4 rounded-xl text-lg text-left transition-all font-bold" style={{background:isCA?'rgba(107,255,142,0.2)':isWA?'rgba(255,107,107,0.2)':'rgba(37,37,66,0.9)',border:`2px solid ${isCA?'#6bff8e':isWA?'#ff6b6b':'#374151'}`,color:isCA?'#6bff8e':isWA?'#ff6b6b':'white',opacity:qfb&&!isCA&&!isWA?0.5:1,transform:'none'}} onClick={()=>handleQuizAns(opt)} disabled={qfb!==null}>{opt}</button>);
            })}
          </div>
          {qfb&&<div className="flex flex-col items-center gap-3" style={{animation:'pop 0.3s ease'}}><div className="text-2xl font-black" style={{fontFamily:"'Dela Gothic One',sans-serif",color:qfb.correct?'#6bff8e':'#ff6b6b'}}>{qfb.correct?'⭕ 正解！':'❌ 不正解…'}</div>{!qfb.correct&&<div className="flex flex-col items-center gap-2" style={{animation:'slideUp 0.3s ease 0.3s both'}}><span className="text-sm text-gray-400">正解は</span><span className="text-xl px-5 py-2 rounded-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#6bff8e',background:'rgba(107,255,142,0.15)',border:'2px solid #6bff8e',boxShadow:'0 0 20px rgba(107,255,142,0.3)'}}>{qfb.answer}</span></div>}</div>}
        </div>
      )}

      {/* バッチ結果 */}
      {phase==='batchResult'&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-md mx-auto w-full" style={{animation:'slideUp 0.5s ease'}}>
          <div className="text-6xl">{bScore>=4?'🎉':bScore>=3?'👏':'💪'}</div>
          <h2 className="text-3xl text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>セット{batch+1} 完了！</h2>
          <div className="rounded-2xl p-6 w-full text-center" style={{background:'rgba(37,37,66,0.9)'}}>
            <span className="text-5xl font-black" style={{fontFamily:"'Dela Gothic One',sans-serif",color}}>{bScore}/{curItems.length}</span>
            <span className="text-gray-400 block mt-2">問正解</span>
          </div>
          <Mascot emotion={bScore>=4?'excited':'happy'} message={bScore>=4?'パーフェクト！':'がんばったね！'}/>
          <button className="px-10 py-5 rounded-full text-xl text-white font-black transition-all hover:scale-105" style={{fontFamily:"'Dela Gothic One',sans-serif",background:`linear-gradient(135deg,${color},#c44eff)`,boxShadow:`0 10px 30px ${color}40`}} onClick={handleNextBatch}>
            {batch+1>=totalBatches?'🏁 結果を見る':'➡️ 次のセットへ'}
          </button>
        </div>
      )}
    </div>
  );
};

// ======== 熟語テストモード ========
const IdiomTestMode=({grade,onGameEnd,onExit})=>{
  const idiomData=getIdiomByGrade(grade);
  const[questions,setQuestions]=useState([]);const[ci,setCi]=useState(0);const[score,setScore]=useState(0);const[combo,setCombo]=useState(0);const[maxCombo,setMaxCombo]=useState(0);const[timeLeft,setTimeLeft]=useState(12);const[cc,setCc]=useState(0);const[fb,setFb]=useState(null);const[showExit,setShowExit]=useState(false);const tRef=useRef(null);const handleAnswerRef=useRef(null);
  const color=gradeColors[grade];const TQ=15;

  useEffect(()=>{
    const sh=shuffleArray(idiomData).slice(0,TQ);
    const qs=sh.map(item=>{const others=idiomData.filter(i=>i.phrase!==item.phrase);const dummies=shuffleArray(others).slice(0,3).map(i=>i.meaning);const opts=shuffleArray([item.meaning,...dummies]);return{phrase:item.phrase,emoji:item.emoji,example:item.example,meaning:item.meaning,options:opts,answer:opts.indexOf(item.meaning)};});
    setQuestions(qs);
  },[grade]);

  const handleAnswer=useCallback((idx)=>{
    if(fb!==null)return;clearInterval(tRef.current);const q=questions[ci];const ok=idx===q.answer;
    if(ok){const pts=100+Math.floor(timeLeft*15)+combo*60;setScore(p=>p+pts);setCombo(p=>p+1);setMaxCombo(p=>Math.max(p,combo+1));setCc(p=>p+1);setFb({type:'correct',points:pts});playSound(q.phrase);}
    else{setCombo(0);setFb({type:'wrong',correctAnswer:q.meaning,selected:idx>=0?q.options[idx]:null});playErrorSound();setTimeout(()=>playSound(q.phrase),500);}
    setTimeout(()=>{setFb(null);if(ci+1>=questions.length){onGameEnd({score:ok?score+100+Math.floor(timeLeft*15)+combo*60:score,correctCount:ok?cc+1:cc,maxCombo:Math.max(maxCombo,ok?combo+1:maxCombo),totalQuestions:questions.length});}else{setCi(p=>p+1);setTimeLeft(12);}},ok?1500:3000);
  },[ci,questions,score,combo,maxCombo,cc,timeLeft,fb,onGameEnd]);
  handleAnswerRef.current=handleAnswer;

  useEffect(()=>{if(!questions.length)return;tRef.current=setInterval(()=>{setTimeLeft(p=>{if(p<=1){handleAnswerRef.current(-1);return 12;}return p-1;});},1000);return()=>clearInterval(tRef.current);},[ci,questions.length]);

  if(!questions.length)return<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  const q=questions[ci];const prog=((ci+1)/questions.length)*100;const tc=timeLeft<=3?'#ff6b6b':timeLeft<=7?'#ffd93d':'#6bff8e';

  return(
    <div className="min-h-screen p-4" style={{background:`radial-gradient(circle at 40% 60%,${color}15 0%,transparent 50%),linear-gradient(135deg,#0f0f2e 0%,#1a1a3e 100%)`}}>
      <ComboEffect combo={combo}/>
      <ConfirmDialog isOpen={showExit} onConfirm={onExit} onCancel={()=>{setShowExit(false);clearInterval(tRef.current);tRef.current=setInterval(()=>{setTimeLeft(p=>{if(p<=1){handleAnswerRef.current(-1);return 12;}return p-1;});},1000);}}/>
      <div className="flex items-center justify-between p-3 rounded-2xl mb-5" style={{background:'rgba(37,37,66,0.8)'}}>
        <button className="p-2 rounded-xl hover:bg-white/10 text-xl text-white" onClick={()=>{clearInterval(tRef.current);setShowExit(true);}}>←</button>
        <div className="flex items-center gap-3"><span className="px-3 py-1 rounded-full font-bold text-sm" style={{background:color,color:'#1a1a2e',fontFamily:"'Dela Gothic One',sans-serif"}}>熟語{grade}級</span><div className="flex flex-col"><span className="text-xs text-gray-400">SCORE</span><span className="text-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#ffd93d'}}>{score.toLocaleString()}</span></div></div>
        <div className="flex items-center gap-3">
          <div className="text-center"><span className="text-xs text-gray-400 block">{ci+1}/{questions.length}</span><div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${prog}%`,background:`linear-gradient(90deg,${color},#c44eff)`}}/></div></div>
          <div className="relative w-12 h-12"><svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#252542" strokeWidth="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={tc} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(timeLeft/12)*100},100`} className="transition-all duration-1000"/></svg><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg" style={{fontFamily:"'Dela Gothic One',sans-serif",color:tc}}>{timeLeft}</span></div>
        </div>
      </div>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        <div className={`rounded-2xl p-8 text-center border-2 transition-all ${fb?.type==='correct'?'border-green-400':fb?.type==='wrong'?'border-red-400':'border-gray-700'}`} style={{background:'rgba(37,37,66,0.9)',animation:fb?.type==='wrong'?'shake 0.5s ease':undefined}}>
          <span className="text-5xl block mb-3">{q.emoji}</span>
          <span className="text-3xl md:text-4xl text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>{q.phrase}</span>
          <div className="mt-4 px-4 py-2 rounded-lg" style={{background:'rgba(255,255,255,0.05)'}}><span className="text-sm text-gray-400">💬 {q.example}</span></div>
        </div>
        <div className="grid grid-cols-1 gap-3">{q.options.map((opt,i)=>{const isCA=fb&&opt===q.meaning;const isWA=fb&&opt===fb.selected&&!isCA;return(<button key={i} className="p-4 rounded-xl text-lg text-left transition-all font-bold" style={{background:isCA?'rgba(107,255,142,0.2)':isWA?'rgba(255,107,107,0.2)':'rgba(37,37,66,0.9)',border:`2px solid ${isCA?'#6bff8e':isWA?'#ff6b6b':'#374151'}`,color:isCA?'#6bff8e':isWA?'#ff6b6b':'white',opacity:fb&&!isCA&&!isWA?0.5:1,transform:'none'}} onClick={()=>handleAnswer(i)} disabled={fb!==null}><span className="inline-flex w-8 h-8 rounded-full items-center justify-center text-sm mr-3 flex-shrink-0" style={{background:color,color:'#1a1a2e',fontFamily:"'Dela Gothic One',sans-serif"}}>{optLabels[i]}</span>{opt}</button>);})}</div>
        {combo>=2&&<div className="text-center"><span className="px-4 py-2 rounded-full text-sm font-bold" style={{background:`${color}20`,color,fontFamily:"'Dela Gothic One',sans-serif"}}>🔥 {combo} COMBO</span></div>}
      </div>
      {fb&&<div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"><div className="flex flex-col items-center gap-3" style={{animation:'pop 0.3s ease'}}><div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{background:fb.type==='correct'?'#6bff8e':'#ff6b6b',color:fb.type==='correct'?'#1a1a2e':'white',boxShadow:`0 0 40px ${fb.type==='correct'?'rgba(107,255,142,0.6)':'rgba(255,107,107,0.6)'}`}}>{fb.type==='correct'?'✓':'✗'}</div><span className="text-3xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:fb.type==='correct'?'#6bff8e':'#ff6b6b'}}>{fb.type==='correct'?'正解!':'不正解…'}</span>{fb.type==='correct'?<span className="text-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#ffd93d'}}>+{fb.points}pt</span>:<div className="flex flex-col items-center gap-2 mt-2" style={{animation:'slideUp 0.3s ease 0.3s both'}}><span className="text-sm text-gray-400">正解は</span><span className="text-2xl px-6 py-3 rounded-xl" style={{fontFamily:"'Dela Gothic One',sans-serif",color:'#6bff8e',background:'rgba(107,255,142,0.15)',border:'2px solid #6bff8e',boxShadow:'0 0 20px rgba(107,255,142,0.3)'}}>{fb.correctAnswer}</span></div>}</div></div>}
    </div>
  );
};

// ======== 復習モード画面 ========
const ReviewScreen = ({wrongHistory, onStartReview, onBack}) => {
  if (!wrongHistory.length) return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-6" style={{background:'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)'}}>
      <Mascot emotion="happy" message="間違えた問題はないよ！" />
      <p className="text-gray-400 text-lg text-center">まだ間違えた問題がありません。<br/>ゲームをプレイして復習リストを作ろう！</p>
      <button className="px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)'}} onClick={onBack}>戻る</button>
    </div>
  );
  const sorted = [...wrongHistory].sort((a,b) => (b.wrongCount||1) - (a.wrongCount||1));
  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-6" style={{background:'radial-gradient(circle at 50% 20%,rgba(255,107,107,0.15) 0%,transparent 50%),linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)'}}>
      <button className="self-start p-3 rounded-xl hover:bg-white/10 transition-all text-2xl text-white" onClick={onBack}>← 戻る</button>
      <h1 className="text-3xl" style={{fontFamily:"'Dela Gothic One',sans-serif",background:'linear-gradient(135deg,#ff6b6b,#ff8e53)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>復習モード</h1>
      <Mascot emotion="thinking" message="苦手を克服しよう！" />
      <p className="text-gray-400">{sorted.length}問の復習問題があります</p>
      <div className="w-full max-w-md space-y-2 max-h-60 overflow-y-auto">
        {sorted.slice(0, 10).map((q, i) => (
          <div key={i} className="flex justify-between items-center px-4 py-3 rounded-xl" style={{background:'rgba(37,37,66,0.8)'}}>
            <span className="text-white text-sm truncate flex-1">{q.question}</span>
            <span className="text-xs px-2 py-1 rounded-full ml-2" style={{background:'rgba(255,107,107,0.2)',color:'#ff6b6b'}}>{q.wrongCount}回</span>
          </div>
        ))}
      </div>
      <button className="flex items-center gap-3 px-10 py-5 rounded-full transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#ff6b6b,#ff8e53)',boxShadow:'0 10px 30px rgba(255,107,107,0.3)'}} onClick={() => onStartReview(sorted)}>
        <span className="text-3xl">🔄</span>
        <span className="text-xl text-white font-black" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>復習スタート！</span>
      </button>
    </div>
  );
};

// ======== WiseXP SDK integration ========
const initWiseXP = () => {
  if (typeof window !== 'undefined' && window.WiseXP && !window.WiseXP.isInitialized()) {
    window.WiseXP.init('eiken-game').catch(() => {});
  }
};
const reportToXP = (result, grade) => {
  if (typeof window !== 'undefined' && window.WiseXP && window.WiseXP.isInitialized()) {
    window.WiseXP.reportGame({
      score: result.score,
      correct: result.correctCount,
      total: result.totalQuestions,
      maxCombo: result.maxCombo,
      grade: String(grade)
    }).catch(() => {});
  }
};
const reportWrongToXP = (q) => {
  if (typeof window !== 'undefined' && window.WiseXP && window.WiseXP.isInitialized()) {
    window.WiseXP.reportWrong({
      question: q.question,
      correct: q.options[q.answer],
      playerAnswer: ''
    }).catch(() => {});
  }
};

// ======== メインApp ========
export default function App(){
  const [saveData, setSaveData] = useState(() => {
    const loaded = loadSaveData();
    return loaded || getDefaultSaveData();
  });
  const [gs, setGs] = useState(GAME_STATES.MENU);
  const [sg, setSg] = useState(5);
  const [gr, setGr] = useState(null);
  const [wrongThisGame, setWrongThisGame] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [streakChecked, setStreakChecked] = useState(false);

  // Initialize WiseXP SDK
  useEffect(() => { initWiseXP(); }, []);

  const hs = saveData.highScores;
  const ihs = saveData.idiomHighScores;

  // ストリーク確認（初回メニュー表示時）
  useEffect(() => {
    if (gs === GAME_STATES.MENU && !streakChecked) {
      const today = getTodayStr();
      if (saveData.streak.lastDate !== today) {
        const newStreak = updateStreak(saveData.streak);
        const updated = { ...saveData, streak: newStreak, dailyChallenge: getDailyChallenge(saveData) };
        setSaveData(updated);
        saveSaveData(updated);
        if (newStreak.current > 1) {
          setShowStreak(true);
          playStreakSound();
          setTimeout(() => setShowStreak(false), 3000);
        }
      }
      setStreakChecked(true);
    }
  }, [gs]);

  const persist = (updater) => {
    setSaveData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveSaveData(next);
      return next;
    });
  };

  const handleStartGame = (g) => { setSg(g); setGs(GAME_STATES.PLAYING); setWrongThisGame([]); };

  const handleGameEnd = (r) => {
    setGr(r);
    const prevLevel = calcLevel(saveData.totalXP);
    const earnedXP = r.score;
    const newXP = saveData.totalXP + earnedXP;
    const newLevel = calcLevel(newXP);
    const today = getTodayStr();
    const dc = saveData.dailyChallenge;
    const dailyCompleted = dc.date === today && dc.grade === sg ? true : dc.completed;

    persist(prev => ({
      ...prev,
      highScores: r.score > prev.highScores[sg] ? { ...prev.highScores, [sg]: r.score } : prev.highScores,
      totalXP: newXP,
      level: newLevel,
      gamesPlayed: prev.gamesPlayed + 1,
      streak: updateStreak(prev.streak),
      dailyChallenge: { ...prev.dailyChallenge, completed: dailyCompleted },
      wrongHistory: addWrongQuestions(prev.wrongHistory, wrongThisGame),
    }));

    // Report to shared XP system
    reportToXP(r, sg);

    if (newLevel > prevLevel) {
      setShowLevelUp(true);
      playLevelUpSound();
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setGs(GAME_STATES.RESULT);
  };

  const handleIdiomEnd = (r) => {
    setGr(r);
    const earnedXP = r.score;
    persist(prev => ({
      ...prev,
      idiomHighScores: r.score > prev.idiomHighScores[sg] ? { ...prev.idiomHighScores, [sg]: r.score } : prev.idiomHighScores,
      totalXP: prev.totalXP + earnedXP,
      level: calcLevel(prev.totalXP + earnedXP),
      gamesPlayed: prev.gamesPlayed + 1,
      streak: updateStreak(prev.streak),
    }));
    setGs(GAME_STATES.IDIOM_RESULT);
  };

  const handleStartReview = (questions) => {
    setSg(0);
    setGs(GAME_STATES.PLAYING);
    setWrongThisGame([]);
  };

  const trackWrong = (question) => {
    setWrongThisGame(prev => [...prev, question]);
    reportWrongToXP(question);
  };

  const daily = getDailyChallenge(saveData);

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap');
        @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-10px)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-5px)}20%,40%,60%,80%{transform:translateX(5px)}}
        @keyframes rainbow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(255,217,61,0.3)}50%{box-shadow:0 0 40px rgba(255,217,61,0.6)}}
        *{box-sizing:border-box}body{margin:0;padding:0}
      `}</style>

      {/* レベルアップ通知 */}
      {showLevelUp && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-center" style={{background:'linear-gradient(135deg,#ffd93d,#ff8e53)',boxShadow:'0 10px 40px rgba(255,217,61,0.5)',animation:'pop 0.5s ease'}}>
          <div className="text-3xl font-black text-gray-900" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>LEVEL UP!</div>
          <div className="text-lg text-gray-800 font-bold">Lv.{saveData.level}</div>
        </div>
      )}

      {/* ストリーク通知 */}
      {showStreak && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-center" style={{background:'linear-gradient(135deg,#ff6b9d,#c44eff)',boxShadow:'0 10px 40px rgba(196,78,255,0.5)',animation:'pop 0.5s ease'}}>
          <div className="text-3xl font-black text-white" style={{fontFamily:"'Dela Gothic One',sans-serif"}}>{saveData.streak.current}日連続!</div>
          <div className="text-sm text-white/80">すごい！続けてるね！</div>
        </div>
      )}

      {gs===GAME_STATES.MENU&&<MainMenu onStartGame={handleStartGame} onIdiomSection={()=>setGs(GAME_STATES.IDIOM_MENU)} onReviewSection={()=>setGs('REVIEW')} highScores={hs} saveData={saveData} daily={daily} />}
      {gs===GAME_STATES.PLAYING&&<GameScreen grade={sg} onGameEnd={handleGameEnd} onExit={()=>setGs(GAME_STATES.MENU)} onWrong={trackWrong} reviewQuestions={sg===0 ? saveData.wrongHistory : null} />}
      {gs===GAME_STATES.RESULT&&<ResultScreen result={gr} grade={sg} onRetry={()=>{setWrongThisGame([]);setGs(GAME_STATES.PLAYING);}} onMenu={()=>{setGs(GAME_STATES.MENU);setGr(null);}} highScore={hs[sg]||0} xpEarned={gr?.score||0} saveData={saveData} />}
      {gs===GAME_STATES.IDIOM_MENU&&<IdiomMenu onStartLearn={(g)=>{setSg(g);setGs(GAME_STATES.IDIOM_LEARN);}} onStartTest={(g)=>{setSg(g);setGs(GAME_STATES.IDIOM_TEST);}} onBack={()=>setGs(GAME_STATES.MENU)}/>}
      {gs===GAME_STATES.IDIOM_LEARN&&<IdiomLearnMode grade={sg} onExit={()=>setGs(GAME_STATES.IDIOM_MENU)} onFinish={(r)=>handleIdiomEnd(r)}/>}
      {gs===GAME_STATES.IDIOM_TEST&&<IdiomTestMode grade={sg} onGameEnd={handleIdiomEnd} onExit={()=>setGs(GAME_STATES.IDIOM_MENU)}/>}
      {gs===GAME_STATES.IDIOM_RESULT&&<ResultScreen result={gr} grade={sg} title="熟語テスト結果" onRetry={()=>setGs(GAME_STATES.IDIOM_TEST)} onMenu={()=>{setGs(GAME_STATES.IDIOM_MENU);setGr(null);}} highScore={ihs[sg]||0} xpEarned={gr?.score||0} saveData={saveData} />}
      {gs==='REVIEW'&&<ReviewScreen wrongHistory={saveData.wrongHistory} onStartReview={handleStartReview} onBack={()=>setGs(GAME_STATES.MENU)} />}
    </>
  );
}
