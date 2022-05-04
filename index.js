const { v2, auth } = require('osu-api-extended');
const { get_percentile, get_uniqueness } = require('./uniqueness_maths')

// enum
const auth_error = "You are not authenticated";
const layer_types = {
    "DTHR": {
        "name": "DTHR",
        "modCombos": [['DT', 'HR'], ['HD', 'DT', 'HR'], ['DT', 'HR', 'FL'], ['DT', 'HR', 'NF'], ['HD', 'DT', 'HR', 'FL'], ['HD', 'DT', 'HR', 'NF']]
    },
    "FL": {
        "name": "FL",
        "modCombos": [['FL'], ['FL', 'HD'], ['FL', 'HR'], ['FL', 'DT'], ['FL', 'HD', 'DT'], ['FL', 'HD', 'HR'], ['EZ', 'FL'], ['EZ', 'HD', 'FL']]
    },
    "EZ": {
        "name": "EZ",
        "modCombos": [['EZ'], ['EZ', 'HD'], ['EZ', 'DT'], ['EZ', 'HD', 'DT']]
    },
    "DT": {
        "name": "DT",
        "modCombos": [['DT'], ['DT', 'HD'], ['DT', 'NF'], ['HD', 'DT', 'NF']]
    },
    "HR": {
        "name": "HR",
        "modCombos": [['HR'], ['HD', 'HR'], ['NF', 'HR'], ['HR', 'SO'], ['NF', 'HD', 'HR'], ['NF', 'SO', 'HR']]
    },
    "HD": {
        "name": "HD",
        "modCombos": [['HD'], ['HD', 'NF'], ['HD', 'SO'], ['HD', 'SO', 'NF']]
    },
    "HT": {
        "name": "HT",
        "modCombos": [['HT'], ['HT', 'HD'], ['HT', 'HR'], ['HT', 'EZ'], ['HT', 'FL'], ['HT', 'NF']]
    },
    "NM": {
        "name": "NM",
        "modCombos": [['NM'], ['NF'], ['SO'], ['NF', 'SO']]
    }
}

// utils
function get_layer_type(mods) {
    if (mods.includes('HR') && (mods.includes('DT') || mods.includes('NC'))) return layer_types.DTHR.name;
    if (mods.includes('FL') && !mods.includes('HT')) return layer_types.FL.name;
    if (mods.includes('EZ') && !mods.includes('HT')) return layer_types.EZ.name;
    if (mods.includes('DT') || mods.includes('NC')) return layer_types.DT.name;
    if (mods.includes('HR') && !mods.includes('HT')) return layer_types.HR.name;
    if (mods.includes('HD') && !mods.includes('HT')) return layer_types.HD.name;
    if (mods.includes('HT')) return layer_types.HT.name;
    return layer_types.NM.name;
}

async function fetch_lb(api, beatmap_id, mods) {
    const fetch_lb_promise = new Promise(async (resolve, reject) => {
        var lb = new Leaderboard();
        const data = await api.beatmap.scores.all(beatmap_id, { mods: mods });
        if (!data.scores) return reject(new Error("Unable to fetch leaderboard"));
        data.scores.forEach(score => {
            lb.addScore(new Score(score.id, score.pp, score.mods))
        });
        resolve(lb)
    })

    return new Promise((resolve) => {
        fetch_lb_promise.then((lb) => {
            resolve(lb);
        }).catch((err) => {
            console.error(err)
        })
    })
}

class Leaderboard {
    constructor() {
        this.scores = new Array();
        this.sorted = false;
    }

    addScore(score) {
        this.scores.push(score);
    }

    addLb(lb) {
        this.scores = this.scores.concat(lb.scores)
    }

    popScores(score_id_arr) {
        score_id_arr.forEach(score_id => {
            this.scores = this.scores.filter(score => score.score_id != score_id);
        });
    }

    sortScores() {
        const sortedScores = (this.scores.sort((a, b) => a.pp - b.pp)).reverse();
        this.scores = sortedScores;
        this.sorted = true;
    }

