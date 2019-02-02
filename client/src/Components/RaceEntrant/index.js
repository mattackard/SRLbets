import React, { Component } from "react";
import './style.scss';

const RaceEntrant = ({ entrant }) => {
    return (
        <div>
            <button className='entrant-dropdown'>{entrant.name} &#9660</button>
            <ul className='race-entrant'>
                <li>Name: {entrant.name}</li>
                <li>Total Points Bet: {entrant.betTotal}</li>
                <li>Race Status: {entrant.status}</li>
                {
                    entrant.status === "Finished" ? 
                    <li>Finished in Position: {entrant.position}</li> : null
                }
                {
                    entrant.twitch ? 
                    <li>Twitch Username: <a href={`https://twitch.tv/${entrant.twitch}`} target="_blank" >{`twitch.tv/${entrant.twitch}`}</a></li>
                    : null
                }
            </ul>
        </div>
    );
}

export default RaceEntrant;