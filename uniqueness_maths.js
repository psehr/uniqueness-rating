function get_percentile(pp_stdev) {
    var percentile = (2 / (Math.log10(0.6 * Math.pow(pp_stdev, 0.2)))) - 8
    percentile < 2 ? percentile = 2 : null;
    percentile > 100 ? percentile = 100 : null;
    percentile = parseFloat(percentile.toFixed(0));
    return percentile;
}

function get_uniqueness(layer_average, score_pp) {
    (layer_average == 0) ? layer_average = Math.pow(1, -20) : null;
    var x = Math.round(score_pp) / Math.round(layer_average);
    var uniqueness = (2.611 * Math.sqrt(Math.pow(x, 2))) / x + (62 * Math.atan(x));
    return parseFloat(uniqueness.toFixed(2));
}

module.exports = { get_percentile, get_uniqueness }