import React, { useState, useEffect } from "react";

const ABCFileSelector = ({ setSelectedABC }) => {
  const [selectedFile, setSelectedFile] = useState("cecilio-lesson1-open-strings.abc");
  const [fileLoadingMessage, setFileLoadingMessage] = useState("");
  const [customABC, setCustomABC] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (selectedFile === "custom") {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    setFileLoadingMessage("File Loading...");

    fetch(`/music/${selectedFile}`)
      .then((res) => res.text())
      .then((data) => {
        const preprocessedData = preprocessABC(data);
        setSelectedABC(preprocessedData);
        setCustomABC(preprocessedData); // Keep a copy for custom mode
        setFileLoadingMessage("File loaded. Press start to play.");
      })
      .catch((error) => {
        console.error("Error loading ABC file:", error);
        setFileLoadingMessage("Error loading file.");
      });
  }, [selectedFile]);

  const preprocessABC = (abcString) => {
    const lines = abcString.split("\n");
    const headers = [];
    const notes = [];

    const ignoredHeaders = new Set(["T", "C", "Z", "S", "N", "G", "O", "H", "I", "P", "W", "F", "B"]);

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("%")) continue;
      if (line.length >= 2 && line[1] === ":" && /^[A-Za-z]$/.test(line[0])) {
        if (ignoredHeaders.has(line[0].toUpperCase())) continue;
        headers.push(line);
      } else {
        notes.push(line);
      }
    }

    return headers.join("\n") + "\n" + notes.join("\n");
  };

  const handleABCBlur = () => {
    setSelectedABC(customABC);
  };

  return (
    <div>
      <p>{fileLoadingMessage}</p>
      <label htmlFor="file">File:</label>
      <select id="file" value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
        <option value="cecilio-lesson1-open-strings.abc">Cecilio Lesson 1 - Open Strings</option>
        <option value="lesson1-open-string-exercise-1.abc">Lesson 1 - Exercise 1</option>
        <option value="custom">Custom ABC</option>
      </select>

      {isCustom && (
        <textarea
          value={customABC}
          onChange={(e) => setCustomABC(e.target.value)}
          onBlur={handleABCBlur}
          placeholder="Enter ABC notation here..."
          rows={10}
          cols={50}
          style={{ width: "100%", marginTop: "10px", fontFamily: "monospace" }}
        />
      )}
    </div>
  );
};

export default ABCFileSelector;
