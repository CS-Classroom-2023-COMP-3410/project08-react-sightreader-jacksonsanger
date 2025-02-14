import React from "react";

const PlaybackControls = ({ isPlaying, setIsPlaying }) => {
  const togglePlayback = () => setIsPlaying((prev) => !prev);

  return (
    <div>
      <button onClick={togglePlayback}>{isPlaying ? "Stop" : "Start"}</button>
      <button onClick={() => setIsPlaying(false)}>Reset</button>
    </div>
  );
};

export default PlaybackControls;
