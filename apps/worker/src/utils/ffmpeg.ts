export const parseFrameRate = (frameRate: string): number => {
    const parts = frameRate.split("/");

    const numerator = Number(parts[0] ?? 0);
    const denominator = Number(parts[1] ?? 1);

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
};