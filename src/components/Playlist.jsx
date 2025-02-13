import React from "react";

const Playlist = ({ playlist, setPlaylistIndex }) => {
  return (
    <ol className="playlist">
      {playlist.map((song, index) => (
        <li key={index} onClick={() => setPlaylistIndex(index)}>{song}</li>
      ))}
    </ol>
  );
};

export default Playlist;
