import { Pool } from "pg";
const pool = new Pool({
    user: 'postgres',
    database: 'wikifib',
    port: 5432,
});
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

// pool.query(query, (error, result) => {
//     if (error) {
//         console.error('Error occurred:', error);
//         result.status(500).send('An error occurred while retrieving data from the database.');
//     } else {
//         const students = result.rows;
//         result.json(students);
//     }
// });

// console.log(pool);

const wikiApiRoot: string = "https://en.wikipedia.org/w/api.php";
const roomIdLength: number = 5;
const defaultChoiceCount: number = 1
const defaultParams: QueryParams = {
    action: "query",
    format: "json",
    list: "random",
    rnlimit: defaultChoiceCount,
    rnnamespace: 0,
}

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

// const defaultGame: Game = {
//     roomID: generateRoomId(roomIdLength),
//     playerList: [],
//     queryParams: defaultParams,
// }

async function queryDatabase(query: string, data: Array<any>){
    const client = await pool.connect();
    const res = await pool.query(query, data);
    client.release();
    return res;
}

async function queryDatabaseZeroParams(query: string){
    const client = await pool.connect();
    const res = await pool.query(query);
    client.release();
    return res;
}

async function generateNewGame(maxScore: number, maxArticles: number, maxRounds: number){
    const roomID = generateRoomId(roomIdLength);
    const query = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const timestamp = (Date.now()/1000);
    const data = [roomID, maxScore, maxArticles, maxRounds, 0, timestamp];
    const output = await queryDatabase(query,data);
    console.log(output);
}

async function deleteQuery(table: string, id: number){
    const query = "DELETE FROM ${} WHERE "
}


// generateNewGame(100, 3, 1000);

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

async function addArticleToDatabase(params: QueryParams, playerId: number){
    const wikiQueryResults: WikiQueryResults = await fetchRandomArticles(params);
    const randomResults = wikiQueryResults.query.random[0];
    const query = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const data = [playerId,randomResults.id,randomResults.title];
    queryDatabase(query, data);
}

async function addPlayerToDatabase(gameId: number, socketId: string, screenname: string){
    const query = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const data = [gameId, socketId, screenname];
    queryDatabase(query, data);
}

async function test(){
    await addPlayerToDatabase(12, 'popopo', 'Josh');
    await addPlayerToDatabase(12, 'ertyui', 'Dustin');
    await addPlayerToDatabase(13, 'wesd', 'Hannah');
    await addPlayerToDatabase(13, 'ujmki', 'Josh');
}

test();

async function hostCheck(gameId: number){
    const query = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = "+gameId+" and is_host = true)");
    const res = await queryDatabaseZeroParams(query);
    return(res.rows[0].exists);
}

async function queryBoolCheck(table: string, column: string, value: any){
    const query = "SELECT EXISTS (SELECT * FROM "+table+" WHERE "+column+" = $1)";
    const data = [value];
    const res = await queryDatabase(query, data)
    console.log(res.rows[0].exists);
}

// queryBoolCheck('players', 'screenname', 'Dan');


// async function populateArticleList(params: QueryParams, player: Player){
//     const wikiQueryResults: WikiQueryResults = await fetchRandomArticles(params);
//     const randomResults: RandomFetchResults = wikiQueryResults.query;
//     player.articleOptions = randomResults;
//     console.log(player);
// }


// function instantiatePlayer(room: Room, screenName: string){
//     let player: Player = {
//         screenName: screenName,
//         playerId: randomUUID(),
//         roomID: room.roomID,
//         score: 0,
//         isInterrogator: false,
//         isHost: false,
//     }
//     room.playerList.push(player);
//     if( room.playerList.length === 1){ 
//         setHost(room, player);
//     }
// }

// function setHost(room: Room, newHost: Player){
//     room.host = newHost.playerId;
//     newHost.isHost = true;
//     for (let p in room.playerList){
//         if (room.playerList[p] !== newHost) {
//             room.playerList[p].isHost = false;
//         }
//     }
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