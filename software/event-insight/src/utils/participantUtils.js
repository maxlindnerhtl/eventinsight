export const timeStringToSeconds = (timeString) => {
    const parts = timeString.split(":").map((part) => parseFloat(part.replace(",", ".")));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
};

export const calculateSpeedAndProgress = (
    participant,
    totalDistance,
    elapsedTime,
    intermediateMarkers
) => {
    if (!totalDistance) return {progress: 0, finished: false, speed: 0};
    let usedTimeSeconds;
    let baseProgress;
    if (participant.Zeit) {
        usedTimeSeconds = timeStringToSeconds(participant.Zeit);
        baseProgress = 100;
    } else if (intermediateMarkers.length > 0) {
        let checkpointIndex = -1;
        for (let i = intermediateMarkers.length; i >= 1; i--) {
            if (participant[i]) {
                checkpointIndex = i - 1;
                usedTimeSeconds = timeStringToSeconds(participant[i]);
                baseProgress = intermediateMarkers[checkpointIndex].progress;
                break;
            }
        }
        if (checkpointIndex === -1) {
            return {progress: 0, finished: false, speed: 0};
        }
    } else {
        return {progress: 0, finished: false, speed: 0};
    }
    const baseDistance = (baseProgress / 100) * totalDistance;
    const speed = usedTimeSeconds > 0 ? baseDistance / usedTimeSeconds : 0;

    const extraTime = Math.max(0, elapsedTime - usedTimeSeconds);
    const currentDistance = baseDistance + speed * (extraTime);
    const progress = Math.min(100, (currentDistance / totalDistance) * 100);
    return {progress, finished: progress >= 100, speed: speed};
};
