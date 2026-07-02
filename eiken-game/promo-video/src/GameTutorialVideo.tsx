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
import { LightLeak } from "@remotion/light-leaks";
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

const BG_MAIN =
  "radial-gradient(circle at 20% 20%, rgba(196,78,255,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,107,157,0.15) 0%, transparent 40%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)";
const BG_GAME =
  "linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 60%, #252542 100%)";
const BG_RESULT =
  "radial-gradient(circle at 50% 30%, rgba(255,217,61,0.1) 0%, transparent 50%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)";
const PANEL_BG = "rgba(37,37,66,0.9)";

// ─── Floating Particles ───
const FloatingParticles: React.FC<{ frame: number; count?: number; color?: string }> = ({
  frame,
  count = 20,
  color = "rgba(108,92,231,0.25)",
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const seed = i * 137.508;
      const x = (seed * 7) % 1080;
      const baseY = (seed * 11) % 1920;
      const size = 3 + (i % 5) * 2;
      const y = (baseY - frame * (0.3 + (i % 4) * 0.15) * 2) % 2100;
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

// ─── Gradient Text ───
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
// Hook Intro
// ═══════════════════════════════════════════
const TutorialHookScene: React.FC<{
  gameNameJa: string;
  accentColor: string;
  secondaryColor: string;
  goldColor: string;
}> = ({ gameNameJa, accentColor, secondaryColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hookScale = interpolate(frame, [0, 8], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const hookOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [0.4 * fps, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const driftScale = interpolate(frame, [0, 2 * fps], [1, 1.02], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG_MAIN, fontFamily, scale: String(driftScale) }}>
      <FloatingParticles frame={frame} count={20} color="rgba(196,78,255,0.2)" />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          left: 540 - 250,
          top: 960 - 250,
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `2px solid ${secondaryColor}22`,
          scale: String(1 + Math.sin(frame * 0.1) * 0.05),
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            opacity: hookOpacity,
            scale: String(hookScale),
          }}
        >
          <GradientText from="#00d9ff" to="#00f5d4" fontSize={88} style={{ textAlign: "center" }}>
            {gameNameJa}
          </GradientText>
        </div>

        <div
          style={{
            opacity: subOpacity,
            fontSize: 52,
            fontWeight: 900,
            color: goldColor,
            textShadow: `0 0 30px ${goldColor}44`,
          }}
        >
          遊び方、15秒で！
        </div>

        <div
          style={{
            opacity: interpolate(frame, [0.7 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            fontSize: 32,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          ⏱️ カンタン4ステップ
        </div>
      </AbsoluteFill>

      {/* Flash on slam */}
      <AbsoluteFill
        style={{
          background: "white",
          opacity: interpolate(frame, [0, 3, 10], [0.7, 0.5, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Tutorial Step — cinematic interactive demo
// ═══════════════════════════════════════════
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

  const stepColors = [secondaryColor, highlightColor, goldColor, accentColor];
  const stepColor = stepColors[(stepNumber - 1) % stepColors.length];

  const badgePop = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  const contentFade = interpolate(frame, [6, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const visualFade = interpolate(frame, [12, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dots = Array.from({ length: totalSteps }, (_, i) => i);
  const driftScale = interpolate(frame, [0, 2.5 * fps], [1, 1.015], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG_GAME, fontFamily, scale: String(driftScale) }}>
      <FloatingParticles frame={frame} count={15} color={`${stepColor}15`} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "100px 60px 120px",
          gap: 20,
        }}
      >
        {/* Step badge */}
        <div
          style={{
            scale: String(badgePop),
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${stepColor}, ${accentColor})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 900,
            color: "white",
            boxShadow: `0 6px 30px ${stepColor}55`,
          }}
        >
          {stepNumber}
        </div>

        {/* Title */}
        <div
          style={{
            opacity: contentFade,
            translate: `0px ${interpolate(frame, [6, 14], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px`,
            fontSize: 60,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>

        {/* Visual demo panel */}
        <div
          style={{
            opacity: visualFade,
            scale: String(
              interpolate(frame, [12, 22], [0.9, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              })
            ),
            width: "88%",
            flex: 1,
            borderRadius: 28,
            background: PANEL_BG,
            border: `1px solid ${stepColor}33`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.3)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 36,
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 88 }}>{emoji}</div>

          {/* Grade select visual */}
          {visual === "grade-select" && (
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { g: "5級", c: "#00d9ff" },
                { g: "4級", c: "#ffd93d" },
                { g: "3級", c: "#ff6b9d" },
              ].map((grade, i) => {
                const gDelay = 16 + i * 5;
                const isSelected = i === 0 && frame > 38;
                return (
                  <div
                    key={i}
                    style={{
                      opacity: interpolate(frame, [gDelay, gDelay + 6], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                      scale: String(
                        interpolate(frame, [gDelay, gDelay + 8], [0.8, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                        })
                      ),
                      width: 185,
                      padding: "24px 12px",
                      borderRadius: 18,
                      background: isSelected ? `${grade.c}22` : "rgba(255,255,255,0.04)",
                      border: `3px solid ${isSelected ? grade.c : "rgba(255,255,255,0.1)"}`,
                      boxShadow: isSelected ? `0 0 20px ${grade.c}33` : "none",
                      textAlign: "center",
                      fontSize: 40,
                      fontWeight: 900,
                      color: grade.c,
                    }}
                  >
                    {grade.g}
                    {isSelected && (
                      <div style={{ fontSize: 24, marginTop: 6, color: "white" }}>✓ 選択中</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quiz answer visual */}
          {visual === "quiz-answer" && (
            <div style={{ width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: "white", marginBottom: 16 }}>
                🍎「りんご」は英語で？
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                {["apple", "orange", "banana", "grape"].map((opt, i) => {
                  const tapped = i === 0 && frame > 38;
                  return (
                    <div
                      key={i}
                      style={{
                        width: "44%",
                        padding: "18px",
                        borderRadius: 14,
                        background: tapped ? `${secondaryColor}33` : "rgba(255,255,255,0.04)",
                        border: `3px solid ${tapped ? secondaryColor : "rgba(255,255,255,0.1)"}`,
                        boxShadow: tapped ? `0 0 20px ${secondaryColor}33` : "none",
                        fontSize: 34,
                        fontWeight: 700,
                        color: "white",
                        scale: String(
                          tapped
                            ? interpolate(frame, [38, 44], [1, 1.05], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                              })
                            : 1
                        ),
                      }}
                    >
                      {opt} {tapped && <span style={{ color: secondaryColor }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              {frame > 38 && (
                <div
                  style={{
                    marginTop: 16,
                    opacity: interpolate(frame, [38, 44], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    scale: String(
                      interpolate(frame, [38, 46], [2, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      })
                    ),
                  }}
                >
                  <GradientText from={secondaryColor} to={goldColor} fontSize={40}>
                    正解！
                  </GradientText>
                </div>
              )}
            </div>
          )}

          {/* Combo chain visual */}
          {visual === "combo-chain" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const cDelay = 14 + n * 4;
                  return (
                    <div
                      key={n}
                      style={{
                        opacity: interpolate(frame, [cDelay, cDelay + 4], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                        scale: String(
                          interpolate(frame, [cDelay, cDelay + 6], [1.8, 1], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.16, 1, 0.3, 1),
                          })
                        ),
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: n >= 3 ? `${goldColor}33` : `${secondaryColor}22`,
                        border: `3px solid ${n >= 3 ? goldColor : secondaryColor}`,
                        boxShadow: n >= 3 ? `0 0 15px ${goldColor}44` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        fontWeight: 900,
                        color: "white",
                      }}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
              {frame > 38 && (
                <div
                  style={{
                    opacity: interpolate(frame, [38, 44], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    scale: String(
                      interpolate(frame, [38, 48], [2.5, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      })
                    ),
                  }}
                >
                  <GradientText from={goldColor} to={highlightColor} fontSize={48}>
                    5x COMBO! GREAT!
                  </GradientText>
                </div>
              )}
            </div>
          )}

          {/* Level up visual */}
          {visual === "level-up" && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div
                style={{
                  width: "85%",
                  height: 18,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  margin: "0 auto 20px",
                }}
              >
                <div
                  style={{
                    width: `${interpolate(frame, [14, 40], [60, 100], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })}%`,
                    height: "100%",
                    borderRadius: 9,
                    background: `linear-gradient(90deg, ${secondaryColor}, ${goldColor})`,
                    boxShadow: `0 0 15px ${goldColor}44`,
                  }}
                />
              </div>
              {frame > 40 && (
                <>
                  <div
                    style={{
                      opacity: interpolate(frame, [40, 46], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                      scale: String(
                        interpolate(frame, [40, 50], [2.5, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.16, 1, 0.3, 1),
                        })
                      ),
                    }}
                  >
                    <GradientText from={secondaryColor} to={goldColor} fontSize={64}>
                      LEVEL UP!
                    </GradientText>
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: 10,
                      opacity: interpolate(frame, [46, 52], [0, 1], {
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

          {/* Description */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              whiteSpace: "pre-line",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ position: "absolute", bottom: 60, display: "flex", gap: 12 }}>
          {dots.map((d) => (
            <div
              key={d}
              style={{
                width: d === stepNumber - 1 ? 32 : 12,
                height: 12,
                borderRadius: 6,
                background:
                  d === stepNumber - 1
                    ? stepColor
                    : d < stepNumber - 1
                      ? `${stepColor}55`
                      : "rgba(255,255,255,0.15)",
                boxShadow: d === stepNumber - 1 ? `0 0 10px ${stepColor}44` : "none",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════
// Outro
// ═══════════════════════════════════════════
const TutorialOutroScene: React.FC<{
  gameNameJa: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  goldColor: string;
}> = ({ gameNameJa, accentColor, secondaryColor, highlightColor, goldColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const revealProgress = interpolate(frame, [0, 0.4 * fps], [0, 1], {
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
  const mascotY = Math.sin(frame * 0.2) * 6;

  return (
    <AbsoluteFill style={{ background: BG_RESULT, fontFamily }}>
      <FloatingParticles frame={frame} count={25} color="rgba(196,78,255,0.12)" />

      {/* Glow rings */}
      {[350, 550].map((size, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - size / 2,
            top: 960 - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1px solid ${[goldColor, secondaryColor][i]}15`,
            scale: String(1 + Math.sin(frame * 0.08 + i * 2) * 0.04),
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
        {/* Mascot */}
        <div
          style={{
            opacity: revealProgress,
            translate: `0px ${mascotY}px`,
            fontSize: 72,
            lineHeight: 1,
          }}
        >
          (★‿★)
        </div>

        <div style={{ opacity: revealProgress, textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            カンタンでしょ？
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: secondaryColor, marginTop: 10 }}>
            {gameNameJa}で冒険しよう！
          </div>
        </div>

        <div
          style={{
            opacity: interpolate(frame, [0.3 * fps, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            fontSize: 44,
            fontWeight: 900,
            color: goldColor,
            textShadow: `0 0 25px ${goldColor}44`,
          }}
        >
          遊んでたら、受かってた。
        </div>

        <div
          style={{
            scale: String(buttonPop * pulse),
            padding: "28px 68px",
            borderRadius: 100,
            background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
            fontSize: 44,
            fontWeight: 900,
            color: "white",
            boxShadow: `0 10px 50px ${highlightColor}55, 0 4px 15px rgba(0,0,0,0.3)`,
          }}
        >
          今すぐ遊んでみよう！
        </div>
      </AbsoluteFill>

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
export const GameTutorialVideo: React.FC<TutorialProps> = (props) => {
  return (
    <TransitionSeries>
      {/* Hook (2s) */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <TutorialHookScene
          gameNameJa={props.gameNameJa}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          goldColor={props.goldColor}
        />
      </TransitionSeries.Sequence>

      {/* Steps with light leak overlays between them */}
      {props.steps.map((step, i) => (
        <React.Fragment key={i}>
          {i === 0 ? (
            <TransitionSeries.Overlay durationInFrames={18}>
              <LightLeak seed={i + 1} hueShift={270} />
            </TransitionSeries.Overlay>
          ) : (
            <TransitionSeries.Transition
              presentation={slide({ direction: "from-right" })}
              timing={linearTiming({ durationInFrames: 8 })}
            />
          )}
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

      {/* Outro with light leak */}
      <TransitionSeries.Overlay durationInFrames={20}>
        <LightLeak seed={5} hueShift={300} />
      </TransitionSeries.Overlay>

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
