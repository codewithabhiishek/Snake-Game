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
      return localStorage.getItem("serpent-player-name") || "SerpentKing";
    } catch {
      return "SerpentKing";
    }
  });
  const [inputCode, setInputCode] = useState(() => initialRoomCode.toUpperCase().slice(0, 4));
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    if (!hostRoomCode) return;
    navigator.clipboard.writeText(hostRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleNameChange = (val: string) => {
    const trimmed = val.slice(0, 15);
    setPlayerName(trimmed);
    try {
      localStorage.setItem("serpent-player-name", trimmed);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overlay-in">
      <div className="relative w-full max-w-2xl bg-[radial-gradient(ellipse_at_top,_#0d281a,_#05110a_70%)] border-2 border-[#22573d] shadow-[0_0_80px_rgba(47,191,113,0.35),0_30px_60px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Banner */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-[#1b4931] bg-[rgba(6,20,13,0.9)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[radial-gradient(circle,_#1d5939,_#0a2215)] border border-[#348557] flex items-center justify-center shadow-lg shadow-[#8dff57]/10 text-xl shrink-0">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-[#8dff57] tracking-wider leading-none drop-shadow-[0_0_12px_rgba(141,255,87,0.5)]">
                  ARENA DUEL
                </h2>
                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#163825] border border-[#2b6a47] text-[#c0ff7a]">
                  P2P WEBRTC
                </span>
              </div>
              <p className="text-[11px] text-[#7fae92] font-medium mt-1">
                Zero server lag · Real-time 2-player snake battle on one shared board
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7fae92] hover:text-[#ff5d5d] hover:bg-[#1a0f14] hover:border hover:border-[#ff5d5d]/40 transition-all cursor-pointer text-lg shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-[#040f08] border-b border-[#163825] shrink-0">
          <button
            onClick={() => {
              setTab("create");
              if (!hostRoomCode) onHostRoom(playerName, themeId);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === "create"
                ? "bg-[#143d27] text-[#c0ff7a] border border-[#2fbf71]/50 shadow-[0_0_16px_rgba(47,191,113,0.25)]"
                : "text-[#7fae92] hover:text-[#d8ffe9] hover:bg-[#081a10]"
            }`}
          >
            <span>👑</span> HOST DUEL (CREATE)
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === "join"
                ? "bg-[#143d27] text-[#c0ff7a] border border-[#2fbf71]/50 shadow-[0_0_16px_rgba(47,191,113,0.25)]"
                : "text-[#7fae92] hover:text-[#d8ffe9] hover:bg-[#081a10]"
            }`}
          >
            <span>🎮</span> ENTER DUEL (JOIN)
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto neon-scrollbar flex-1 flex flex-col gap-5 text-xs">
          {/* Gamer Tag Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[rgba(10,31,20,0.6)] border border-[#1d4c33]">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🏷️</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-[#7fae92]">Your Gamer Tag</div>
                <div className="text-xs text-[#d8ffe9] font-medium">Visible to your opponent in the match HUD</div>
              </div>
            </div>
            <input
              type="text"
              value={playerName}
              maxLength={15}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your tag"
              className="px-3.5 py-1.5 rounded-lg bg-[#07160f] border border-[#256141] text-[#c0ff7a] font-bold text-xs focus:outline-none focus:border-[#8dff57] focus:ring-1 focus:ring-[#8dff57] transition-all sm:w-48 text-center sm:text-left"
            />
          </div>

          {/* CREATE ROOM TAB */}
          {tab === "create" && (
            <div className="flex flex-col gap-5">
              {/* Versus Match Preview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                {/* Player 1 Card (Host) */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-[radial-gradient(ellipse_at_top,_#123823,_#091c12)] border border-[#2fbf71] shadow-[0_0_20px_rgba(47,191,113,0.15)] flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#0e291a] border-2 border-[#8dff57] flex items-center justify-center text-xl shadow-[0_0_14px_rgba(141,255,87,0.4)]">
                    🐍
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#c0ff7a] truncate max-w-[140px]">
                    {playerName || "Host"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#8dff57] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#8dff57] tracking-wider uppercase">HOST · P1</span>
                  </div>
                  <span className="text-[9px] text-[#7fae92] mt-0.5 font-medium">Equipped: Neon Lime</span>
                </div>

                {/* VS Emblem */}
                <div className="sm:col-span-1 flex flex-col items-center justify-center py-1 sm:py-0">
                  <div className="w-9 h-9 rounded-full bg-[#181126] border-2 border-[#ffd166] shadow-[0_0_16px_rgba(255,209,102,0.4)] flex items-center justify-center font-display font-bold text-xs text-[#ffd166] tracking-tighter">
                    VS
                  </div>
                  <span className="text-[8px] font-semibold tracking-widest text-[#7fae92] mt-1 uppercase">
                    BEST OF 5
                  </span>
                </div>

                {/* Player 2 Card (Challenger) */}
                <div
                  className={`sm:col-span-2 p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    guestConnected
                      ? "bg-[radial-gradient(ellipse_at_top,_#331024,_#170612)] border-[#ff2a85] shadow-[0_0_25px_rgba(255,42,133,0.25)]"
                      : "bg-[#091811]/60 border-[#1a422d] border-dashed opacity-80"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition-all ${
                      guestConnected
                        ? "bg-[#2b0c1e] border-[#ff2a85] shadow-[0_0_16px_rgba(255,42,133,0.5)]"
                        : "bg-[#07170f] border-[#255238] text-[#7fae92]"
                    }`}
                  >
                    {guestConnected ? "🐉" : "⏳"}
                  </div>
                  <div
                    className={`mt-2 text-xs font-bold truncate max-w-[140px] ${
                      guestConnected ? "text-[#ff70a6]" : "text-[#7fae92]"
                    }`}
                  >
                    {guestConnected ? guestName || "Challenger" : "Waiting for friend..."}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        guestConnected ? "bg-[#ff2a85] animate-pulse" : "bg-[#ffd166] opacity-60"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase ${
                        guestConnected ? "text-[#ff70a6]" : "text-[#ffd166]"
                      }`}
                    >
                      {guestConnected ? "CHALLENGER · P2" : "INVITE REQUIRED"}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#7fae92] mt-0.5 font-medium">
                    {guestConnected ? "Equipped: Hot Pink" : "Share room to connect"}
                  </span>
                </div>
              </div>

              {/* Share & Invite Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[rgba(8,23,15,0.7)] border border-[#1d4c33]">
                {/* Room Code Column */}
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.2em] text-[#7fae92] font-bold uppercase">
                        4-Letter Room Code
                      </span>
                      <span className="text-[9px] text-[#c0ff7a] font-semibold">Active & Listening</span>
                    </div>

                    {/* Digital LED Code Boxes */}
                    <div className="flex items-center gap-2 mt-2">
                      {(hostRoomCode || "....").split("").map((char, i) => (
                        <div
                          key={i}
                          className="flex-1 py-3.5 rounded-lg bg-[#05110a] border border-[#2b6a47] flex items-center justify-center font-display font-bold text-2xl sm:text-3xl text-[#ffd166] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_12px_rgba(255,209,102,0.15)]"
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="w-full py-2 px-3 rounded-lg bg-[#0c2618] hover:bg-[#143824] border border-[#276342] text-[#c0ff7a] text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {copiedCode ? "✓ CODE COPIED!" : "📋 COPY 4-LETTER CODE"}
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-2 px-3 rounded-lg bg-[#123823] hover:bg-[#1b4d30] border border-[#348759] text-[#8dff57] text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#8dff57]/10"
                    >
                      {copiedLink ? "✓ DIRECT LINK COPIED!" : "🔗 COPY 1-CLICK INVITE LINK"}
                    </button>
                  </div>
                </div>

                {/* QR Code Column */}
                <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#06140c] border border-[#19422c] text-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-xl shadow-black/60 border-2 border-[#2b6a47]">
                    <QRCodeSVG
                      value={inviteUrl || "https://snake-game-sage-pi.vercel.app"}
                      size={115}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-2.5 text-[10px] text-[#d8ffe9] font-bold flex items-center gap-1.5">
                    <span>📱</span> Scan with Phone Camera to Join
                  </div>
                  <span className="text-[8px] text-[#7fae92] font-medium">Opens the match directly in Safari / Chrome</span>
                </div>
              </div>

              {/* COMMENCE DUEL CTA BUTTON */}
              <button
                onClick={onStartDuel}
                disabled={!guestConnected}
                className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  guestConnected
                    ? "btn-chunky bg-[#8dff57] text-[#06140c] border-2 border-[#c0ff7a] shadow-[0_0_35px_rgba(141,255,87,0.45)] hover:brightness-110 active:translate-y-0.5"
                    : "bg-[#0b1c12] text-[#7fae92] opacity-60 cursor-not-allowed border border-[#19402b]"
                }`}
              >
                {guestConnected ? "⚡ COMMENCE 1V1 DUEL ⚡" : "⏳ WAITING FOR CHALLENGER TO CONNECT..."}
              </button>
            </div>
          )}

          {/* JOIN ROOM TAB */}
          {tab === "join" && (
            <div className="flex flex-col gap-5 py-2">
              <div className="p-5 rounded-xl bg-[rgba(8,23,15,0.7)] border border-[#1d4c33] flex flex-col items-center text-center">
                <span className="text-2xl mb-1">🎮</span>
                <h3 className="font-display font-bold text-sm text-[#8dff57] tracking-wider">
                  ENTER ROOM CODE
                </h3>
                <p className="text-[11px] text-[#7fae92] font-medium mt-1 max-w-sm">
                  Ask your friend for their 4-letter room code (or click their invite link) to jump into the arena.
                </p>

                <div className="w-full max-w-xs mt-4">
                  <input
                    type="text"
                    maxLength={4}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. 7X9K"
                    autoFocus
                    className="w-full py-3.5 px-4 rounded-xl bg-[#05110a] border-2 border-[#2b6a47] text-center font-display text-3xl text-[#ffd166] tracking-[0.35em] focus:outline-none focus:border-[#8dff57] focus:ring-2 focus:ring-[#8dff57]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_0_20px_rgba(255,209,102,0.15)] transition-all"
                  />
                </div>

                {connectionError && (
                  <div className="mt-4 p-3 rounded-xl bg-[rgba(255,93,93,0.15)] border border-[#ff5d5d] text-[#ff8a5c] text-xs font-medium text-center flex items-center justify-center gap-2 max-w-sm">
                    <span>⚠️</span>
                    <span>{connectionError}</span>
                  </div>
                )}
              </div>

              {/* JOIN BUTTON */}
              <button
                onClick={() => onJoinRoom(inputCode, playerName, themeId)}
                disabled={inputCode.length !== 4 || isConnecting}
                className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  inputCode.length === 4 && !isConnecting
                    ? "btn-chunky bg-[#8dff57] text-[#06140c] border-2 border-[#c0ff7a] shadow-[0_0_35px_rgba(141,255,87,0.45)] hover:brightness-110 active:translate-y-0.5"
                    : "bg-[#0b1c12] text-[#7fae92] opacity-60 cursor-not-allowed border border-[#19402b]"
                }`}
              >
                {isConnecting ? "CONNECTING TO HOST OVER WEBRTC..." : "⚔️ ENTER THE ARENA"}
              </button>

              <div className="text-[10px] text-center text-[#7fae92] opacity-80">
                100% serverless P2P connection · Zero account needed · Play on any browser or phone
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
