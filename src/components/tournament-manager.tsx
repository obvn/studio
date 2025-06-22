"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { Tournament, Player, Match } from "@/types";
import { calculateStandings, generatePairings } from "@/lib/swiss";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Users,
  Swords,
  Trophy,
  RefreshCw,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const TournamentSetup = ({
  onStart,
}: {
  onStart: (tournamentName: string, playerNames: string[]) => void;
}) => {
  const [name, setName] = useState("MTG Night");
  const [players, setPlayers] = useState(
    "Alice\nBob\nCharlie\nDiana\nEthan\nFiona\nGeorge\nIvy"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playerNames = players
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    if (name && playerNames.length >= 2) {
      onStart(name, playerNames);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            New Tournament
          </CardTitle>
          <CardDescription>
            Enter tournament details and player names to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="tournament-name">Tournament Name</label>
            <Input
              id="tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., FNM Showdown"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="player-names">Player Names (one per line)</label>
            <Textarea
              id="player-names"
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              placeholder="Alice\nBob\nCharlie..."
              rows={10}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Start Tournament
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const StandingsDisplay = ({ players }: { players: Player[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" /> Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TooltipProvider>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      MW% <Info size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Match Win Percentage</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      SOS <Info size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Strength of Schedule</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      SOSOS <Info size={14} />
                    </TooltipTrigger>
                    <TooltipContent>
                      Strength of Opponents' Schedule
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              </TooltipProvider>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, index) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-right">{p.points}</TableCell>
                <TableCell className="text-right">
                  {p.tiebreakers.matchWinPercentage.toFixed(3)}
                </TableCell>
                <TableCell className="text-right">
                  {p.tiebreakers.opponentsMatchWinPercentage.toFixed(3)}
                </TableCell>
                <TableCell className="text-right">
                  {p.tiebreakers.opponentsOpponentsMatchWinPercentage.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const RoundDisplay = ({
  round,
  players,
  onResult,
}: {
  round: Tournament["rounds"][0];
  players: Player[];
  onResult: (matchIndex: number, winnerId: number | "draw") => void;
}) => {
  const getPlayerName = useCallback(
    (id: number | "bye") => {
      if (id === "bye") return "BYE";
      return players.find((p) => p.id === id)?.name || "Unknown Player";
    },
    [players]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-6 w-6" /> Round {round.roundNumber} Pairings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {round.pairings.map((match, index) => (
            <div key={index}>
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 p-4 border rounded-lg">
                <div className="text-right font-semibold text-lg">
                  {getPlayerName(match.player1Id)}
                </div>
                <div className="text-muted-foreground">vs</div>
                <div className="font-semibold text-lg">
                  {getPlayerName(match.player2Id)}
                </div>
              </div>
              {match.player2Id !== "bye" && (
                <div className="flex justify-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={
                      match.winnerId === match.player1Id ? "default" : "outline"
                    }
                    onClick={() => onResult(index, match.player1Id)}
                  >
                    {getPlayerName(match.player1Id)} wins
                  </Button>
                  <Button
                    size="sm"
                    variant={match.winnerId === "draw" ? "default" : "outline"}
                    onClick={() => onResult(index, "draw")}
                  >
                    Draw
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      match.winnerId === match.player2Id ? "default" : "outline"
                    }
                    onClick={() => onResult(index, match.player2Id as number)}
                  >
                    {getPlayerName(match.player2Id)} wins
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export function TournamentManager() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const { toast } = useToast();

  const handleStartTournament = (
    tournamentName: string,
    playerNames: string[]
  ) => {
    if (playerNames.length < 2) {
      toast({
        title: "Error",
        description: "You need at least 2 players to start a tournament.",
        variant: "destructive",
      });
      return;
    }
    const players: Player[] = playerNames.map((name, index) => ({
      id: index,
      name,
      points: 0,
      opponentIds: [],
      gamesWon: 0,
      gamesPlayed: 0,
      byes: 0,
      tiebreakers: {
        matchWinPercentage: 0,
        opponentsMatchWinPercentage: 0,
        opponentsOpponentsMatchWinPercentage: 0,
      },
    }));
    setTournament({
      name: tournamentName,
      players,
      rounds: [],
      status: "in_progress",
    });
    toast({
      title: "Tournament Started!",
      description: `"${tournamentName}" is underway with ${players.length} players.`,
    });
  };

  const handleGenerateRound = (isRegen = false) => {
    if (!tournament) return;

    if (!isRegen) {
      const currentRound = tournament.rounds[tournament.rounds.length - 1];
      if (currentRound) {
        const resultsPending = currentRound.pairings.some(
          (p) => p.winnerId === null
        );
        if (resultsPending) {
          toast({
            title: "Cannot generate next round",
            description: "Please enter all results for the current round.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    const pairings = generatePairings(
      tournament.players,
      isRegen
        ? tournament.rounds.slice(0, -1)
        : tournament.rounds
    );

    const newRound: Tournament["rounds"][0] = {
      roundNumber: isRegen
        ? tournament.rounds.length
        : tournament.rounds.length + 1,
      pairings,
    };
    
    setTournament((prev) => {
      if (!prev) return null;
      const updatedRounds = isRegen ? [...prev.rounds.slice(0, -1), newRound] : [...prev.rounds, newRound];
      const updatedPlayers = calculateStandings(prev.players, updatedRounds);

      return {
        ...prev,
        rounds: updatedRounds,
        players: updatedPlayers
      };
    });
    
    toast({
      title: `Round ${newRound.roundNumber} Generated`,
      description: `Pairings are ready. Good luck!`,
    });
  };

  const handleResult = (matchIndex: number, winnerId: number | "draw") => {
    setTournament((prev) => {
      if (!prev) return null;
      const newRounds = [...prev.rounds];
      const currentRoundIndex = newRounds.length - 1;
      const match = newRounds[currentRoundIndex].pairings[matchIndex];
      
      const player1Score = winnerId === match.player1Id ? 2 : winnerId === 'draw' ? 1 : 0;
      const player2Score = winnerId === match.player2Id ? 2 : winnerId === 'draw' ? 1 : 0;

      newRounds[currentRoundIndex].pairings[matchIndex].winnerId = winnerId;
      newRounds[currentRoundIndex].pairings[matchIndex].result = { player1Score, player2Score };

      const updatedPlayers = calculateStandings(prev.players, newRounds);

      return { ...prev, rounds: newRounds, players: updatedPlayers };
    });
  };

  const sortedPlayers = useMemo(() => {
    if (!tournament) return [];
    return calculateStandings(tournament.players, tournament.rounds);
  }, [tournament]);

  if (!tournament) {
    return <TournamentSetup onStart={handleStartTournament} />;
  }

  const currentRound = tournament.rounds[tournament.rounds.length - 1];
  const allResultsIn = currentRound?.pairings.every((p) => p.winnerId !== null);

  return (
    <div className="space-y-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{tournament.name}</CardTitle>
            <CardDescription>
              Round {tournament.rounds.length} of {Math.ceil(Math.log2(tournament.players.length))}.
              {tournament.status === 'completed' ? ' Tournament finished.' : ''}
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button
              onClick={() => handleGenerateRound(false)}
              disabled={!allResultsIn && tournament.rounds.length > 0}
              className="bg-accent hover:bg-accent/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {tournament.rounds.length === 0
                ? "Generate Round 1"
                : "Generate Next Round"}
            </Button>
            {currentRound && (
                <Button onClick={() => handleGenerateRound(true)} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Round
                </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {currentRound && (
            <RoundDisplay
              round={currentRound}
              players={tournament.players}
              onResult={handleResult}
            />
          )}
        </div>
        <div className="space-y-8">
          <StandingsDisplay players={sortedPlayers} />
        </div>
      </div>
    </div>
  );
}
