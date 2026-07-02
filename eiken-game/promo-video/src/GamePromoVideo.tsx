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
import { LightLeak } from "@remotion/light-leaks";
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

// App-matching backgrounds
const BG_MAIN =
  "radial-gradient(circle at 20% 20%, rgba(196,78,255,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,107,157,0.15) 0%, transparent 40%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)";
const BG_GAME =
  "linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 60%, #252542 100%)";
const BG_RESULT =
  "radial-gradient(circle at 50% 30%, rgba(255,217,61,0.1) 0%, transparent 50%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)";
const PANEL_BG = "rgba(37,37,66,0.9)";

// ─── Floating Particles Background ───
const FloatingParticles: React.FC<{ frame: number; count?: number; color?: string }> = ({
  frame,
  count = 25,
  color = "rgba(108,92,231,0.3)",
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const seed = i * 137.508;
        const x = ((seed * 7) % 1080);
        const baseY = ((seed * 11) % 1920);
        const size = 3 + (i % 5) * 2;
        const speed = 0.3 + (i % 4) * 0.15;
        const y = (baseY - frame * speed * 2) % 2100;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y < -20 ? y + 2100 : y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: 0.4 + Math.sin(frame * 0.05 + i) * 0.3,
            }}
          />
        );
      })}
    </>
  );
};

// ─── Confetti System ───
const ConfettiExplosion: React.FC<{
  frame: number;
  startFrame: number;
  centerX?: number;
  centerY?: number;
}> = ({ frame, startFrame, centerX = 540, centerY = 960 }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame > 35) return null;
  const progress = localFrame / 35;
  const colors = ["#ff6b9d", "#ffd93d", "#00d9ff", "#6bff8e", "#c44eff", "#ff8e53"];

  return (
    <>
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2 + (i * 0.3);
        const speed = 120 + (i % 6) * 50;
        const dx = Math.cos(angle) * speed * progress;
        const dy = Math.sin(angle) * speed * progress + 300 * progress * progress;
        const size = 6 + (i % 4) * 3;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: centerX + dx,
              top: centerY + dy,
              width: size,
              height: size * 0.6,
              background: colors[i % colors.length],
              borderRadius: 2,
              opacity: interpolate(progress, [0, 0.7, 1], [1, 1, 0]),
              rotate: `${localFrame * 18 + i * 30}deg`,
            }}
          />
        );
      })}
    </>
  );
};

