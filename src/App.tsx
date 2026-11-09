import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Camera,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Droplets,
  Flag,
  Gamepad2,
  Home,
  Medal,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  CameraPreset,
  ConnectedGamepadInfo,
  ControlType,
  PlayerSlotConfig,
  TrackId,
  VehicleTelemetry,
  WeatherType,
} from './types/game';
import { TRACK_DEFINITIONS, TRACK_ORDER } from './game/tracks';
import { RaceViewport } from './components/RaceViewport';
import { soundEngine } from './audio/soundEngine';

export type GameMode = 'single_track' | 'grand_prix';

export interface GrandPrixDriverStanding {
  slotIndex: number;
  name: string;
  colorHex: string;
  controlType: ControlType;
  totalPoints: number;
  roundPoints: (number | null)[];
  wins: number;
  podiums: number;
  bestLapMs: number | null;
  totalHits: number;
  spinOutsCaused: number;
}

export interface HallOfFameEntry {
  id: string;
  driverName: string;
  colorHex: string;
  totalPoints: number;
  wins: number;
  lapsPerRace: number;
  bestLapMs: number | null;
  dateLabel: string;
}

const FIXED_LAPS = 3;
const WEATHER_TYPES: WeatherType[] = ['clear', 'rain', 'snow'];
const GP_POINTS_BY_RANK = [10, 6, 4, 2];
const HALL_OF_FAME_STORAGE_KEY = 'sage_rally_gp_leaderboard_v1';

function pickRandomWeather(): WeatherType {
  return WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
}

const DEFAULT_HALL_OF_FAME: HallOfFameEntry[] = [
  {
    id: 'hof-1',
    driverName: 'Sage Champion',
    colorHex: '#EF4444',
    totalPoints: 48,
    wins: 4,
    lapsPerRace: FIXED_LAPS,
    bestLapMs: 36420,
    dateLabel: 'Pro-Am Record',
  },
  {
    id: 'hof-2',
    driverName: 'Ironman Stewart',
    colorHex: '#F59E0B',
    totalPoints: 41,
    wins: 3,
    lapsPerRace: FIXED_LAPS,
    bestLapMs: 37890,
    dateLabel: 'Baja Cup',
  },
  {
    id: 'hof-3',
    driverName: 'Cobalt Works',
    colorHex: '#3B82F6',
    totalPoints: 34,
    wins: 1,
    lapsPerRace: FIXED_LAPS,
    bestLapMs: 38910,
    dateLabel: 'Forest Series',
  },
  {
    id: 'hof-4',
    driverName: 'Emerald GT',
    colorHex: '#10B981',
    totalPoints: 28,
    wins: 0,
    lapsPerRace: FIXED_LAPS,
    bestLapMs: 40150,
    dateLabel: 'Alpine Trophy',
  },
];

const CAR_PALETTE: { colorHex: string; colorName: string }[] = [
  { colorHex: '#EF4444', colorName: 'Crimson GT' },
  { colorHex: '#3B82F6', colorName: 'Cobalt Rally' },
  { colorHex: '#F59E0B', colorName: 'Solaris Pro' },
  { colorHex: '#10B981', colorName: 'Emerald Works' },
];

function buildSlotsForPlayerCount(
  humanCount: number,
  connectedGamepads: ConnectedGamepadInfo[]
): PlayerSlotConfig[] {
  return [0, 1, 2, 3].map((slotIndex) => {
    const palette = CAR_PALETTE[slotIndex];
    const isHuman = slotIndex < humanCount;

    if (!isHuman) {
      return {
        slotIndex,
        name: `Sage AI-${slotIndex + 1}`,
        colorHex: palette.colorHex,
        colorName: palette.colorName,
        controlType: 'ai' as ControlType,
        gamepadIndex: null,
      };
    }

    if (slotIndex === 0) {
      const hasPad0 = connectedGamepads.some((p) => p.index === 0);
      return {
        slotIndex,
        name: 'Player 1',
        colorHex: palette.colorHex,
        colorName: palette.colorName,
        controlType: (hasPad0 && humanCount > 1
          ? 'gamepad'
          : 'keyboard_wasd') as ControlType,
        gamepadIndex: hasPad0 && humanCount > 1 ? 0 : null,
      };
    }
    if (slotIndex === 1) {
      const hasPad1 = connectedGamepads.some((p) => p.index === 1);
      return {
        slotIndex,
        name: 'Player 2',
        colorHex: palette.colorHex,
        colorName: palette.colorName,
        controlType: (hasPad1 ? 'gamepad' : 'keyboard_arrows') as ControlType,
        gamepadIndex: hasPad1 ? 1 : null,
      };
    }
    const padIndex = slotIndex - 1;
    return {
      slotIndex,
      name: `Player ${slotIndex + 1}`,
      colorHex: palette.colorHex,
      colorName: palette.colorName,
      controlType: 'gamepad' as ControlType,
      gamepadIndex: padIndex,
    };
  });
}

