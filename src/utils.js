export function parseData(data) {
    data.forEach(d => {
        const {volumefrom, volumeto} = d;

        d.date = new Date(d.time);

        d.close = +d.close;
        d.open = +d.open;

        d.high = +d.high;
        d.low = +d.low;

        d.volume = Math.abs(volumefrom - volumeto);
    });

    return data;
}
