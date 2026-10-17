import { bnNumber } from '../utils/bangla.js';
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Flame,
  RotateCcw,
  Share2,
  Trophy,
  X,
} from 'lucide-react';
import { createResultCard } from '../utils/resultCard.js';
import { copyText, formatTimer, resultCaption } from '../utils/sharing.js';
import Modal from './Modal.jsx';

export default function VictoryModal({ result, onClose, onPlayAgain, onNewRoom, isHost }) {
  const [card, setCard] = useState(null);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const caption = resultCaption(result);
  const players = [...result.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  useEffect(() => {
    let cancelled = false;
    let url;
    createResultCard(result)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setCard({
          url,
          file: new File([blob], 'পাজল-মিলেছে.png', { type: 'image/png' }),
        });
      })
      .catch(() => {
        if (!cancelled) setNotice('কার্ডের ছবি তৈরি হয়নি। ফলাফল কপি করে শেয়ার করতে পারেন।');
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [result]);

  function download() {
    if (!card) return;
    const link = document.createElement('a');
    link.href = card.url;
    link.download = 'পাজল-মিলেছে.png';
    link.click();
    setNotice('কার্ড তৈরি! এবার স্টোরি বা পোস্টে বন্ধুদের দেখিয়ে দিন।');
  }

  async function share() {
    if (!navigator.share) {
      download();
      return;
    }
    setSharing(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.hash = '';
      const data = {
        title: 'পাজল তো মিলল! • মাল্টিপ্লেয়ার পাজল গেম',
        text: caption,
        url: url.toString(),
      };
      if (card && navigator.canShare?.({ files: [card.file] })) {
        // The PNG is prepared before this click to preserve browser user activation.
        await navigator.share({
          title: data.title,
          text: `${caption}\n${url}`,
          files: [card.file],
        });
      } else {
        await navigator.share(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError')
        setNotice('এখানে সরাসরি শেয়ার হচ্ছে না। কার্ডের ছবি নামিয়ে বা ফলাফল কপি করে শেয়ার করুন।');
    } finally {
      setSharing(false);
    }
  }

  async function copyResult() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.hash = '';
      await copyText(`${caption}\n${url}`);
      setCopied(true);
      setNotice('ফলাফল কপি হয়েছে। পছন্দের সামাজিক মাধ্যমে পেস্ট করুন।');
    } catch {
      setNotice('কপি করা যাচ্ছে না। কার্ডের ছবি নামিয়ে শেয়ার করুন।');
    }
  }

  return (
    <Modal titleId="victory-title" onClose={onClose} className="max-w-4xl">
      <button
        onClick={onClose}
        aria-label="ফলাফল বন্ধ করুন"
        className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/60 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <X size={19} />
      </button>
      <div className="grid md:grid-cols-[0.95fr_1fr]">
        <div className="relative flex items-center justify-center overflow-hidden bg-[#0c2429] p-5 sm:p-7">
          <div className="victory-glow pointer-events-none absolute inset-0" />
          {card ? (
            <img
              src={card.url}
              alt={`জয়ের কার্ড: ${result.title}, ${bnNumber(result.total)} টুকরো মিলেছে, সময় ${formatTimer(result.elapsedSeconds)}`}
              className="relative w-full max-w-[330px] rounded-2xl border border-white/10 shadow-2xl"
            />
          ) : (
            <div className="relative flex aspect-[4/5] w-full max-w-[330px] flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-950/50 p-6 text-center">
              <Trophy size={48} className="text-amber-300" />
              <p className="text-3xl font-black text-emerald-200">মিলেছে, মিলেছে!</p>
              <img
                src={result.imageSrc}
                alt={result.title}
                className="max-h-40 rounded-lg object-contain"
              />
              <p className="text-sm text-emerald-100">
                {bnNumber(result.total)} টুকরো · {formatTimer(result.elapsedSeconds)}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 md:py-9">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
            <Trophy size={13} /> পাজলবাজ দলের জয়!
          </span>
          <h2 id="victory-title" className="text-3xl font-black tracking-tight sm:text-4xl">
            জীবন এলোমেলো?
            <br />
            <span className="text-emerald-300">পাজল তো মিলল!</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            আপনারা <span className="font-medium text-white">{result.title}</span> পাজলটা মিলিয়ে
            ফেলেছেন। এবার বন্ধুদের একটু দেখানো যাক!
          </p>
          <div className="my-5 grid grid-cols-3 gap-2">
            {[
              [formatTimer(result.elapsedSeconds), 'সময় লেগেছে'],
              [result.total, 'টুকরো'],
              [result.players.filter((player) => !player.isBot).length, 'খেলোয়াড়'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/5 bg-white/5 px-2 py-3 text-center"
              >
                <p className="text-xl font-extrabold text-white">{bnNumber(value)}</p>
                <p className="mt-1 text-[10px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-xs">
              <h3 className="font-bold text-slate-200">পাজল মেলানোর দল</h3>
              <span className="flex items-center gap-1 text-amber-300">
                <Flame size={13} />
                {bnNumber(result.bestCombo)}× সেরা কম্বো
              </span>
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-xs"
                >
                  <span className="w-4 text-slate-500">{bnNumber(index + 1)}</span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: player.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-200">{player.name}</span>
                  {player.isBot && <span className="text-[10px] text-slate-500">বট</span>}
                  <span className="font-mono font-bold text-emerald-300">
                    {bnNumber(player.score || 0)} পয়েন্ট
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={sharing || (!navigator.share && !card)}
            onClick={share}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            <Share2 size={17} />
            {sharing
              ? 'শেয়ার হচ্ছে…'
              : navigator.share
                ? 'এই জয় শেয়ার করুন'
                : 'কার্ড সেভ করে শেয়ার করুন'}
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              disabled={!card}
              onClick={download}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-40"
            >
              <Download size={14} /> ছবি নামান
            </button>
            <button
              onClick={copyResult}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'কপি হয়েছে!' : 'ফলাফল কপি'}
            </button>
          </div>
          <p
            role="status"
            className="mt-2 min-h-8 text-center text-[11px] leading-relaxed text-slate-400"
          >
            {notice || 'স্টোরিতে দিন, বন্ধুদের একটু চ্যালেঞ্জ ছুড়ে দিন!'}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-semibold">
            {isHost ? (
              <button
                onClick={onPlayAgain}
                className="flex items-center gap-1.5 text-white hover:text-emerald-300"
              >
                <RotateCcw size={14} /> একই দলে আবার খেলি
              </button>
            ) : (
              <span className="text-slate-500">পরের পাজলটি রুমের মালিক শুরু করবেন</span>
            )}
            <button
              onClick={onNewRoom}
              className="flex items-center gap-1 text-slate-400 hover:text-white"
            >
              নতুন রুম <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
