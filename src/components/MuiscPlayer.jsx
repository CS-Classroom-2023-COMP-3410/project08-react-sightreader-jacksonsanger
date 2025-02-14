import React, { useState, useEffect, useRef } from "react";
import ABCJS from "abcjs";
import PitchDetector from "./PitchDetector";

const MusicPlayer = ({ abcString, startMic }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const notationRef = useRef(null);
  const synthRef = useRef(null);
  const timerRef = useRef(null);
  const currentEventRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!abcString || !ABCJS) return;

    ABCJS.renderAbc(notationRef.current, abcString, {
      responsive: "resize",
      scale: 1.5,
      add_classes: true,
    });

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    synthRef.current = new ABCJS.synth.CreateSynth();
    synthRef.current.init({
      audioContext: audioContextRef.current,
      visualObj: ABCJS.renderAbc(notationRef.current, abcString)[0],
      millisecondsPerMeasure: 500,
    });
  }, [abcString]);

  const highlightNote = (event, color) => {
    if (!event || !event.elements) return;
    event.elements.forEach((elGroup) => {
      elGroup.forEach((el) => el.setAttribute("fill", color));
    });
  };

  const eventCallback = (event) => {
    if (currentEventRef.current) {
      highlightNote(currentEventRef.current, "#000000");
    }
    if (event) {
      highlightNote(event, "#3D9AFC");
      currentEventRef.current = event;
    }
  };

  const handleStartStop = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      synthRef.current.stop();
      if (timerRef.current) timerRef.current.stop();
      return;
    }

    setIsPlaying(true);
    await synthRef.current.prime();
    await synthRef.current.start();
    
    timerRef.current = new ABCJS.TimingCallbacks(ABCJS.renderAbc(notationRef.current, abcString)[0], {
      eventCallback,
    });
    timerRef.current.start();

    startMic(); // Start microphone when music starts
  };

  return (
    <div>
      <button onClick={handleStartStop}>{isPlaying ? "Stop" : "Start"}</button>
      <div ref={notationRef}></div>
    </div>
  );
};

export default MusicPlayer;
