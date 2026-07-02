import "./index.css";
import { Composition } from "remotion";
import { GamePromoVideo, GamePromoSchema } from "./GamePromoVideo";
import { GameTutorialVideo, GameTutorialSchema } from "./GameTutorialVideo";

// Total promo: 45+90+75+75+60 - (4+8+8+8) = 317 frames @ 30fps = ~10.5s
// Total tutorial: 60 + 75*4 + 75 - (8*4+10) = 393 frames @ 30fps = ~13s

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GamePromo"
        component={GamePromoVideo}
        schema={GamePromoSchema}
        durationInFrames={317}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          gameName: "Eiken Quest",
          gameNameJa: "英検クエスト",
          tagline: "遊んでたら、受かってた。",
          hookText: "英検の勉強\nつまんない？",
          accentColor: "#6C5CE7",
          secondaryColor: "#00CECE",
          highlightColor: "#FF6B9D",
          goldColor: "#FFD700",
          gameUrl: "eiken-game-winniek75s-projects.vercel.app",
        }}
      />
      <Composition
        id="GameTutorial"
        component={GameTutorialVideo}
        schema={GameTutorialSchema}
        durationInFrames={393}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          gameName: "Eiken Quest",
          gameNameJa: "英検クエスト",
          accentColor: "#6C5CE7",
          secondaryColor: "#00CECE",
          highlightColor: "#FF6B9D",
          goldColor: "#FFD700",
          steps: [
            {
              title: "級を選ぼう！",
              description: "5級・4級・3級から\n自分のレベルを選ぶだけ",
              emoji: "🎯",
              visual: "grade-select",
            },
            {
              title: "答えをタップ！",
              description: "4つの選択肢から\n正解をタップするだけ",
              emoji: "👆",
              visual: "quiz-answer",
            },
            {
              title: "コンボをつなげ！",
              description: "連続正解でコンボ発動\nボーナスXPゲット",
              emoji: "🔥",
              visual: "combo-chain",
            },
            {
              title: "レベルアップ！",
              description: "XPを貯めてどんどん成長\nデイリーチャレンジも",
              emoji: "⭐",
              visual: "level-up",
            },
          ],
        }}
      />
    </>
  );
};
