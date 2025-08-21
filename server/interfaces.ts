export interface QueryParams {
    action: string;
    format: string;
    list: string;
    rnlimit: number;
    rnnamespace: number;
}
export interface WikiQueryResults{
    batchcomplete: string;
    continue: object;
    query;
}
export interface Article {
    id: number;
    title: string;
}
export interface Game {
    id: number;
    roomCode: string;
    maxScore: number;
    maxArticles: number;
    maxRounds: number;
    currentRound: number;
    createdAt: EpochTimeStamp;
}
export interface GameOptions {
    maxScore: number;
    maxArticles: number;
    maxRounds: number;
}
export interface Player {
    socket: any;
    screenname: string;
}

