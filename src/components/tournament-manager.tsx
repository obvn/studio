"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { Tournament, Player, Match, Round } from "@/types";
import { calculateStandings, generatePairings } from "@/lib/swiss";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const StandingsDisplay = ({
  players,
  rounds,
}: {
  players: Player[];
  rounds: Round[];
}) => {
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [
    players,
  ]);

  const getPlayerName = useCallback(
    (id: number) => {
      return playerMap.get(id)?.name || "Unknown Player";
    },
    [playerMap]
  );

  const getPlayerMatches = useCallback(
    (playerId: number) => {
      const matches: Match[] = [];
      rounds.forEach((round) => {
        const match = round.pairings.find(
          (p) => p.player1Id === playerId || p.player2Id === playerId
        );
        if (match) {
          matches.push(match);
        }
      });
      return matches;
    },
    [rounds]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" /> Standings
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-[50px,1fr,auto,auto,auto,auto] items-center gap-4 border-b px-4 py-2 text-sm font-medium text-muted-foreground">
          <div className="text-left">Rank</div>
          <div className="text-left">Player</div>
          <div className="text-right">Points</div>
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex cursor-help items-center justify-end gap-1">
                  MW% <Info size={14} />
                </TooltipTrigger>
                <TooltipContent>Match Win Percentage</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex cursor-help items-center justify-end gap-1">
                  SOS <Info size={14} />
                </TooltipTrigger>
                <TooltipContent>Strength of Schedule</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex cursor-help items-center justify-end gap-1">
                  SOSOS <Info size={14} />
                </TooltipTrigger>
                <TooltipContent>
                  Sum of Opponents' Strength of Schedule
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {players.map((p, index) => {
            const playerMatches = getPlayerMatches(p.id);
            return (
              <AccordionItem value={`item-${p.id}`} key={p.id}>
                <AccordionTrigger className="w-full p-0 hover:no-underline">
                  <div className="grid w-full grid-cols-[50px,1fr,auto,auto,auto,auto] items-center gap-4 px-4 py-3 hover:bg-muted/50">
                    <div className="text-left font-medium">{index + 1}</div>
                    <div className="text-left">{p.name}</div>
                    <div className="text-right">{p.points}</div>
                    <div className="text-right">
                      {p.tiebreakers.matchWinPercentage.toFixed(3)}
                    </div>
                    <div className="text-right">
                      {p.tiebreakers.strengthOfSchedule}
                    </div>
                    <div className="text-right">
                      {p.tiebreakers.sumOfOpponentStrengthOfSchedule}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="pl-[66px]">
                    {" "}
                    {/* 50px + 16px gap */}
                    <h4 className="mb-2 text-sm font-semibold">
                      Match History
                    </h4>
                    {playerMatches.length > 0 ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {playerMatches.map((match, matchIndex) => {
                          const opponentId =
                            match.player1Id === p.id
                              ? match.player2Id
                              : match.player1Id;
                          const opponentName =
                            opponentId === "bye"
                              ? "BYE"
                              : getPlayerName(opponentId);

                          let resultText = "Pending";
                          let outcome: "Win" | "Loss" | "Draw" | null = null;
                          if (match.winnerId !== null) {
                            if (
                              match.winnerId === p.id ||
                              match.winnerId === "bye"
                            )
                              outcome = "Win";
                            else if (match.winnerId === "draw")
                              outcome = "Draw";
                            else outcome = "Loss";
                          }

                          if (match.result) {
                            if (match.player1Id === p.id) {
                              resultText = `${match.result.player1Score}-${match.result.player2Score}`;
                            } else {
                              resultText = `${match.result.player2Score}-${match.result.player1Score}`;
                            }
                          }
                          if (opponentId === "bye") resultText = "2-0";

                          return (
                            <li
                              key={matchIndex}
                              className="flex items-center justify-between"
                            >
                              <span>
                                vs. <strong>{opponentName}</strong>
                              </span>
                              <div className="flex items-center gap-2">
                                {outcome && (
                                  <Badge
                                    variant={
                                      outcome === "Win"
                                        ? "default"
                                        : outcome === "Loss"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="text-xs font-medium"
                                  >
                                    {outcome}
                                  </Badge>
                                )}
                                <span className="font-mono text-foreground">
                                  {resultText}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No matches played yet.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
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
  onResult: (matchIndex: number, score: string) => void;
}) => {
  const getPlayerName = useCallback(
    (id: number | "bye") => {
      if (id === "bye") return "BYE";
      return players.find((p) => p.id === id)?.name || "Unknown Player";
    },
    [players]
  );

  const scoreOptions = ["2-0", "2-1", "1-0", "1-1", "0-1", "1-2", "0-2", "0-0"];

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
                <div className="text-center">
                  <div className="text-muted-foreground">vs</div>
                  {match.result && (
                    <div className="font-mono mt-1 font-bold text-lg">{`${match.result.player1Score} - ${match.result.player2Score}`}</div>
                  )}
                </div>
                <div className="font-semibold text-lg">
                  {getPlayerName(match.player2Id)}
                </div>
              </div>
              {match.player2Id !== "bye" && (
                <div className="flex justify-center mt-2">
                  <Select
                    onValueChange={(value) => onResult(index, value)}
                    value={
                      match.result
                        ? `${match.result.player1Score}-${match.result.player2Score}`
                        : ""
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Enter Result" />
                    </SelectTrigger>
                    <SelectContent>
                      {scoreOptions.map((score) => (
                        <SelectItem key={score} value={score}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        strengthOfSchedule: 0,
        sumOfOpponentStrengthOfSchedule: 0,
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

  const handleResult = (matchIndex: number, score: string) => {
    setTournament((prev) => {
      if (!prev) return null;
      const newRounds = [...prev.rounds];
      const currentRoundIndex = newRounds.length - 1;
      const match = newRounds[currentRoundIndex].pairings[matchIndex];
      
      const [player1Score, player2Score] = score.split('-').map(Number);

      let winnerId: number | 'draw' | 'bye' | null = null;
      if (match.player2Id !== 'bye') {
        if (player1Score > player2Score) {
          winnerId = match.player1Id;
        } else if (player2Score > player1Score) {
          winnerId = match.player2Id as number;
        } else {
          winnerId = 'draw';
        }
      } else {
        winnerId = 'bye';
      }

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
          <StandingsDisplay players={sortedPlayers} rounds={tournament.rounds} />
        </div>
      </div>
    </div>
  );
}
