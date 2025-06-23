export interface Player {
  id: number;
  name: string;
  points: number;
  opponentIds: number[];
  gamesWon: number;
  gamesPlayed: number;
  byes: number;
  tiebreakers: {
    matchWinPercentage: number;
    strengthOfSchedule: number;
    sumOfOpponentStrengthOfSchedule: number;
  };
}

export interface Match {
  table: number;
  player1Id: number;
  player2Id: number | 'bye';
  result: {
    player1Score: number;
    player2Score: number;
  } | null;
  winnerId: number | 'draw' | 'bye' | null;
}

export interface Round {
  roundNumber: number;
  pairings: Match[];
}

export interface Tournament {
  name: string;
  players: Player[];
  rounds: Round[];
  status: 'setup' | 'in_progress' | 'completed';
}
