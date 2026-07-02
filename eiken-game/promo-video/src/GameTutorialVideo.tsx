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

const StepSchema = z.object({
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
});

export const GameTutorialSchema = z.object({
  gameName: z.string(),
  gameNameJa: z.string(),
  accentColor: z.string(),
  secondaryColor: z.string(),
  highlightColor: z.string(),
  steps: z.array(StepSchema),
});

type TutorialProps = z.infer<typeof GameTutorialSchema>;

// --- Scene: Tutorial Intro ---
const TutorialIntroScene: React.FC<{
  gameNameJa: string;
  accentColor: string;
  secondaryColor: string;
}> = ({ gameNameJa, accentColor, secondaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 0.5 * fps], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const subtitleOpacity = interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
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
      <div
        style={{
          opacity: titleOpacity,
          scale: String(titleScale),
          fontSize: 84,
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
          opacity: subtitleOpacity,
          fontSize: 56,
          fontWeight: 700,
          color: secondaryColor,
          padding: "16px 48px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.08)",
        }}
      >
        📖 遊び方ガイド
      </div>
    </AbsoluteFill>
  );
};

// --- Scene: Tutorial Step ---
const TutorialStepScene: React.FC<{
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  emoji: string;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
}> = ({
  stepNumber,
  totalSteps,
  title,
  description,
  emoji,
  accentColor,
  secondaryColor,
  highlightColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberScale = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const emojiScale = interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const emojiRotate = interpolate(frame, [0.2 * fps, 0.6 * fps], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const titleOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [0.3 * fps, 0.6 * fps], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const descOpacity = interpolate(frame, [0.6 * fps, 1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress dots
  const dots = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e, ${accentColor}33)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      {/* Step Number Badge */}
      <div
        style={{
          scale: String(numberScale),
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 6px 30px ${highlightColor}66`,
        }}
      >
        {stepNumber}
      </div>

      {/* Emoji */}
      <div
        style={{
          scale: String(emojiScale),
          rotate: `${emojiRotate}deg`,
          fontSize: 120,
        }}
      >
        {emoji}
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          translate: `0px ${titleY}px`,
          fontSize: 64,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          opacity: descOpacity,
          fontSize: 40,
          fontWeight: 700,
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 800,
          whiteSpace: "pre-line",
        }}
      >
        {description}
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          display: "flex",
          gap: 16,
        }}
      >
        {dots.map((d) => (
          <div
            key={d}
            style={{
              width: d === stepNumber - 1 ? 40 : 16,
              height: 16,
              borderRadius: 8,
              background:
                d === stepNumber - 1
                  ? secondaryColor
                  : "rgba(255,255,255,0.3)",
              transition: "none",
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
}> = ({ gameNameJa, accentColor, secondaryColor, highlightColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonScale = interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const pulse = Math.sin(frame * 0.12) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${accentColor}, #1a1a2e, ${highlightColor}66)`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          opacity,
          fontSize: 72,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
        }}
      >
        準備OK？
      </div>

      <div
        style={{
          opacity,
          fontSize: 52,
          fontWeight: 700,
          color: secondaryColor,
        }}
      >
        {gameNameJa}で遊ぼう！
      </div>

      <div
        style={{
          scale: String(buttonScale * pulse),
          padding: "28px 80px",
          borderRadius: 100,
          background: `linear-gradient(135deg, ${highlightColor}, ${accentColor})`,
          fontSize: 48,
          fontWeight: 900,
          color: "white",
          boxShadow: `0 8px 40px ${highlightColor}66`,
        }}
      >
        スタート！ 🚀
      </div>

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
export const GameTutorialVideo: React.FC<TutorialProps> = (props) => {
  const STEP_DURATION = 75; // 2.5s per step

  return (
    <TransitionSeries>
      {/* Intro */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <TutorialIntroScene
          gameNameJa={props.gameNameJa}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
        />
      </TransitionSeries.Sequence>

      {/* Steps */}
      {props.steps.map((step, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={linearTiming({ durationInFrames: 12 })}
          />
          <TransitionSeries.Sequence durationInFrames={STEP_DURATION}>
            <TutorialStepScene
              stepNumber={i + 1}
              totalSteps={props.steps.length}
              title={step.title}
              description={step.description}
              emoji={step.emoji}
              accentColor={props.accentColor}
              secondaryColor={props.secondaryColor}
              highlightColor={props.highlightColor}
            />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}

      {/* Outro */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={75}>
        <TutorialOutroScene
          gameNameJa={props.gameNameJa}
          accentColor={props.accentColor}
          secondaryColor={props.secondaryColor}
          highlightColor={props.highlightColor}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
