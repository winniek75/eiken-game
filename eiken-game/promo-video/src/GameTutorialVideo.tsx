import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin", "japanese"],
});

export const GameTutorialSchema = z.object({
  gameName: z.string(),
  gameNameJa: z.string(),
  accentColor: z.string(),
  secondaryColor: z.string(),
  highlightColor: z.string(),
  goldColor: z.string(),
  steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      emoji: z.string(),
      visual: z.string(),
    })
  ),
});

type TutorialProps = z.infer<typeof GameTutorialSchema>;

// --- Scene: Hook Intro ---
const TutorialHookScene: React.FC<{
  gameNameJa: string;
  accentColor: string;
  secondaryColor: string;
  goldColor: string;
}> = ({ gameNameJa, accentColor, secondaryColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text slams in
  const hookScale = interpolate(frame, [0, 6], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const hookOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle fades in
  const subOpacity = interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subY = interpolate(frame, [0.5 * fps, 0.8 * fps], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Timer text
  const timerOpacity = interpolate(frame, [0.8 * fps, 1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${accentColor}, #1a1a2e)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Decorative ring */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: `3px solid ${secondaryColor}22`,
        }}
      />

      <div
        style={{
          opacity: hookOpacity,
          scale: String(hookScale),
          fontSize: 88,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          textShadow: `0 4px 30px ${accentColor}88`,
        }}
      >
        {gameNameJa}
      </div>

      <div
        style={{
          opacity: subOpacity,
          translate: `0px ${subY}px`,
          fontSize: 56,
          fontWeight: 900,
          color: goldColor,
          textShadow: `0 0 30px ${goldColor}44`,
        }}
      >
        遊び方、15秒で！
      </div>

      <div
        style={{
          opacity: timerOpacity,
          fontSize: 36,
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        ⏱️ カンタン4ステップ
      </div>
    </AbsoluteFill>
  );
};

// --- Scene: Interactive Tutorial Step ---
const TutorialStepScene: React.FC<{
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  emoji: string;
  visual: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({
  stepNumber,
  totalSteps,
  title,
  description,
  emoji,
  visual,
  accentColor,
  secondaryColor,
  highlightColor,
  goldColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step badge pops in
  const badgeScale = interpolate(frame, [0, 8], [0, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const badgeSettle = interpolate(frame, [8, 14], [1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Content slides up
  const contentOpacity = interpolate(frame, [6, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentY = interpolate(frame, [6, 16], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Visual demo area
  const visualOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visualScale = interpolate(frame, [12, 22], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const dots = Array.from({ length: totalSteps }, (_, i) => i);

  // Color based on step
  const stepColors = [secondaryColor, highlightColor, goldColor, accentColor];
  const stepColor = stepColors[(stepNumber - 1) % stepColors.length];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e, ${accentColor}22)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 60px 120px",
        gap: 24,
      }}
    >
      {/* Step badge */}
      <div
        style={{
          scale: String(frame < 8 ? badgeScale : badgeSettle),
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${stepColor}, ${accentColor})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 6px 30px ${stepColor}66`,
        }}
      >
        {stepNumber}
      </div>

      {/* Title */}
      <div
        style={{
          opacity: contentOpacity,
          translate: `0px ${contentY}px`,
          fontSize: 64,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
        }}
      >
        {title}
      </div>

      {/* Visual demo area */}
      <div
        style={{
          opacity: visualOpacity,
          scale: String(visualScale),
          width: "90%",
          flex: 1,
          borderRadius: 28,
          background: "rgba(255,255,255,0.04)",
          border: `2px solid ${stepColor}33`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 40,
          overflow: "hidden",
        }}
      >
        {/* Big emoji */}
        <div style={{ fontSize: 100 }}>{emoji}</div>

        {/* Visual content based on step type */}
        {visual === "grade-select" && (
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { g: "5級", c: "#00d9ff" },
              { g: "4級", c: "#ffd93d" },
              { g: "3級", c: "#ff6b9d" },
            ].map((grade, i) => {
              const gDelay = 16 + i * 6;
              const gScale = interpolate(frame, [gDelay, gDelay + 8], [0.8, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              });
              const gOpacity = interpolate(frame, [gDelay, gDelay + 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              // Highlight 5級 as selected
              const isSelected = i === 0 && frame > 40;

              return (
                <div
                  key={i}
                  style={{
                    opacity: gOpacity,
                    scale: String(gScale),
                    width: 200,
                    padding: "28px 16px",
                    borderRadius: 20,
                    background: isSelected ? `${grade.c}33` : "rgba(255,255,255,0.06)",
                    border: `3px solid ${isSelected ? grade.c : "rgba(255,255,255,0.15)"}`,
                    textAlign: "center",
                    fontSize: 44,
                    fontWeight: 900,
                    color: grade.c,
                  }}
                >
                  {grade.g}
                  {isSelected && (
                    <div style={{ fontSize: 28, marginTop: 8, color: "white" }}>
                      ✓ 選択中
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {visual === "quiz-answer" && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: "white", marginBottom: 20 }}>
              🍎「りんご」は英語で？
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              {["apple", "orange", "banana", "grape"].map((opt, i) => {
                const tapped = i === 0 && frame > 40;
                return (
                  <div
                    key={i}
                    style={{
                      width: "44%",
                      padding: "20px",
                      borderRadius: 16,
                      background: tapped ? `${secondaryColor}44` : "rgba(255,255,255,0.08)",
                      border: `3px solid ${tapped ? secondaryColor : "rgba(255,255,255,0.15)"}`,
                      fontSize: 36,
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {opt} {tapped && "✓"}
                  </div>
                );
              })}
            </div>
            {frame > 40 && (
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  color: secondaryColor,
                  marginTop: 20,
                  opacity: interpolate(frame, [40, 48], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                正解！
              </div>
            )}
          </div>
        )}

        {visual === "combo-chain" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const cDelay = 14 + n * 5;
                const cOpacity = interpolate(frame, [cDelay, cDelay + 4], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const cScale = interpolate(frame, [cDelay, cDelay + 6], [1.5, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                });

                return (
                  <div
                    key={n}
                    style={{
                      opacity: cOpacity,
                      scale: String(cScale),
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      background: n >= 3 ? `${goldColor}44` : `${secondaryColor}33`,
                      border: `3px solid ${n >= 3 ? goldColor : secondaryColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      fontWeight: 900,
                      color: "white",
                    }}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            {frame > 40 && (
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: goldColor,
                  textShadow: `0 0 30px ${goldColor}66`,
                  opacity: interpolate(frame, [40, 48], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  scale: String(interpolate(frame, [40, 50], [2, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })),
                }}
              >
                5x COMBO! GREAT!
              </div>
            )}
          </div>
        )}

        {visual === "level-up" && (
          <div style={{ textAlign: "center" }}>
            {/* XP bar */}
            <div
              style={{
                width: 600,
                height: 20,
                borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: `${interpolate(frame, [14, 45], [60, 100], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}%`,
                  height: "100%",
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${secondaryColor}, ${goldColor})`,
                }}
              />
            </div>
            {frame > 45 && (
              <>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 900,
                    color: goldColor,
                    textShadow: `0 0 40px ${goldColor}66`,
                    opacity: interpolate(frame, [45, 52], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    scale: String(interpolate(frame, [45, 55], [2, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    })),
                  }}
                >
                  LEVEL UP!
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 12,
                    opacity: interpolate(frame, [50, 58], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  Lv.4 → Lv.5 🎉
                </div>
              </>
            )}
          </div>
        )}

        {/* Description text */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            whiteSpace: "pre-line",
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          display: "flex",
          gap: 14,
        }}
      >
        {dots.map((d) => (
          <div
            key={d}
            style={{
              width: d === stepNumber - 1 ? 36 : 14,
              height: 14,
              borderRadius: 7,
              background:
                d === stepNumber - 1
                  ? stepColor
                  : d < stepNumber - 1
                    ? `${stepColor}66`
                    : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene: Outro ---
const TutorialOutroScene: React.FC<{
  gameNameJa: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ gameNameJa, accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 0.4 * fps], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const buttonScale = interpolate(frame, [0.4 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const pulse = Math.sin(frame * 0.15) * 0.04 + 1;

  // Mascot bounce
  const mascotY = Math.sin(frame * 0.2) * 8;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${accentColor}, #1a1a2e, ${highlightColor}55)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${goldColor}15, transparent)`,
        }}
      />

      {/* Mascot */}
      <div
        style={{
          opacity: contentOpacity,
          translate: `0px ${mascotY}px`,
          fontSize: 80,
          lineHeight: 1,
        }}
      >
        (★‿★)
      </div>

      {/* Ready message */}
      <div
        style={{
          opacity: contentOpacity,
          scale: String(titleScale),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 900, color: "white" }}>
          カンタンでしょ？
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: secondaryColor,
            marginTop: 12,
          }}
        >
          {gameNameJa}で冒険しよう！
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: contentOpacity,
          fontSize: 40,
          fontWeight: 900,
          color: goldColor,
          textShadow: `0 0 20px ${goldColor}44`,
        }}
      >
        遊んでたら、受かってた。
      </div>

      {/* CTA button */}
      <div
        style={{
          scale: String(buttonScale * pulse),
          padding: "28px 72px",
          borderRadius: 100,
          background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
          fontSize: 48,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 8px 40px ${highlightColor}66`,
        }}
      >
        今すぐ遊んでみよう！
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 50,
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

// --- Main Composition ---
export const GameTutorialVideo: React.FC<TutorialProps> = (props) => {
  return (
    <TransitionSeries>
      {/* Hook Intro (2s) */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <TutorialHookScene
          gameNameJa={props.gameNameJa}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      {/* 4 Tutorial Steps (2.5s each) */}
      {props.steps.map((step, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={linearTiming({ durationInFrames: 8 })}
          />
          <TransitionSeries.Sequence durationInFrames={75}>
            <TutorialStepScene
              stepNumber={i + 1}
              totalSteps={props.steps.length}
              title={step.title}
              description={step.description}
              emoji={step.emoji}
              visual={step.visual}
              accentColor={props.accentColor}
              secondaryColor={props.secondaryColor}
              highlightColor={props.highlightColor}
              goldColor={props.goldColor}
            />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}

      {/* Outro (2.5s) */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />
      <TransitionSeries.Sequence durationInFrames={75}>
        <TutorialOutroScene
          gameNameJa={props.gameNameJa}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
