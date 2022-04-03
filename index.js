const { v2, auth } = require('osu-api-extended');

class Score {
    constructor(score_id, pp, mods) {
        this.score_id = score_id;
        this.pp = pp;
        this.mods = mods;
        this.layerType = null;
        this.uniqueness = null;
    }

    getUniqueness(layer) {
        const layerPP = layer.average;
        const scorePP = Math.round(this.pp);

        const uniqueness = Math.round((scorePP / (layerPP-(layerPP/10))) * 100 - 100)
        this.uniqueness = uniqueness;
        return uniqueness;
    }

    setLayerType(type) {
        this.layerType = type;
    }
}

class Layer {
    constructor(type) {
        this.type = type;
        this.mods = null;
        this.stdev = null;
        this.percentile = null;
        this.average = null;
        this.scores = [];
    }

    addScore(score) {
        if (!(score instanceof Score)) return;
        return this.scores.push(score);
    }

    removeScore(score_id) {
        this.scores = this.scores.filter(score => score.score_id != score_id);
    }

    async getMods() {
        if (this.mods) return this.mods;
        const modLayer1 = [['DT', 'HR'], ['NC', 'HR'], ['HD', 'DT', 'HR'], ['HD', 'NC', 'HR'], ['DT', 'HR', 'FL'], ['NC', 'HR', 'FL'], ['DT', 'HR', 'NF'], ['NC', 'HR', 'NF'], ['HD', 'DT', 'HR', 'FL'], ['HD', 'NC', 'HR', 'FL'], ['HD', 'DT', 'HR', 'NF'], ['HD', 'NC', 'HR', 'NF']];
        const modLayer2 = [['FL'], ['FL', 'HD'], ['FL', 'HR'], ['FL', 'DT'], ['FL', 'NC'], ['FL', 'HD', 'DT'], ['FL', 'HD', 'NC'], ['FL', 'HD', 'HR'], ['EZ', 'FL'], ['EZ', 'HD', 'FL']];
        const modLayer3 = [['EZ'], ['EZ', 'HD'], ['EZ', 'DT'], ['EZ', 'NC'], ['EZ', 'HD', 'DT'], ['EZ', 'HD', 'NC']];
        const modLayer4 = [['DT'], ['NC'], ['DT', 'HD'], ['NC', 'HD'], ['DT', 'NF'], ['NC', 'NF'], ['HD', 'DT', 'NF'], ['HD', 'NC', 'NF']];
        const modLayer5 = [['HR'], ['HD', 'HR'], ['NF', 'HR'], ['HR', 'SO'], ['HR', 'SD'], ['HR', 'PF'], ['NF', 'HD', 'HR'], ['NF', 'SO', 'HR']];
        const modLayer6 = [['HD'], ['HD', 'NF'], ['HD', 'SO'], ['HD', 'SD'], ['HD', 'PF'], ['HD', 'SO', 'NF']];
        const modLayer7 = [['HT'], ['HT', 'HD'], ['HT', 'HR'], ['HT', 'EZ'], ['HT', 'FL'], ['HT', 'NF']];
        const modLayer8 = [['NM'], ['NF'], ['SO'], ['SD'], ['PF'], ['NF', 'SO']];
        await this.type == 'layer1' ? this.mods = modLayer1 : null;
        await this.type == 'layer2' ? this.mods = modLayer2 : null;
        await this.type == 'layer3' ? this.mods = modLayer3 : null;
        await this.type == 'layer4' ? this.mods = modLayer4 : null;
        await this.type == 'layer5' ? this.mods = modLayer5 : null;
        await this.type == 'layer6' ? this.mods = modLayer6 : null;
        await this.type == 'layer7' ? this.mods = modLayer7 : null;
        await this.type == 'layer8' ? this.mods = modLayer8 : null;
        return this.mods;
    }

    async getStdev() {
        if (this.stdev) return this.stdev;
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
        this.stdev = parseFloat(stdev.toFixed(1));
        if (!this.stdev) this.stdev = 0;
        return this.stdev;
    }

    async getPercentile() {
        if (this.percentile) return this.percentile;
        var stdev = this.stdev;
        var percentile = (2 / (Math.log10(0.6 * Math.pow(stdev, 0.2)))) - 8
        percentile < 2 ? percentile = 2 : null;
        percentile > 100 ? percentile = 100 : null;
        this.percentile = parseFloat(percentile.toFixed(0));
        return this.percentile;
    }

    async getAverage() {
        if (this.average) return this.average;
        const scores = this.scores;
        const pp_array = [];
        scores.forEach((score) => {
            pp_array.push(score.pp);
        })
        const average = pp_array => pp_array.reduce((a, b) => a + b, 0) / pp_array.length;
        this.average = Math.round(average(pp_array));
        !this.average ? this.average = 0 : null;
        return this.average;
    }

    getScores() {
        return this.scores;
    }

    async sortScores() {
        var sortedScores = (this.scores.sort((a, b) => a.pp - b.pp)).reverse();
        this.scores = sortedScores;
        return sortedScores;
    }

