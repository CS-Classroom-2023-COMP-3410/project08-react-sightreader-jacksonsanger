import React, { useState, useEffect } from "react";

const ABCFileSelector = ({ setSelectedABC }) => {
  const [selectedFile, setSelectedFile] = useState("cecilio-lesson1-open-strings.abc");
  let fileLoadingMessage = ""

  useEffect(() => {
    if (!selectedFile) return;

    fetch(`/music/${selectedFile}`)
      .then((res) => res.text())
      .then((data) => {
        fileLoadingMessage = "File Loading..."
        const preprocessedData = preprocessABC(data); // Preprocess before updating state
        setSelectedABC(preprocessedData);
        fileLoadingMessage = "File loaded. Press start to play."
      })
      .catch((error) => {
        console.error("Error loading ABC file:", error);
      });
  }, [selectedFile, setSelectedABC]);

  const preprocessABC = (abcString) => {
    const lines = abcString.split('\n');
    const headers = [];
    const notes = [];

    const ignoredHeaders = new Set(['T', 'C', 'Z', 'S', 'N', 'G', 'O', 'H', 'I', 'P', 'W', 'F', 'B']);

    for (let line of lines) {
        line = line.trim();

        // Ignore empty lines and comments
        if (!line || line.startsWith('%')) {
            continue;
        }

        // Check if line is a metadata header
        if (line.length >= 2 && line[1] === ':' && /^[A-Za-z]$/.test(line[0])) {
            if (ignoredHeaders.has(line[0].toUpperCase())) {
                continue; // Ignore specific headers
            }
            headers.push(line);
        } else {
            notes.push(line);
        }
    }

    return headers.join('\n') + '\n' + notes.join('\n');
  }

  return (
    <div>
      <p>{fileLoadingMessage}</p>
      <label htmlFor="file">File:</label>
      <select id="file" onChange={(e) => setSelectedFile(e.target.value)}>
        <option value="cecilio-lesson1-open-strings.abc">Cecilio Lesson 1 - Open Strings</option>
        <option value="lesson1-open-string-exercise-1.abc">Lesson 1 - Exercise 1</option>
      </select>
    </div>
  );
};

export default ABCFileSelector;
