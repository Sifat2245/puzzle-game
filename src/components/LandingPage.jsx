import React from 'react';
import { ArrowUpRight, Check, Grid, Play, Sparkles, Upload, Users } from 'lucide-react';
import { PUZZLE_CATALOG } from '../data/puzzles.js';
import { useGame } from '../context/GameContext.jsx';
import { bnNumber } from '../utils/bangla.js';
import LandingHeader from './LandingHeader.jsx';
import RoomControls from './RoomControls.jsx';
import '../styles/landing.css';

export default function LandingPage() {
  const {
    isHost,
    canLaunch,
    reconnect,
    isLoading,
    toasts,
    connectionStatus,
    joinedViaLinkBanner,
    roomCode,
    customImageSrc,
    customImageTitle,
    selectedCatalog,
    handleLaunchGameFromLanding,
    activeImageSrc,
    activePuzzleTitle,
    targetPieceCount,
    puzzleId,
    setPuzzleId,
    setCustomImageSrc,
    setPhotoSyncBanner,
    handleCustomPhotoUpload,
    photoSyncBanner,
    myName,
    setMyName,
    myColor,
    setMyColor,
    setTargetPieceCount,
    botCount,
    setBotCount,
  } = useGame();

  return (
    <div className="landing-page">
      <LandingHeader connectionStatus={connectionStatus} reconnect={reconnect} />

      {joinedViaLinkBanner && (
        <div className="landing-invite">
          <Users size={19} aria-hidden="true" />
          <p>
            বন্ধুর আমন্ত্রণে এসেছেন <strong>রুম {roomCode}</strong>। নাম লিখে{' '}
            <strong>পাজলে যোগ দিন</strong> চেপে একসঙ্গে খেলুন।
          </p>
        </div>
      )}

      <main className="landing-main">
        <section className="landing-showcase" aria-labelledby="puzzle-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">
              <Sparkles size={16} /> একটু খেলা, একটু আড্ডা
            </span>
            <h2 id="puzzle-title">
              {customImageSrc ? customImageTitle : selectedCatalog.fullTitle}
            </h2>
            <p>
              {customImageSrc
                ? 'আপনার ছবি, আপনার পাজল। বন্ধুদের সঙ্গে নতুন স্মৃতি।'
                : selectedCatalog.description}
            </p>
          </div>

          <div className="landing-preview">
            <span className="landing-preview-note" aria-hidden="true">
              মিলবেই তো!
            </span>
            <img src={activeImageSrc} alt={activePuzzleTitle} className="landing-preview-image" />
            <div className="landing-preview-footer">
              <span className="landing-piece-badge">
                <Grid size={15} aria-hidden="true" /> {bnNumber(targetPieceCount)} টুকরোর পাজল
              </span>
              <button
                type="button"
                disabled={isLoading || !canLaunch}
                onClick={handleLaunchGameFromLanding}
                className="landing-preview-play"
              >
                <Play size={15} fill="currentColor" aria-hidden="true" />
                {!canLaunch ? 'সংযোগ হচ্ছে…' : isHost ? 'এই পাজল খেলুন' : 'পাজলে যোগ দিন'}
              </button>
            </div>
          </div>

          <div className="landing-gallery-heading">
            <h3>আজ কার সঙ্গে খেলবেন?</h3>
            {customImageSrc && (
              <span className="landing-photo-selected">
                <Check size={14} /> আপনার ছবি
              </span>
            )}
          </div>
          <div className="landing-gallery">
            {PUZZLE_CATALOG.map((item) => {
              const selected = !customImageSrc && puzzleId === item.id;
              return (
                <button
                  key={item.id}
                  data-testid={'puzzle-' + item.id}
                  type="button"
                  disabled={!isHost}
                  aria-pressed={selected}
                  onClick={() => {
                    setPuzzleId(item.id);
                    setCustomImageSrc(null);
                    setPhotoSyncBanner('');
                  }}
                  className={'landing-character' + (selected ? ' is-selected' : '')}
                >
                  <img src={item.src} alt={item.title} loading="lazy" />
                  <span>{item.title}</span>
                  {selected && (
                    <span className="landing-character-check" aria-hidden="true">
                      <Check size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <label className={'landing-upload' + (!isHost ? ' is-disabled' : '')}>
            <span className="landing-upload-icon">
              <Upload size={21} aria-hidden="true" />
            </span>
            <span className="landing-upload-copy">
              <strong>নিজের ছবিটাও পাজল হয়ে যাক!</strong>
              <span>
                {isHost
                  ? 'একটা ছবি দিন, সবাই মিলে সেটাই মেলাই।'
                  : 'এই রুমের ছবি বেছে নেবেন রুমের মালিক।'}
              </span>
            </span>
            <ArrowUpRight size={21} className="landing-upload-arrow" aria-hidden="true" />
            <input
              type="file"
              disabled={!isHost}
              accept="image/*"
              aria-label="নিজের পাজলের ছবি বাছুন"
              onChange={handleCustomPhotoUpload}
              className="sr-only"
            />
          </label>
          {photoSyncBanner && (
            <p className="landing-photo-notice">
              <Check size={16} /> {photoSyncBanner}
            </p>
          )}
        </section>

        <section className="landing-setup" aria-labelledby="setup-title">
          <div className="landing-setup-heading">
            <span className="landing-eyebrow">
              <Users size={16} /> আড্ডার আয়োজন
            </span>
            <h2 id="setup-title">বন্ধুদের নিয়ে শুরু করুন</h2>
            <p>রুম খুলুন, বন্ধু ডাকুন, মিলে মিলে খেলুন।</p>
          </div>

          <RoomControls />

          <div className="landing-field">
            <label htmlFor="player-name">
              <span className="landing-step">২</span> আপনার নাম ও পছন্দের রং
            </label>
            <div className="landing-player-inputs">
              <input
                type="text"
                maxLength={18}
                id="player-name"
                value={myName}
                onChange={(event) => setMyName(event.target.value)}
                placeholder="আপনার নাম"
                className="landing-input"
              />
              <input
                type="color"
                value={myColor}
                onChange={(event) => setMyColor(event.target.value)}
                className="landing-color-input"
                title="আপনার কার্সর ও টুকরোর রং বেছে নিন"
                aria-label="আপনার কার্সর ও টুকরোর রং বেছে নিন"
              />
            </div>
          </div>

          <fieldset className="landing-field">
            <legend>
              <span className="landing-step">৩</span> কত টুকরোর পাজল খেলবেন?
            </legend>
            <div className="landing-presets">
              {[
                { count: 24, label: 'প্রায় ২৪ টুকরো', sub: 'ঝটপট এক দান' },
                { count: 48, label: 'প্রায় ৪৮ টুকরো', sub: 'আরামসে খেলি' },
                { count: 96, label: 'প্রায় ৯৬ টুকরো', sub: 'বন্ধুদের চ্যালেঞ্জ' },
                { count: 150, label: 'প্রায় ১৫০ টুকরো', sub: 'পাজল ওস্তাদ' },
              ].map((preset) => (
                <button
                  key={preset.count}
                  type="button"
                  disabled={!isHost}
                  aria-pressed={targetPieceCount === preset.count}
                  onClick={() => setTargetPieceCount(preset.count)}
                  className={
                    'landing-preset' + (targetPieceCount === preset.count ? ' is-selected' : '')
                  }
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.sub}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="landing-bots">
            <label htmlFor="bot-count">
              <strong>সাহায্যকারী বট</strong>
              <span>{bnNumber(botCount)} জন খেলছে</span>
            </label>
            <input
              id="bot-count"
              type="range"
              min={0}
              max={4}
              disabled={!isHost}
              value={botCount}
              onChange={(event) => setBotCount(Number(event.target.value))}
            />
            <p>
              {isHost
                ? 'শুধু বন্ধুদের সঙ্গে খেলতে চাইলে বটের সংখ্যা ০ রাখুন।'
                : 'পাজল ও বটের সংখ্যা ঠিক করবেন রুমের মালিক।'}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading || !canLaunch}
            onClick={handleLaunchGameFromLanding}
            className="landing-launch"
          >
            <Play size={18} fill="currentColor" aria-hidden="true" />
            <span>
              {!canLaunch
                ? 'সংযোগ হচ্ছে…'
                : isLoading
                  ? 'পাজল সাজানো হচ্ছে…'
                  : isHost
                    ? 'চলুন, মেলানো যাক!'
                    : 'পাজলে যোগ দিন'}
            </span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </button>
          <p className="landing-setup-footer">জেতার তাড়া নেই, মেলানোর আনন্দটাই আসল।</p>
        </section>
      </main>
      <div role="status" className="landing-toasts">
        {toasts.map((toast) => (
          <p key={toast.id}>{toast.text}</p>
        ))}
      </div>
    </div>
  );
}
