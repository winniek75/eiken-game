import React, { useState, useEffect, useCallback, useRef } from 'react';

// 英検5級の問題（100問）
const grade5Questions = [
  // 基本単語 - 食べ物
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
  
  // 基本単語 - 動物
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
  
  // 基本単語 - 身の回り
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
  
  // 基本単語 - 場所
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
  
  // 基本単語 - 人
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
  
  // 基本単語 - 色
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
  
  // 基本単語 - 数字
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
  
  // 基本単語 - 曜日・時間
  { type: 'vocab', question: '「日曜日」は英語で？', options: ['Monday', 'Saturday', 'Sunday', 'Friday'], answer: 2, hint: '☀️の日' },
  { type: 'vocab', question: '「月曜日」は英語で？', options: ['Monday', 'Tuesday', 'Sunday', 'Friday'], answer: 0, hint: '🌙の日' },
  { type: 'vocab', question: '「金曜日」は英語で？', options: ['Thursday', 'Friday', 'Saturday', 'Wednesday'], answer: 1, hint: '週末前' },
  { type: 'vocab', question: '「朝」は英語で？', options: ['night', 'evening', 'morning', 'afternoon'], answer: 2, hint: '🌅' },
  { type: 'vocab', question: '「夜」は英語で？', options: ['morning', 'afternoon', 'evening', 'night'], answer: 3, hint: '🌙' },
  { type: 'vocab', question: '「今日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'now'], answer: 0, hint: 'この日' },
  { type: 'vocab', question: '「明日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'later'], answer: 1, hint: '次の日' },
  { type: 'vocab', question: '「昨日」は英語で？', options: ['today', 'tomorrow', 'yesterday', 'before'], answer: 2, hint: '前の日' },
  
  // 基本単語 - 形容詞
  { type: 'vocab', question: '「大きい」は英語で？', options: ['small', 'big', 'tall', 'short'], answer: 1, hint: '🐘' },
  { type: 'vocab', question: '「小さい」は英語で？', options: ['small', 'big', 'wide', 'narrow'], answer: 0, hint: '🐜' },
  { type: 'vocab', question: '「新しい」は英語で？', options: ['old', 'young', 'new', 'fresh'], answer: 2, hint: '✨' },
  { type: 'vocab', question: '「古い」は英語で？', options: ['new', 'young', 'fresh', 'old'], answer: 3, hint: '昔の' },
  { type: 'vocab', question: '「熱い・暑い」は英語で？', options: ['hot', 'cold', 'warm', 'cool'], answer: 0, hint: '🔥' },
  { type: 'vocab', question: '「冷たい・寒い」は英語で？', options: ['hot', 'cold', 'warm', 'cool'], answer: 1, hint: '❄️' },
  { type: 'vocab', question: '「良い」は英語で？', options: ['bad', 'nice', 'good', 'great'], answer: 2, hint: '👍' },
  { type: 'vocab', question: '「悪い」は英語で？', options: ['good', 'nice', 'great', 'bad'], answer: 3, hint: '👎' },
  
  // 基本単語 - 動詞
  { type: 'vocab', question: '「食べる」は英語で？', options: ['eat', 'drink', 'cook', 'make'], answer: 0, hint: '🍽️' },
  { type: 'vocab', question: '「飲む」は英語で？', options: ['eat', 'drink', 'pour', 'swallow'], answer: 1, hint: '🥤' },
  { type: 'vocab', question: '「走る」は英語で？', options: ['walk', 'jump', 'run', 'skip'], answer: 2, hint: '🏃' },
  { type: 'vocab', question: '「歩く」は英語で？', options: ['run', 'jump', 'skip', 'walk'], answer: 3, hint: '🚶' },
  { type: 'vocab', question: '「見る」は英語で？', options: ['see', 'hear', 'smell', 'taste'], answer: 0, hint: '👀' },
  { type: 'vocab', question: '「聞く」は英語で？', options: ['see', 'hear', 'smell', 'touch'], answer: 1, hint: '👂' },
  { type: 'vocab', question: '「読む」は英語で？', options: ['write', 'speak', 'read', 'listen'], answer: 2, hint: '📖' },
  { type: 'vocab', question: '「書く」は英語で？', options: ['read', 'speak', 'listen', 'write'], answer: 3, hint: '✍️' },
  
  // 文法問題
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
  { type: 'grammar', question: 'I ___ to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 0, hint: '主語がIの時' },
  { type: 'grammar', question: 'She ___ a cat.', options: ['have', 'has', 'having', 'had'], answer: 1, hint: '三人称単数' },
  { type: 'grammar', question: '___ is this? It\'s a book.', options: ['Who', 'What', 'Where', 'When'], answer: 1, hint: '物を聞く' },
  { type: 'grammar', question: 'I like ___ soccer.', options: ['play', 'plays', 'playing', 'played'], answer: 2, hint: 'like + ~ing' },
  { type: 'grammar', question: 'There ___ a dog in the park.', options: ['is', 'are', 'am', 'be'], answer: 0, hint: '単数なので' },
  { type: 'grammar', question: 'There ___ two cats.', options: ['is', 'are', 'am', 'be'], answer: 1, hint: '複数なので' },
  { type: 'grammar', question: 'I ___ breakfast at 7.', options: ['eat', 'eats', 'eating', 'ate'], answer: 0, hint: '主語がI' },
  { type: 'grammar', question: '___ is your birthday?', options: ['Who', 'What', 'Where', 'When'], answer: 3, hint: '「いつ」を聞く' },
];

// 英検4級の問題（100問）
const grade4Questions = [
  // 単語 - 日常生活
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
  
  // 単語 - 形容詞・副詞
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
  
  // 単語 - 動詞
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
  
  // 単語 - 名詞
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
  
  // 文法 - 現在完了
  { type: 'grammar', question: 'I have ___ to Kyoto twice.', options: ['go', 'went', 'been', 'going'], answer: 2, hint: '経験を表す現在完了' },
  { type: 'grammar', question: 'I have ___ my homework yet.', options: ['finish', 'finished', 'finishing', "not finished"], answer: 3, hint: 'まだ〜していない' },
  { type: 'grammar', question: 'She has ___ here for five years.', options: ['live', 'lived', 'living', 'lives'], answer: 1, hint: '継続を表す現在完了' },
  { type: 'grammar', question: 'Have you ever ___ sushi?', options: ['eat', 'ate', 'eaten', 'eating'], answer: 2, hint: '経験を尋ねる' },
  { type: 'grammar', question: 'I have just ___ lunch.', options: ['have', 'had', 'having', 'has'], answer: 1, hint: '完了を表す' },
  { type: 'grammar', question: 'He has ___ to America three times.', options: ['go', 'went', 'been', 'gone'], answer: 2, hint: '行ったことがある' },
  { type: 'grammar', question: 'How long have you ___ English?', options: ['study', 'studied', 'studying', 'studies'], answer: 1, hint: 'どのくらい〜していますか' },
  { type: 'grammar', question: 'I have never ___ such a beautiful place.', options: ['see', 'saw', 'seen', 'seeing'], answer: 2, hint: '一度も〜ない' },
  
  // 文法 - 比較
  { type: 'grammar', question: 'This book is ___ than that one.', options: ['interesting', 'more interesting', 'most interesting', 'interestingly'], answer: 1, hint: '比較級' },
  { type: 'grammar', question: 'He is the ___ student in our class.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 2, hint: '最上級' },
  { type: 'grammar', question: 'She runs ___ than her brother.', options: ['fast', 'faster', 'fastest', 'more fast'], answer: 1, hint: '比較級' },
  { type: 'grammar', question: 'This is the ___ movie I have ever seen.', options: ['good', 'better', 'best', 'most good'], answer: 2, hint: '最上級' },
  { type: 'grammar', question: 'Tom is as ___ as his father.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 0, hint: '同等比較 as...as' },
  { type: 'grammar', question: 'Which is ___, dogs or cats?', options: ['popular', 'more popular', 'most popular', 'popularer'], answer: 1, hint: '2つの比較' },
  
  // 文法 - 受動態・不定詞
  { type: 'grammar', question: 'The movie ___ by many people.', options: ['watch', 'watches', 'watched', 'was watched'], answer: 3, hint: '受動態' },
  { type: 'grammar', question: 'I want ___ a doctor.', options: ['be', 'being', 'to be', 'been'], answer: 2, hint: 'want to ~' },
  { type: 'grammar', question: 'He enjoys ___ tennis.', options: ['play', 'plays', 'playing', 'to play'], answer: 2, hint: 'enjoy ~ing' },
  { type: 'grammar', question: 'This letter was ___ by my mother.', options: ['write', 'wrote', 'written', 'writing'], answer: 2, hint: '受動態の過去分詞' },
  { type: 'grammar', question: 'She asked me ___ her.', options: ['help', 'helped', 'helping', 'to help'], answer: 3, hint: 'ask 人 to ~' },
  { type: 'grammar', question: 'I finished ___ my homework.', options: ['do', 'did', 'doing', 'to do'], answer: 2, hint: 'finish ~ing' },
  
  // 文法 - 条件・接続詞
  { type: 'grammar', question: 'If it ___ tomorrow, I will stay home.', options: ['rain', 'rains', 'rained', 'raining'], answer: 1, hint: '条件節は現在形' },
  { type: 'grammar', question: 'She ___ cooking when I arrived.', options: ['is', 'was', 'were', 'been'], answer: 1, hint: '過去進行形' },
  { type: 'grammar', question: '___ it was raining, we went out.', options: ['Because', 'Although', 'If', 'When'], answer: 1, hint: '〜だけれども' },
  { type: 'grammar', question: 'I was tired ___ I went to bed early.', options: ['so', 'but', 'or', 'and'], answer: 0, hint: 'だから' },
  { type: 'grammar', question: '___ he is rich, he is not happy.', options: ['Because', 'Although', 'If', 'When'], answer: 1, hint: '〜にもかかわらず' },
  
  // イディオム
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

// 英検3級の問題（100問）
const grade3Questions = [
  // 単語 - 抽象名詞
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
  
  // 単語 - 動詞（高度）
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
  
  // 単語 - 副詞
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
  
  // 単語 - 形容詞
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
  
  // 文法 - 仮定法
  { type: 'grammar', question: 'I wish I ___ fly.', options: ['can', 'could', 'will', 'would'], answer: 1, hint: '仮定法' },
  { type: 'grammar', question: 'If I ___ you, I would study harder.', options: ['am', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: 'If I ___ rich, I would travel the world.', options: ['am', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: 'I wish I ___ speak French.', options: ['can', 'could', 'may', 'might'], answer: 1, hint: '〜できたらなあ' },
  { type: 'grammar', question: 'If she ___ here, she would help us.', options: ['is', 'was', 'were', 'be'], answer: 2, hint: '仮定法過去' },
  { type: 'grammar', question: 'I wish it ___ raining.', options: ["isn't", "wasn't", "weren't", "doesn't"], answer: 2, hint: '雨じゃなければ' },
  
  // 文法 - 関係代名詞
  { type: 'grammar', question: 'The book ___ I bought yesterday is interesting.', options: ['who', 'which', 'what', 'when'], answer: 1, hint: '関係代名詞（物）' },
  { type: 'grammar', question: 'She is the woman ___ helped me.', options: ['who', 'which', 'what', 'whom'], answer: 0, hint: '関係代名詞（人・主格）' },
  { type: 'grammar', question: 'The man ___ I met was a doctor.', options: ['who', 'whom', 'which', 'what'], answer: 1, hint: '関係代名詞（人・目的格）' },
  { type: 'grammar', question: 'This is the house ___ he lives.', options: ['which', 'where', 'when', 'what'], answer: 1, hint: '関係副詞（場所）' },
  { type: 'grammar', question: 'I remember the day ___ we first met.', options: ['which', 'where', 'when', 'what'], answer: 2, hint: '関係副詞（時）' },
  { type: 'grammar', question: 'The reason ___ he was late is unknown.', options: ['which', 'where', 'when', 'why'], answer: 3, hint: '関係副詞（理由）' },
  { type: 'grammar', question: '___ surprised me was his attitude.', options: ['That', 'What', 'Which', 'It'], answer: 1, hint: '関係代名詞what' },
  { type: 'grammar', question: 'I don\'t know ___ to do.', options: ['how', 'what', 'which', 'where'], answer: 1, hint: '何をすべきか' },
  
  // 文法 - 使役・知覚動詞
  { type: 'grammar', question: 'He made me ___ the room.', options: ['clean', 'cleaned', 'cleaning', 'to clean'], answer: 0, hint: '使役動詞' },
  { type: 'grammar', question: 'I saw him ___ the street.', options: ['cross', 'crossed', 'crossing', 'to cross'], answer: 0, hint: '知覚動詞' },
  { type: 'grammar', question: 'She let me ___ her car.', options: ['use', 'used', 'using', 'to use'], answer: 0, hint: 'let + 原形' },
  { type: 'grammar', question: 'I heard someone ___ my name.', options: ['call', 'called', 'calling', 'to call'], answer: 0, hint: '知覚動詞' },
  { type: 'grammar', question: 'My mother had me ___ shopping.', options: ['go', 'went', 'going', 'to go'], answer: 0, hint: 'have + 原形' },
  { type: 'grammar', question: 'I watched the children ___ in the park.', options: ['play', 'played', 'playing', 'to play'], answer: 0, hint: '知覚動詞' },
  
  // 文法 - その他重要文法
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
  
  // イディオム・表現
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

const getQuestionsByGrade = (grade) => {
  switch (grade) {
    case 5: return grade5Questions;
    case 4: return grade4Questions;
    case 3: return grade3Questions;
    default: return grade5Questions;
  }
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 選択肢をシャッフルして、正解のインデックスも更新する
const shuffleOptions = (question) => {
  const optionsWithIndex = question.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === question.answer
  }));
  
  const shuffled = shuffleArray(optionsWithIndex);
  const newAnswer = shuffled.findIndex(opt => opt.isCorrect);
  
  return {
    ...question,
    options: shuffled.map(opt => opt.text),
    answer: newAnswer
  };
};

const getRandomQuestions = (grade, count = 10) => {
  const questions = getQuestionsByGrade(grade);
  const shuffledQuestions = shuffleArray(questions).slice(0, count);
  // 各問題の選択肢もシャッフル
  return shuffledQuestions.map(q => shuffleOptions(q));
};

const GAME_STATES = { MENU: 'menu', PLAYING: 'playing', RESULT: 'result' };

// マスコットキャラクター
const Mascot = ({ emotion = 'happy', message = '' }) => {
  const faces = {
    happy: '(◕‿◕)',
    excited: '(★‿★)',
    thinking: '(◔_◔)',
    sad: '(╥_╥)',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: emotion === 'sad' 
              ? 'linear-gradient(135deg, #6b7280, #9ca3af)' 
              : 'linear-gradient(135deg, #ff6b9d, #c44eff)',
            animation: emotion === 'excited' ? 'bounce 0.5s infinite' : 'float 3s ease-in-out infinite',
            boxShadow: '0 10px 30px rgba(196, 78, 255, 0.4)'
          }}
        >
          <span className="text-2xl text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {faces[emotion]}
          </span>
        </div>
      </div>
      {message && (
        <div className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
          {message}
        </div>
      )}
    </div>
  );
};

// コンボエフェクト
const ComboEffect = ({ combo }) => {
  if (combo < 2) return null;
  
  return (
    <div 
      className="fixed top-1/4 right-4 flex flex-col items-center z-50"
      style={{ animation: 'pop 0.3s ease-out' }}
    >
      <span 
        className="text-6xl font-black"
        style={{
          fontFamily: "'Dela Gothic One', sans-serif",
          background: 'linear-gradient(45deg, #ff6b9d, #ffd93d, #00f5d4, #c44eff)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'rainbow 2s ease infinite',
          filter: 'drop-shadow(0 0 10px rgba(255,107,157,0.5))'
        }}
      >
        {combo}
      </span>
      <span 
        className="text-2xl font-black"
        style={{
          fontFamily: "'Dela Gothic One', sans-serif",
          color: '#ffd93d',
          textShadow: '0 0 10px rgba(255,217,61,0.8)'
        }}
      >
        COMBO!
      </span>
    </div>
  );
};

// 確認ダイアログ
const ConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div 
        className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
        style={{ animation: 'pop 0.3s ease' }}
      >
        <div className="text-4xl mb-4">🤔</div>
        <h3 className="text-xl font-bold text-white mb-2">ゲームを終了しますか？</h3>
        <p className="text-gray-400 mb-6">現在の進行状況は保存されません</p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-600 hover:bg-gray-500 transition-all"
            onClick={onCancel}
          >
            続ける
          </button>
          <button
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' }}
            onClick={onConfirm}
          >
            終了する
          </button>
        </div>
      </div>
    </div>
  );
};

// メインメニュー
const MainMenu = ({ onStartGame, highScores }) => {
  const [selectedGrade, setSelectedGrade] = useState(null);

  const grades = [
    { level: 5, name: '5級', description: '小学校高学年〜中1', color: '#00d9ff', emoji: '🌟', questions: grade5Questions.length },
    { level: 4, name: '4級', description: '中学2年レベル', color: '#ffd93d', emoji: '⭐', questions: grade4Questions.length },
    { level: 3, name: '3級', description: '中学卒業レベル', color: '#ff6b9d', emoji: '💫', questions: grade3Questions.length },
  ];

  return (
    <div 
      className="min-h-screen p-6 flex flex-col items-center gap-8"
      style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(196, 78, 255, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(255, 107, 157, 0.15) 0%, transparent 40%),
          linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`
      }}
    >
      <div className="text-center flex flex-col items-center gap-5">
        <h1 className="flex flex-wrap justify-center gap-2" style={{ fontFamily: "'Dela Gothic One', sans-serif" }}>
          <span 
            className="text-5xl md:text-6xl"
            style={{
              background: 'linear-gradient(135deg, #00d9ff, #00f5d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.5))'
            }}
          >
            英検
          </span>
          <span 
            className="text-5xl md:text-6xl"
            style={{
              background: 'linear-gradient(135deg, #ff6b9d, #c44eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(255, 107, 157, 0.5))'
            }}
          >
            クエスト
          </span>
        </h1>
        <Mascot emotion="happy" message="さあ、チャレンジしよう！" />
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-xl text-gray-400 text-center mb-5" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
          レベルを選択
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {grades.map((grade, idx) => (
            <button
              key={grade.level}
              className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 border-3 ${
                selectedGrade === grade.level ? 'scale-105' : ''
              }`}
              style={{
                background: 'linear-gradient(135deg, #252542 0%, #1a1a2e 100%)',
                borderColor: selectedGrade === grade.level ? grade.color : 'transparent',
                borderWidth: '3px',
                boxShadow: selectedGrade === grade.level 
                  ? `0 0 40px ${grade.color}40` 
                  : '0 4px 20px rgba(0,0,0,0.3)',
                animation: `slideUp 0.5s ease forwards`,
                animationDelay: `${idx * 0.1}s`,
              }}
              onClick={() => setSelectedGrade(grade.level)}
            >
              <span className="text-5xl">{grade.emoji}</span>
              <span 
                className="text-3xl"
                style={{ fontFamily: "'Dela Gothic One', sans-serif", color: grade.color }}
              >
                {grade.name}
              </span>
              <span className="text-sm text-gray-400">{grade.description}</span>
              <span className="text-xs text-gray-500">📝 {grade.questions}問収録</span>
              {highScores[grade.level] > 0 && (
                <span 
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ background: 'rgba(255, 217, 61, 0.2)', color: '#ffd93d' }}
                >
                  🏆 {highScores[grade.level]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedGrade && (
        <button 
          className="flex items-center gap-4 px-12 py-5 rounded-full cursor-pointer transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #ff6b9d, #c44eff)',
            boxShadow: '0 10px 40px rgba(196, 78, 255, 0.4)',
            animation: 'pop 0.3s ease'
          }}
          onClick={() => onStartGame(selectedGrade)}
        >
          <span 
            className="text-2xl text-white"
            style={{ fontFamily: "'Dela Gothic One', sans-serif" }}
          >
            ゲームスタート！
          </span>
          <span className="text-3xl">🚀</span>
        </button>
      )}
    </div>
  );
};

