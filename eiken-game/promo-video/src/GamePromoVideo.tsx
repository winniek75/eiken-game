import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Sequence,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "japanese"],
});

export const GamePromoSchema = z.object({
  gameName: z.string(),
  gameNameJa: z.string(),
  tagline: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  accentColor: z.string(),
  secondaryColor: z.string(),
  highlightColor: z.string(),
  gameUrl: z.string(),
  category: z.string(),
});

type PromoProps = z.infer<typeof GamePromoSchema>;

// --- Scene: Title ---
const TitleScene: React.FC<{
  gameName: string;
  gameNameJa: string;
  tagline: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
}> = ({ gameName, gameNameJa, tagline, accentColor, secondaryColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const logoRotate = interpolate(frame, [0, 0.6 * fps], [-10, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const titleOpacity = interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [0.4 * fps, 0.8 * fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const taglineOpacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgGlow = interpolate(frame, [0, 2 * fps], [0, 360], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${bgGlow}deg, ${accentColor}, #1a1a2e, ${secondaryColor})`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${highlightColor}33, transparent)`,
          top: -100,
          right: -100,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor}33, transparent)`,
          bottom: -80,
          left: -80,
        }}
      />

      {/* Logo / Emoji */}
      <div
        style={{
          fontSize: 120,
          scale: String(logoScale),
          rotate: `${logoRotate}deg`,
        }}
      >
        📚
      </div>

      {/* Game Name */}
      <div
        style={{
          opacity: titleOpacity,
          translate: `0px ${titleY}px`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "white",
            textShadow: `0 4px 30px ${accentColor}88`,
            lineHeight: 1.1,
          }}
        >
          {gameNameJa}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: secondaryColor,
            marginTop: 10,
          }}
        >
          {gameName}
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          fontSize: 44,
          fontWeight: 700,
          color: highlightColor,
          textAlign: "center",
          padding: "12px 40px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene: Quiz Demo ---
const QuizDemoScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
}> = ({ accentColor, secondaryColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questionOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const options = ["apple", "orange", "banana", "grape"];
  const correctIndex = 0;

  const selectionFrame = 1.5 * fps;
  const selected = frame >= selectionFrame;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1a1a2e, ${accentColor}44)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        padding: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          fontSize: 36,
          fontWeight: 700,
          color: secondaryColor,
        }}
      >
        ゲーム画面イメージ
      </div>

      {/* Question */}
      <div
        style={{
          opacity: questionOpacity,
          fontSize: 56,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          padding: "30px 50px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.08)",
          border: `3px solid ${accentColor}66`,
        }}
      >
        🍎「りんご」は英語で？
      </div>

      {/* Options grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          justifyContent: "center",
          width: "100%",
          maxWidth: 800,
        }}
      >
        {options.map((opt, i) => {
          const optDelay = 0.3 * fps + i * 0.15 * fps;
          const optOpacity = interpolate(frame, [optDelay, optDelay + 0.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const optScale = interpolate(frame, [optDelay, optDelay + 0.3 * fps], [0.8, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });

          const isCorrect = i === correctIndex;
          let bg = "rgba(255,255,255,0.1)";
          let borderColor = "rgba(255,255,255,0.2)";

          if (selected && isCorrect) {
            bg = `${secondaryColor}44`;
            borderColor = secondaryColor;
          } else if (selected && !isCorrect) {
            bg = "rgba(255,255,255,0.05)";
          }

          return (
            <div
              key={i}
              style={{
                opacity: optOpacity,
                scale: String(optScale),
                width: "45%",
                padding: "28px 20px",
                borderRadius: 20,
                background: bg,
                border: `3px solid ${borderColor}`,
                fontSize: 44,
                fontWeight: 700,
                color: "white",
                textAlign: "center",
              }}
            >
              {opt}
              {selected && isCorrect && (
                <span style={{ marginLeft: 12 }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Correct feedback */}
      {selected && (
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: secondaryColor,
            opacity: interpolate(
              frame,
              [selectionFrame, selectionFrame + 0.3 * fps],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            scale: String(
              interpolate(
                frame,
                [selectionFrame, selectionFrame + 0.3 * fps],
                [1.5, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }
              )
            ),
          }}
        >
          正解！ +10 XP 🎉
        </div>
      )}
    </AbsoluteFill>
  );
};

// --- Scene: Features ---
const FeaturesScene: React.FC<{
  features: string[];
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
}> = ({ features, accentColor, secondaryColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const featureIcons = ["📝", "🎮", "⭐", "📅", "🏆", "🔥"];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e, ${accentColor}22)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: "white",
          marginBottom: 20,
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        ✨ 機能紹介
      </div>

      {features.map((feature, i) => {
        const delay = 0.3 * fps + i * 0.4 * fps;
        const opacity = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateX = interpolate(
          frame,
          [delay, delay + 0.4 * fps],
          [-60, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }
        );

        return (
          <div
            key={i}
            style={{
              opacity,
              translate: `${translateX}px 0px`,
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "24px 40px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: `2px solid ${accentColor}44`,
              width: "85%",
            }}
          >
            <span style={{ fontSize: 48 }}>
              {featureIcons[i % featureIcons.length]}
            </span>
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "white",
              }}
            >
              {feature}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// --- Scene: CTA ---
const CTAScene: React.FC<{
  gameName: string;
  gameUrl: string;
  category: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
}> = ({ gameName, gameUrl, category, accentColor, secondaryColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin(frame * 0.15) * 0.05 + 1;

  const contentOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonScale = interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${accentColor}, #1a1a2e, ${highlightColor}88)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${secondaryColor}22, transparent)`,
          scale: String(pulse),
        }}
      />

      <div style={{ opacity: contentOpacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: secondaryColor,
            marginBottom: 16,
          }}
        >
          {category}
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            color: "white",
            textShadow: `0 4px 30px ${accentColor}`,
          }}
        >
          {gameName}
        </div>
      </div>

      <div
        style={{
          scale: String(buttonScale),
          padding: "28px 80px",
          borderRadius: 100,
          background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
          fontSize: 48,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 8px 40px ${highlightColor}66`,
        }}
      >
        今すぐプレイ！
      </div>

      <div
        style={{
          opacity: contentOpacity,
          fontSize: 32,
          color: "rgba(255,255,255,0.6)",
          marginTop: 10,
        }}
      >
        {gameUrl}
      </div>

      {/* WISE branding */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          fontSize: 28,
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        WISE English Club
      </div>
    </AbsoluteFill>
  );
};

// --- Main Composition ---
export const GamePromoVideo: React.FC<PromoProps> = (props) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <TitleScene
          gameName={props.gameName}
          gameNameJa={props.gameNameJa}
          tagline={props.tagline}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      <TransitionSeries.Sequence durationInFrames={90}>
        <QuizDemoScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-left" })}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      <TransitionSeries.Sequence durationInFrames={105}>
        <FeaturesScene
          features={props.features}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      <TransitionSeries.Sequence durationInFrames={75}>
        <CTAScene
          gameName={props.gameName}
          gameUrl={props.gameUrl}
          category={props.category}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
