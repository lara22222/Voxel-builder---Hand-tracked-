import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

type HandTrackerProps = {
  onFingerMove?: (x: number, y: number) => void;
};


function HandTracker({ onFingerMove }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState("Loading hand tracker...");
  const [gesture, setGesture] = useState("Open");

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId = 0;
    let cancelled = false;

    async function setup() {
      try {
        // Load MediaPipe's WebAssembly files
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // Create the hand tracking model
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },

          runningMode: "VIDEO",
          numHands: 1,

          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) return;

        setStatus("Starting camera...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
          },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        if (cancelled) return;

        setStatus("Show your hand");

        detectHands();
      } catch (error) {
        console.error(error);
        setStatus("Could not start hand tracking");
      }
    }

    function detectHands() {
      if (
        !handLandmarker ||
        !videoRef.current ||
        !canvasRef.current
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2) {
        animationFrameId = requestAnimationFrame(detectHands);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results = handLandmarker.detectForVideo(
        video,
        performance.now()
      );

      const context = canvas.getContext("2d");

      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const drawingUtils = new DrawingUtils(context);

      if (results.landmarks.length > 0) {
        setStatus("Hand detected");

        const hand = results.landmarks[0];

        const thumbTip = hand[4];
        const indexTip = hand[8];
        onFingerMove?.(indexTip.x, indexTip.y);

        const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
        );

        if (distance < 0.05) {
        setGesture("PINCH");
        } else {
        setGesture("Open");
        }

        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
              lineWidth: 3,
            }
          );

          drawingUtils.drawLandmarks(landmarks, {
            radius: 4,
          });
        }
      } else {
        setStatus("Show your hand");
      }

      animationFrameId = requestAnimationFrame(detectHands);
    }

    setup();

    return () => {
      cancelled = true;

      cancelAnimationFrame(animationFrameId);

      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      handLandmarker?.close();
    };
  }, []);

  return (
    <div>
      <p>{status}</p>
      <p>
        Gesture: <strong>{gesture}</strong>
      </p>
      <div

      
        style={{
            position: "relative",
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            display: "block",
            borderRadius: "12px",
            transform: "scaleX(-1)",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

export default HandTracker;