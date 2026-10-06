import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ThemeId } from "../game/themes";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHostRoom: (name: string, themeId: ThemeId) => void;
  onJoinRoom: (code: string, name: string, themeId: ThemeId) => void;
  initialRoomCode?: string;
  themeId: ThemeId;
  hostRoomCode?: string | null;
  guestConnected?: boolean;
  guestName?: string;
  isConnecting?: boolean;
  connectionError?: string | null;
  onStartDuel?: () => void;
}

export function MultiplayerModal({
  isOpen,
  onClose,
  onHostRoom,
  onJoinRoom,
  initialRoomCode = "",
  themeId,
  hostRoomCode,
  guestConnected,
  guestName,
  isConnecting,
  connectionError,
  onStartDuel,
}: MultiplayerModalProps) {
  const [tab, setTab] = useState<"create" | "join">(() => (initialRoomCode ? "join" : "create"));
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem("serpent-player-name") || "Player 1";
    } catch {
      return "Player 1";
    }
  });
  const [inputCode, setInputCode] = useState(() => initialRoomCode.toUpperCase().slice(0, 4));
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setTab("join");
      setInputCode(initialRoomCode.toUpperCase().slice(0, 4));
    }
  }, [initialRoomCode]);

  useEffect(() => {
    if (isOpen && tab === "create" && !hostRoomCode) {
      onHostRoom(playerName, themeId);
    }
  }, [isOpen, tab, hostRoomCode, onHostRoom, playerName, themeId]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = hostRoomCode ? `${currentUrl}?room=${hostRoomCode}` : "";

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNameChange = (val: string) => {
    const trimmed = val.slice(0, 16);
    setPlayerName(trimmed);
    try {
      localStorage.setItem("serpent-player-name", trimmed);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overlay-in">
      <div className="relative w-full max-w-md bg-[#0a1b13] border-2 border-[#1e4a33] shadow-[0_0_50px_rgba(47,191,113,0.25)] rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e4a33] bg-[#07160f]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div>
              <h2 className="font-display font-bold text-sm sm:text-base text-[#8dff57] tracking-wider leading-none">
                PLAY WITH FRIENDS
              </h2>
              <span className="text-[9px] text-[#7fae92] font-semibold">1V1 ARENA DUEL (P2P WEBRTC)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-[#7fae92] hover:text-[#c0ff7a] hover:bg-[#143324] transition-colors cursor-pointer text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#1e4a33] bg-[#05110c]">
          <button
            onClick={() => {
              setTab("create");
              if (!hostRoomCode) onHostRoom(playerName, themeId);
            }}
            className={`flex-1 py-2.5 text-xs font-display font-bold tracking-wider transition-colors cursor-pointer ${
              tab === "create"
                ? "text-[#8dff57] border-b-2 border-[#8dff57] bg-[#0c2217]"
                : "text-[#7fae92] hover:text-[#d8ffe9]"
            }`}
          >
            CREATE ROOM
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-2.5 text-xs font-display font-bold tracking-wider transition-colors cursor-pointer ${
              tab === "join"
                ? "text-[#8dff57] border-b-2 border-[#8dff57] bg-[#0c2217]"
                : "text-[#7fae92] hover:text-[#d8ffe9]"
            }`}
          >
            JOIN ROOM
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto neon-scrollbar flex-1 flex flex-col gap-4 text-xs">
          {/* Player Name */}
          <div>
            <label className="block text-[10px] tracking-widest text-[#7fae92] font-semibold mb-1 uppercase">
              Your Player Name
            </label>
            <input
              type="text"
              value={playerName}
              maxLength={16}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your gamer tag"
              className="w-full px-3 py-2 rounded bg-[#07160f] border border-[#1e4a33] text-[#d8ffe9] font-medium focus:outline-none focus:border-[#8dff57] transition-colors"
            />
          </div>

          {/* CREATE TAB */}
          {tab === "create" && (
            <div className="flex flex-col gap-4">
              {/* Room Code Card */}
              <div className="p-3.5 rounded-lg bg-[#07160f] border border-[#1e4a33] text-center">
                <span className="text-[9px] tracking-[0.2em] text-[#7fae92] font-semibold uppercase">Room Code</span>
                <div className="font-display font-bold text-3xl sm:text-4xl text-[#ffd166] tracking-widest mt-1 glow-gold select-all">
                  {hostRoomCode || "..."}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={handleCopyLink}
                    disabled={!hostRoomCode}
                    className="px-3 py-1.5 rounded bg-[#123121] border border-[#2b6a47] text-[#c0ff7a] text-[10px] font-semibold hover:bg-[#1b442e] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedLink ? "✓ LINK COPIED!" : "📋 COPY INVITE LINK"}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {inviteUrl && (
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#07160f] border border-[#1e4a33]">
                  <div className="p-2 bg-white rounded-md shadow-md">
                    <QRCodeSVG value={inviteUrl} size={110} level="M" />
                  </div>
                  <span className="text-[9px] text-[#7fae92] mt-2 font-medium">Scan with camera to join on phone</span>
                </div>
              )}

              {/* Players Status */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#07160f] border border-[#1e4a33]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8dff57] font-semibold">🟢 P1 (Host): {playerName}</span>
                  <span className="text-[10px] text-[#8dff57] font-bold">READY</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#132c1f]">
                  <span className="text-[#ffd166]">
                    {guestConnected ? `🌸 P2 (Guest): ${guestName || "Friend"}` : "⏳ P2: Waiting for friend..."}
                  </span>
                  <span className={`text-[10px] font-bold ${guestConnected ? "text-[#c0ff7a]" : "text-[#7fae92]"}`}>
                    {guestConnected ? "CONNECTED" : "WAITING"}
                  </span>
                </div>
              </div>

              {/* Start Match CTA */}
              <button
                onClick={onStartDuel}
                disabled={!guestConnected}
                className={`w-full py-3 rounded-md font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  guestConnected
                    ? "btn-chunky bg-[#8dff57] text-[#06110c] hover:brightness-110"
                    : "bg-[#102419] text-[#7fae92] opacity-60 cursor-not-allowed border border-[#1e4a33]"
                }`}
              >
                {guestConnected ? "⚡ START 1V1 DUEL" : "WAITING FOR FRIEND TO CONNECT..."}
              </button>
            </div>
          )}

          {/* JOIN TAB */}
          {tab === "join" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] tracking-widest text-[#7fae92] font-semibold mb-1 uppercase">
                  4-Character Room Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="e.g. 7X9K"
                  className="w-full px-4 py-3 rounded bg-[#07160f] border border-[#1e4a33] text-center font-display text-2xl text-[#ffd166] tracking-widest focus:outline-none focus:border-[#8dff57] transition-colors"
                />
              </div>

              {connectionError && (
                <div className="p-2.5 rounded bg-[rgba(255,93,93,0.15)] border border-[#ff5d5d] text-[#ff8a5c] text-[11px] font-medium text-center">
                  ⚠️ {connectionError}
                </div>
              )}

              <button
                onClick={() => onJoinRoom(inputCode, playerName, themeId)}
                disabled={inputCode.length !== 4 || isConnecting}
                className={`w-full py-3 rounded-md font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  inputCode.length === 4 && !isConnecting
                    ? "btn-chunky bg-[#8dff57] text-[#06110c] hover:brightness-110"
                    : "bg-[#102419] text-[#7fae92] opacity-60 cursor-not-allowed border border-[#1e4a33]"
                }`}
              >
                {isConnecting ? "CONNECTING TO HOST..." : "⚔️ JOIN DUEL"}
              </button>

              <div className="text-[10px] text-center text-[#7fae92] opacity-80 pt-1">
                Zero sign-up required. Direct browser-to-browser connection over WebRTC.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
