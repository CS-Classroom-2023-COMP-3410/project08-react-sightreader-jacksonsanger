import React, { useState, useEffect } from "react";
import * as Pitchfinder from "pitchfinder";

const AudioControls = ({ setCurrentMidi, setIsRecording }) => {
  const [audioContext, setAudioContext] = useState(null);
  const [sourceStream, setSourceStream] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      setSourceStream(stream);
    });

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const startMic = () => {
    if (!sourceStream) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    const sourceNode = context.createMediaStreamSource(sourceStream);
    const analyser = context.createAnalyser();
    sourceNode.connect(analyser);

    const pitchDetector = Pitchfinder.YIN({ sampleRate: context.sampleRate });

    const updatePitch = () => {
      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);
      const pitch = pitchDetector(buffer);
      if (pitch) {
        const midi = Math.round(69 + 12 * Math.log2(pitch / 440));
        setCurrentMidi(midi);
      }
    };

    setInterval(updatePitch, 100);
    setIsRecording(true);
  };

  const stopMic = () => {
    setIsRecording(false);
    if (audioContext) {
      audioContext.close();
    }
  };

  return (
    <div className="audio-controls">
      <button onClick={startMic}>Start Mic</button>
      <button onClick={stopMic}>Stop Mic</button>
    </div>
  );
};

export default AudioControls;
