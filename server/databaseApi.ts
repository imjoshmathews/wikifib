import { Pool } from "pg";
import { postgresqlCredentials }  from './secrets';
import * as constants from './const'
import { Player, Article, GameOptions, Game } from './interfaces';

const pool: Pool = new Pool(postgresqlCredentials);
pool.on('error', (err, client) =>{
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export function generateRoomCode(length: number): string {
    let results: string = '';
    for (let i = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * constants.characters.length);
        results += constants.characters.charAt(randomIndex);
    }
    return results;
};
export async function stripQueryToRows(results){
    return results.rows;
};

export async function queryDatabase(query: string, values?: Array<any>): Promise<Array<any>>{
    const client = await pool.connect();
    let res: Promise<any>;
        if (typeof values !== 'undefined') {
            try{
                res = await pool.query(query, values);
                res = await stripQueryToRows(res)
            } catch(error){
                res = error;
            }
        } else {
            try{
                res = await pool.query(query);
                res = await stripQueryToRows(res)
            } catch(error){
                res = error;
            }
        }
    client.release();
    return res;
};

export async function createUniqueRoomCode(): Promise<string>{
    const query: string = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    let values: Array<any>;
    let roomCode: string;
    let roomCollision: boolean;
    do { 
        roomCode = generateRoomCode(5);
        values = [roomCode];
        const res = await queryDatabase(query, values);
        roomCollision = res[0].exists;
    } while (roomCollision);
    return roomCode;
};
export async function getGameMaxScore(gameId: number): Promise<number>{
    const query: string = "SELECT max_score FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_score;
};
export async function getGameMaxArticles(gameId: number): Promise<number>{
    const query: string = "SELECT max_articles FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_articles;
};
export async function getGameMaxRounds(gameId: number): Promise<number>{
    const query: string = "SELECT max_rounds FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_rounds;
};
export async function getGameCurrentRound(gameId: number): Promise<number>{
    const query: string = "SELECT current_round FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].current_round;
};
export async function setGameCurrentRound(gameId: number, round: number): Promise<void>{
    const query: string = "UPDATE games SET current_round = $2 WHERE id = $1";
    const values: Array<any> = [gameId, round];
    await queryDatabase(query,values);
};
export async function getGameIdFromRoomCode(roomCode: string): Promise<number>{
    const query: string = "SELECT id FROM games WHERE room_code = $1";
    const values: Array<any> = [roomCode];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getRoomCode(gameId: number): Promise<string>{
    const query: string = "SELECT room_code FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].room_code;
};
export async function getGameIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT game_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].game_id;
};
export async function isGameEmpty(gameId: number): Promise<boolean>{
    const query: string = ("SELECT EXISTS (SELECT 1 FROM players WHERE game_id = $1)");
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return !(results[0].exists);
};
export async function getPlayerIdFromSocketId(socketId: string): Promise<number>{
    const query: string = "SELECT id FROM players WHERE socket_id = $1";
    const values: Array<any> = [socketId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getPlayerSocketId(playerId: number): Promise<string>{
    const query: string = "SELECT socket_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].socket_id;
};
export async function getPlayerName(playerId: number): Promise<string>{
    const query: string = "SELECT screenname FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].screenname;
};
export async function getPlayerScore(playerId: number): Promise<number>{
    const query: string = "SELECT score FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].score;
};
export async function setPlayerScore(playerId: number, score: number): Promise<void>{
    const query: string = "UPDATE players SET score = $2 WHERE id = $1";
    const values: Array<any> = [playerId, score];
    await queryDatabase(query,values);
};
export async function isPlayerHost(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_host FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_host;
};

export async function getHost(gameId: number): Promise<Player>{
    const query: string = "SELECT * FROM players WHERE is_host = true AND game_id = $1";
    const values: Array<number> = [gameId];
    const response = await queryDatabase(query,values);
    return response[0];
}
export async function getInterrogator(gameId: number): Promise<Player>{
    const query: string = "SELECT * FROM players WHERE is_interrogator = true AND game_id = $1";
    const values: Array<number> = [gameId];
    const response = await queryDatabase(query,values);
    console.log(response[0]);
    return response[0];
}
export async function getHonestPlayer(gameId: number): Promise<Player>{
    const query: string = "SELECT * FROM players WHERE is_honest = true AND game_id = $1";
    const values: Array<number> = [gameId];
    const response = await queryDatabase(query,values);
    return response[0];
}

export async function resetPlayerHost(){};
export async function setPlayerHost(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_host = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerInterrogator(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_interrogator FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_interrogator;
};
export async function setPlayerInterrogator(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_interrogator = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerHonest(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_honest FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_honest;
};
export async function setPlayerHonest(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_honest = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerReady(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_ready FROM players WHERE id = $1";
    const values: Array<number> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_ready;
};
export async function setPlayerReady(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_ready = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerConnected(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_connected FROM players WHERE id = $1";
    const values: Array<number> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_connected;
};
export async function setPlayerConnected(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_connected = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function getPlayerIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT player_id FROM articles WHERE id = $1";
    const values: Array<number> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].player_id;
};
export async function getArticleIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT id FROM articles WHERE player_id = $1";
    const values: Array<number> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getArticleIdFromWikiId(wikiId: number): Promise<number>{
    const query: string = "SELECT id FROM articles WHERE wiki_id = $1";
    const values: Array<number> = [wikiId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getWikiIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT wiki_id FROM articles WHERE id = $1";
    const values: Array<number> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].wiki_id;
};
export async function getArticleTitle(articleId: number): Promise<string>{
    const query: string = "SELECT title FROM articles WHERE id = $1";
    const values: Array<number> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].title;
};
export async function addGameToDatabase(gameOptions: GameOptions): Promise<number>{
    const query: string = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const roomCode: string = await createUniqueRoomCode();
    const timestamp = (Date.now()/1000);
    const values: Array<any> = [roomCode, gameOptions.max_score, gameOptions.max_articles, gameOptions.max_rounds, 0, timestamp];
    await queryDatabase(query,values);
    const gameId = await getGameIdFromRoomCode(roomCode);
    return gameId;
};
export async function deleteGameFromDatabase(gameId: number){
    const query: string = "DELETE FROM games WHERE id = $1";
    const values: Array<number> = [gameId];
    await queryDatabase(query,values);
};
export async function addPlayerToGame(roomCode: string, player: Player){
    const query: string = "INSERT INTO players(game_id, socket_id, screenname, is_connected, is_interrogator) VALUES ($1,$2,$3,$4,$5)";
    const values: Array<any> = [player.game_id, player.socket_id, player.screenname, player.is_connected, player.is_interrogator];
    await queryDatabase(query, values);
    const playerId = await getPlayerIdFromSocketId(player.socket_id);
    return playerId;
};
export async function deletePlayerFromDatabase(playerId: number): Promise<void>{
    const query: string = "DELETE FROM players WHERE id = $1";
    const values: Array<number> = [playerId];
    await queryDatabase(query,values);
};
export async function addArticleToDatabase(article: Article): Promise<number>{
    const query: string = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values: Array<any> = [article.player_id,article.wiki_id,article.title];
    await queryDatabase(query, values);
    const articleId = await getArticleIdFromPlayerId(article.player_id);
    return articleId;
};
export async function deleteArticleFromDatabase(id: number): Promise<void>{
    const query: string = "DELETE FROM articles WHERE id = $1";
    const values: Array<number> = [id];
    await queryDatabase(query,values);
};

export async function getAllPlayerIds(gameId: number): Promise<Array<number>>{
    const query: string = "SELECT id FROM players WHERE game_id = $1";
    const values: Array<number> = [gameId];
    const playerIdList = await queryDatabase(query,values);
    return playerIdList;
}

export async function getAllPlayerObjects(gameId: number): Promise<Array<Player>>{
    const query: string = "SELECT * FROM players WHERE game_id = $1";
    const values: Array<number> = [gameId];
    const playerList = await queryDatabase(query,values);
    return playerList;
}

export async function getAllConnectedPlayers(gameId: number): Promise<Array<Player>>{
    const query: string = "SELECT * FROM players WHERE game_id = $1 AND is_connected = true";
    const values: Array<number> = [gameId];
    const playerList = await queryDatabase(query,values);
    return playerList;
}

export async function updateGame(game: Game): Promise<void>{
    const query: string = "UPDATE games SET room_code = $1, max_score = $2, max_articles = $3, max_rounds = $4, current_round = $5, game_started = $6 WHERE id = $7";
    const values: Array<any> = [game.room_code,game.max_score,game.max_articles,game.max_rounds,game.current_round,game.game_started,game.id];
    await queryDatabase(query,values);
}

export async function updatePlayer(player: Player): Promise<void>{
    const query: string = "UPDATE players SET game_id = $1, socket_id = $2, screenname = $3, score = $4, is_host = $5, is_interrogator = $6, is_honest = $7, is_ready = $8, is_connected = $9 WHERE id = $10";
    const values: Array<any> = [player.game_id,player.socket_id,player.screenname,player.score,player.is_host,player.is_interrogator,player.is_honest,player.is_ready, player.is_connected, player.id];
    await queryDatabase(query,values);
}

export async function updateArticle(article: Article): Promise<void>{
    const query: string = "UPDATE articles SET player_id = $1, wiki_id = $2, title = $3 WHERE id = $4";
    const values: Array<any> = [article.player_id,article.wiki_id,article.title,article.id];
    await queryDatabase(query,values);
}

export async function getGameObject(gameId: number): Promise<Game>{
    const query: string = "SELECT * FROM games WHERE id = $1";
    const values: Array<number> = [gameId];
    const results: Array<Game> = await queryDatabase(query,values);
    return results[0];
}
export async function getPlayerObject(id: number): Promise<Player>{
    const query: string = "SELECT * FROM players WHERE id = $1";
    const values: Array<number> = [id];
    const response = await queryDatabase(query,values);
    return response[0];
}
export async function getArticleObject(id: number): Promise<Article>{
    const query: string = "SELECT * FROM articles WHERE id = $1";
    const values: Array<number> = [id];
    const response = await queryDatabase(query,values);
    return response[0];
}
export async function isSocketIdUnique(socketId: string): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT * FROM players WHERE socket_id = $1)";
    const values: Array<any> = [socketId];
    const results = await queryDatabase(query,values);
    return !(results[0].exists);
};

export async function doesRoomCodeExist(roomCode: string): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    const values: Array<string> = [roomCode];
    const results = await queryDatabase(query,values);
    return results[0].exists;
}

export async function doesGameExist(gameId: number): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT 1 FROM games WHERE id = $1)";
    const values: Array<number> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].exists;
}

export async function doesPlayerExist(playerId: number): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT 1 FROM players WHERE id = $1)";
    const values: Array<number> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].exists;
}

export async function doesHonestPlayerExist(gameId: number): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT 1 FROM players WHERE game_id = $1 and is_honest = true)";
    const values: Array<number> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].exists;
}

export async function doesArticleForPlayerExist(playerId: number): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT * FROM articles WHERE player_id = $1)";
    const values: Array<number> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].exists;
}

export async function readyCheck(gameId: number): Promise<boolean>{
    const query: string = "SELECT EXISTS (SELECT 1 FROM players WHERE game_id = $1 AND is_ready = false)";
    const values: Array<number> = [gameId];
    const results = await queryDatabase(query,values);
    return !results[0].exists;
}

// export async function getActiveArticle(gameId: number): Promise<Article>{
//     const query: string = "SELECT * FROM articles WHERE "
// }