import { Pool } from "pg";
import { POSTGRESQL_CREDENTIALS }  from './secrets.js';
import * as CONSTANTS from './const.js'
const pool = new Pool(POSTGRESQL_CREDENTIALS);
pool.on('error', (err, client) =>{
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// async function queryTest(){
//     const query = "SELECT * FROM articles";
//     const data = [1];
//     const client = await pool.connect();
//     const res = await pool.query(query);
//     console.log(res.rows);
//     client.release();
// }

// queryTest();

const wikiApiRoot: string = CONSTANTS.WIKI_API_ROOT;
const roomIdLength: number = CONSTANTS.ROOM_ID_LENGTH;
const defaultChoiceCount: number = 1
const defaultParams: QueryParams = CONSTANTS.DEFAULTPARAMS;

interface QueryParams {
    action: string;
    format: string;
    list: string;
    rnlimit: number;
    rnnamespace: number;
}

interface WikiQueryResults{
    batchcomplete: string;
    continue: object;
    query;
}

// interface RandomFetchResults {
//     random?: Array<Article>;
// }

interface Article {
    id: number;
    player_id: number;
    wiki_id: number;
    title: string;
    is_selected?: boolean;
}
interface Player {
    id: number;
    gameId: number;
    socketId: string;
    screenname: string;
    isHost: boolean;
    isInterrogator: boolean;
    isHonest: boolean;
    score: number;
}
interface Game {
    id: number;
    roomCode: string;
    maxScore: number;
    maxArticles: number;
    maxRounds: number;
    currentRound: number;
    createdAt: EpochTimeStamp;
}

async function queryDatabase(query: string, values?: Array<any>): Promise<any>{
    const client = await pool.connect();
    let res: Promise<any>;
    if (typeof values !== 'undefined') {
        res = await pool.query(query, values);
    } else {
        res = await pool.query(query);
    }
    client.release();
    return res;
}


function stringifyWikiQuery(params: QueryParams): string {
    let url: string = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];})
    return url;
}
function generateRoomId(len: number): string {
    const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res: string = '';
    for (let i = 0; i < len; i++) {
        const randomIndex: number = Math.floor(Math.random() * chars.length);
        res += chars.charAt(randomIndex);
    }
    return res;
}

async function fetchRandomArticles(params: QueryParams): Promise<WikiQueryResults> {
    const response: Response = await fetch(stringifyWikiQuery(params));
    const wikiQueryResults: WikiQueryResults = await response.json();
    return wikiQueryResults;
}

async function addGameToDatabase(maxScore: number, maxArticles: number, maxRounds: number): Promise<void>{
    const roomID = generateRoomId(roomIdLength);
    const query = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const timestamp = (Date.now()/1000);
    const values = [roomID, maxScore, maxArticles, maxRounds, 0, timestamp];
    const output = await queryDatabase(query,values);
    console.log(output);
}


async function deleteGameFromDatabase(id: number){
    const query = "DELETE FROM games WHERE id = $1";
    const values= [id];
    await queryDatabase(query,values);
}

async function addPlayerToDatabase(gameId: number, socketId: string, screenname: string): Promise<void>{
    const query = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const values = [gameId, socketId, screenname];
    queryDatabase(query, values);
}

async function setPlayerAsGameHost(gameId: number, newHostId: number){
    const query = "UPDATE players SET is_host = true WHERE... "
    // finish this sql query later
}

async function deletePlayerFromDatabase(id: number){
    const query = "DELETE FROM players WHERE id = $1";
    const values= [id];
    await queryDatabase(query,values);
}

async function addArticleToDatabase(params: QueryParams, playerId: number): Promise<void>{
    const wikiQueryResults: WikiQueryResults = await fetchRandomArticles(params);
    const randomResults = wikiQueryResults.query.random[0];
    const query = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values = [playerId,randomResults.id,randomResults.title];
    queryDatabase(query, values);
}
async function deleteArticleFromDatabase(id: number){
    const query = "DELETE FROM articles WHERE id = $1";
    const values= [id];
    await queryDatabase(query,values);
}



async function hostCheck(gameId: number){
    const query = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1 and is_host = true)");
    const values = [gameId]
    const res = await queryDatabase(query, values);
    return(res.rows[0].exists);
}

// async function populateArticleList(params: QueryParams, player: Player){
//     const wikiQueryResults: WikiQueryResults = await fetchRandomArticles(params);
//     const randomResults: RandomFetchResults = wikiQueryResults.query;
//     player.articleOptions = randomResults;
//     console.log(player);
// }



// function dealOutArticles(params: QueryParams, playerList: Array<Player>){
//     for(let p in playerList){
//         populateArticleList(params, playerList[p])
//     }
// }

// instantiatePlayer(defaultRoom, "Josh");
// // instantiatePlayer(defaultRoom, "Hannah");
// // dealOutArticles(defaultRoom.queryParams, defaultRoom.playerList);
// // console.log(defaultRoom);
// // console.log(defaultRoom.playerList);
//  setTimeout(() => {
//      console.log(JSON.stringify(defaultRoom, null, "\t"));
//  //    for(let p in defaultRoom.playerList){
//  //        console.log(defaultRoom.playerList[p].articleOptions)
//  //    }
//  }, 2000);


// // SELECT ARTICLE


//addArticleToDatabase(defaultParams, 1);


addGameToDatabase(100, 3, 1000);

async function test(){
    await addPlayerToDatabase(12, 'yayaya', 'Josh but remote');
    await addPlayerToDatabase(12, 'yoyoyo', 'Dustin but remote');
    await addPlayerToDatabase(13, 'yiyiyi', 'Hannah but remote');
    await addPlayerToDatabase(13, 'yeyeye', 'Josh but remote...er');
}
// test();