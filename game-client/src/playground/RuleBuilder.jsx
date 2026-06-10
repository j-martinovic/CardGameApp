// RuleBuilder.jsx — multi-step rule form for the Game Playground.
// Walks the user through each section of RULE_SCHEMA.

import React, { useState } from 'react';
import { DEFAULT_RULES } from './RuleSchema';

const STEPS = [
  'Basics', 'Dealing', 'Turns', 'Special Cards',
  'Win Condition', 'Scoring', 'Accessories', 'Table Layout',
  'Table Setup', 'Trick Taking', 'House Rules', 'Review & Play',
];

const inputStyle = {
  background: '#0d1f0d',
  border: '1px solid #c9a84c55',
  borderRadius: 6,
  color: '#e8d5a3',
  padding: '8px 12px',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
};

const labelStyle = { fontSize: 13, opacity: 0.8, marginBottom: 4, display: 'block' };

function Field({ label, description, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {description && <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 6 }}>{description}</div>}
      {children}
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );
}

function NumberInput({ value, onChange, min, max }) {
  return (
    <input type="number" style={inputStyle} value={value}
      min={min} max={max} onChange={e => onChange(Number(e.target.value))} />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <span style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? '#c9a84c' : '#333',
        display: 'inline-block', position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ display: 'none' }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

export default function RuleBuilder({ initialRules, onPlay, onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [rules, setRules] = useState({ ...DEFAULT_RULES, ...initialRules });
  const [specialCard, setSpecialCard] = useState({ rank: '', suit: 'any', effect: 'skip_next_player', effectValue: 2, description: '' });
  const [houseRule, setHouseRule] = useState('');

  function set(key, value) { setRules(r => ({ ...r, [key]: value })); }
  function setNested(key, subKey, value) {
    setRules(r => ({ ...r, [key]: { ...(r[key] || {}), [subKey]: value } }));
  }

  const sectionStyle = {
    background: 'rgba(0,0,0,0.4)', borderRadius: 12,
    border: '1px solid #c9a84c33', padding: 20, marginBottom: 16,
  };

  function renderStep() {
    switch (step) {
      // ── Step 0: Basics ──────────────────────────────────────────────────
      case 0: return (
        <div>
          <Field label="Game Name">
            <input style={inputStyle} value={rules.gameName || ''} maxLength={60}
              onChange={e => set('gameName', e.target.value)} placeholder="My Custom Game" />
          </Field>
          <Field label="Game Description">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              value={rules.gameDescription || ''} maxLength={300}
              onChange={e => set('gameDescription', e.target.value)} placeholder="Brief description…" />
          </Field>
          <Field label="Number of Players" description="How many players participate (1–8).">
            <NumberInput value={rules.numPlayers} onChange={v => set('numPlayers', v)} min={1} max={8} />
          </Field>
          <Field label="Deck Type" description="The card deck used for the game.">
            <SelectInput value={rules.deckType} onChange={v => set('deckType', v)}
              options={['standard_52', 'standard_52_jokers', 'double_deck', 'tarot', 'custom']} />
          </Field>
        </div>
      );

      // ── Step 1: Dealing ─────────────────────────────────────────────────
      case 1: return (
        <div>
          <Field label="Cards Dealt Per Player" description="How many cards each player receives at the start.">
            <NumberInput value={rules.cardsDealtPerPlayer} onChange={v => set('cardsDealtPerPlayer', v)} min={0} max={52} />
          </Field>
          <Field label="Deal Direction">
            <SelectInput value={rules.dealDirection} onChange={v => set('dealDirection', v)}
              options={['clockwise', 'counterclockwise', 'simultaneous']} />
          </Field>
          <Field label="Deal Mode">
            <SelectInput value={rules.dealMode} onChange={v => set('dealMode', v)}
              options={['one_at_a_time', 'all_at_once', 'by_hand']} />
          </Field>
        </div>
      );

      // ── Step 2: Turns ───────────────────────────────────────────────────
      case 2: {
        const apt = rules.actionsPerTurn || {};
        return (
          <div>
            <Field label="Turn Based">
              <Toggle value={rules.turnBased} onChange={v => set('turnBased', v)} label="Players take turns" />
            </Field>
            <Field label="Turn Order">
              <SelectInput value={rules.turnOrder} onChange={v => set('turnOrder', v)}
                options={['clockwise', 'counterclockwise', 'random_each_round', 'by_score_ascending', 'by_score_descending']} />
            </Field>
            <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: '#c9a84c' }}>Actions per turn</div>
              <Toggle value={apt.mustDraw} onChange={v => setNested('actionsPerTurn', 'mustDraw', v)} label="Must draw a card" />
              <div style={{ marginTop: 8 }} />
              <Toggle value={apt.mayDraw !== false} onChange={v => setNested('actionsPerTurn', 'mayDraw', v)} label="May draw a card" />
              <div style={{ marginTop: 8 }} />
              <Field label="Cards drawn per turn">
                <NumberInput value={apt.drawCount ?? 1} onChange={v => setNested('actionsPerTurn', 'drawCount', v)} min={0} max={10} />
              </Field>
              <Field label="Draw from">
                <SelectInput value={apt.drawFrom || 'draw_pile'} onChange={v => setNested('actionsPerTurn', 'drawFrom', v)}
                  options={['draw_pile', 'discard_pile', 'either', 'opponent_hand', 'table_pile']} />
              </Field>
              <Toggle value={apt.mustDiscard} onChange={v => setNested('actionsPerTurn', 'mustDiscard', v)} label="Must discard a card" />
              <div style={{ marginTop: 8 }} />
              <Toggle value={apt.mustPlayCard} onChange={v => setNested('actionsPerTurn', 'mustPlayCard', v)} label="Must play a card from hand" />
              <div style={{ marginTop: 8 }} />
              <Field label="Card play rule">
                <SelectInput value={apt.playCardRule || 'any'} onChange={v => setNested('actionsPerTurn', 'playCardRule', v)}
                  options={['any', 'must_match_suit', 'must_match_rank', 'must_follow_suit', 'must_beat_current', 'must_be_higher', 'any_from_hand']} />
              </Field>
              <Toggle value={apt.mayAskForCard} onChange={v => setNested('actionsPerTurn', 'mayAskForCard', v)} label="May ask another player for a card (Go Fish style)" />
            </div>
          </div>
        );
      }

      // ── Step 3: Special Cards ───────────────────────────────────────────
      case 3: return (
        <div>
          <div style={{ marginBottom: 16 }}>
            {(rules.specialCards || []).map((sc, i) => (
              <div key={i} style={{ background: '#1a2a1a', border: '1px solid #c9a84c44', borderRadius: 6, padding: '8px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>{sc.rank} of {sc.suit} → {sc.effect}</span>
                <button onClick={() => set('specialCards', rules.specialCards.filter((_, j) => j !== i))}
                  style={{ background: '#5a1a1a', color: '#e88', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            {(!rules.specialCards || rules.specialCards.length === 0) && (
              <p style={{ opacity: 0.5, fontSize: 13 }}>No special cards yet.</p>
            )}
          </div>
          <div style={{ background: '#0d1a0d', borderRadius: 8, padding: 12, border: '1px solid #333' }}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: '#c9a84c', fontSize: 13 }}>Add Special Card</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Rank">
                <input style={inputStyle} placeholder="e.g. A, J, 2, Joker" value={specialCard.rank}
                  onChange={e => setSpecialCard(s => ({ ...s, rank: e.target.value }))} />
              </Field>
              <Field label="Suit">
                <input style={inputStyle} placeholder="♠ ♥ ♦ ♣ or 'any'" value={specialCard.suit}
                  onChange={e => setSpecialCard(s => ({ ...s, suit: e.target.value }))} />
              </Field>
            </div>
            <Field label="Effect">
              <SelectInput value={specialCard.effect}
                onChange={v => setSpecialCard(s => ({ ...s, effect: v }))}
                options={['skip_next_player','reverse_turn_order','draw_2_next_player','draw_4_next_player','wild_choose_suit','wild_choose_rank','play_again','swap_hands','steal_card_from_player','draw_to_5','none']} />
            </Field>
            <button onClick={() => {
              if (!specialCard.rank) return;
              set('specialCards', [...(rules.specialCards || []), { ...specialCard }]);
              setSpecialCard({ rank: '', suit: 'any', effect: 'skip_next_player', effectValue: 2, description: '' });
            }} style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 700 }}>
              + Add
            </button>
          </div>
        </div>
      );

      // ── Step 4: Win Condition ───────────────────────────────────────────
      case 4: return (
        <div>
          <Field label="Win Condition" description="How the winner is determined.">
            <SelectInput value={rules.winCondition} onChange={v => set('winCondition', v)}
              options={['empty_hand','most_cards','fewest_cards','target_score','lowest_score','highest_score','most_tricks','fewest_tricks','collect_sets','last_player_standing','exact_count','custom_condition']} />
          </Field>
          {rules.winCondition === 'target_score' && (
            <Field label="Target Score">
              <NumberInput value={rules.targetScore || 100} onChange={v => set('targetScore', v)} min={1} />
            </Field>
          )}
          {rules.winCondition === 'collect_sets' && (
            <>
              <Field label="Sets Needed to Win">
                <NumberInput value={rules.targetSets || 4} onChange={v => set('targetSets', v)} min={1} />
              </Field>
              <Field label="Cards Per Set (Book)">
                <NumberInput value={rules.setSize || 4} onChange={v => set('setSize', v)} min={2} max={13} />
              </Field>
            </>
          )}
          {rules.winCondition === 'custom_condition' && (
            <Field label="Describe the win condition">
              <textarea style={{ ...inputStyle, minHeight: 80 }} value={rules.customWinDescription || ''}
                onChange={e => set('customWinDescription', e.target.value)} />
            </Field>
          )}
          <Field label="Max Rounds (0 = unlimited)">
            <NumberInput value={rules.maxRounds || 0} onChange={v => set('maxRounds', v)} min={0} />
          </Field>
        </div>
      );

      // ── Step 5: Scoring ─────────────────────────────────────────────────
      case 5: {
        const sc = rules.scoring || {};
        return (
          <div>
            <Field label="Scoring">
              <Toggle value={sc.enabled} onChange={v => setNested('scoring', 'enabled', v)} label="Game uses a score" />
            </Field>
            {sc.enabled && (
              <>
                <Field label="Card point values">
                  <SelectInput value={sc.cardValues || 'none'} onChange={v => setNested('scoring', 'cardValues', v)}
                    options={['none','rank_value','face_cards_10','aces_11_faces_10','custom_map']} />
                </Field>
                <Field label="Penalty per card left in hand at end">
                  <NumberInput value={sc.penaltyPerCardInHand || 0} onChange={v => setNested('scoring', 'penaltyPerCardInHand', v)} min={0} />
                </Field>
                <Field label="Bonus for emptying hand first">
                  <NumberInput value={sc.bonusForEmptyHand || 0} onChange={v => setNested('scoring', 'bonusForEmptyHand', v)} min={0} />
                </Field>
              </>
            )}
          </div>
        );
      }

      // ── Step 6: Accessories ─────────────────────────────────────────────
      case 6: {
        const acc = rules.accessories || {};
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#c9a84c', marginBottom: 8 }}>Dice</div>
            <Toggle value={acc.dice?.enabled} onChange={v => setNested('accessories', 'dice', { ...(acc.dice || {}), enabled: v })} label="Use dice" />
            {acc.dice?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="Number of dice">
                  <NumberInput value={acc.dice.count || 1} onChange={v => setNested('accessories', 'dice', { ...(acc.dice || {}), count: v })} min={1} max={6} />
                </Field>
                <Field label="Sides per die">
                  <NumberInput value={acc.dice.sides || 6} onChange={v => setNested('accessories', 'dice', { ...(acc.dice || {}), sides: v })} min={2} max={20} />
                </Field>
              </div>
            )}
            <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, fontWeight: 600, color: '#c9a84c', marginBottom: 8 }}>Chips</div>
            <Toggle value={acc.chips?.enabled} onChange={v => setNested('accessories', 'chips', { ...(acc.chips || {}), enabled: v })} label="Use chips/tokens" />
            {acc.chips?.enabled && (
              <Field label="Starting chips per player">
                <NumberInput value={acc.chips.startingChips || 100} onChange={v => setNested('accessories', 'chips', { ...(acc.chips || {}), startingChips: v })} min={0} />
              </Field>
            )}
            <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, fontWeight: 600, color: '#c9a84c', marginBottom: 8 }}>Community Cards</div>
            <Toggle value={acc.communityCards?.enabled} onChange={v => setNested('accessories', 'communityCards', { ...(acc.communityCards || {}), enabled: v })} label="Use community cards" />
            {acc.communityCards?.enabled && (
              <>
                <Field label="Number of community cards">
                  <NumberInput value={acc.communityCards.count || 3} onChange={v => setNested('accessories', 'communityCards', { ...(acc.communityCards || {}), count: v })} min={1} max={10} />
                </Field>
                <Field label="Cards revealed at game start">
                  <NumberInput value={acc.communityCards.revealedAtStart || 0} onChange={v => setNested('accessories', 'communityCards', { ...(acc.communityCards || {}), revealedAtStart: v })} min={0} />
                </Field>
              </>
            )}
          </div>
        );
      }

      // ── Step 7: Table Layout ────────────────────────────────────────────
      case 7: {
        const tl = rules.tableLayout || {};
        return (
          <div>
            <Field label="Draw pile position">
              <SelectInput value={tl.drawPilePosition || 'center'} onChange={v => setNested('tableLayout', 'drawPilePosition', v)}
                options={['center','left','right','top','bottom','none']} />
            </Field>
            <Field label="Discard pile position">
              <SelectInput value={tl.discardPilePosition || 'right_of_draw'} onChange={v => setNested('tableLayout', 'discardPilePosition', v)}
                options={['center','left_of_draw','right_of_draw','top','bottom','none']} />
            </Field>
            <Field label="Player hand position">
              <SelectInput value={tl.playerHandPosition || 'bottom'} onChange={v => setNested('tableLayout', 'playerHandPosition', v)}
                options={['bottom','top','left','right']} />
            </Field>
            <Field label="Hand visibility">
              <SelectInput value={tl.handVisible || 'face_up_to_owner'} onChange={v => setNested('tableLayout', 'handVisible', v)}
                options={['face_up_to_owner','face_down_to_others','face_up_to_all','face_down_to_all']} />
            </Field>
            <Field label="Table style">
              <SelectInput value={tl.tableStyle || 'poker'} onChange={v => setNested('tableLayout', 'tableStyle', v)}
                options={['poker','bridge','solitaire','war','minimal']} />
            </Field>
            <Toggle value={tl.showCardCount !== false} onChange={v => setNested('tableLayout', 'showCardCount', v)} label="Show opponent card count" />
          </div>
        );
      }

      // ── Step 8: Table Setup ─────────────────────────────────────────────
      case 8: {
        const itl = rules.initialTableLayout || {};
        return (
          <div>
            <Field label="Initial Table Layout">
              <Toggle value={itl.enabled} onChange={v => setNested('initialTableLayout', 'enabled', v)} label="Enable table piles at game start" />
            </Field>
            {itl.enabled && (
              <>
                <Toggle value={itl.drawPileVisible} onChange={v => setNested('initialTableLayout', 'drawPileVisible', v)} label="Draw pile top card is visible" />
                <p style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>
                  Table pile configuration (for Solitaire-style setups) can be edited in code via RuleSchema.js for advanced layouts.
                </p>
              </>
            )}
          </div>
        );
      }

      // ── Step 9: Trick Taking ────────────────────────────────────────────
      case 9: {
        const tt = rules.trickTaking || {};
        return (
          <div>
            <Field label="Trick Taking">
              <Toggle value={tt.enabled} onChange={v => setNested('trickTaking', 'enabled', v)} label="This is a trick-taking game" />
            </Field>
            {tt.enabled && (
              <>
                <Field label="Lead suit rule">
                  <SelectInput value={tt.leadSuit || 'must_follow'} onChange={v => setNested('trickTaking', 'leadSuit', v)}
                    options={['must_follow','may_follow','no_rule']} />
                </Field>
                <Field label="Trump suit">
                  <SelectInput value={tt.trumpSuit || 'none'} onChange={v => setNested('trickTaking', 'trumpSuit', v)}
                    options={['none','fixed','bid','flipped_card','no_trump']} />
                </Field>
                {tt.trumpSuit === 'fixed' && (
                  <Field label="Fixed trump suit">
                    <SelectInput value={tt.fixedTrumpSuit || '♠'} onChange={v => setNested('trickTaking', 'fixedTrumpSuit', v)}
                      options={['♠','♥','♦','♣']} />
                  </Field>
                )}
                <Field label="Trick winner">
                  <SelectInput value={tt.trickWinner || 'highest_of_lead_suit'} onChange={v => setNested('trickTaking', 'trickWinner', v)}
                    options={['highest_of_lead_suit','highest_trump_else_lead','lowest_card','highest_card_any_suit']} />
                </Field>
                <Toggle value={tt.trickWinnerLeads !== false} onChange={v => setNested('trickTaking', 'trickWinnerLeads', v)} label="Trick winner leads next trick" />
                <Field label="Points per trick won">
                  <NumberInput value={tt.scoringPerTrick || 1} onChange={v => setNested('trickTaking', 'scoringPerTrick', v)} min={0} />
                </Field>
              </>
            )}
          </div>
        );
      }

      // ── Step 10: House Rules ────────────────────────────────────────────
      case 10: return (
        <div>
          <div style={{ marginBottom: 12 }}>
            {(rules.houseRules || []).map((hr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a2a1a', borderRadius: 6, padding: '8px 12px', marginBottom: 6, border: '1px solid #333' }}>
                <span style={{ fontSize: 13 }}>{hr.rule}</span>
                <button onClick={() => set('houseRules', rules.houseRules.filter((_, j) => j !== i))}
                  style={{ background: '#5a1a1a', color: '#e88', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={houseRule} placeholder="Add a house rule…"
              onChange={e => setHouseRule(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && houseRule.trim()) { set('houseRules', [...(rules.houseRules || []), { rule: houseRule.trim() }]); setHouseRule(''); } }} />
            <button onClick={() => { if (houseRule.trim()) { set('houseRules', [...(rules.houseRules || []), { rule: houseRule.trim() }]); setHouseRule(''); } }}
              style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 6, padding: '0 16px', cursor: 'pointer', fontWeight: 700 }}>
              +
            </button>
          </div>
        </div>
      );

      // ── Step 11: Review & Play ──────────────────────────────────────────
      case 11: return (
        <div>
          <div style={{ background: '#0d1f0d', borderRadius: 8, padding: 16, border: '1px solid #c9a84c44', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#c9a84c', marginBottom: 8 }}>{rules.gameName || 'My Custom Game'}</div>
            <div style={{ opacity: 0.7, marginBottom: 12, fontSize: 13 }}>{rules.gameDescription || 'No description'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
              <div>Players: <strong>{rules.numPlayers}</strong></div>
              <div>Deck: <strong>{rules.deckType?.replace(/_/g, ' ')}</strong></div>
              <div>Cards dealt: <strong>{rules.cardsDealtPerPlayer}</strong></div>
              <div>Win by: <strong>{rules.winCondition?.replace(/_/g, ' ')}</strong></div>
              <div>Turn order: <strong>{rules.turnOrder?.replace(/_/g, ' ')}</strong></div>
              <div>Special cards: <strong>{(rules.specialCards || []).length}</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onPlay?.(rules)}
              style={{ flex: 1, background: '#c9a84c', color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia, serif' }}>
              Play Now
            </button>
            <button onClick={() => onSave?.(rules)}
              style={{ flex: 1, background: '#1a3a5c', color: '#e8d5a3', border: '1px solid #c9a84c44', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Georgia, serif' }}>
              Save Game
            </button>
          </div>
        </div>
      );

      default: return <div>Step {step}</div>;
    }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{
              background: i === step ? '#c9a84c' : i < step ? '#2d5a27' : '#1a2a3a',
              color: i === step ? '#000' : '#e8d5a3',
              border: 'none', borderRadius: 4, padding: '4px 10px',
              cursor: 'pointer', fontSize: 11, fontFamily: 'Georgia, serif',
              fontWeight: i === step ? 700 : 400,
            }}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ ...sectionStyle, minHeight: 300 }}>
        <h2 style={{ color: '#c9a84c', marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>
        {renderStep()}
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid #555', color: '#e8d5a3', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          Cancel
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ background: '#1a2a3a', color: '#e8d5a3', border: '1px solid #c9a84c44', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button onClick={() => setStep(s => s + 1)}
              style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
