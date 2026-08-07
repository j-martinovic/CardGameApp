// DrawPile.jsx — communal draw pile. Behaviorally identical to Deck; kept as a
// separate name so boardConfig zone types read clearly ('Deck' vs 'DrawPile').
import React from 'react';
import Deck from './Deck';

export default function DrawPile(props) {
  return <Deck {...props} />;
}