// ゲーム画面
const GameScreen = ({ grade, onGameEnd, onExit }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [mascotEmotion, setMascotEmotion] = useState('thinking');
  const [mascotMessage, setMascotMessage] = useState('がんばれ〜！');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerRef = useRef(null);

  const gradeColors = { 5: '#00d9ff', 4: '#ffd93d', 3: '#ff6b9d' };
  const gradeColor = gradeColors[grade];
  
  const optionLabels = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    setQuestions(getRandomQuestions(grade, 10));
  }, [grade]);

  useEffect(() => {
    if (questions.length === 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(-1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, questions.length]);

  const handleAnswer = useCallback((selectedIndex) => {
    if (feedback !== null) return;
    
    clearInterval(timerRef.current);
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedIndex === currentQuestion.answer;

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 10);
      const comboBonus = combo * 50;
      const points = 100 + timeBonus + comboBonus;
      
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, combo + 1));
      setCorrectCount(prev => prev + 1);
      setFeedback({ type: 'correct', points });
      
      const messages = ['すごい！', 'ナイス！', '完璧！', 'その調子！', '天才！'];
      setMascotMessage(messages[Math.floor(Math.random() * messages.length)]);
      setMascotEmotion(combo >= 2 ? 'excited' : 'happy');
    } else {
      setCombo(0);
      setFeedback({ type: 'wrong', correctAnswer: currentQuestion.options[currentQuestion.answer] });
      setMascotMessage('ドンマイ！');
      setMascotEmotion('sad');
    }

    setTimeout(() => {
      setFeedback(null);
      setShowHint(false);
      setMascotEmotion('thinking');
      setMascotMessage('');
      
      if (currentIndex + 1 >= questions.length) {
        onGameEnd({
          score: isCorrect ? score + 100 + Math.floor(timeLeft * 10) + combo * 50 : score,
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          maxCombo: Math.max(maxCombo, isCorrect ? combo + 1 : maxCombo),
          totalQuestions: questions.length,
        });
      } else {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(15);
      }
    }, 1500);
  }, [currentIndex, questions, score, combo, maxCombo, correctCount, timeLeft, feedback, onGameEnd]);

  const handleExitClick = () => {
    clearInterval(timerRef.current);
    setShowExitConfirm(true);
  };

  const handleExitConfirm = () => {
    onExit();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
    // タイマー再開
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(-1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const timerColor = timeLeft <= 5 ? '#ff6b6b' : timeLeft <= 10 ? '#ffd93d' : '#6bff8e';

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        background: `
          radial-gradient(circle at 30% 70%, ${gradeColor}15 0%, transparent 50%),
          linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`
      }}
    >
      <ComboEffect combo={combo} />
      <ConfirmDialog 
        isOpen={showExitConfirm} 
        onConfirm={handleExitConfirm} 
        onCancel={handleExitCancel} 
      />
      
      {/* ヘッダー */}
      <div 
        className="flex justify-between items-center p-4 rounded-2xl mb-6"
        style={{ background: 'rgba(37, 37, 66, 0.8)', backdropFilter: 'blur(10px)' }}
      >
        {/* 戻るボタン */}
        <button
          className="p-2 rounded-xl hover:bg-white/10 transition-all mr-2"
          onClick={handleExitClick}
          title="メニューに戻る"
        >
          <span className="text-2xl">←</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div 
            className="px-4 py-2 rounded-full text-lg font-bold"
            style={{ 
              background: gradeColor, 
              color: '#1a1a2e',
              fontFamily: "'Dela Gothic One', sans-serif"
            }}
          >
            {grade}級
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">SCORE</span>
            <span 
              className="text-2xl"
              style={{ fontFamily: "'Dela Gothic One', sans-serif", color: '#ffd93d' }}
            >
              {score.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs mx-4">
          <div className="text-center text-sm text-gray-400 mb-2">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${gradeColor}, #c44eff)`
              }}
            />
          </div>
        </div>

        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#252542"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={timerColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(timeLeft / 15) * 100}, 100`}
              className="transition-all duration-1000"
            />
          </svg>
          <span 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
            style={{ fontFamily: "'Dela Gothic One', sans-serif", color: timerColor }}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_auto] gap-6">
        <div className="flex flex-col gap-5">
          {/* 問題カード */}
          <div 
            className={`rounded-2xl p-6 text-center border-2 transition-all ${
              feedback?.type === 'correct' ? 'border-green-400' : 
              feedback?.type === 'wrong' ? 'border-red-400' : 'border-gray-600'
            }`}
            style={{ 
              background: 'rgba(37, 37, 66, 0.9)',
              animation: feedback?.type === 'wrong' ? 'shake 0.5s ease' : undefined
            }}
          >
            <span 
              className="inline-block px-3 py-1 rounded-lg text-xs font-bold mb-4"
              style={{ background: gradeColor, color: '#1a1a2e' }}
            >
              {currentQuestion.type === 'vocab' ? '単語' : currentQuestion.type === 'grammar' ? '文法' : '表現'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
            {showHint && (
              <div 
                className="mt-4 px-5 py-3 rounded-xl text-base"
                style={{ 
                  background: 'rgba(255, 217, 61, 0.15)', 
                  border: '1px solid rgba(255, 217, 61, 0.3)',
                  color: '#ffd93d',
                  animation: 'slideUp 0.3s ease'
                }}
              >
                💡 ヒント: {currentQuestion.hint}
              </div>
            )}
          </div>

          {/* 選択肢 */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  feedback && idx === currentQuestion.answer
                    ? 'border-green-400 bg-green-400/20'
                    : 'border-gray-600 hover:border-current hover:-translate-y-1'
                }`}
                style={{ 
                  background: feedback && idx === currentQuestion.answer 
                    ? 'rgba(107, 255, 142, 0.15)' 
                    : 'rgba(37, 37, 66, 0.9)',
                  borderColor: feedback && idx === currentQuestion.answer ? '#6bff8e' : undefined,
                  '--tw-border-opacity': 1,
                  color: gradeColor
                }}
                onClick={() => handleAnswer(idx)}
                disabled={feedback !== null}
              >
                <span 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ 
                    background: gradeColor, 
                    color: '#1a1a2e',
                    fontFamily: "'Dela Gothic One', sans-serif"
                  }}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-lg text-white">{option}</span>
              </button>
            ))}
          </div>

          {!showHint && !feedback && (
            <button 
              className="px-5 py-3 rounded-xl text-sm text-gray-400 border-2 border-dashed border-gray-600 hover:border-yellow-400 hover:text-yellow-400 transition-all"
              onClick={() => setShowHint(true)}
            >
              💡 ヒントを見る
            </button>
          )}
        </div>

        {/* マスコット */}
        <div className="flex flex-col items-center gap-5 md:order-none order-first">
          <Mascot emotion={mascotEmotion} message={mascotMessage} />
          {combo >= 2 && (
            <div 
              className="px-5 py-3 rounded-xl flex flex-col items-center"
              style={{ 
                background: 'linear-gradient(135deg, #ff6b9d, #c44eff)',
                animation: 'pop 0.3s ease'
              }}
            >
              <span className="text-xs text-white/80">COMBO</span>
              <span 
                className="text-2xl text-white"
                style={{ fontFamily: "'Dela Gothic One', sans-serif" }}
              >
                ×{combo}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* フィードバック */}
      {feedback && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div 
            className="flex flex-col items-center gap-3"
            style={{ animation: 'pop 0.3s ease' }}
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{
                background: feedback.type === 'correct' ? '#6bff8e' : '#ff6b6b',
                color: feedback.type === 'correct' ? '#1a1a2e' : 'white',
                boxShadow: `0 0 40px ${feedback.type === 'correct' ? 'rgba(107, 255, 142, 0.6)' : 'rgba(255, 107, 107, 0.6)'}`
              }}
            >
              {feedback.type === 'correct' ? '✓' : '✗'}
            </div>
            <span 
              className="text-3xl"
              style={{ 
                fontFamily: "'Dela Gothic One', sans-serif",
                color: feedback.type === 'correct' ? '#6bff8e' : '#ff6b6b'
              }}
            >
              {feedback.type === 'correct' ? '正解!' : '不正解...'}
            </span>
            {feedback.type === 'correct' ? (
              <span 
                className="text-2xl"
                style={{ fontFamily: "'Dela Gothic One', sans-serif", color: '#ffd93d' }}
              >
                +{feedback.points}pt
              </span>
            ) : (
              <span className="text-lg text-gray-400">
                正解: {feedback.correctAnswer}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// リザルト画面
const ResultScreen = ({ result, grade, onRetry, onMenu, highScore }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isNewHighScore = result.score > highScore;
  const accuracy = Math.round((result.correctCount / result.totalQuestions) * 100);

  const getRank = () => {
    if (accuracy >= 90) return { rank: 'S', color: '#ffd93d', message: '素晴らしい！完璧に近い！' };
    if (accuracy >= 70) return { rank: 'A', color: '#6bff8e', message: 'すごい！よくできました！' };
    if (accuracy >= 50) return { rank: 'B', color: '#00d9ff', message: 'がんばりました！' };
    if (accuracy >= 30) return { rank: 'C', color: '#c44eff', message: 'もう少し練習しよう！' };
    return { rank: 'D', color: '#ff6b6b', message: '次はもっとがんばろう！' };
  };

  const { rank, color, message } = getRank();

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="min-h-screen p-6 flex flex-col items-center justify-center"
      style={{
        background: `
          radial-gradient(circle at 50% 30%, rgba(255, 217, 61, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`
      }}
    >
      {isNewHighScore && (
        <div 
          className="px-10 py-4 rounded-full text-2xl text-white font-bold mb-8"
          style={{
            fontFamily: "'Dela Gothic One', sans-serif",
            background: 'linear-gradient(90deg, #ff6b9d, #ffd93d, #00f5d4, #c44eff, #ff6b9d)',
            backgroundSize: '400% 100%',
            animation: 'rainbow 3s linear infinite',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          🎉 NEW HIGH SCORE! 🎉
        </div>
      )}

      <div 
        className="rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-8"
        style={{
          background: 'rgba(37, 37, 66, 0.95)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.5s ease'
        }}
      >
        <h1 
          className="text-3xl"
          style={{
            fontFamily: "'Dela Gothic One', sans-serif",
            background: 'linear-gradient(135deg, #ff6b9d, #c44eff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          結果発表
        </h1>
        
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              boxShadow: `0 0 50px ${color}80`,
              animation: 'pop 0.5s ease'
            }}
          >
            <span 
              className="text-6xl text-white"
              style={{ 
                fontFamily: "'Dela Gothic One', sans-serif",
                textShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              {rank}
            </span>
          </div>
          <p className="text-lg text-gray-400">{message}</p>
        </div>

        <Mascot 
          emotion={accuracy >= 70 ? 'excited' : accuracy >= 50 ? 'happy' : 'sad'} 
          message={accuracy >= 70 ? '最高！' : accuracy >= 50 ? 'いい感じ！' : 'また挑戦しよう！'}
        />

        {showDetails && (
          <div 
            className="grid grid-cols-2 gap-5 w-full"
            style={{ animation: 'slideUp 0.5s ease 0.3s both' }}
          >
            {[
              { label: 'スコア', value: result.score.toLocaleString(), color: '#ffd93d' },
              { label: '正解数', value: `${result.correctCount}/${result.totalQuestions}`, color: 'white' },
              { label: '正解率', value: `${accuracy}%`, color: 'white' },
              { label: '最大コンボ', value: `${result.maxCombo}×`, color: '#ff6b9d' },
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="rounded-xl p-5 flex flex-col items-center gap-2"
                style={{ background: 'rgba(15, 15, 26, 0.5)' }}
              >
                <span className="text-sm text-gray-400">{stat.label}</span>
                <span 
                  className="text-2xl"
                  style={{ fontFamily: "'Dela Gothic One', sans-serif", color: stat.color }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-5 w-full">
          <button 
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold text-white transition-all hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44eff)' }}
            onClick={onRetry}
          >
            <span>🔄</span>
            <span>もう一度</span>
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold text-white border-2 border-white/20 bg-white/10 transition-all hover:-translate-y-1"
            onClick={onMenu}
          >
            <span>🏠</span>
            <span>メニュー</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// メインアプリ
export default function App() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU);
  const [selectedGrade, setSelectedGrade] = useState(5);
  const [gameResult, setGameResult] = useState(null);
  const [highScores, setHighScores] = useState({ 5: 0, 4: 0, 3: 0 });

  const handleStartGame = (grade) => {
    setSelectedGrade(grade);
    setGameState(GAME_STATES.PLAYING);
  };

  const handleGameEnd = (result) => {
    setGameResult(result);
    if (result.score > highScores[selectedGrade]) {
      setHighScores(prev => ({ ...prev, [selectedGrade]: result.score }));
    }
    setGameState(GAME_STATES.RESULT);
  };

  const handleExit = () => {
    setGameState(GAME_STATES.MENU);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {gameState === GAME_STATES.MENU && (
        <MainMenu onStartGame={handleStartGame} highScores={highScores} />
      )}
      {gameState === GAME_STATES.PLAYING && (
        <GameScreen 
          grade={selectedGrade} 
          onGameEnd={handleGameEnd} 
          onExit={handleExit}
        />
      )}
      {gameState === GAME_STATES.RESULT && (
        <ResultScreen 
          result={gameResult} 
          grade={selectedGrade}
          onRetry={() => setGameState(GAME_STATES.PLAYING)}
          onMenu={() => { setGameState(GAME_STATES.MENU); setGameResult(null); }}
          highScore={highScores[selectedGrade]}
        />
      )}
    </>
  );
}
