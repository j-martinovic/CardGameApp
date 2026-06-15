"""
Shared handler package — public API.

Usage from any game blueprint or move resolver:

    from shared_handlers import (
        play_card, place_bid, end_turn, update_score, ...
    )
"""

from .card_interactions import (
    select_card,
    deselect_card,
    play_card,
    discard_card,
    draw_card,
    sort_hand,
    reveal_card,
    shuffle_reset,
    snap_card_back,
    peek_card,
    cut_deck,
    burn_card,
    mark_card_held,
)

from .betting import (
    place_bid,
    raise_bet,
    call_bet,
    fold,
    check,
    pass_bid,
    set_trump_suit,
    bid_timeout_autopass,
    enforce_minimum_raise,
    post_ante_blind,
    activate_time_bank,
    resolve_split_pot,
    straddle,
    run_it_twice,
)

from .turn_round import (
    start_game,
    end_turn,
    start_next_round,
    forfeit,
    turn_timeout_autoplay,
    undo_last_action,
    restore_reconnection_state,
    force_resync,
)

from .player_actions import (
    claim_trick,
    challenge_play,
    meld_declare,
    swap_cards,
    declare_win,
    split_hand_blackjack,
    insurance_bet,
    rebuy_chips,
    sit_out_next_hand,
)

from .social import (
    send_chat_message,
    send_emoji_reaction,
    send_quick_phrase,
    mute_player,
    report_player,
    block_player,
    send_spectator_chat,
)

from .lobby import (
    create_room,
    join_room,
    leave_room,
    ready_up,
    spectate_game,
    promote_spectator,
    set_house_rules,
    kick_vote,
    rematch_request,
    accept_rematch,
    bot_fill_player,
    host_migration,
)

from .bridge_specific import (
    open_bidding_box,
    double_bid,
    redouble_bid,
    reveal_dummy_hand,
    claim_remaining_tricks,
    alert_explain_bid,
    unauthorized_information_warning,
    stop_card_indicator,
    claim_acceptance,
    partnership_chat,
)

from .euchre_specific import (
    order_it_up,
    pass_pick_it_up,
    go_alone,
    stick_the_dealer,
    screw_the_dealer,
)

from .poker_specific import (
    all_in,
    show_hand,
    muck_hand,
    rabbit_hunt,
    track_side_pot,
    auto_fold_checkbox,
)

from .scoring import (
    update_score,
    unlock_achievement,
    export_hand_history,
    kibitz_replay_step,
)

from .debug import (
    force_specific_deal,
    reveal_all_hands,
    simulate_disconnect,
    step_game_state,
    dump_game_log,
)

__all__ = [
    # card_interactions
    "select_card", "deselect_card", "play_card", "discard_card", "draw_card",
    "sort_hand", "reveal_card", "shuffle_reset", "snap_card_back", "peek_card",
    "cut_deck", "burn_card", "mark_card_held",
    # betting
    "place_bid", "raise_bet", "call_bet", "fold", "check", "pass_bid",
    "set_trump_suit", "bid_timeout_autopass", "enforce_minimum_raise",
    "post_ante_blind", "activate_time_bank", "resolve_split_pot", "straddle",
    "run_it_twice",
    # turn_round
    "start_game", "end_turn", "start_next_round", "forfeit",
    "turn_timeout_autoplay", "undo_last_action", "restore_reconnection_state",
    "force_resync",
    # player_actions
    "claim_trick", "challenge_play", "meld_declare", "swap_cards", "declare_win",
    "split_hand_blackjack", "insurance_bet", "rebuy_chips", "sit_out_next_hand",
    # social
    "send_chat_message", "send_emoji_reaction", "send_quick_phrase",
    "mute_player", "report_player", "block_player", "send_spectator_chat",
    # lobby
    "create_room", "join_room", "leave_room", "ready_up", "spectate_game",
    "promote_spectator", "set_house_rules", "kick_vote", "rematch_request",
    "accept_rematch", "bot_fill_player", "host_migration",
    # bridge_specific
    "open_bidding_box", "double_bid", "redouble_bid", "reveal_dummy_hand",
    "claim_remaining_tricks", "alert_explain_bid",
    "unauthorized_information_warning", "stop_card_indicator",
    "claim_acceptance", "partnership_chat",
    # euchre_specific
    "order_it_up", "pass_pick_it_up", "go_alone", "stick_the_dealer",
    "screw_the_dealer",
    # poker_specific
    "all_in", "show_hand", "muck_hand", "rabbit_hunt", "track_side_pot",
    "auto_fold_checkbox",
    # scoring
    "update_score", "unlock_achievement", "export_hand_history",
    "kibitz_replay_step",
    # debug
    "force_specific_deal", "reveal_all_hands", "simulate_disconnect",
    "step_game_state", "dump_game_log",
]
