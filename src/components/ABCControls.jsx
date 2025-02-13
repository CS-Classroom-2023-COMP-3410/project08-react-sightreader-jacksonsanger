import React, { useState } from "react";

const ABCControls = ({ setLoadedABC, setLoadedPlaylist }) => {
  const [file, setFile] = useState("");

  const loadABCFile = (filename) => {
    fetch(`/music/${filename}`)
      .then((res) => res.text())
      .then((data) => setLoadedABC(data));
  };

  const loadPlaylistFile = (filename) => {
    fetch(`/music/${filename}`)
      .then((res) => res.json())
      .then((data) => setLoadedPlaylist(data));
  };

  return (
    <div className="abc-controls">
      <label htmlFor="file">File:</label>
      <select id="file" onChange={(e) => setFile(e.target.value)}>
        <option value="">---Select ABC File---</option>
        <option value="beginner.pls">Beginner</option>
        <option value="lesson1.abc">Lesson 1</option>
      </select>
      <button onClick={() => loadABCFile(file)}>Load ABC</button>
      <button onClick={() => loadPlaylistFile(file)}>Load Playlist</button>
    </div>
  );
};

export default ABCControls;
