import React from 'react'

const Tempo = ({ tempo, setTempo }) => {

    //return a dropdown menu with options for 30, 60, 90, 120, 180, 240
    return (
        <div>
            <label>Tempo:</label>
            <select value={tempo} onChange={(e) => setTempo(e.target.value)}>
                <option value="30">30</option>
                <option value="60">60</option>
                <option value="90">90</option>
                <option value="120">120</option>
                <option value="180">180</option>
                <option value="240">240</option>
            </select>
        </div>
    )
}

export default Tempo