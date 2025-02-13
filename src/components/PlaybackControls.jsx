import React from "react";

const PlaybackControls = ({ isRecording, setIsRecording, setExpectedMidi, setScore }) => {
  const startPlayback = () => {
    setIsRecording(true);
    setExpectedMidi(60); // Example expected MIDI
    setScore({ correct: 0, total: 0 });
  };

  const stopPlayback = () => {
    setIsRecording(false);
  };

  return (
    <div className="playback-controls">
      <button onClick={startPlayback} disabled={isRecording}>Start</button>
      <button onClick={stopPlayback}>Stop</button>
    </div>
  );
};

export default PlaybackControls;
