"""
Bridge-specific game handlers.

These handlers are stubs for Contract Bridge mechanics that require game-specific
state (partnership assignments, vulnerability, full bidding box state).
Implement full logic in the Bridge game's move resolver after calling these.
"""
import time


def open_bidding_box(game_state: dict, player_id: str) -> dict:
    """Signal that a player has opened their bidding box to make a call.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player opening the bidding box.

    Returns:
        Updated game_state with the active bidder recorded.
    """
    game_state["active_bidder"] = player_id
    return game_state


def double_bid(game_state: dict, player_id: str) -> dict:
    """Record a double bid on the last contract.

    Args:
        game_state: Current game state dict. Expected key: 'last_bid'.
        player_id: ID of the player doubling.

    Returns:
        Updated game_state with the double recorded — stub.
    """
    game_state.setdefault("bid_history", []).append({
        "player": player_id,
        "call": "double",
        "timestamp": time.time(),
    })
    game_state["doubled"] = True
    game_state["redoubled"] = False
    return game_state


def redouble_bid(game_state: dict, player_id: str) -> dict:
    """Record a redouble bid (only valid after a double).

    Args:
        game_state: Current game state dict.
        player_id: ID of the player redoubling.

    Returns:
        Updated game_state with the redouble recorded — stub.
    """
    game_state.setdefault("bid_history", []).append({
        "player": player_id,
        "call": "redouble",
        "timestamp": time.time(),
    })
    game_state["redoubled"] = True
    return game_state


def reveal_dummy_hand(game_state: dict, dummy_player_id: str) -> dict:
    """Flip the dummy hand face-up after the opening lead.

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        dummy_player_id: ID of the dummy player (typically declarer's partner).

    Returns:
        Updated game_state with all dummy cards marked face_up.
    """
    hand = game_state.get("hands", {}).get(dummy_player_id, [])
    for card in hand:
        card["face_up"] = True
    game_state["dummy_revealed"] = True
    game_state["dummy_player_id"] = dummy_player_id
    return game_state


def claim_remaining_tricks(game_state: dict, claimant_id: str, claimed_tricks: int) -> dict:
    """Declare the rest of the tricks without playing them out.

    Args:
        game_state: Current game state dict.
        claimant_id: ID of the player making the claim.
        claimed_tricks: Number of remaining tricks the claimant asserts they will win.

    Returns:
        Updated game_state with the claim pending acceptance — stub.
    """
    game_state["pending_claim"] = {
        "claimant": claimant_id,
        "claimed_tricks": claimed_tricks,
        "accepted": False,
        "timestamp": time.time(),
    }
    return game_state


def alert_explain_bid(game_state: dict, alerting_player_id: str, alerted_bid: str, explanation: str) -> dict:
    """Record a Bridge Alert — one side explains a partner's non-standard bid.

    Args:
        game_state: Current game state dict.
        alerting_player_id: ID of the player providing the explanation.
        alerted_bid: The bid being explained (e.g., '1NT', '2♣').
        explanation: Free-text explanation for the opponents.

    Returns:
        Updated game_state with the alert logged.
    """
    game_state.setdefault("alerts", []).append({
        "alerting_player": alerting_player_id,
        "bid": alerted_bid,
        "explanation": explanation,
        "timestamp": time.time(),
    })
    return game_state


def unauthorized_information_warning(game_state: dict, offending_player_id: str, infraction: str) -> dict:
    """Record an unauthorized information infraction.

    Args:
        game_state: Current game state dict.
        offending_player_id: ID of the player who communicated unauthorized information.
        infraction: Description of the infraction.

    Returns:
        Updated game_state with the infraction logged.
    """
    game_state.setdefault("infractions", []).append({
        "player": offending_player_id,
        "type": "unauthorized_information",
        "description": infraction,
        "timestamp": time.time(),
    })
    return game_state


def stop_card_indicator(game_state: dict, player_id: str) -> dict:
    """Record use of the STOP card, indicating a skip bid that requires a pause.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player using the STOP card.

    Returns:
        Updated game_state with the stop pause requirement recorded.
    """
    game_state["stop_card_active"] = True
    game_state["stop_card_player"] = player_id
    return game_state


def claim_acceptance(game_state: dict, accepting_player_id: str) -> dict:
    """Accept an opponent's claim of remaining tricks.

    Args:
        game_state: Current game state dict. Expected key: 'pending_claim'.
        accepting_player_id: ID of the player accepting the claim.

    Returns:
        Updated game_state with the claim marked as accepted — stub.
    """
    if game_state.get("pending_claim"):
        game_state["pending_claim"]["accepted"] = True
        game_state["pending_claim"]["accepted_by"] = accepting_player_id
    return game_state


def partnership_chat(game_state: dict, sender_id: str, message: str, partnership_chat_log: list) -> dict:
    """Send a message visible only to a player's partner.

    Args:
        game_state: Current game state dict (used to look up partnership).
        sender_id: ID of the sending player.
        message: Message text.
        partnership_chat_log: Mutable list of partnership chat entries.

    Returns:
        The new entry appended to partnership_chat_log.
    """
    entry = {
        "sender": sender_id,
        "message": message[:500],
        "timestamp": time.time(),
    }
    partnership_chat_log.append(entry)
    return entry
