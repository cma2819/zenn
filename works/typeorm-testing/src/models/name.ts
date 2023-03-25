export type Name = {
    first: string;
    last: string;
}

export const makeName = (first: string, last: string): Name => {

    if (!first || !last) {
        throw new Error("Give me name plz");
    }

    return {
        first,
        last,
    }
}