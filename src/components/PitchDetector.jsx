import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import * as Pitchfinder from "pitchfinder";

const MIN_VOLUME = 0.075; // Minimum volume threshold to ignore background noise

const PitchDetector = forwardRef(({ setCurrentMidi, isMicActive }, ref) => {
  const [audioContext, setAudioContext] = useState(null);
  const [sourceStream, setSourceStream] = useState(null);
  const analyserRef = useRef(null);
  const volumeMeterRef = useRef(null);
  const pitchIntervalRef = useRef(null);
  const [detectedNote, setDetectedNote] = useState("-"); // Stores detected note

  // Note conversion logic
  const scales = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function midi_number_to_scale(number) {
    return scales[number % 12];
  }

  function midi_number_to_octave(number) {
    return Math.floor(number / 12) - 1;
  }

  function midi_number_to_string(number) {
    if (number > 0) {
      return `${midi_number_to_scale(number)}${midi_number_to_octave(number)}`;
    }
    return "-"; // No note detected
  }

  function noteFromPitch(frequency) {
    if (!frequency) return 0;
    return Math.round(12 * (Math.log2(frequency / 440)) + 69);
  }

  const startMicrophone = async () => {
    try {
      if (audioContext) return; // Prevent multiple instances

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setSourceStream(stream);

      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const sourceNode = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      const detector = new Pitchfinder.YIN({ sampleRate: context.sampleRate });

      startVolumeMeter(sourceNode, context);

      pitchIntervalRef.current = setInterval(() => {
        const volume = volumeMeterRef.current?.volume || 0;
        if (volume < MIN_VOLUME) {
          setCurrentMidi(0);
          setDetectedNote("-");
          return;
        }

        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        const freq = detector(buffer);
        const midiNumber = noteFromPitch(freq);

        setCurrentMidi(midiNumber);
        setDetectedNote(midi_number_to_string(midiNumber));
      }, 100);
    } catch (error) {
      console.error("Microphone access error:", error);
    }
  };

  const stopMicrophone = () => {
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    if (sourceStream) {
      sourceStream.getTracks().forEach((track) => track.stop());
      setSourceStream(null);
    }
    setDetectedNote("-");
  };

  function startVolumeMeter(source, context) {
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);

    volumeMeterRef.current = {
      volume: 0,
      updateVolume: () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        volumeMeterRef.current.volume = sum / bufferLength / 255; // Normalize volume
      },
    };

    setInterval(() => volumeMeterRef.current.updateVolume(), 50);
  }

  // 🔥 **Expose start/stopMicrophone to Parent using useImperativeHandle**
  useImperativeHandle(ref, () => ({
    startMicrophone,
    stopMicrophone,
  }));

  // 🔥 **Automatically manage mic when `isMicActive` changes**
  useEffect(() => {
    if (isMicActive) {
      startMicrophone();
    } else {
      stopMicrophone();
    }
    return () => stopMicrophone(); // Cleanup on unmount
  }, [isMicActive]);

  return <p>{audioContext ? `Detected Note: ${detectedNote}` : "Mic is off."}</p>;
});

export default PitchDetector;
