"""
Shared player action handlers for trick-taking, declaration, and split-hand games.

Each function is a stub with a correct signature and docstring.
Game-specific scoring or validation logic must be added in the calling
game's move resolver after these functions return.
"""
import time


def claim_trick(game_state: dict, player_id: str, trick_cards: list) -> dict:
    """Record that a player has won a trick.

    Args:
        game_state: Current game state dict. Expected key: 'tricks_won'.
        player_id: ID of the player claiming the trick.
        trick_cards: List of card dicts that comprise the trick.

    Returns:
        Updated game_state with the trick added to the player's won tricks.
    """
    tricks = game_state.setdefault("tricks_won", {})
    tricks.setdefault(player_id, []).append(trick_cards)
    game_state.setdefault("action_log", []).append(
        {"event": "trick_claimed", "player": player_id, "timestamp": time.time()}
    )
    return game_state


def challenge_play(game_state: dict, challenger_id: str, challenged_id: str, reason: str) -> dict:
    """Record a challenge to another player's most recent action.

    The game-specific resolver must evaluate whether the challenge is valid.

    Args:
        game_state: Current game state dict.
        challenger_id: ID of the player issuing the challenge.
        challenged_id: ID of the player being challenged.
        reason: Human-readable reason for the challenge.

    Returns:
        Updated game_state with the challenge recorded and pending resolution.
    """
    game_state.setdefault("pending_challenges", []).append({
        "challenger": challenger_id,
        "challenged": challenged_id,
        "reason": reason,
        "resolved": False,
        "timestamp": time.time(),
    })
    return game_state


def meld_declare(game_state: dict, player_id: str, meld_cards: list, meld_type: str) -> dict:
    """Declare a meld (set of cards) in games like Rummy or Canasta.

    Args:
        game_state: Current game state dict. Expected key: 'melds'.
        player_id: ID of the declaring player.
        meld_cards: List of card dicts forming the meld.
        meld_type: Game-specific meld label (e.g., 'set', 'run', 'canasta').

    Returns:
        Updated game_state with the meld recorded.
    """
    game_state.setdefault("melds", {}).setdefault(player_id, []).append({
        "cards": meld_cards,
        "type": meld_type,
        "timestamp": time.time(),
    })
    return game_state


def swap_cards(game_state: dict, player_id: str, give_indices: list, receive_indices: list, partner_id: str) -> dict:
    """Swap cards between a player and a partner (e.g., in Tichu or Hearts passing).

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        player_id: ID of the initiating player.
        give_indices: Indices of cards in player_id's hand to give away.
        receive_indices: Indices of cards in partner_id's hand to receive.
        partner_id: ID of the player receiving cards.

    Returns:
        Updated game_state — stub; game-specific swap logic must be implemented.
    """
    # Stub: game-specific swap ordering (simultaneous vs sequential) varies too
    # much to implement generically. Log the intent and let the resolver handle it.
    game_state.setdefault("pending_swaps", []).append({
        "from": player_id,
        "to": partner_id,
        "give_indices": give_indices,
        "receive_indices": receive_indices,
        "timestamp": time.time(),
    })
    return game_state


def declare_win(game_state: dict, player_id: str) -> dict:
    """Record a player's self-declared win (used in games like Gin Rummy).

    The game-specific resolver must verify the claim before awarding points.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player declaring a win.

    Returns:
        Updated game_state with the win claim pending verification.
    """
    game_state["win_declared_by"] = player_id
    game_state["win_declaration_time"] = time.time()
    return game_state


def split_hand_blackjack(game_state: dict, player_id: str) -> dict:
    """Split a Blackjack hand into two separate hands.

    Requires the player to have exactly two cards of equal rank.

    Args:
        game_state: Current game state dict. Expected key: 'hands'.
        player_id: ID of the splitting player.

    Returns:
        Updated game_state with the hand split into 'split_hands' list — stub.
    """
    # Stub: actual splitting requires chip deduction and card dealing, which
    # depend on game-specific bet structure. Record the split intent here.
    game_state.setdefault("split_intents", []).append({
        "player": player_id,
        "timestamp": time.time(),
    })
    return game_state


def insurance_bet(game_state: dict, player_id: str, amount: int) -> dict:
    """Place a Blackjack insurance bet against a dealer Ace.

    Args:
        game_state: Current game state dict. Expected keys: 'chips'.
        player_id: ID of the player buying insurance.
        amount: Insurance bet amount (typically half of the original bet).

    Returns:
        Updated game_state with the insurance bet recorded.
    """
    chips = game_state.get("chips", {}).get(player_id, 0)
    paid = min(amount, chips)
    game_state.setdefault("chips", {})[player_id] = chips - paid
    game_state.setdefault("insurance_bets", {})[player_id] = paid
    return game_state


def rebuy_chips(game_state: dict, player_id: str, amount: int) -> dict:
    """Add chips to a player's stack mid-game (rebuy).

    Args:
        game_state: Current game state dict. Expected key: 'chips'.
        player_id: ID of the player rebuying.
        amount: Number of chips to add.

    Returns:
        Updated game_state with chips added to the player's stack.
    """
    game_state.setdefault("chips", {})[player_id] = (
        game_state.get("chips", {}).get(player_id, 0) + amount
    )
    game_state.setdefault("action_log", []).append(
        {"event": "rebuy", "player": player_id, "amount": amount, "timestamp": time.time()}
    )
    return game_state


def sit_out_next_hand(game_state: dict, player_id: str, sitting_out: bool = True) -> dict:
    """Toggle whether a player will sit out the next hand.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player opting in/out.
        sitting_out: True to sit out, False to return to play.

    Returns:
        Updated game_state with the player's sit-out preference recorded.
    """
    sitters = game_state.setdefault("sitting_out", [])
    if sitting_out and player_id not in sitters:
        sitters.append(player_id)
    elif not sitting_out and player_id in sitters:
        sitters.remove(player_id)
    return game_state
