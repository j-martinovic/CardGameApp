"""
Shared betting and wagering handlers.

Each function accepts `game_state` (dict) and bet-specific keyword arguments.
Game-specific pot structures or blind schedules should be implemented in the
calling game's blueprint after invoking these shared functions.
"""


def place_bid(game_state: dict, player_id: str, amount: int) -> dict:
    """Place a bid for the current round.

    Args:
        game_state: Current game state dict. Expected keys: 'bids', 'chips'.
        player_id: ID of the bidding player.
        amount: Bid amount in chips.

    Returns:
        Updated game_state with the bid recorded and chips deducted.
    """
    chips = game_state.get("chips", {}).get(player_id, 0)
    amount = min(amount, chips)
    game_state.setdefault("bids", {})[player_id] = amount
    game_state.setdefault("chips", {})[player_id] = chips - amount
    game_state.setdefault("pot", 0)
    game_state["pot"] += amount
    return game_state


def raise_bet(game_state: dict, player_id: str, raise_to: int) -> dict:
    """Raise the current bet to a new total amount.

    Args:
        game_state: Current game state dict. Expected keys: 'current_bet', 'chips', 'bets'.
        player_id: ID of the player raising.
        raise_to: New total bet amount (not the increment).

    Returns:
        Updated game_state with the current bet raised and player chips deducted.
    """
    current_bet = game_state.get("current_bet", 0)
    already_bet = game_state.get("bets", {}).get(player_id, 0)
    additional = raise_to - already_bet
    chips = game_state.get("chips", {}).get(player_id, 0)
    additional = min(additional, chips)
    game_state.setdefault("bets", {})[player_id] = already_bet + additional
    game_state.setdefault("chips", {})[player_id] = chips - additional
    game_state.setdefault("pot", 0)
    game_state["pot"] += additional
    game_state["current_bet"] = max(current_bet, raise_to)
    game_state.setdefault("last_aggressor", None)
    game_state["last_aggressor"] = player_id
    return game_state


def call_bet(game_state: dict, player_id: str) -> dict:
    """Match the current bet.

    Args:
        game_state: Current game state dict. Expected keys: 'current_bet', 'chips', 'bets'.
        player_id: ID of the calling player.

    Returns:
        Updated game_state with the player's bet matched up to their chip count.
    """
    current_bet = game_state.get("current_bet", 0)
    already_bet = game_state.get("bets", {}).get(player_id, 0)
    to_call = current_bet - already_bet
    chips = game_state.get("chips", {}).get(player_id, 0)
    paid = min(to_call, chips)
    game_state.setdefault("bets", {})[player_id] = already_bet + paid
    game_state.setdefault("chips", {})[player_id] = chips - paid
    game_state.setdefault("pot", 0)
    game_state["pot"] += paid
    return game_state


def fold(game_state: dict, player_id: str) -> dict:
    """Mark a player as folded for the current hand.

    Args:
        game_state: Current game state dict. Expected key: 'folded'.
        player_id: ID of the folding player.

    Returns:
        Updated game_state with the player added to the folded set.
    """
    game_state.setdefault("folded", [])
    if player_id not in game_state["folded"]:
        game_state["folded"].append(player_id)
    return game_state


def check(game_state: dict, player_id: str) -> dict:
    """Pass action without betting (only valid when no bet is owed).

    Args:
        game_state: Current game state dict.
        player_id: ID of the checking player.

    Returns:
        Updated game_state with the check action recorded in the action log.
    """
    game_state.setdefault("action_log", []).append({"player": player_id, "action": "check"})
    return game_state


def pass_bid(game_state: dict, player_id: str) -> dict:
    """Pass the bid in a bidding game (e.g., Euchre, Spades).

    Args:
        game_state: Current game state dict.
        player_id: ID of the passing player.

    Returns:
        Updated game_state with the pass recorded and bid turn advanced.
    """
    game_state.setdefault("action_log", []).append({"player": player_id, "action": "pass"})
    game_state.setdefault("passes", []).append(player_id)
    return game_state


def set_trump_suit(game_state: dict, suit: str) -> dict:
    """Set the trump suit for the current hand.

    Args:
        game_state: Current game state dict.
        suit: One of 'spades', 'hearts', 'diamonds', 'clubs' (or game-specific).

    Returns:
        Updated game_state with trump_suit set.
    """
    game_state["trump_suit"] = suit
    return game_state


