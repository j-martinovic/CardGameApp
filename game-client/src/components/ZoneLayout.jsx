// ZoneLayout.jsx — reads a flat boardConfig zone array and renders the matching
// primitive component for each zone, wiring drag/drop/click straight through
// to useBoardEventHandlers. This is the glue between the config schema (Step 4)
// and the primitive component library (Step 2).
import React from 'react';
import Hand from './primitives/Hand';
import Deck from './primitives/Deck';
import DrawPile from './primitives/DrawPile';
import Pile from './primitives/Pile';
import PlayZone from './primitives/PlayZone';
import CardSlot from './primitives/CardSlot';

// Maps a zone's `type` to the abstract zone-type used by useBoardEventHandlers'
// moveMap (e.g. 'hand→play'). Several primitive types collapse to the same
// abstract zone type (Deck/DrawPile are both 'deck').
const ZONE_TYPE_ABSTRACT = {
  Hand: 'hand',
  Deck: 'deck',
  DrawPile: 'deck',
  Pile: 'pile',
  PlayZone: 'play',
  CardSlot: 'slot',
};

function abstractTypeOf(zoneId, zones) {
  const zone = zones.find((z) => z.id === zoneId);
  if (zone) return ZONE_TYPE_ABSTRACT[zone.type] || 'unknown';
  return zoneId?.startsWith('hand-') ? 'hand' : 'unknown';
}

export default function ZoneLayout({ zones = [], G = {}, playerID, eventHandlers }) {
  const { selectedCardId, handleCardDrop, handleCardClick, handleZoneClick, handleDeckClick } = eventHandlers;

  return (
    <>
      {zones.map((zone) => {
        const zoneData = G?.[zone.id];
        const abstractType = ZONE_TYPE_ABSTRACT[zone.type];
        {console.log("---")}
        {console.log(zone.id)}
        {console.log("---")}
        console.log(zone.type)
        switch (zone.type) {
          case 'Hand': {
            const hand = (
              <Hand
                cards={zoneData || []}
                playerId={zone.owner}
                isOwner={zone.faceUp !== false}
                selectedCardId={selectedCardId}
                disabled={zone.disabled}
                onCardSelect={(cardId) => handleCardClick({ cardId, zoneId: zone.id, zoneType: 'hand' })}
                onCardConfirm={(cardId) => handleCardClick({ cardId, zoneId: zone.id, zoneType: 'hand' })}
              />
            );
            // isTargetZone: true (e.g. Go Fish opponent hands) — clicking the zone
            // fires handleZoneClick with type 'opponent-hand' so the ask move dispatches.
            if (zone.isTargetZone) {
              return (
                <div
                  key={zone.id}
                  className="zone-target-wrapper"
                  role="button"
                  tabIndex={0}
                  aria-label={`Ask ${zone.label || 'opponent'}`}
                  onClick={() => handleZoneClick({ zoneId: zone.id, zoneType: 'opponent-hand' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleZoneClick({ zoneId: zone.id, zoneType: 'opponent-hand' });
                    }
                  }}
                >
                  {console.log("RENDERING")}
                  {hand}
                </div>
              );
            }
            return <React.Fragment key={zone.id}>{hand}</React.Fragment>;
          }

          case 'Deck':
          case 'DrawPile': {
            const Component = zone.type === 'DrawPile' ? DrawPile : Deck;
            return (
              <Component
                key={zone.id}
                deckId={zone.id}
                cardCount={zoneData?.length ?? 0}
                disabled={zone.disabled}
                onDraw={() => handleDeckClick(zone.id)}
              />
            );
          }

          case 'Pile':
            return (
              <Pile
                key={zone.id}
                pileId={zone.id}
                cards={zoneData || []}
                faceUp={zone.faceUp}
                isDropTarget={zone.isDropTarget}
                label={zone.label}
                onDrop={({ cardId, sourceZoneId }) => handleCardDrop({
                  cardId,
                  sourceZoneId,
                  targetZoneId: zone.id,
                  sourceZoneType: abstractTypeOf(sourceZoneId, zones),
                  targetZoneType: abstractType,
                })}
                onTopCardClick={({ cardId }) => handleCardClick({ cardId, zoneId: zone.id, zoneType: abstractType })}
              />
            );

          case 'PlayZone':
            return (
              <PlayZone
                key={zone.id}
                zoneId={zone.id}
                cards={zoneData || []}
                isDropTarget={zone.isDropTarget !== false}
                label={zone.label}
                maxCards={zone.maxCards}
                disabled={zone.disabled}
                selectedCardId={selectedCardId}
                onDrop={({ cardId, sourceZoneId }) => handleCardDrop({
                  cardId,
                  sourceZoneId,
                  targetZoneId: zone.id,
                  sourceZoneType: abstractTypeOf(sourceZoneId, zones),
                  targetZoneType: abstractType,
                })}
                onPlay={({ cardId, zoneId }) => handleCardDrop({
                  cardId,
                  sourceZoneId: `hand-${playerID}`,
                  targetZoneId: zoneId,
                  sourceZoneType: 'hand',
                  targetZoneType: abstractType,
                })}
              />
            );

          case 'CardSlot':
            return (
              <CardSlot
                key={zone.id}
                slotId={zone.id}
                card={zoneData}
                isDropTarget={zone.isDropTarget !== false}
                disabled={zone.disabled}
                onDrop={({ cardId, sourceZoneId }) => handleCardDrop({
                  cardId,
                  sourceZoneId,
                  targetZoneId: zone.id,
                  sourceZoneType: abstractTypeOf(sourceZoneId, zones),
                  targetZoneType: abstractType,
                })}
                onSlotClick={() => handleZoneClick({ zoneId: zone.id, zoneType: abstractType })}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