// ─── Cinematic Flash Overlay ───
const FlashOverlay: React.FC<{
  frame: number;
  triggerFrame: number;
  color?: string;
  duration?: number;
}> = ({ frame, triggerFrame, color = "white", duration = 10 }) => {
  const localFrame = frame - triggerFrame;
  if (localFrame < 0 || localFrame > duration) return null;

  return (
    <AbsoluteFill
      style={{
        background: color,
        opacity: interpolate(localFrame, [0, 3, duration], [0.9, 0.6, 0], {
          extrapolateRight: "clamp",
        }),
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Gradient Text Component ───
const GradientText: React.FC<{
  children: React.ReactNode;
  from: string;
  to: string;
  fontSize: number;
  style?: React.CSSProperties;
}> = ({ children, from, to, fontSize, style }) => (
  <div
    style={{
      fontSize,
      fontWeight: 900,
      fontFamily,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      filter: `drop-shadow(0 0 20px ${from}88)`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ═══════════════════════════════════════════
// Scene 1: HOOK — 「英検の勉強つまんない？」
// ═══════════════════════════════════════════
const HookScene: React.FC<{
  hookText: string;
  accentColor: string;
  highlightColor: string;
}> = ({ hookText, accentColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cinematic zoom-in on text
  const textScale = interpolate(frame, [0, 8], [4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const textOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Impact shake
  const shakeX =
    frame < 12
      ? Math.sin(frame * 10) *
        interpolate(frame, [4, 12], [8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Vignette darkens
  const vignetteOpacity = interpolate(frame, [0, 0.5 * fps], [0.3, 0.6], {
    extrapolateRight: "clamp",
  });

  // Subtle camera drift
  const driftScale = interpolate(frame, [0, 1.5 * fps], [1, 1.03], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: BG_MAIN,
        fontFamily,
        scale: String(driftScale),
        translate: `${shakeX}px 0px`,
      }}
    >
      <FloatingParticles frame={frame} count={15} color="rgba(255,107,157,0.2)" />

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Hook text — huge, center screen */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            scale: String(textScale),
            fontSize: 110,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.35,
            padding: "0 80px",
            textShadow: "0 6px 30px rgba(0,0,0,0.8)",
            whiteSpace: "pre-line",
          }}
        >
          {hookText}
        </div>
      </AbsoluteFill>

      <FlashOverlay frame={frame} triggerFrame={3} color="white" duration={8} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Scene 2: GAMEPLAY — rapid-fire quiz + combo
// ═══════════════════════════════════════════
const QuizRapidFireScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questions = [
    { q: "「りんご」", a: "apple", emoji: "🍎", wrongs: ["orange", "banana", "grape"] },
    { q: "「犬」", a: "dog", emoji: "🐕", wrongs: ["cat", "bird", "fish"] },
    { q: "「学校」", a: "school", emoji: "🏫", wrongs: ["house", "park", "store"] },
  ];

  const qDur = 0.8 * fps;
  const answerDelay = 0.35 * fps;
  const currentQ = Math.min(Math.floor(frame / qDur), 2);
  const localFrame = frame - currentQ * qDur;
  const answered = localFrame > answerDelay;
  const combo = currentQ + 1;

  const q = questions[currentQ];

  // Camera zoom-in per correct answer
  const zoomLevel = 1 + currentQ * 0.02;

  // Combo glow intensity
  const comboGlow = combo >= 3 ? `0 0 60px ${goldColor}66` : `0 0 30px ${secondaryColor}44`;

  return (
    <AbsoluteFill
      style={{
        background: BG_GAME,
        fontFamily,
        scale: String(zoomLevel),
      }}
    >
      <FloatingParticles frame={frame} count={20} color="rgba(0,206,206,0.15)" />

      {/* Timer bar — cinematic thin line at very top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: `${interpolate(frame, [0, 2.5 * fps], [100, 20], { extrapolateRight: "clamp" })}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${secondaryColor}, ${accentColor})`,
            boxShadow: `0 0 15px ${secondaryColor}`,
          }}
        />
      </div>

      {/* Combo badge — top right, glassmorphism */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 60,
          padding: "16px 28px",
          borderRadius: 20,
          background: PANEL_BG,
          border: `2px solid ${combo >= 3 ? goldColor : secondaryColor}44`,
          boxShadow: comboGlow,
          textAlign: "center",
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: combo >= 3 ? goldColor : secondaryColor,
            lineHeight: 1,
            scale: String(
              combo >= 3
                ? interpolate(frame % 10, [0, 5, 10], [1, 1.08, 1])
                : 1
            ),
          }}
        >
          {combo}x
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: highlightColor, marginTop: 4 }}>
          COMBO
        </div>
      </div>

      {/* Question + answers */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: "0 60px",
        }}
      >
        {/* Question card */}
        <div
          style={{
            opacity: interpolate(localFrame, [0, 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: String(
              interpolate(localFrame, [0, 8], [0.85, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              })
            ),
            padding: "36px 56px",
            borderRadius: 28,
            background: PANEL_BG,
            border: `2px solid ${accentColor}44`,
            textAlign: "center",
            boxShadow: `0 10px 40px rgba(0,0,0,0.3)`,
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 12 }}>{q.emoji}</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: "white" }}>
            {q.q}は英語で？
          </div>
        </div>

        {/* Answer grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            justifyContent: "center",
            width: "100%",
            maxWidth: 880,
          }}
        >
          {[q.a, ...q.wrongs].map((opt, j) => {
            const optDelay = 4 + j * 3;
            const optOpacity = interpolate(localFrame, [optDelay, optDelay + 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isCorrect = j === 0;
            const tapped = answered && isCorrect;

            return (
              <div
                key={j}
                style={{
                  opacity: optOpacity,
                  width: "46%",
                  padding: "24px 16px",
                  borderRadius: 18,
                  background: tapped ? `${secondaryColor}33` : PANEL_BG,
                  border: `3px solid ${tapped ? secondaryColor : "rgba(255,255,255,0.1)"}`,
                  boxShadow: tapped ? `0 0 25px ${secondaryColor}44` : "none",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "white",
                  textAlign: "center",
                  scale: String(
                    tapped
                      ? interpolate(localFrame, [answerDelay, answerDelay + 6], [1, 1.05], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                        })
                      : 1
                  ),
                }}
              >
                {opt}
                {tapped && <span style={{ marginLeft: 10, color: secondaryColor }}>✓</span>}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* "正解!" feedback — big cinematic pop */}
      {answered && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 220,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              opacity: interpolate(localFrame, [answerDelay, answerDelay + 5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: String(
                interpolate(localFrame, [answerDelay, answerDelay + 8], [2.5, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })
              ),
            }}
          >
            <GradientText from={secondaryColor} to={goldColor} fontSize={60}>
              正解！ +{100 + combo * 50} XP
            </GradientText>
          </div>
        </AbsoluteFill>
      )}

      {/* Confetti on combo 3 */}
      <ConfettiExplosion frame={frame} startFrame={Math.floor(qDur * 2 + answerDelay)} />

      {/* Flash on each correct */}
      <FlashOverlay frame={frame} triggerFrame={Math.floor(answerDelay)} color={secondaryColor} duration={6} />
      <FlashOverlay frame={frame} triggerFrame={Math.floor(qDur + answerDelay)} color={secondaryColor} duration={6} />
      <FlashOverlay frame={frame} triggerFrame={Math.floor(qDur * 2 + answerDelay)} color={goldColor} duration={10} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Scene 3: LEVEL UP + Game Modes
// ═══════════════════════════════════════════
const LevelUpScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Level up number pop
  const lvPop = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // XP bar
  const xpWidth = interpolate(frame, [8, 0.7 * fps], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Pulsing glow ring around Lv number
  const ringScale = 1 + Math.sin(frame * 0.15) * 0.08;

  const modes = [
    { name: "Normal", desc: "10問チャレンジ", icon: "📝", color: secondaryColor },
    { name: "Time Attack", desc: "60秒で何問解ける？", icon: "⏱️", color: highlightColor },
    { name: "Survival", desc: "3ライフで生き残れ！", icon: "❤️", color: "#ff4444" },
  ];

  return (
    <AbsoluteFill style={{ background: BG_RESULT, fontFamily }}>
      <FloatingParticles frame={frame} count={20} color={`${goldColor}22`} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: `3px solid ${goldColor}33`,
            scale: String(ringScale),
            top: 280,
          }}
        />

        {/* LEVEL UP */}
        <div style={{ scale: String(lvPop), textAlign: "center" }}>
          <GradientText from={secondaryColor} to={goldColor} fontSize={48} style={{ marginBottom: 8 }}>
            LEVEL UP!
          </GradientText>
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              color: goldColor,
              textShadow: `0 0 60px ${goldColor}66, 0 4px 20px rgba(0,0,0,0.5)`,
              lineHeight: 1,
            }}
          >
            Lv.5
          </div>
        </div>

        {/* XP Bar — glassmorphism */}
        <div
          style={{
            width: "72%",
            height: 20,
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              width: `${xpWidth}%`,
              height: "100%",
              borderRadius: 10,
              background: `linear-gradient(90deg, ${secondaryColor}, ${goldColor})`,
              boxShadow: `0 0 20px ${goldColor}44`,
            }}
          />
        </div>

        {/* Game Modes — slick cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "82%",
            marginTop: 24,
          }}
        >
          {modes.map((mode, i) => {
            const delay = 0.6 * fps + i * 6;
            const mOpacity = interpolate(frame, [delay, delay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const mX = interpolate(frame, [delay, delay + 10], [60, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });

            return (
              <div
                key={i}
                style={{
                  opacity: mOpacity,
                  translate: `${mX}px 0px`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "20px 32px",
                  borderRadius: 20,
                  background: PANEL_BG,
                  border: `1px solid ${mode.color}33`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
                }}
              >
                <span style={{ fontSize: 44 }}>{mode.icon}</span>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: mode.color }}>
                    {mode.name}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                    {mode.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <FlashOverlay frame={frame} triggerFrame={0} color={goldColor} duration={12} />
      <ConfettiExplosion frame={frame} startFrame={2} centerY={500} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Scene 4: ENGAGEMENT — streak, daily, grades
// ═══════════════════════════════════════════
const EngagementScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const streakNum = interpolate(frame, [0, 0.4 * fps], [0, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const grades = [
    { level: "5級", color: "#00d9ff", label: "243問", sub: "基礎" },
    { level: "4級", color: "#ffd93d", label: "375問", sub: "中級" },
    { level: "3級", color: "#ff6b9d", label: "570問", sub: "上級" },
  ];

  const mascotY = Math.sin(frame * 0.2) * 6;

  return (
    <AbsoluteFill style={{ background: BG_MAIN, fontFamily }}>
      <FloatingParticles frame={frame} count={18} color="rgba(196,78,255,0.15)" />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Streak — cinematic counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 40px",
            borderRadius: 24,
            background: PANEL_BG,
            border: `1px solid ${goldColor}33`,
            boxShadow: `0 0 30px ${goldColor}22`,
            opacity: interpolate(frame, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: String(
              interpolate(frame, [0, 10], [0.8, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              })
            ),
          }}
        >
          <span style={{ fontSize: 56 }}>🔥</span>
          <div>
            <div style={{ fontSize: 64, fontWeight: 900, color: goldColor, lineHeight: 1 }}>
              {Math.floor(streakNum)}日連続
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              デイリーストリーク
            </div>
          </div>
        </div>

        {/* Daily challenge */}
        <div
          style={{
            opacity: interpolate(frame, [0.4 * fps, 0.4 * fps + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: String(
              interpolate(frame, [0.4 * fps, 0.4 * fps + 10], [0.5, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              })
            ),
            padding: "16px 36px",
            borderRadius: 18,
            background: PANEL_BG,
            border: `1px solid ${secondaryColor}33`,
            fontSize: 34,
            fontWeight: 900,
            color: secondaryColor,
          }}
        >
          📅 今日のデイリーチャレンジ
        </div>

        {/* Grade cards — cinematic stagger */}
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          {grades.map((g, i) => {
            const delay = 0.6 * fps + i * 8;
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(frame, [delay, delay + 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: `0px ${interpolate(frame, [delay, delay + 10], [30, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                  })}px`,
                  width: 240,
                  padding: "28px 16px",
                  borderRadius: 24,
                  background: PANEL_BG,
                  border: `2px solid ${g.color}44`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 900, color: g.color }}>{g.level}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "white", marginTop: 6 }}>{g.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{g.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Mascot */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 80,
            translate: `0px ${mascotY}px`,
            opacity: interpolate(frame, [0.8 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56, lineHeight: 1 }}>(★‿★)</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: secondaryColor,
              background: PANEL_BG,
              padding: "8px 16px",
              borderRadius: 12,
              marginTop: 6,
            }}
          >
            すごい！天才！
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Scene 5: CTA — cinematic end card
// ═══════════════════════════════════════════
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

  const revealProgress = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const buttonPop = interpolate(frame, [0.4 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  const pulse = Math.sin(frame * 0.15) * 0.03 + 1;

  return (
    <AbsoluteFill style={{ background: BG_RESULT, fontFamily }}>
      <FloatingParticles frame={frame} count={30} color="rgba(196,78,255,0.12)" />

      {/* Animated glow rings */}
      {[400, 600, 800].map((size, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - size / 2,
            top: 960 - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1px solid ${[goldColor, secondaryColor, accentColor][i]}15`,
            scale: String(1 + Math.sin(frame * 0.08 + i * 2) * 0.05),
          }}
        />
      ))}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: revealProgress,
            scale: String(interpolate(revealProgress, [0, 1], [0.8, 1])),
            textAlign: "center",
          }}
        >
          <GradientText from="#00d9ff" to="#00f5d4" fontSize={100} style={{ lineHeight: 1.1 }}>
            英検
          </GradientText>
          <GradientText from="#ff6b9d" to="#c44eff" fontSize={100} style={{ lineHeight: 1.1, marginTop: -8 }}>
            クエスト
          </GradientText>
          <div style={{ fontSize: 40, fontWeight: 700, color: secondaryColor, marginTop: 8 }}>
            {gameName}
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: interpolate(frame, [0.3 * fps, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            fontSize: 52,
            fontWeight: 900,
            color: goldColor,
            textShadow: `0 0 30px ${goldColor}44`,
            textAlign: "center",
          }}
        >
          {tagline}
        </div>

        {/* CTA Button */}
        <div
          style={{
            scale: String(buttonPop * pulse),
            padding: "30px 72px",
            borderRadius: 100,
            background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
            fontSize: 48,
            fontWeight: 900,
            color: "white",
            boxShadow: `0 10px 50px ${highlightColor}55, 0 4px 15px rgba(0,0,0,0.3)`,
          }}
        >
          今すぐ遊んでみよう！
        </div>

        <div
          style={{
            opacity: revealProgress * 0.5,
            fontSize: 26,
            color: "rgba(255,255,255,0.4)",
            marginTop: 8,
          }}
        >
          {gameUrl}
        </div>
      </AbsoluteFill>

      {/* WISE branding */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          width: "100%",
          textAlign: "center",
          fontSize: 26,
          fontWeight: 700,
          color: "rgba(255,255,255,0.25)",
        }}
      >
        WISE English Club
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Main Composition — with light leak overlays
// ═══════════════════════════════════════════
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

      {/* Light leak transition */}
      <TransitionSeries.Overlay durationInFrames={20}>
        <LightLeak seed={1} hueShift={270} />
      </TransitionSeries.Overlay>

      {/* Scene 2: Quiz rapid-fire (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <QuizRapidFireScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      {/* Light leak transition */}
      <TransitionSeries.Overlay durationInFrames={24}>
        <LightLeak seed={3} hueShift={60} />
      </TransitionSeries.Overlay>

      {/* Scene 3: Level Up + Modes (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <LevelUpScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      {/* Fade transition */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 4: Engagement (2.5s) */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <EngagementScene
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      {/* Light leak to CTA */}
      <TransitionSeries.Overlay durationInFrames={20}>
        <LightLeak seed={7} hueShift={300} />
      </TransitionSeries.Overlay>

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