function createInitialGpStandings(
  slots: PlayerSlotConfig[]
): GrandPrixDriverStanding[] {
  return slots.map((s) => ({
    slotIndex: s.slotIndex,
    name: s.name,
    colorHex: s.colorHex,
    controlType: s.controlType,
    totalPoints: 0,
    roundPoints: [null, null, null, null, null],
    wins: 0,
    podiums: 0,
    bestLapMs: null,
    totalHits: 0,
    spinOutsCaused: 0,
  }));
}

function formatLapTime(ms: number | null): string {
  if (ms === null || ms <= 0) return '--:--.---';
  const totalSeconds = ms / 1000;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const millis = Math.floor(ms % 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function getRankOrdinal(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('grand_prix');
  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(1);
  const [trackId, setTrackId] = useState<TrackId>('pinewood_gp');
  const [weather, setWeather] = useState<WeatherType>(() => pickRandomWeather());
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric_zoom');
  const [playerSlots, setPlayerSlots] = useState<PlayerSlotConfig[]>(() =>
    buildSlotsForPlayerCount(1, [])
  );

  // Start on the Initial Title Screen ('lobby') with 3D attract-mode background
  const [raceState, setRaceState] = useState<
    'lobby' | 'countdown' | 'racing' | 'paused' | 'finished'
  >('lobby');
  const [raceRestartToken, setRaceRestartToken] = useState<number>(1);

  // Grand Prix Championship State (5 Rounds across all 5 tracks)
  const [gpRoundIndex, setGpRoundIndex] = useState<number>(0);
  const [gpStandings, setGpStandings] = useState<GrandPrixDriverStanding[]>(() =>
    createInitialGpStandings(buildSlotsForPlayerCount(1, []))
  );
  const [lastRoundPointsAwarded, setLastRoundPointsAwarded] = useState<
    Record<number, number>
  >({});
  const [fastestLapBonusSlot, setFastestLapBonusSlot] = useState<number | null>(
    null
  );

  // Persistent Grand Prix Hall of Fame Leaderboard
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HALL_OF_FAME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_HALL_OF_FAME;
  });
  const [showLeaderboardModal, setShowLeaderboardModal] =
    useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<VehicleTelemetry[]>([]);
  const [connectedGamepads, setConnectedGamepads] = useState<ConnectedGamepadInfo[]>([]);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [finalStandings, setFinalStandings] = useState<VehicleTelemetry[]>([]);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' && raceState === 'racing') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'Escape') {
        setRaceState((prev) => {
          if (prev === 'racing') return 'paused';
          if (prev === 'paused') return 'racing';
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [raceState]);

  // Xbox Controller Press 'A' to auto-join a slot on Title Screen
  useEffect(() => {
    if (raceState !== 'lobby' && raceState !== 'paused') return;
    for (const pad of connectedGamepads) {
      if (pad.aButton) {
        setPlayerSlots((prev) => {
          const alreadyAssigned = prev.some(
            (s) => s.controlType === 'gamepad' && s.gamepadIndex === pad.index
          );
          if (alreadyAssigned) return prev;
          const next = [...prev];
          const targetIdx = next.findIndex((s) => s.controlType !== 'gamepad');
          const idx = targetIdx >= 0 ? targetIdx : 0;
          next[idx] = {
            ...next[idx],
            name: `Player ${idx + 1}`,
            controlType: 'gamepad',
            gamepadIndex: pad.index,
          };
          const newHumanCount = next.filter((s) => s.controlType !== 'ai').length;
          setHumanPlayerCount(Math.max(1, newHumanCount));
          return next;
        });
      }
    }
  }, [connectedGamepads, raceState]);

  const handlePlayerCountSelect = (count: number) => {
    setHumanPlayerCount(count);
    const updatedSlots = buildSlotsForPlayerCount(count, connectedGamepads);
    setPlayerSlots(updatedSlots);
  };

  const handleTelemetryUpdate = useCallback(
    (
      nextTelemetry: VehicleTelemetry[],
      gamepads: ConnectedGamepadInfo[],
      cdVal: number | null
    ) => {
      setTelemetry(nextTelemetry);
      setConnectedGamepads(gamepads);
      setCountdownVal(cdVal);
    },
    []
  );

  const handleRaceFinished = useCallback(
    (standings: VehicleTelemetry[]) => {
      setFinalStandings(standings);
      setRaceState('finished');

      if (gameMode === 'grand_prix') {
        let fastestSlot: number | null = null;
        let fastestMs = Infinity;
        for (const car of standings) {
          if (car.bestLapMs !== null && car.bestLapMs < fastestMs) {
            fastestMs = car.bestLapMs;
            fastestSlot = car.slotIndex;
          }
        }
        setFastestLapBonusSlot(fastestSlot);

        const awardedMap: Record<number, number> = {};
        for (const car of standings) {
          const basePts = GP_POINTS_BY_RANK[car.positionRank - 1] ?? 1;
          const bonusPts = car.slotIndex === fastestSlot ? 1 : 0;
          awardedMap[car.slotIndex] = basePts + bonusPts;
        }
        setLastRoundPointsAwarded(awardedMap);

        setGpStandings((prev) => {
          const updated = prev.map((driver) => {
            const raceResult = standings.find(
              (s) => s.slotIndex === driver.slotIndex
            );
            if (!raceResult) return driver;
            const pts = awardedMap[driver.slotIndex] ?? 0;
            const nextRoundPts = [...driver.roundPoints];
            nextRoundPts[gpRoundIndex] = pts;
            const totalPts = nextRoundPts.reduce<number>(
              (acc, val) => acc + (val ?? 0),
              0
            );
            const nextBestLap =
              driver.bestLapMs === null
                ? raceResult.bestLapMs
                : raceResult.bestLapMs !== null
                  ? Math.min(driver.bestLapMs, raceResult.bestLapMs)
                  : driver.bestLapMs;

            return {
              ...driver,
              name: raceResult.name,
              controlType: raceResult.controlType,
              totalPoints: totalPts,
              roundPoints: nextRoundPts,
              wins: driver.wins + (raceResult.positionRank === 1 ? 1 : 0),
              podiums: driver.podiums + (raceResult.positionRank <= 3 ? 1 : 0),
              bestLapMs: nextBestLap,
              totalHits: driver.totalHits + raceResult.totalHits,
              spinOutsCaused:
                driver.spinOutsCaused + raceResult.spinOutsCaused,
            };
          });

          const sortedGp = [...updated].sort(
            (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins
          );

          if (gpRoundIndex === TRACK_ORDER.length - 1 && sortedGp.length > 0) {
            const champion = sortedGp[0];
            const newEntry: HallOfFameEntry = {
              id: `gp-${Date.now()}`,
              driverName: champion.name,
              colorHex: champion.colorHex,
              totalPoints: champion.totalPoints,
              wins: champion.wins,
              lapsPerRace: FIXED_LAPS,
              bestLapMs: champion.bestLapMs,
              dateLabel: 'Grand Prix Cup',
            };
            setHallOfFame((prevHof) => {
              const combined = [newEntry, ...prevHof]
                .sort(
                  (a, b) =>
                    b.totalPoints - a.totalPoints ||
                    (a.bestLapMs ?? 999999) - (b.bestLapMs ?? 999999)
                )
                .slice(0, 8);
              try {
                localStorage.setItem(
                  HALL_OF_FAME_STORAGE_KEY,
                  JSON.stringify(combined)
                );
              } catch {
                // ignore storage errors
              }
              return combined;
            });
          }

          return sortedGp;
        });
      }
    },
    [gameMode, gpRoundIndex]
  );

  const handleCountdownComplete = useCallback(() => {
    setRaceState('racing');
    setCountdownVal(null);
  }, []);

  const launchFromTitleScreen = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const freshSlots = buildSlotsForPlayerCount(
      humanPlayerCount,
      connectedGamepads
    );
    setPlayerSlots(freshSlots);
    setWeather(pickRandomWeather());

    if (gameMode === 'grand_prix') {
      const firstTrack = TRACK_ORDER[0];
      setGpRoundIndex(0);
      setGpStandings(createInitialGpStandings(freshSlots));
      setLastRoundPointsAwarded({});
      setFastestLapBonusSlot(null);
      setTrackId(firstTrack);
    }
    setRaceRestartToken((t) => t + 1);
    setRaceState('countdown');
  };

  const advanceToNextGpRound = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const nextRound = gpRoundIndex + 1;
    if (nextRound < TRACK_ORDER.length) {
      const nextTrack = TRACK_ORDER[nextRound];
      setGpRoundIndex(nextRound);
      setTrackId(nextTrack);
      setWeather(pickRandomWeather());
      setRaceRestartToken((t) => t + 1);
      setRaceState('countdown');
    }
  };

  const restartCurrentRace = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setWeather(pickRandomWeather());
    setRaceRestartToken((t) => t + 1);
    setRaceState('countdown');
  };

  const returnToTitleScreen = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRaceState('lobby');
  };

  const handleTrackChange = (id: TrackId) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTrackId(id);
    setWeather(pickRandomWeather());
    if (raceState === 'racing') {
      setGameMode('single_track');
      setRaceRestartToken((t) => t + 1);
      setRaceState('racing');
    }
  };

  const toggleMute = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const currentTrackDef = TRACK_DEFINITIONS[trackId];

  const shortTrackLabels: Record<TrackId, string> = {
    pinewood_gp: 'Forest GP',
    pro_am_circuit: 'Pro-Am',
    ironman_baja: 'Ironman Baja',
    alpine_pass: 'Alpine Pass',
    thunder_valley: 'Thunder Valley',
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#0B0F17] text-slate-100">
      {/* 3D WebGL Viewport (100% Full-Screen) */}
      <RaceViewport
        trackId={trackId}
        weather={weather}
        cameraPreset={cameraPreset}
        maxLaps={FIXED_LAPS}
        playerSlots={playerSlots}
        raceState={raceState}
        raceRestartToken={raceRestartToken}
        onTelemetryUpdate={handleTelemetryUpdate}
        onRaceFinished={handleRaceFinished}
        onCountdownComplete={handleCountdownComplete}
      />

      {/* TOP TELEMETRY & STANDINGS BAR (Shown when Racing or Countdown) */}
      {raceState !== 'lobby' && (
        <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none px-4 pt-3">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-6 bg-[#0B0F17]/92 border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto shadow-lg">
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold tracking-wider text-amber-400 whitespace-nowrap shrink-0">
                  SAGE RALLY
                </span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
                  {gameMode === 'grand_prix' && (
                    <>
                      <span className="font-mono font-bold text-cyan-300">
                        GP ROUND {gpRoundIndex + 1}/{TRACK_ORDER.length}
                      </span>
                      <span className="text-slate-500" aria-hidden="true">
                        ·
                      </span>
                    </>
                  )}
                  <span className="font-semibold text-white">
                    {currentTrackDef.name}
                  </span>
                  <span className="text-slate-500" aria-hidden="true">
                    ·
                  </span>
                  <span className="capitalize">{weather}</span>
                  <span className="text-slate-500" aria-hidden="true">
                    ·
                  </span>
                  <span className="hidden xl:inline">
                    Space: Gun (3/Lap) · E: Oil (2/Lap) · Shift/C: Nitro (3/Lap) · R: Reset
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="hidden lg:flex items-center gap-1.5 text-slate-400 whitespace-nowrap mr-1">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>
                    {connectedGamepads.length > 0
                      ? `${connectedGamepads.length} Xbox Controller${connectedGamepads.length > 1 ? 's' : ''}`
                      : `${humanPlayerCount}P Active`}
                  </span>
                </div>

                <button
                  onClick={returnToTitleScreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Title Screen</span>
                </button>

                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setRaceState((prev) =>
                      prev === 'paused' ? 'racing' : 'paused'
                    );
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {raceState === 'paused' ? 'Resume Race' : 'Pause'}
                </button>
              </div>
            </div>

            {/* 4-Car Live Telemetry Strip */}
            {telemetry.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pointer-events-auto">
                {telemetry.map((car) => {
                  const gpDriver = gpStandings.find(
                    (g) => g.slotIndex === car.slotIndex
                  );
                  return (
                    <div
                      key={car.slotIndex}
                      className="bg-[#0B0F17]/90 border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-md flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: car.colorHex }}
                          />
                          <span className="font-display font-bold text-xs text-white truncate">
                            {car.name}
                          </span>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            ·{' '}
                            {car.controlType === 'gamepad'
                              ? `Xbox #${(car.gamepadIndex ?? 0) + 1}`
                              : car.controlType === 'keyboard_wasd'
                                ? car.slotIndex === 0 && humanPlayerCount === 1
                                  ? 'WASD/Arrows'
                                  : 'WASD'
                                : car.controlType === 'keyboard_arrows'
                                  ? 'Arrows'
                                  : 'AI'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {gameMode === 'grand_prix' && gpDriver && (
                            <span className="text-[10px] font-mono text-cyan-300 whitespace-nowrap">
                              {gpDriver.totalPoints} PTS
                            </span>
                          )}
                          {car.isLastPlaceBoost && (
                            <span
                              className="text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap"
                              title="4th Place Catch-Up Speed Boost (+10%)"
                            >
                              +10% SPD
                            </span>
                          )}
                          {car.isLeaderPenalty && (
                            <span
                              className="text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap"
                              title="Front Car Competitive Pace Penalty (-5%)"
                            >
                              -5% SPD
                            </span>
                          )}
                          <span className="font-display font-bold text-sm text-amber-400 font-mono whitespace-nowrap">
                            {getRankOrdinal(car.positionRank)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">
                            {car.speedKmh}{' '}
                            <span className="text-[10px] text-slate-400">
                              KM/H
                            </span>
                          </span>
                          <span className="text-slate-600">·</span>
                          <span>
                            LAP {car.lap}/{car.maxLaps}
                          </span>
                        </div>

                        {/* Weapons & Nitro Readout: 3 Gun Shots, 2 Oil Slicks & 3 Nitro Boosts per Lap */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-0.5 ${
                              car.gunAmmo > 0
                                ? 'text-amber-300'
                                : 'text-slate-600'
                            }`}
                            title="Forward Gun Shots (3 per lap)"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            {car.gunAmmo}/{car.maxGunAmmo}
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              car.oilAmmo > 0
                                ? 'text-cyan-300'
                                : 'text-slate-600'
                            }`}
                            title="Rear Oil Slicks (2 per lap)"
                          >
                            <Droplets className="w-3.5 h-3.5" />
                            {car.oilAmmo}/{car.maxOilAmmo}
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              car.nitroAmmo > 0
                                ? 'text-emerald-300'
                                : 'text-slate-600'
                            }`}
                            title="Nitro Boosts (3 per lap — Shift/C or Xbox Y)"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {car.nitroAmmo}/{car.maxNitroAmmo}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Surface, Slipstream, Nitro, Tunnel, Banking & Combat Status Line */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate">
                          {car.isSpinningOut ? (
                            <strong className="text-rose-400">
                              OIL SPIN-OUT!
                            </strong>
                          ) : car.isDamaged ? (
                            <strong className="text-amber-400">
                              WEAPON HIT (-42% SPD)
                            </strong>
                          ) : car.isCollisionSlowed ? (
                            <strong className="text-orange-400">
                              CAR BUMP (-10% SPD · 4s)
                            </strong>
                          ) : car.isAirborne ? (
                            <strong className="text-cyan-400">
                              AIRBORNE JUMP!
                            </strong>
                          ) : car.isBoosting ? (
                            <strong className="text-amber-300">
                              NITRO BOOST!
                            </strong>
                          ) : car.isSlipstreaming ? (
                            <strong className="text-cyan-300">
                              SLIPSTREAM DRAFT (+15%)
                            </strong>
                          ) : car.isLastPlaceBoost ? (
                            <strong className="text-emerald-300">
                              LAST-PLACE BOOST (+10%)
                            </strong>
                          ) : car.isInTunnel ? (
                            <strong className="text-amber-200">
                              MOUNTAIN TUNNEL
                            </strong>
                          ) : (
                            <>
                              <span className="capitalize">{car.surface}</span>
                              {Math.abs(car.bankAngleDeg) >= 4
                                ? ` · ${Math.abs(car.bankAngleDeg)}° Bank`
                                : ''}
                            </>
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          Best {formatLapTime(car.bestLapMs)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </header>
      )}

      {/* CENTER RACE COUNTDOWN BANNER (3 - 2 - 1 - GO!) */}
      {raceState === 'countdown' && countdownVal !== null && (
        <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-[#0B0F17]/95 border border-slate-700 rounded-2xl px-12 py-6 text-center shadow-2xl">
            <p className="text-xs font-medium tracking-widest text-slate-400 mb-1">
              {gameMode === 'grand_prix'
                ? `SAGE RALLY GRAND PRIX — ROUND ${gpRoundIndex + 1} OF ${TRACK_ORDER.length}`
                : `SAGE RALLY — ${currentTrackDef.name.toUpperCase()}`}
            </p>
            <p className="text-xs font-mono text-cyan-300 mb-2 capitalize">
              Random Weather: {weather} · 3 Laps · Random Starting Grid
            </p>
            <div className="font-display text-7xl font-bold text-amber-400 font-mono">
              {countdownVal === 0 ? 'GO!' : countdownVal}
            </div>
          </div>
        </div>
      )}

      {/* STREAMLINED INITIAL TITLE SCREEN (raceState === 'lobby') */}
      {raceState === 'lobby' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
          <div className="w-full max-w-4xl bg-[#0B0F17]/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Title Hero Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <Trophy className="w-9 h-9 text-amber-400 shrink-0" />
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-wider">
                    SAGE RALLY
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    3D Top-Down Arcade Combat Racing · 3 Laps · Random Weather & Grid
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowLeaderboardModal((prev) => !prev)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-display font-bold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                    showLeaderboardModal
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>
                    {showLeaderboardModal
                      ? 'Back to Setup'
                      : 'Grand Prix Leaderboard'}
                  </span>
                </button>

                <button
                  onClick={launchFromTitleScreen}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {gameMode === 'grand_prix'
                      ? 'START GRAND PRIX'
                      : `START ${shortTrackLabels[trackId].toUpperCase()}`}
                  </span>
                </button>
              </div>
            </div>

            {showLeaderboardModal ? (
              /* GRAND PRIX HALL OF FAME LEADERBOARD VIEW */
              <div className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                      <Medal className="w-5 h-5 text-amber-400" />
                      Sage Rally Grand Prix Championship Leaderboard
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Top 5-Circuit Grand Prix Championship scores (3 Laps per Circuit).
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    1st = 10 · 2nd = 6 · 3rd = 4 · 4th = 2 · Fastest Lap = +1
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {hallOfFame.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="font-display font-bold text-lg font-mono text-amber-400 w-8">
                          #{idx + 1}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-sm shrink-0"
                          style={{ backgroundColor: entry.colorHex }}
                        />
                        <div>
                          <div className="font-display font-bold text-sm text-white">
                            {entry.driverName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {entry.dateLabel} · {entry.lapsPerRace} Laps/Circuit
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs font-mono">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">
                            RACE WINS
                          </div>
                          <div className="text-white font-bold">
                            {entry.wins} / 5
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">
                            FASTEST LAP
                          </div>
                          <div className="text-cyan-300 font-bold">
                            {formatLapTime(entry.bestLapMs)}
                          </div>
                        </div>
                        <div className="text-right min-w-[74px]">
                          <div className="text-[10px] text-slate-400">
                            CHAMPIONSHIP
                          </div>
                          <div className="text-amber-400 text-base font-bold">
                            {entry.totalPoints} PTS
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* STREAMLINED SETUP: 01. AMOUNT OF PLAYERS & 02. SINGLE TRACK OR GRAND PRIX */
              <div className="py-6 flex flex-col gap-6">
                {/* 01. Choose Number of Players */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      01. Choose Number of Players
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {humanPlayerCount} Human · {4 - humanPlayerCount} Sage AI · Random Starting Grid
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((pCount) => {
                      const active = humanPlayerCount === pCount;
                      return (
                        <button
                          key={pCount}
                          onClick={() => handlePlayerCountSelect(pCount)}
                          className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            active
                              ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-display font-bold text-2xl text-amber-400">
                            {pCount}P
                          </span>
                          <span className="text-xs font-medium whitespace-nowrap">
                            {pCount === 1
                              ? '1 Player (vs 3 AI)'
                              : pCount === 4
                                ? '4 Players (Full Grid)'
                                : `${pCount} Players (vs ${4 - pCount} AI)`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 02. Choose Mode: Grand Prix (All 5 Tracks) or Single Track */}
                <div className="pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-cyan-400" />
                      02. Choose Race Mode
                    </h2>
                    <span className="text-xs font-mono text-cyan-400">
                      3 Laps per Race · Random Weather Each Start
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setGameMode('grand_prix')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        gameMode === 'grand_prix'
                          ? 'bg-slate-900 border-amber-500 shadow-sm'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-base text-white">
                          Grand Prix (All 5 Tracks)
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          LEADERBOARD CUP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Race all 5 circuits in sequence with cumulative Championship Points and Hall of Fame Leaderboard standings.
                      </p>
                    </button>

                    <div
                      onClick={() => setGameMode('single_track')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        gameMode === 'single_track'
                          ? 'bg-slate-900 border-cyan-400 shadow-sm'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-base text-white">
                          Single Track Race
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          QUICK RACE
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {TRACK_ORDER.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGameMode('single_track');
                              setTrackId(id);
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                              trackId === id && gameMode === 'single_track'
                                ? 'bg-cyan-400 text-slate-950 font-bold'
                                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {shortTrackLabels[id]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-RACE PAUSE MODAL */}
      {raceState === 'paused' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-xl bg-[#0B0F17] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Sage Rally — Race Paused
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {gameMode === 'grand_prix'
                    ? `Grand Prix Round ${gpRoundIndex + 1}/${TRACK_ORDER.length} · ${currentTrackDef.name}`
                    : `Single Race · ${currentTrackDef.name}`}
                </p>
              </div>
              <Flag className="w-6 h-6 text-amber-400" />
            </div>

            <div className="py-5 flex flex-col gap-3 text-xs text-slate-300">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                <div className="font-display font-bold text-white mb-1">
                  Controls Reference
                </div>
                <p className="text-slate-400">
                  <strong className="text-slate-200">Player 1 (WASD):</strong> W/S Throttle · A/D Steer · Space Gun (3/Lap) · E Oil (2/Lap) · Left Shift/C Nitro (3/Lap) · R Reset
                </p>
                <p className="text-slate-400 mt-1">
                  <strong className="text-slate-200">Player 2 (Arrows):</strong> Up/Down Throttle · Left/Right Steer · R-Shift Gun · Enter Oil · R-Ctrl/M Nitro
                </p>
                <p className="text-slate-400 mt-1">
                  <strong className="text-slate-200">Xbox Gamepad:</strong> RT/LT Gas/Brake · Left Stick Steer · A/X/RB Gun · B/LB Oil · Y Nitro
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-800">
              <button
                onClick={returnToTitleScreen}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Return to Title Screen</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={restartCurrentRace}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Track</span>
                </button>
                <button
                  onClick={() => setRaceState('racing')}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Driving</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST-RACE PODIUM & GRAND PRIX CHAMPIONSHIP LEADERBOARD MODAL */}
      {raceState === 'finished' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/65">
          <div className="w-full max-w-4xl bg-[#0B0F17] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    {gameMode === 'grand_prix'
                      ? gpRoundIndex === TRACK_ORDER.length - 1
                        ? 'Sage Rally Grand Prix — Final Championship Standings!'
                        : `Grand Prix Round ${gpRoundIndex + 1}/${TRACK_ORDER.length} Complete — ${currentTrackDef.name}`
                      : `Sage Rally Podium — ${currentTrackDef.name}`}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {FIXED_LAPS} Laps · <span className="capitalize">{weather}</span> Conditions
                    {gameMode === 'grand_prix' &&
                      ' · Points Awarded: 1st (10), 2nd (6), 3rd (4), 4th (2) + Fastest Lap (+1)'}
                  </p>
                </div>
              </div>
              <Flag className="w-6 h-6 text-slate-500 hidden sm:block" />
            </div>

            {gameMode === 'grand_prix' ? (
              /* GRAND PRIX CHAMPIONSHIP LEADERBOARD + ROUND BREAKDOWN */
              <div className="my-5 flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-display text-sm font-bold text-amber-400 uppercase tracking-wider">
                      Grand Prix Championship Leaderboard (After Round {gpRoundIndex + 1} of {TRACK_ORDER.length})
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      R1..R5 = Points per Circuit
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {gpStandings.map((driver, idx) => {
                      const roundGain =
                        lastRoundPointsAwarded[driver.slotIndex] ?? 0;
                      const gotFastestBonus =
                        fastestLapBonusSlot === driver.slotIndex;

                      return (
                        <div
                          key={driver.slotIndex}
                          className={`flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3 border ${
                            idx === 0
                              ? 'bg-slate-900 border-amber-500/80'
                              : 'bg-slate-950/90 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-lg font-mono text-amber-400 w-9">
                              {getRankOrdinal(idx + 1)}
                            </span>
                            <span
                              className="w-3.5 h-3.5 rounded-sm shrink-0"
                              style={{ backgroundColor: driver.colorHex }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-sm text-white">
                                  {driver.name}
                                </span>
                                <span className="text-[11px] font-mono text-emerald-400">
                                  +{roundGain} PTS
                                  {gotFastestBonus ? ' (Fastest Lap +1)' : ''}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">
                                Wins: <strong className="text-slate-200">{driver.wins}</strong> · Best Lap:{' '}
                                <span className="font-mono text-slate-200">
                                  {formatLapTime(driver.bestLapMs)}
                                </span>{' '}
                                · Hits: {driver.totalHits} · Oils: {driver.spinOutsCaused}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-1.5 font-mono text-xs">
                              {TRACK_ORDER.map((tId, rIdx) => {
                                const rPts = driver.roundPoints[rIdx];
                                return (
                                  <div
                                    key={tId}
                                    className={`px-2 py-1 rounded border text-center min-w-[42px] ${
                                      rIdx === gpRoundIndex
                                        ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                                        : rPts !== null
                                          ? 'bg-slate-900 border-slate-700 text-slate-300'
                                          : 'bg-slate-950 border-slate-800/70 text-slate-600'
                                    }`}
                                  >
                                    <div className="text-[9px] text-slate-400">
                                      R{rIdx + 1}
                                    </div>
                                    <div className="font-bold">
                                      {rPts !== null ? rPts : '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="text-right min-w-[76px]">
                              <div className="text-[10px] font-mono text-slate-400">
                                TOTAL PTS
                              </div>
                              <div className="font-display font-bold text-xl font-mono text-amber-400">
                                {driver.totalPoints}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE TRACK RACE PODIUM */
              <div className="my-5 flex flex-col gap-2.5">
                {finalStandings.map((car) => (
                  <div
                    key={car.slotIndex}
                    className="flex items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg font-mono text-amber-400 w-9">
                        {getRankOrdinal(car.positionRank)}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-sm shrink-0"
                        style={{ backgroundColor: car.colorHex }}
                      />
                      <div>
                        <div className="font-display font-bold text-sm text-white">
                          {car.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Best Lap:{' '}
                          <span className="font-mono text-slate-200">
                            {formatLapTime(car.bestLapMs)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                      <span>Gun Hits: {car.totalHits}</span>
                      <span>·</span>
                      <span>Oil Spin-Outs: {car.spinOutsCaused}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={returnToTitleScreen}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Sage Rally Title Screen</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={restartCurrentRace}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay This Circuit</span>
                </button>

                {gameMode === 'grand_prix' &&
                gpRoundIndex < TRACK_ORDER.length - 1 ? (
                  <button
                    onClick={advanceToNextGpRound}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      Next Round ({gpRoundIndex + 2}/{TRACK_ORDER.length}):{' '}
                      {TRACK_DEFINITIONS[TRACK_ORDER[gpRoundIndex + 1]].name}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={launchFromTitleScreen}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>
                      {gameMode === 'grand_prix'
                        ? 'Start New Grand Prix Cup'
                        : 'Rematch Now'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Shown during Active Racing) */}
      {raceState !== 'lobby' && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-[min(920px,96vw)] transition-transform duration-200 ${
            dockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
          }`}
        >
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setDockCollapsed((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-medium text-slate-300 bg-[#0B0F17]/95 border border-b-0 border-slate-800 rounded-t-lg hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show Race Controls (H)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hide Controls (H)</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#0B0F17]/95 border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2.5">
            {/* 5-Circuit Quick Switcher */}
            <div className="flex items-center gap-1">
              {TRACK_ORDER.map((id) => (
                <button
                  key={id}
                  onClick={() => handleTrackChange(id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    trackId === id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {shortTrackLabels[id]}
                </button>
              ))}
            </div>

            {/* Camera Angle Preset */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <Camera className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden xl:inline" />
              {(
                [
                  { id: 'isometric_zoom', label: 'Shared Zoom' },
                  { id: 'high_overhead', label: 'High Overhead' },
                  { id: 'tight_action', label: 'Close Action' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setCameraPreset(cam.id);
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    cameraPreset === cam.id
                      ? 'bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            {/* Action Buttons: Restart, Title Screen, Mute */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={restartCurrentRace}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Restart Race"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              <button
                onClick={returnToTitleScreen}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Title Screen</span>
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
