export interface QueryParams {
    action: string;
    format: string;
    list: string;
    rnlimit: number;
    rnnamespace: number;
    rnminsize: number;
}
export interface WikiQueryResults{
    batchcomplete: string;
    continue: object;
    query;
}

export interface RandomResults{
    id: number,
    ns: number,
    title: string,
}

export interface Article {
    id: number;
    player_id: number;
    wiki_id: number;
    title: string;
}
export interface Game {
    id: number;
    room_code: string;
    max_score: number;
    max_articles: number;
    max_rounds: number;
    current_round: number;
    created_at: EpochTimeStamp;
    game_started: boolean;
}

export interface InitOptions {
    hostScreenname: string,
    gameOptions: GameOptions,    
}

export interface GameOptions {
    max_score: number;
    max_articles: number;
    max_rounds: number;
}

export interface Player {
    id: number,
    game_id: number,
    socket_id: string,
    screenname: string,
    score: number,
    is_host: boolean,
    is_interrogator: boolean,
    is_honest: boolean,
    is_connected: boolean,
}
