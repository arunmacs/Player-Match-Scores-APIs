const express = require("express");
const app = express();
app.use(express.json());
let port = 3001;

const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let database = null;

const initializeDBServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const convertJsonToPlayersObj = (jsonObj) => {
  return {
    playerId: jsonObj.player_id,
    playerName: jsonObj.player_name,
  };
};

const convertJsonToPlayerMatchesObj = (jsonObj) => {
  return {
    matchId: jsonObj.match_id,
    match: jsonObj.match,
    year: jsonObj.year,
    //playerId: jsonObj.player_id,
  };
};

const convertJsonToPlayersMatchListObj = (jsonObj) => {
  return {
    playerId: jsonObj.player_id,
    playerName: jsonObj.player_name,
    //matchId: jsonObj.match_id,
  };
};

//API-1:Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  try {
    const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
    const playersList = await database.all(getPlayersQuery);
    response.send(
      playersList.map((eachObj) => convertJsonToPlayersObj(eachObj))
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-2:Returns a list of all the players in the player table

app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
    const player = await database.get(getPlayerQuery);
    response.send({
      playerId: player.player_id,
      playerName: player.player_name,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-3:Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const updatePlayerQuery = `
      UPDATE player_details
      SET 
        player_name = '${playerName}'
      WHERE player_id = ${playerId} ;`;
    await database.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-4:Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
    const match = await database.get(getMatchQuery);
    response.send({
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-5:Returns a list of all the players in the player table

app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerMatchesQuery = `
    SELECT 
        match_details.match_id,match,year,player_match_score.player_id
    FROM 
        match_details JOIN player_match_score
    WHERE 
        player_id = ${playerId};`;
    const playerMatchesList = await database.all(getPlayerMatchesQuery);
    response.send(
      playerMatchesList.map((eachObj) => convertJsonToPlayerMatchesObj(eachObj))
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-6:Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  try {
    const { matchId } = request.params;
    //console.log(matchId);
    const getListPlayersMatchQuery = `
    SELECT 
        *
    FROM 
        player_details INNER JOIN player_match_score ON 
        player_details.player_id = player_match_score.player_id
    WHERE 
        match_id = ${matchId}
    GROUP BY 
        player_details.player_id;`;
    const PlayersMatchList = await database.all(getListPlayersMatchQuery);
    response.send(
      PlayersMatchList.map((eachObj) =>
        convertJsonToPlayersMatchListObj(eachObj)
      )
    );
    //response.send(PlayersMatchList);
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-7:Returns the statistics of the total score,
// fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    const { playerId } = request.params;
    //console.log(playerId);
    const getPlayerStatsQuery = `
    SELECT 
        player_details.player_id,
        player_details.player_name,
        SUM(score),
        SUM(fours),
        SUM(sixes)
    FROM 
        player_details JOIN player_match_score
    WHERE 
        player_match_score.player_id = ${playerId};`;
    const PlayerStats = await database.get(getPlayerStatsQuery);
    //response.send(PlayerStats);
    response.send({
      playerId: PlayerStats["player_id"],
      playerName: PlayerStats["player_name"],
      totalScore: PlayerStats["SUM(score)"],
      totalFours: PlayerStats["SUM(fours)"],
      totalSixes: PlayerStats["SUM(sixes)"],
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

module.exports = app;
