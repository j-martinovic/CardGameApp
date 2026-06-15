"""
Shared card interaction handlers.

Each function accepts `game_state` (dict) and action-specific keyword arguments.
Callers are responsible for committing or broadcasting the returned state.
Functions that require game-specific logic are stubs — implement in the game's
own move resolver after calling these.
"""
import random


def select_card(game_state: dict, player_id: str, card_index: int) -> dict:
    """Mark a card in the player's hand as selected.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player performing the action.
        card_index: Index into the player's hand.

    Returns:
        Updated game_state with the card flagged as selected.
    """
    game_state.setdefault("selected_cards", {}).setdefault(player_id, [])
    if card_index not in game_state["selected_cards"][player_id]:
        game_state["selected_cards"][player_id].append(card_index)
    return game_state


def deselect_card(game_state: dict, player_id: str, card_index: int) -> dict:
    """Remove a card from the player's selection.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player performing the action.
        card_index: Index of the card to deselect.

    Returns:
        Updated game_state with the card removed from the selection list.
    """
    selected = game_state.setdefault("selected_cards", {}).get(player_id, [])
    game_state["selected_cards"][player_id] = [i for i in selected if i != card_index]
    return game_state


def play_card(game_state: dict, player_id: str, card_index: int) -> dict:
    """Remove a card from the player's hand and place it on the play area.

    Args:
        game_state: Current game state dict. Expected keys: 'hands', 'play_area'.
        player_id: ID of the player playing the card.
        card_index: Index into the player's hand.

    Returns:
        Updated game_state with the card moved from hand to play_area.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    if 0 <= card_index < len(hand):
        card = hand.pop(card_index)
        game_state.setdefault("play_area", {}).setdefault(player_id, []).append(card)
    return game_state


def discard_card(game_state: dict, player_id: str, card_index: int) -> dict:
    """Move a card from the player's hand to the discard pile.

    Args:
        game_state: Current game state dict. Expected keys: 'hands', 'discard_pile'.
        player_id: ID of the player discarding.
        card_index: Index of the card in the player's hand.

    Returns:
        Updated game_state with card added to discard_pile.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    if 0 <= card_index < len(hand):
        card = hand.pop(card_index)
        game_state.setdefault("discard_pile", []).append(card)
    return game_state


def draw_card(game_state: dict, player_id: str, count: int = 1) -> dict:
    """Draw one or more cards from the top of the deck into the player's hand.

    Args:
        game_state: Current game state dict. Expected keys: 'deck', 'hands'.
        player_id: ID of the player drawing.
        count: Number of cards to draw (default 1).

    Returns:
        Updated game_state with cards moved from deck to player's hand.
    """
    deck = game_state.get("deck", [])
    hand = game_state.setdefault("hands", {}).setdefault(player_id, [])
    for _ in range(min(count, len(deck))):
        hand.append(deck.pop(0))
    return game_state


def sort_hand(game_state: dict, player_id: str, sort_key: str = "rank") -> dict:
    """Sort a player's hand by a given key.

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        player_id: ID of the player whose hand to sort.
        sort_key: Card attribute to sort by (e.g., 'rank', 'suit', 'value').

    Returns:
        Updated game_state with the player's hand sorted.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    hand.sort(key=lambda c: c.get(sort_key, 0))
    return game_state


def reveal_card(game_state: dict, player_id: str, card_index: int) -> dict:
    """Flip a card face-up so all players can see it.

    Args:
        game_state: Current game state dict.
        player_id: Owner of the card being revealed.
        card_index: Index of the card in the player's hand.

    Returns:
        Updated game_state with the card's 'face_up' flag set to True.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    if 0 <= card_index < len(hand):
        hand[card_index]["face_up"] = True
    return game_state


def shuffle_reset(game_state: dict, seed: int = None) -> dict:
    """Shuffle the discard pile back into the deck and reset it.

    Args:
        game_state: Current game state dict. Expected keys: 'deck', 'discard_pile'.
        seed: Optional random seed for deterministic shuffles in tests.

    Returns:
        Updated game_state with a freshly shuffled deck and empty discard pile.
    """
    discard = game_state.get("discard_pile", [])
    deck = game_state.get("deck", [])
    combined = deck + discard
    if seed is not None:
        random.seed(seed)
    random.shuffle(combined)
    game_state["deck"] = combined
    game_state["discard_pile"] = []
    return game_state


def snap_card_back(game_state: dict, player_id: str, card_index: int) -> dict:
    """Return a card from the play area back to the player's hand (undo drag).

    Args:
        game_state: Current game state dict. Expected keys: 'play_area', 'hands'.
        player_id: ID of the player whose card is being snapped back.
        card_index: Index of the card in the player's play_area list.

    Returns:
        Updated game_state with card moved back to the player's hand.
    """
    play_area = game_state.get("play_area", {}).get(player_id, [])
    if 0 <= card_index < len(play_area):
        card = play_area.pop(card_index)
        game_state.setdefault("hands", {}).setdefault(player_id, []).append(card)
    return game_state


def peek_card(game_state: dict, peeker_id: str, owner_id: str, card_index: int) -> dict:
    """Record that one player secretly looked at another player's card.

    Args:
        game_state: Current game state dict.
        peeker_id: ID of the player who is peeking.
        owner_id: ID of the player who owns the card.
        card_index: Index of the card in the owner's hand.

    Returns:
        Updated game_state with the peek event logged.
    """
    peek_log = game_state.setdefault("peek_log", [])
    peek_log.append({"peeker": peeker_id, "owner": owner_id, "card_index": card_index})
    return game_state


def cut_deck(game_state: dict, cut_position: int) -> dict:
    """Cut the deck at the given position and swap the two halves.

    Args:
        game_state: Current game state dict. Expected key: 'deck'.
        cut_position: Index at which to cut (bottom half becomes top).

    Returns:
        Updated game_state with the deck cut.
    """
    deck = game_state.get("deck", [])
    if 0 < cut_position < len(deck):
        game_state["deck"] = deck[cut_position:] + deck[:cut_position]
    return game_state


def burn_card(game_state: dict) -> dict:
    """Remove the top card of the deck face-down without showing it.

    Args:
        game_state: Current game state dict. Expected keys: 'deck', 'burn_pile'.

    Returns:
        Updated game_state with the top deck card added to the burn pile.
    """
    deck = game_state.get("deck", [])
    if deck:
        card = deck.pop(0)
        card["face_up"] = False
        game_state.setdefault("burn_pile", []).append(card)
    return game_state


def mark_card_held(game_state: dict, player_id: str, card_index: int, held: bool = True) -> dict:
    """Toggle a 'held' visual marker on a card (e.g., for Poker hold decision).

    Args:
        game_state: Current game state dict.
        player_id: ID of the player marking the card.
        card_index: Index of the card in the player's hand.
        held: True to mark as held, False to unmark.

    Returns:
        Updated game_state with the card's 'held' flag updated.
    """
    hand = game_state.get("hands", {}).get(player_id, [])
    if 0 <= card_index < len(hand):
        hand[card_index]["held"] = held
    return game_state
