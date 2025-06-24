import type { Player, Round, Match, Tournament } from "@/types";

const WINS_POINTS = 3;
const DRAW_POINTS = 1;

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function calculateStandings(players: Player[], rounds: Round[]): Player[] {
  const playerMap = new Map<number, Player>(players.map((p) => [p.id, { ...p }]));

  // Reset all values
  for (const player of playerMap.values()) {
    player.points = 0;
    player.gamesWon = 0;
    player.gamesPlayed = 0;
    player.opponentIds = [];
    player.byes = 0;
  }

  // Calculate points, games, and opponents
  for (const round of rounds) {
    for (const match of round.pairings) {
      if (match.winnerId === 'bye') {
        const player = playerMap.get(match.player1Id);
        if (player) {
          player.points += WINS_POINTS;
          player.byes += 1;
        }
        continue;
      }

      const player1 = playerMap.get(match.player1Id);
      const player2 = playerMap.get(match.player2Id as number);

      if (player1 && player2) {
        player1.opponentIds.push(player2.id);
        player2.opponentIds.push(player1.id);
        player1.gamesPlayed += 1;
        player2.gamesPlayed += 1;
        
        if (match.winnerId === player1.id) {
          player1.points += WINS_POINTS;
        } else if (match.winnerId === player2.id) {
          player2.points += WINS_POINTS;
        } else if (match.winnerId === 'draw') {
          player1.points += DRAW_POINTS;
          player2.points += DRAW_POINTS;
        }
      }
    }
  }

  // Calculate Match Win Percentage (MWP)
  for (const player of playerMap.values()) {
    const roundsPlayed = player.gamesPlayed + player.byes;
    if (roundsPlayed > 0) {
      player.tiebreakers.matchWinPercentage = Math.max(0.33, player.points / (roundsPlayed * WINS_POINTS));
    } else {
      player.tiebreakers.matchWinPercentage = 0;
    }
  }

  // Calculate Strength of Schedule (SOS)
  for (const player of playerMap.values()) {
    let sos_total = 0;
    if (player.opponentIds.length > 0) {
      for (const opponentId of player.opponentIds) {
        const opponent = playerMap.get(opponentId);
        if (opponent) {
          sos_total += opponent.points;
        }
      }
      player.tiebreakers.strengthOfSchedule = sos_total;
    } else {
        player.tiebreakers.strengthOfSchedule = 0;
    }
  }

  // Calculate Sum of Opponents' Strength of Schedule (SOSOS)
  for (const player of playerMap.values()) {
    let sosos_total = 0;
    if (player.opponentIds.length > 0) {
      for (const opponentId of player.opponentIds) {
        const opponent = playerMap.get(opponentId);
        if (opponent) {
            sosos_total += opponent.tiebreakers.strengthOfSchedule;
        }
      }
      player.tiebreakers.sumOfOpponentStrengthOfSchedule = sosos_total;
    } else {
        player.tiebreakers.sumOfOpponentStrengthOfSchedule = 0;
    }
  }

  const sortedPlayers = Array.from(playerMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.tiebreakers.strengthOfSchedule !== a.tiebreakers.strengthOfSchedule) return b.tiebreakers.strengthOfSchedule - a.tiebreakers.strengthOfSchedule;
    if (b.tiebreakers.sumOfOpponentStrengthOfSchedule !== a.tiebreakers.sumOfOpponentStrengthOfSchedule) return b.tiebreakers.sumOfOpponentStrengthOfSchedule - a.tiebreakers.sumOfOpponentStrengthOfSchedule;
    return a.id - b.id; // Use player ID as a final, stable tiebreaker
  });

  return sortedPlayers;
}


export function generatePairings(players: Player[], existingRounds: Round[]): Match[] {
  let unpairedPlayers = calculateStandings(players, existingRounds);

  // Handle Bye
  let byePlayer: Player | null = null;
  if (unpairedPlayers.length % 2 !== 0) {
    // Find player with lowest score who hasn't had a bye
    for (let i = unpairedPlayers.length - 1; i >= 0; i--) {
      if (unpairedPlayers[i].byes === 0) {
        byePlayer = unpairedPlayers.splice(i, 1)[0];
        break;
      }
    }
    // If all have had a bye, give it to the lowest ranked player
    if (!byePlayer) {
      byePlayer = unpairedPlayers.pop()!;
    }
  }

  const pairings: Match[] = [];
  const pairedPlayerIds = new Set<number>();

  const allPreviousPairings = new Set<string>();
  existingRounds.forEach(round => {
    round.pairings.forEach(p => {
      if(p.player2Id !== 'bye') {
        const ids = [p.player1Id, p.player2Id].sort();
        allPreviousPairings.add(`${ids[0]}-${ids[1]}`);
      }
    });
  });

  const playersToPair = [...unpairedPlayers];
  const scoreGroups: { [key: number]: Player[] } = {};

  playersToPair.forEach(p => {
    if (!scoreGroups[p.points]) {
      scoreGroups[p.points] = [];
    }
    scoreGroups[p.points].push(p);
  });

  const sortedScores = Object.keys(scoreGroups).map(Number).sort((a,b) => b-a);
  let floatingPlayers: Player[] = [];

  for(const score of sortedScores) {
    let currentGroup = [...scoreGroups[score], ...floatingPlayers];
    floatingPlayers = [];
    currentGroup = shuffleArray(currentGroup);

    if (currentGroup.length % 2 !== 0) {
      floatingPlayers.push(currentGroup.pop()!);
    }

    while(currentGroup.length > 0) {
      const p1 = currentGroup.shift()!;
      let p2Found = false;
      for(let i=0; i<currentGroup.length; i++) {
        const p2 = currentGroup[i];
        const pairKey = [p1.id, p2.id].sort().join('-');
        if(!allPreviousPairings.has(pairKey)) {
          pairings.push({ table: 0, player1Id: p1.id, player2Id: p2.id, result: null, winnerId: null });
          currentGroup.splice(i, 1);
          p2Found = true;
          break;
        }
      }
      if(!p2Found && currentGroup.length > 0) {
        // Could not find a valid pair, just pair with first available
         const p2 = currentGroup.shift()!;
         pairings.push({ table: 0, player1Id: p1.id, player2Id: p2.id, result: null, winnerId: null });
      }
    }
  }


  if (byePlayer) {
    pairings.push({ table: 0, player1Id: byePlayer.id, player2Id: 'bye', result: { player1Score: 2, player2Score: 0}, winnerId: 'bye' });
  }

  return pairings.map((p, index) => ({ ...p, table: index + 1 }));
}