    async reduceScores(optionalRemove) {
        if (optionalRemove) {
            optionalRemove.forEach(remove_id => {
                this.removeScore(remove_id);
            });
        }
        var scores = this.scores;
        const length = scores.length;
        const percentile = await this.getPercentile();
        var reduceAmount = (percentile / 100) * length;
        reduceAmount < 1 ? reduceAmount = 1 : reduceAmount = Math.round(reduceAmount);
        reduceAmount > 20 ? reduceAmount = 20 : null;
        var reducedScores = [];
        for (let i = 0; i < reduceAmount; i++) {
            reducedScores.push(scores[i]);
        }
        if (reducedScores.length == 1 && !reducedScores[0]) {
            reducedScores = [];
        }
        this.scores = reducedScores;
        return this.scores;
    }
}

// exports
async function login(client_id, client_secret) {
    const p = new Promise((resolve, reject) => {
        auth.login(client_id, client_secret).then((res) => {
            if (res.access_token) {
                return resolve(v2);
            }
            return reject('Error: API login failed');
        })
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return reject(err);
        })
    })
}

// exports
async function login_lazer(login, password) {
    const p = new Promise((resolve, reject) => {
        auth.login_lazer(login, password).then((api) => {
            if (api.access_token) {
                return resolve(v2);
            }
            return reject('Error: API login via Lazer credentials failed');
        })
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return reject(err);
        })
    })
}

// local function (no exports)
function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

async function getLayerTypeFromMods(mods) {
    if (mods.includes('HR') && (mods.includes('DT') || mods.includes('NC'))) return 'layer1';
    if (mods.includes('FL') && !mods.includes('HT')) return 'layer2';
    if (mods.includes('EZ') && !mods.includes('HT')) return 'layer3';
    if (mods.includes('DT') || mods.includes('NC')) return 'layer4';
    if (mods.includes('HR') && !mods.includes('HT')) return 'layer5';
    if (mods.includes('HD') && !mods.includes('HT')) return 'layer6';
    if (mods.includes('HT')) return 'layer7';
    return 'layer8';
}

// local function (no exports)
async function getLeaderboard(api, beatmap_id, mods) {
    const p = new Promise((resolve, reject) => {
        api.beatmap.scores.all(beatmap_id, { mode: 'osu', mods: mods }).then((leaderboard) => {
            if (leaderboard.scores) {
                return resolve(leaderboard);
            }
            return reject('Error: Leaderboard parsing failed');
        });
    })

    return new Promise((resolve, reject) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return reject(err);
        })
    })
}

async function getScore(api, score_id) {
    const p = new Promise((resolve, reject) => {
        api.scores.score.get('osu', score_id).then((score) => {
            if (score.created_at) {
                return resolve(score);
            }
            return reject('Error: Score parsing failed');
        });
    })

    return new Promise((resolve, reject) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return reject(err);
        })
    })
}

async function createLayers() {
    let l1 = new Layer('layer1');
    await l1.getMods();
    let l2 = new Layer('layer2');
    await l2.getMods();
    let l3 = new Layer('layer3');
    await l3.getMods();
    let l4 = new Layer('layer4');
    await l4.getMods();
    let l5 = new Layer('layer5');
    await l5.getMods();
    let l6 = new Layer('layer6');
    await l6.getMods();
    let l7 = new Layer('layer7');
    await l7.getMods();
    let l8 = new Layer('layer8');
    await l8.getMods();

    var layers = [l1, l2, l3, l4, l5, l6, l7, l8];

    return layers;
}

async function fetchLeaderboards(layer, api, beatmap_id, throttling) {
    const p = new Promise(async (resolve) => {
        let allLb = [];
        const mods = layer.mods;
        for (const modCombo of mods) {
            await getLeaderboard(api, beatmap_id, modCombo).then((lb) => {
                for (const score of lb.scores) {
                    allLb.push(score);
                }
            }).catch((err) => {
                null;
            });
            msleep(throttling);
        }
        resolve(allLb);
    })

    const p2 = new Promise((resolve, reject) => {
        p.then((result) => {
            resolve(result);
        }).catch((err) => {
            reject(err);
        })
    })

    return new Promise((resolve) => {
        p.then(async (lb) => {
            for (const score of lb) {
                if (score) {
                    await layer.addScore(new Score(score.id, score.pp, score.mods))
                }
            }

            resolve(layer);
        }).catch((err) => {
            reject(err);
        })
    })
}

async function computeLayers(api, beatmap_id, throttling, optionalRemove) {
    var layers = await createLayers();
    var computedLayers = [];
    for (const layer of layers) {
        const l = await fetchLeaderboards(layer, api, beatmap_id, throttling);
        await l.sortScores();
        await l.getStdev();
        await l.getPercentile();
        await l.reduceScores(optionalRemove);
        await l.getAverage();
        
        computedLayers.push(l);
        msleep(1000);
    }
    return computedLayers;
}

async function getUniqueness(api, score_id, layers) {
    const score_data = await getScore(api, score_id);
    var score = new Score(score_data.id, score_data.pp, score_data.mods);
    const layerType = await getLayerTypeFromMods(score.mods);
    const layer = layers.filter(layer => layer.type == layerType);
    score.getUniqueness(layer[0]);
    score.setLayerType(layerType);
    return score;
}

module.exports = {
    login,
    login_lazer,
    computeLayers,
    getUniqueness
}