def bid_timeout_autopass(game_state: dict, player_id: str) -> dict:
    """Auto-pass for a player whose bid timer has expired.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player who timed out.

    Returns:
        Updated game_state as if the player passed, with a timeout flag recorded.
    """
    game_state = pass_bid(game_state, player_id)
    game_state.setdefault("timeouts", []).append({"player": player_id, "event": "bid_timeout"})
    return game_state


def enforce_minimum_raise(game_state: dict, raise_amount: int, minimum: int) -> bool:
    """Check whether a raise meets the table minimum.

    Args:
        game_state: Current game state dict (unused but kept for interface consistency).
        raise_amount: The proposed raise amount.
        minimum: The minimum legal raise increment.

    Returns:
        True if the raise is legal, False otherwise.
    """
    return raise_amount >= minimum


def post_ante_blind(game_state: dict, player_id: str, blind_type: str, amount: int) -> dict:
    """Post an ante, small blind, or big blind.

    Args:
        game_state: Current game state dict. Expected keys: 'chips', 'pot'.
        player_id: ID of the posting player.
        blind_type: 'ante' | 'small_blind' | 'big_blind'.
        amount: Blind/ante amount.

    Returns:
        Updated game_state with the blind posted.
    """
    chips = game_state.get("chips", {}).get(player_id, 0)
    paid = min(amount, chips)
    game_state.setdefault("chips", {})[player_id] = chips - paid
    game_state.setdefault("pot", 0)
    game_state["pot"] += paid
    game_state.setdefault("blinds", {})[player_id] = {"type": blind_type, "amount": paid}
    if blind_type in ("small_blind", "big_blind"):
        game_state.setdefault("bets", {})[player_id] = paid
        game_state["current_bet"] = max(game_state.get("current_bet", 0), paid)
    return game_state


def activate_time_bank(game_state: dict, player_id: str) -> dict:
    """Activate a player's time bank to extend their decision window.

    Args:
        game_state: Current game state dict.
        player_id: ID of the player using their time bank.

    Returns:
        Updated game_state with the time bank activation recorded.
    """
    time_banks = game_state.setdefault("time_banks", {})
    remaining = time_banks.get(player_id, 1)
    if remaining > 0:
        time_banks[player_id] = remaining - 1
        game_state.setdefault("action_log", []).append(
            {"player": player_id, "action": "time_bank_activated"}
        )
    return game_state


def resolve_split_pot(game_state: dict, winners: list) -> dict:
    """Distribute the pot evenly among multiple winners.

    Args:
        game_state: Current game state dict. Expected keys: 'pot', 'chips'.
        winners: List of player IDs who share the pot.

    Returns:
        Updated game_state with the pot split and awarded to winners.
    """
    if not winners:
        return game_state
    pot = game_state.get("pot", 0)
    share = pot // len(winners)
    remainder = pot % len(winners)
    chips = game_state.setdefault("chips", {})
    for player_id in winners:
        chips[player_id] = chips.get(player_id, 0) + share
    # Remainder goes to the first winner (standard casino rule)
    chips[winners[0]] = chips.get(winners[0], 0) + remainder
    game_state["pot"] = 0
    return game_state


def straddle(game_state: dict, player_id: str, amount: int) -> dict:
    """Post an optional live straddle (double the big blind, acts last pre-flop).

    Args:
        game_state: Current game state dict.
        player_id: ID of the straddling player.
        amount: Straddle amount (typically 2x big blind).

    Returns:
        Updated game_state with the straddle posted.
    """
    game_state = post_ante_blind(game_state, player_id, "straddle", amount)
    game_state["straddle_player"] = player_id
    return game_state


def run_it_twice(game_state: dict, consenting_players: list) -> dict:
    """Record player consent to run out remaining board cards twice.

    Args:
        game_state: Current game state dict.
        consenting_players: List of all-in player IDs who agreed to run it twice.

    Returns:
        Updated game_state with the run_it_twice flag enabled if all consent.
    """
    game_state.setdefault("run_it_twice_consents", [])
    for player_id in consenting_players:
        if player_id not in game_state["run_it_twice_consents"]:
            game_state["run_it_twice_consents"].append(player_id)
    active_all_in = game_state.get("all_in_players", [])
    if active_all_in and set(active_all_in).issubset(set(game_state["run_it_twice_consents"])):
        game_state["run_it_twice"] = True
    return game_state
