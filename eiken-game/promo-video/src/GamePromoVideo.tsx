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
  hookText: z.string(),
  accentColor: z.string(),
  secondaryColor: z.string(),
  highlightColor: z.string(),
  goldColor: z.string(),
  gameUrl: z.string(),
});

type PromoProps = z.infer<typeof GamePromoSchema>;

// --- Confetti particle ---
const ConfettiParticle: React.FC<{
  frame: number;
  startFrame: number;
  x: number;
  color: string;
  delay: number;
  speed: number;
  angle: number;
  size: number;
}> = ({ frame, startFrame, x, color, delay, speed, angle, size }) => {
  const localFrame = frame - startFrame - delay;
  if (localFrame < 0 || localFrame > 30) return null;

  const progress = localFrame / 30;
  const dx = Math.cos(angle) * speed * progress;
  const dy = Math.sin(angle) * speed * progress - 200 * progress * progress;

  return (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: 960 - dy,
        width: size,
        height: size * 0.6,
        background: color,
        borderRadius: 2,
        opacity: 1 - progress,
        rotate: `${localFrame * 15}deg`,
      }}
    />
  );
};

// --- Scene 1: Hook - "英検の勉強、つまんない？" ---
const HookScene: React.FC<{
  hookText: string;
  accentColor: string;
  highlightColor: string;
}> = ({ hookText, accentColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text slams in
  const textScale = interpolate(frame, [0, 6], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const textOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Screen shake on impact
  const shakeX = frame < 10 ? Math.sin(frame * 8) * interpolate(frame, [3, 10], [6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  // Desaturated, boring colors for "before" state
  const bgBrightness = interpolate(frame, [0, 0.5 * fps], [0.4, 0.5], {
    extrapolateRight: "clamp",
  });

  // Boring textbook emoji fading in behind
  const bookOpacity = interpolate(frame, [8, 20], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e, #2d2b55)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        filter: `brightness(${bgBrightness})`,
        translate: `${shakeX}px 0px`,
      }}
    >
      {/* Boring textbook in background */}
      <div style={{ position: "absolute", fontSize: 200, opacity: bookOpacity }}>
        📖
      </div>

      {/* Hook text - big, bold, takes up 60%+ of screen */}
      <div
        style={{
          opacity: textOpacity,
          scale: String(textScale),
          fontSize: 100,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.3,
          padding: "0 60px",
          textShadow: `0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        {hookText}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 2: Color burst transition + Quiz rapid-fire ---
const QuizRapidFireScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 rapid questions answered correctly
  const questions = [
    { q: "「りんご」", a: "apple", emoji: "🍎" },
    { q: "「犬」", a: "dog", emoji: "🐕" },
    { q: "「学校」", a: "school", emoji: "🏫" },
  ];

  const questionDuration = 0.8 * fps; // each question takes 0.8s

  // Combo counter
  const currentCombo = frame < questionDuration ? 1
    : frame < questionDuration * 2 ? 2
    : 3;

  // Flash effect on each correct answer
  const flashPoints = [0.5 * fps, 0.5 * fps + questionDuration, 0.5 * fps + questionDuration * 2];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1a1a2e, ${accentColor}55)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      {/* Combo display - top right */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: currentCombo >= 3 ? goldColor : secondaryColor,
            textShadow: `0 0 30px ${currentCombo >= 3 ? goldColor : secondaryColor}88`,
            scale: String(
              currentCombo >= 3
                ? interpolate(frame % 8, [0, 4, 8], [1, 1.1, 1], { extrapolateRight: "clamp" })
                : 1
            ),
          }}
        >
          {currentCombo}x
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: highlightColor,
          }}
        >
          COMBO!
        </div>
      </div>

      {/* Timer bar at top */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 80,
          right: 200,
          height: 12,
          borderRadius: 6,
          background: "rgba(255,255,255,0.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${interpolate(frame, [0, 2.5 * fps], [100, 30], { extrapolateRight: "clamp" })}%`,
            height: "100%",
            borderRadius: 6,
            background: `linear-gradient(90deg, ${secondaryColor}, ${accentColor})`,
          }}
        />
      </div>

      {/* Rapid question cards */}
      {questions.map((q, i) => {
        const qStart = i * questionDuration;
        const qEnd = qStart + questionDuration;
        const isActive = frame >= qStart && frame < qEnd;
        const isPast = frame >= qEnd;

        if (!isActive && !isPast) return null;
        if (isPast && i < questions.length - 1) return null;

        const localFrame = frame - qStart;
        const answered = localFrame > 0.4 * fps;

        const cardScale = interpolate(localFrame, [0, 8], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });

        return (
          <React.Fragment key={i}>
            {/* Question card */}
            <div
              style={{
                scale: String(cardScale),
                padding: "40px 60px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.08)",
                border: `3px solid ${accentColor}66`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 80, marginBottom: 16 }}>{q.emoji}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: "white" }}>
                {q.q}は英語で？
              </div>
            </div>

            {/* Answer buttons - 2x2 grid */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                justifyContent: "center",
                width: "90%",
                maxWidth: 900,
              }}
            >
              {[q.a, "wrong1", "wrong2", "wrong3"].map((opt, j) => {
                const isCorrect = j === 0;
                const optDelay = 4 + j * 3;
                const optOpacity = interpolate(localFrame, [optDelay, optDelay + 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

                let bg = "rgba(255,255,255,0.08)";
                let border = "rgba(255,255,255,0.15)";
                if (answered && isCorrect) {
                  bg = `${secondaryColor}44`;
                  border = secondaryColor;
                }

                return (
                  <div
                    key={j}
                    style={{
                      opacity: optOpacity,
                      width: "44%",
                      padding: "24px 16px",
                      borderRadius: 18,
                      background: bg,
                      border: `3px solid ${border}`,
                      fontSize: 40,
                      fontWeight: 700,
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    {isCorrect ? q.a : ["orange", "banana", "cat", "park", "house", "bird"][j + i * 2]}
                    {answered && isCorrect && " ✓"}
                  </div>
                );
              })}
            </div>

            {/* Correct flash */}
            {answered && (
              <div
                style={{
                  position: "absolute",
                  fontSize: 64,
                  fontWeight: 900,
                  color: secondaryColor,
                  opacity: interpolate(localFrame, [0.4 * fps, 0.6 * fps], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  scale: String(interpolate(localFrame, [0.4 * fps, 0.55 * fps], [2, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })),
                  bottom: 200,
                  textShadow: `0 0 40px ${secondaryColor}88`,
                }}
              >
                正解！ +150 XP
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Confetti on combo 3 */}
      {frame >= questionDuration * 2 + 0.4 * fps && (
        <>
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              frame={frame}
              startFrame={Math.floor(questionDuration * 2 + 0.4 * fps)}
              x={540 + (Math.sin(i * 1.7) * 300)}
              color={["#ff6b9d", "#ffd93d", "#00d9ff", "#6bff8e", "#c44eff", "#ff8e53"][i % 6]}
              delay={Math.floor(i * 0.5)}
              speed={100 + (i % 5) * 40}
              angle={-Math.PI / 2 + (i - 10) * 0.15}
              size={8 + (i % 4) * 3}
            />
          ))}
        </>
      )}
    </AbsoluteFill>
  );
};

// --- Scene 3: Level Up + Game Modes showcase ---
const LevelUpScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Level up burst
  const burstScale = interpolate(frame, [0, 10], [0, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const burstSettle = interpolate(frame, [10, 18], [1.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lvScale = frame < 10 ? burstScale : burstSettle;

  // XP bar filling
  const xpProgress = interpolate(frame, [6, 0.8 * fps], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Screen flash on level up
  const flashOpacity = interpolate(frame, [0, 3, 12], [0.8, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Game mode cards slide in
  const modes = [
    { name: "Normal", desc: "10問チャレンジ", icon: "📝", color: secondaryColor },
    { name: "Time Attack", desc: "60秒で何問解ける？", icon: "⏱️", color: highlightColor },
    { name: "Survival", desc: "3ライフで生き残れ！", icon: "❤️", color: "#ff4444" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e, ${accentColor}33)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: goldColor,
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Level Up Banner */}
      <div
        style={{
          scale: String(lvScale),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, color: secondaryColor }}>
          LEVEL UP!
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: goldColor,
            textShadow: `0 0 50px ${goldColor}66, 0 4px 20px rgba(0,0,0,0.3)`,
            lineHeight: 1,
          }}
        >
          Lv.5
        </div>
      </div>

      {/* XP Bar */}
      <div
        style={{
          width: "75%",
          height: 24,
          borderRadius: 12,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${xpProgress}%`,
            height: "100%",
            borderRadius: 12,
            background: `linear-gradient(90deg, ${secondaryColor}, ${goldColor})`,
            boxShadow: `0 0 20px ${goldColor}66`,
          }}
        />
      </div>

      {/* Game Modes */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "85%",
          marginTop: 20,
        }}
      >
        {modes.map((mode, i) => {
          const delay = 0.8 * fps + i * 8;
          const modeOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const modeX = interpolate(frame, [delay, delay + 12], [80, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });

          return (
            <div
              key={i}
              style={{
                opacity: modeOpacity,
                translate: `${modeX}px 0px`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "22px 36px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.06)",
                border: `2px solid ${mode.color}44`,
              }}
            >
              <span style={{ fontSize: 48 }}>{mode.icon}</span>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: mode.color }}>
                  {mode.name}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                  {mode.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 4: Streak + Daily + Grade showcase ---
const EngagementScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Streak counter animation
  const streakNum = interpolate(frame, [0, 0.5 * fps], [0, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Grade badges
  const grades = [
    { level: "5級", color: "#00d9ff", label: "243問", sub: "基礎単語・文法" },
    { level: "4級", color: "#ffd93d", label: "375問", sub: "中級英語" },
    { level: "3級", color: "#ff6b9d", label: "570問", sub: "上級英語" },
  ];

  // Mascot
  const mascotBounce = Math.sin(frame * 0.2) * 8;

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
      }}
    >
      {/* Streak display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span style={{ fontSize: 64 }}>🔥</span>
        <div>
          <div style={{ fontSize: 72, fontWeight: 900, color: goldColor }}>
            {Math.floor(streakNum)}日連続
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
            デイリーストリーク
          </div>
        </div>
      </div>

      {/* Daily challenge badge */}
      <div
        style={{
          opacity: interpolate(frame, [0.5 * fps, 0.5 * fps + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: String(interpolate(frame, [0.5 * fps, 0.5 * fps + 12], [0.5, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })),
          padding: "16px 40px",
          borderRadius: 16,
          background: `linear-gradient(135deg, ${accentColor}44, ${highlightColor}44)`,
          border: `2px solid ${secondaryColor}66`,
          fontSize: 36,
          fontWeight: 900,
          color: secondaryColor,
          textAlign: "center",
        }}
      >
        📅 今日のデイリーチャレンジ
      </div>

      {/* Grade cards */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 10,
        }}
      >
        {grades.map((g, i) => {
          const delay = 0.7 * fps + i * 10;
          const cardOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(frame, [delay, delay + 12], [40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                translate: `0px ${cardY}px`,
                width: 260,
                padding: "28px 16px",
                borderRadius: 24,
                background: "rgba(255,255,255,0.06)",
                border: `3px solid ${g.color}66`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: g.color }}>
                {g.level}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "white", marginTop: 8 }}>
                {g.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                {g.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mascot */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 80,
          translate: `0px ${mascotBounce}px`,
          opacity: interpolate(frame, [1 * fps, 1.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, lineHeight: 1 }}>(★‿★)</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: secondaryColor,
            background: "rgba(0,0,0,0.5)",
            padding: "8px 16px",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          すごい！天才！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 5: CTA ---
const CTAScene: React.FC<{
  gameName: string;
  gameNameJa: string;
  tagline: string;
  gameUrl: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ gameName, gameNameJa, tagline, gameUrl, accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 0.4 * fps], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const buttonScale = interpolate(frame, [0.5 * fps, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const pulse = Math.sin(frame * 0.15) * 0.04 + 1;

  // Rank badge
  const rankOpacity = interpolate(frame, [0.3 * fps, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${accentColor}, #1a1a2e, ${highlightColor}66)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Glow rings */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `2px solid ${goldColor}22`,
          scale: String(pulse * 1.2),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          border: `1px solid ${secondaryColor}11`,
          scale: String(pulse * 1.1),
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: contentOpacity,
          scale: String(titleScale),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 900, color: "white", lineHeight: 1.1, textShadow: `0 4px 30px ${accentColor}` }}>
          {gameNameJa}
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: secondaryColor, marginTop: 8 }}>
          {gameName}
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: rankOpacity,
          fontSize: 52,
          fontWeight: 900,
          color: goldColor,
          textAlign: "center",
          textShadow: `0 0 30px ${goldColor}44`,
        }}
      >
        {tagline}
      </div>

      {/* CTA Button */}
      <div
        style={{
          scale: String(buttonScale * pulse),
          padding: "32px 80px",
          borderRadius: 100,
          background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
          fontSize: 52,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 8px 40px ${highlightColor}66`,
        }}
      >
        今すぐ遊んでみよう！
      </div>

      {/* URL */}
      <div
        style={{
          opacity: contentOpacity,
          fontSize: 28,
          color: "rgba(255,255,255,0.5)",
          marginTop: 8,
        }}
      >
        {gameUrl}
      </div>

      {/* WISE branding */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          fontSize: 28,
          fontWeight: 700,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        WISE English Club
      </div>
    </AbsoluteFill>
  );
};

// --- Main Composition: 5 scenes ---
export const GamePromoVideo: React.FC<PromoProps> = (props) => {
  return (
    <TransitionSeries>
      {/* Scene 1: Hook (1.5s) */}
      <TransitionSeries.Sequence durationInFrames={45}>
        <HookScene
          hookText={props.hookText}
          accentColor={props.accentColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>

      {/* Hard cut - no transition for impact */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 4 })}
      />

      {/* Scene 2: Quiz rapid-fire with combo (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <QuizRapidFireScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* Scene 3: Level Up + Game Modes (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <LevelUpScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* Scene 4: Engagement (streak, daily, grades) (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <EngagementScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 8 })}
      />

      {/* Scene 5: CTA (2s) */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <CTAScene
          gameName={props.gameName}
          gameNameJa={props.gameNameJa}
          tagline={props.tagline}
          gameUrl={props.gameUrl}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
