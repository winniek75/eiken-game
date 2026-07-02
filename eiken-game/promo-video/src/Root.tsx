import "./index.css";
import { Composition } from "remotion";
import { GamePromoVideo, GamePromoSchema } from "./GamePromoVideo";
import { GameTutorialVideo, GameTutorialSchema } from "./GameTutorialVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GamePromo"
        component={GamePromoVideo}
        schema={GamePromoSchema}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          gameName: "Eiken Quest",
          gameNameJa: "英検クエスト",
          tagline: "楽しく英単語マスター！",
          description: "英検5級〜3級の単語・文法を\nクイズ形式で楽しく学べる！",
          features: [
            "100問以上の英検対策クイズ",
            "3つのゲームモード",
            "XP・レベルアップシステム",
            "デイリーチャレンジ",
          ],
          accentColor: "#6C5CE7",
          secondaryColor: "#00CECE",
          highlightColor: "#FF6B9D",
          gameUrl: "eiken-game-winniek75s-projects.vercel.app",
          category: "Vocabulary",
        }}
      />
      <Composition
        id="GameTutorial"
        component={GameTutorialVideo}
        schema={GameTutorialSchema}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          gameName: "Eiken Quest",
          gameNameJa: "英検クエスト",
          accentColor: "#6C5CE7",
          secondaryColor: "#00CECE",
          highlightColor: "#FF6B9D",
          steps: [
            {
              title: "級を選ぼう",
              description: "5級・4級・3級から\nレベルを選択！",
              emoji: "🎯",
            },
            {
              title: "問題に答えよう",
              description: "4つの選択肢から\n正しい答えをタップ！",
              emoji: "✅",
            },
            {
              title: "コンボをつなげよう",
              description: "連続正解でコンボ発動！\nボーナスXPゲット！",
              emoji: "🔥",
            },
            {
              title: "レベルアップ！",
              description: "XPを貯めてレベルアップ！\nデイリーチャレンジも！",
              emoji: "⭐",
            },
          ],
        }}
      />
    </>
  );
};