    // reduce scores to a limited amount (i, defaults to all), with optional ignored ids
    reduceScores({ i = this.scores.length, ignored_ids = [0] }) {
        (!this.sorted) ? this.sortScores() : null;
        this.popScores(ignored_ids);
        var reduced = new Array();
        for (var x = 0; x < i; x++) {
            reduced.push(this.scores[x])
        }
        this.scores = reduced;
    }

    get_pp_stdev() {
        var pp_array = [];
        var stdev;
        this.scores.forEach(score => {
            pp_array.push(score.pp);
        });
        if (pp_array.length == 0) return 0;

        var variance = 0;
        const sum = pp_array.reduce((acc, val) => acc + val);
        const { length: num } = pp_array;
        const median = sum / num;
        pp_array.forEach(num => {
            variance += ((num - median) * (num - median));
        });
        variance /= num;
        stdev = Math.sqrt(variance);
        stdev = parseFloat(stdev.toFixed(1));
        if (!stdev) stdev = 0;
        return stdev;
    }

    average() {
        const pp_array = [];
        this.scores.forEach((score) => {
            pp_array.push(score.pp);
        })
        const tempAvg = pp_array => pp_array.reduce((a, b) => a + b, 0) / pp_array.length;
        var average = Math.round(tempAvg(pp_array));
        if (!average) average = 0;
        return average;
    }
}

class Layer {
    constructor({ leaderboard, reducedLeaderboard, average, layer_type, layer_mods }) {
        this.leaderboard = leaderboard;
        this.reducedLeaderboard = reducedLeaderboard;
        this.average = average;
        this.layer_type = layer_type;
        this.layer_mods = layer_mods;
    }
}

class Score {
    constructor(score_id, pp, mods) {
        this.score_id = score_id;
        this.pp = pp;
        this.mods = mods;
    }
}

// exported class, contains all necessary methods for uniqueness-rating calculations

class UniquenessRequest {
    constructor(debug) {
        this.api = null;
        this.score = null;
        this.layer = null;
        this.uniqueness = null;
        this.authenticated = false;
        this.timestamp = (new Date()).toUTCString();
        this.outgoing_calls = 0;
        this.debug = debug;
        (typeof debug != "boolean") ? this.debug = false : null;
    }

    // authenticate the request using the osu-api-extended package for further api usage
    async auth(access_token = null) {
        (this.debug) ? console.time("Authentication") : null;
        const authPromise = new Promise(async (resolve, reject) => {
            // increment calls
            (access_token.length < 1000) ? reject(new Error("Invalid token")) : null;
            auth.set_token(access_token);
            auth.set_expire(86400);

            resolve();
        })

        return new Promise((resolve) => {
            authPromise.then(() => {
                this.api = v2;
                this.authenticated = true;
                this.increment_calls();
                (this.debug) ? console.timeEnd("Authentication") : null;
                resolve()
            }).catch((err) => {
                console.log("what")
                console.error(err);
                resolve()
            })
        })
    }

    async parseScore(score_id) {
        (this.debug) ? console.time("Fetching score_id " + score_id) : null;
        const parseScorePromise = new Promise(async (resolve, reject) => {
            if (!this.authenticated) return reject(new Error(auth_error));
            if (typeof score_id != "number") return reject(new TypeError("Parameter 'score_id' is NaN"))
            const data = await this.api.scores.score.get("osu", score_id);
            // increment calls
            if (!data.id) return reject(new Error("Cannot retrieve score data"))
            const scoreObject = new Score(data.id, data.pp, data.mods);
            const beatmap_id = data.beatmap.id;
            const layer_type = get_layer_type(data.mods);
            resolve({ scoreObject, layerParam: { beatmap_id, layer_type } })
        })
        return new Promise((resolve) => {
            parseScorePromise.then((parsed) => {
                this.score = parsed.scoreObject;
                this.increment_calls();
                (this.debug) ? console.timeEnd("Fetching score_id " + score_id) : null;
                resolve(parsed.layerParam);
            }).catch((err) => {
                console.error(err);
                resolve(null);
            })
        })
    }

