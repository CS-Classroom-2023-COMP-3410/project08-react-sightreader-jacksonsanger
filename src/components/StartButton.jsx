import React, { useState, useEffect, useRef } from "react";

const StartButton = ({ selectedABC, isPlaying, setIsPlaying, pitchDetectorRef, tempo }) => {
  const [countdown, setCountdown] = useState(null);
  const [tunebook, setTunebook] = useState(null);
  const timerRef = useRef(null);
  const synthRef = useRef(null);
  const currentEventRef = useRef(null);
  const countdownRef = useRef(null);
  const synthAudioContextRef = useRef(null);

  useEffect(() => {
    console.log("Loading ABC Notation...");
    stopPlaying(); // Stop music when ABC file changes

    if (selectedABC.trim() === "") {
      console.warn("Empty ABC notation. Skipping render.");
      return;
    }

    const visualObj = ABCJS.renderAbc("notation-hidden", selectedABC, {
      responsive: "resize",
      scale: 1.5,
      add_classes: true,
    });

    console.log("Tunebook Rendered:", visualObj);
    if (visualObj.length === 0) {
      console.error("ERROR: Tunebook is empty after rendering.");
    }

    setTunebook(visualObj);
  }, [selectedABC, tempo]);

  const beginCountdown = () => {
    console.log("🎬 Start Button Clicked!");
    if (!tunebook || tunebook.length === 0) {
      console.error("ERROR: Tunebook is empty! Retrying in 500ms...");
      setTimeout(beginCountdown, 500);
      return;
    }

    setIsPlaying(true);
    let beatsPerMeasure = tunebook[0].getBeatsPerMeasure();
    let count = beatsPerMeasure;

    if (pitchDetectorRef?.current?.startMicrophone) {
      console.log("🎤 Starting microphone...");
      pitchDetectorRef.current.startMicrophone();
    }

    setCountdown(count);
    console.log(`Countdown starting from ${count}...`);

    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
        console.log("🎵 Starting music...");
        startPlaying();
      } else {
        setCountdown(count);
        console.log("Countdown:", count);
      }
    }, millisecondsPerBeat(tempo || 60));
  };

  const eventCallback = (event) => {
    console.log("Note Event Triggered:", event);
    if (!event) {
      console.warn("No event received!");
      return;
    }
    if (currentEventRef.current) {
      colorNote(currentEventRef.current, "#000000"); // Reset previous note to black
    }
    colorNote(event, "#3D9AFC"); // Highlight current note blue
    currentEventRef.current = event;
  };

  const colorNote = (event, color) => {
    if (!event?.elements) return;
    event.elements.forEach((e) => {
      e.forEach((s) => s.setAttribute("fill", color));
    });
  };

  const startPlaying = async () => {
    console.log("Initializing playback...");

    if (!tunebook || tunebook.length === 0) {
      console.error("ERROR: Cannot start playing! Tunebook is empty.");
      return;
    }

    if (!synthAudioContextRef.current || synthAudioContextRef.current.state === "closed") {
      synthAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      console.log("Created new AudioContext");
    }

    if (synthAudioContextRef.current.state === "suspended") {
      await synthAudioContextRef.current.resume();
      console.log("AudioContext resumed");
    }

    synthRef.current = new ABCJS.synth.CreateSynth();

    timerRef.current = new ABCJS.TimingCallbacks(tunebook[0], {
      qpm: tempo || 60,
      extraMeasuresAtBeginning: 0,
      lineEndAnticipation: 0,
      beatSubdivisions: 4,
      eventCallback: eventCallback,
    });

    timerRef.current.start();

    synthRef.current
      .init({
        visualObj: tunebook[0],
        audioContext: synthAudioContextRef.current,
        millisecondsPerMeasure: millisecondsPerMeasure(tempo || 60, tunebook[0]),
      })
      .then(() => {
        console.log("Synth Initialized");
        return synthRef.current.prime();
      })
      .then(() => {
        console.log("Synth Primed, Now Playing...");
        synthRef.current.start();
      })
      .catch((error) => console.error("Synth Error:", error));
  };

  const stopPlaying = () => {
    console.log("⏹Stopping playback...");
    setIsPlaying(false);
    setCountdown(null);
    clearInterval(countdownRef.current);
    countdownRef.current = null;

    synthRef.current?.stop();
    timerRef.current?.stop();

    if (synthAudioContextRef.current && synthAudioContextRef.current.state !== "suspended") {
      synthAudioContextRef.current.suspend().then(() => console.log("AudioContext suspended"));
    }

    if (pitchDetectorRef?.current?.stopMicrophone) {
      console.log("🎤 Stopping microphone...");
      pitchDetectorRef.current.stopMicrophone();
    }

    if (currentEventRef.current) {
      colorNote(currentEventRef.current, "#000000"); // Reset last highlighted note
    }
  };

  const millisecondsPerBeat = (qpm) => 60000 / qpm;

  const millisecondsPerMeasure = (qpm, tune) => tune.getBeatsPerMeasure() * millisecondsPerBeat(qpm);

  return (
    <div>
      {countdown !== null && (
        <h3 key={countdown} id="count-down" className="countdown-animation">
          {countdown}
        </h3>
      )}
      <button onClick={isPlaying ? stopPlaying : beginCountdown}>
        {isPlaying ? "Stop" : "Start"}
      </button>
      <div id="notation-hidden" style={{ display: "none" }}></div>
    </div>
  );
};

export default StartButton;
