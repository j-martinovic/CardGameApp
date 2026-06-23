



export const game1 = {
    name: "Mighty",
    setup: ({ctx, }) => {},
    // validateSetupData: (setupData, numPlayers) => 'setupData is not valid!',
    moves: {
        A: ({G, ctx, playerID, events, random}) => {},

        B: {
            move: ({G, ctx, playerID, events, random}) => {},
            undoable: ({ G, ctx }) => {return false},
            redact: true,
            client: false,
            ignoreStaleStateID: false,
        },
    },

    minPlayers: 4,
    maxPlayers: 6,
}

export const game2 = {
    name: "Golf",
    setup: ({ctx, }) => {},
    // validateSetupData: (setupData, numPlayers) => 'setupData is not valid!',
    moves: {
        A: ({G, ctx, playerID, events, random}) => {},

        B: {
            move: ({G, ctx, playerID, events, random}) => {},
            undoable: ({ G, ctx }) => {return false},
            redact: true,
            client: false,
            ignoreStaleStateID: false,
        },
    },

    minPlayers: 4,
    maxPlayers: 6,
}