    async parseBeatmap(beatmap_id, mods) {
        (this.debug) ? console.time("Fetching beatmap_id " + beatmap_id) : null;
        const parseBeatmapPromise = new Promise(async (resolve, reject) => {
            if (!this.authenticated) return reject(new Error(auth_error));
            if (typeof beatmap_id != "number") return reject(new TypeError("Parameter 'beatmap_id' is NaN"));
            if (typeof mods != "object") return reject(new TypeError("Parameter 'mods' is not an object"))
            const validityCheck = await this.api.beatmap.get(beatmap_id);
            // increment calls
            if (!validityCheck.id) return reject(new Error("Cannot retrieve beatmap data"))
            const layer_type = get_layer_type(mods);
            resolve({ layerParam: { beatmap_id, layer_type } })
        })

        return new Promise((resolve) => {
            parseBeatmapPromise.then((parsed) => {
                this.increment_calls();
                (this.debug) ? console.timeEnd("Fetching beatmap_id " + beatmap_id) : null;
                resolve(parsed.layerParam);
            }).catch((err) => {
                console.error(err);
                resolve();
            })
        })
    }

    // main method to compute a new Layer from beatmap_id and layer_type
    async calcLayer({ beatmap_id, layer_type }) {
        var ignored_ids = [];
        (this.debug) ? console.time("Total calcLayer") : null;
        // dont forget to catch wrong param
        const calcLayerPromise = new Promise(async (resolve, reject) => {
            if (!this.authenticated) return reject(new Error(auth_error));
            if (!beatmap_id) return reject(new Error("Empty beatmap_id"))
            if (this.score) ignored_ids.push(this.score.score_id);

            var layer_mods = [];
            for (const [type, entry] of Object.entries(layer_types)) {
                if (type == layer_type) layer_mods = entry.modCombos;
            }

            var combinedLb = new Leaderboard();
            for (const ix in layer_mods) {
                (this.debug) ? console.time("  Fetching " + layer_mods[ix]) : null;
                const lb = await fetch_lb(this.api, beatmap_id, layer_mods[ix]);
                (this.debug) ? console.timeEnd("  Fetching " + layer_mods[ix]) : null;
                // increment calls
                combinedLb.addLb(lb);
            }
            var leaderboard = new Leaderboard();
            leaderboard.addLb(combinedLb);

            combinedLb.sortScores();

            var percentile = get_percentile(combinedLb.get_pp_stdev());
            (percentile > leaderboard.scores.length) ? percentile = leaderboard.scores.length - 1 : null;

            combinedLb.reduceScores({ i: percentile, ignored_ids: ignored_ids })
            const reducedLeaderboard = combinedLb;

            const average = reducedLeaderboard.average();

            resolve(new Layer({ leaderboard, reducedLeaderboard, average, layer_type, layer_mods }))
        })

        return new Promise((resolve) => {
            calcLayerPromise.then((layer) => {
                (this.debug) ? console.timeEnd("Total calcLayer") : null;
                this.increment_calls(layer.layer_mods.length);
                this.layer = layer;
                resolve();
            }).catch((err) => {
                console.error(err);
                resolve();
            })
        })
    }

    async calcUniqueness() {
        (this.debug) ? console.time("calcUniqueness") : null;
        const calcUniquenessPromise = new Promise((resolve, reject) => {
            (!this.score) ? reject(new Error("No score to be calculated")) : null;
            (!this.layer) ? reject(new Error("No layer to be used for calculation")) : null;

            const layer_average = this.layer.average;
            const score_pp = this.score.pp;

            const uniqueness_value = get_uniqueness(layer_average, score_pp);
            (!uniqueness_value && uniqueness_value != 0) ? reject(new Error("Uniqueness calculation failed")) : null;

            var uniqueness = {
                layer_average,
                score_pp,
                uniqueness_value
            };

            resolve(uniqueness);
        })

        return new Promise((resolve) => {
            calcUniquenessPromise.then((uniqueness) => {
                (this.debug) ? console.timeEnd("calcUniqueness") : null;
                this.uniqueness = uniqueness;
                resolve();
            }).catch((err) => {
                console.error(err);
                resolve();
            })
        })
    }

    // tracking the number of outgoing osu!api calls for safety reasons
    async increment_calls(i = 1) {
        for (var x = 0; x < i; x++) {
            this.outgoing_calls++;
        }
    }
}

module.exports = {
    UniquenessRequest
}