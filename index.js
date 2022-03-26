const { v2, auth } = require('osu-api-extended');

class Beatmap {
    constructor(beatmap) {
        this.id = beatmap?.id;
        this.full_title = `${beatmap?.beatmapset?.artist} - ${beatmap?.beatmapset?.title_unicode} [${beatmap?.version}]`;
        this.creator = beatmap?.beatmapset.creator;
        this.playcount = beatmap?.playcount;
    }
}

class Data {
    constructor() {
        this.mapStdev = null;
        this.userStdev = null;
        this.lbLevel = null;
        this.mapCoef = null;
        this.userCoef = null;
        this.lbCoef = null;
        this.finalCoef = null;
    }

    updateData(leaderboard) {
        const p = new Promise(async (resolve, reject) => {
            if (leaderboard instanceof Leaderboard) {
                this.mapStdev = await getMapStDevFromLeaderboard(leaderboard);
                this.userStdev = await getUserPPStDevFromLeaderboard(leaderboard);
                this.lbLevel = await getUserMedianPPFromLeaderboard(leaderboard);
                this.mapCoef = await getMapCoefFromMapStdev(this.mapStdev);
                this.userCoef = await getUserCoefFromUserStdev(this.userStdev);
                this.lbCoef = await getLbCoefFromLbLevel(this.lbLevel);
                this.finalCoef = this.mapCoef * (0.5 * this.userCoef) * this.lbCoef;
                return resolve(this);
            }
            return reject('Error: Invalid leaderboard')
        })

        return new Promise((resolve) => {
            p.then(() => {
                return resolve(this);
            }).catch((err) => {
                return console.error(err);
            })
        })
    }
}

class Score {
    constructor(score_id, user_id, pp, user_pp, mods) {
        this.score_id = score_id;
        this.user_id = user_id;
        this.pp = pp;
        this.user_pp = user_pp;
        this.mods = mods;
        this.UNR = null;
    }

    setUNR(UNR) {
        this.UNR = UNR;
    }
}

class Leaderboard {
    constructor() {
        this.beatmap = null;
        this.scores = [];
        this.data = null;
    }

    setBeatmap(beatmap) {
        const p = new Promise((resolve, reject) => {
            if (beatmap instanceof Beatmap) return resolve(this.beatmap = beatmap);
            return reject('Error: Invalid beatmap')
        })

        return new Promise((resolve) => {
            p.then(() => {
                return resolve(this);
            }).catch((err) => {
                return console.error(err);
            })
        })
    }

    setData(data) {
        const p = new Promise((resolve, reject) => {
            if (data instanceof Beatmap) return resolve(this.beatmap = beatmap);
            return reject('Error: Invalid beatmap')
        })

        return new Promise((resolve) => {
            p.then(() => {
                return resolve(this);
            }).catch((err) => {
                return console.error(err);
            })
        })
    }

    addScore(score) {
        const p = new Promise((resolve, reject) => {
            if (score instanceof Score) return resolve(this.scores.push(score));
            return reject('Error: Invalid score')
        })

        return new Promise((resolve) => {
            p.then(() => {
                return resolve(this);
            }).catch((err) => {
                return console.error(err);
            })
        })
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
            return console.error(err);
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
            return console.error(err);
        })
    })
}

// exports
async function getMapStDevFromLeaderboard(leaderboard) {
    const p = new Promise(async (resolve, reject) => {
        if (!leaderboard instanceof Leaderboard) return reject('Error: Invalid leaderboard');
        var pp_array = [];
        await leaderboard.scores.forEach(score => {
            pp_array.push(score.pp);
        });

        const sum = pp_array.reduce((acc, val) => acc + val);
        const { length: num } = pp_array;
        const median = sum / num;
        let variance = 0;
        pp_array.forEach(num => {
            variance += ((num - median) * (num - median));
        });
        variance /= num;
        const stdev = Math.sqrt(variance);
        return resolve(stdev);
    })

    var stdev = await p.then((result) => {
        return result;
    }).catch((err) => {
        console.error(err);
    })

    return stdev;
}

async function getUserPPStDevFromLeaderboard(leaderboard) {
    const p = new Promise(async (resolve, reject) => {
        if (!leaderboard instanceof Leaderboard) return reject('Error: Invalid leaderboard');
        var pp_array = [];
        await leaderboard.scores.forEach(score => {
            pp_array.push(score.user_pp);
        });

        const sum = pp_array.reduce((acc, val) => acc + val);
        const { length: num } = pp_array;
        const median = sum / num;
        let variance = 0;
        pp_array.forEach(num => {
            variance += ((num - median) * (num - median));
        });
        variance /= num;
        const stdev = Math.sqrt(variance);
        return resolve(stdev);
    })

    var stdev = await p.then((result) => {
        return result;
    }).catch((err) => {
        console.error(err);
    })

    return stdev;
}

async function getUserMedianPPFromLeaderboard(leaderboard) {
    const p = new Promise(async (resolve, reject) => {
        if (!leaderboard instanceof Leaderboard) return reject('Error: Invalid leaderboard');
        var pp_array = [];
        await leaderboard.scores.forEach(score => {
            pp_array.push(score.user_pp);
        });

        const sum = pp_array.reduce((acc, val) => acc + val);
        const { length: num } = pp_array;
        const median = sum / num;
        return resolve(median);
    })

    var median = await p.then((result) => {
        return result;
    }).catch((err) => {
        console.error(err);
    })

    return median;
}

async function getMapCoefFromMapStdev(mapStdev) {
    return 1.7 / Math.log10(mapStdev);
}

async function getUserCoefFromUserStdev(userStdev) {
    return 2.3 / Math.log10(userStdev);
}

async function getLbCoefFromLbLevel(lbLevel) {
    return Math.log2(lbLevel) - 12;
}

// local function (no exports)
function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}


// local function (no exports)
async function getScore(api, score_id) {
    const p = new Promise((resolve, reject) => {
        api.scores.score.get('osu', score_id).then((score) => {
            if (score.created_at) {
                return resolve(score);
            }
            return reject('Error: Score parsing failed');
        });
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return console.error(err);
        })
    })
}

// local function (no exports)
async function getBeatmap(api, beatmap_id) {
    const p = new Promise((resolve, reject) => {
        api.beatmap.get(beatmap_id).then((beatmap) => {
            if (beatmap.last_updated) {
                return resolve(beatmap);
            }
            return reject('Error: Beatmap parsing failed');
        });
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return console.error(err);
        })
    })
}

// exports
async function getLeaderboard(api, beatmap_id, mods, api_throttling) {
    const p = new Promise(async (resolve, reject) => {
        console.clear();
        console.log(`Fetching leaderboard...`);
        if (mods) {
            await api.me.data('osu').then((auth_type) => {
                if (auth_type.authentication === 'basic' || !auth_type.is_supporter) {
                    console.warn(`Warning: Login must be done via login_lazer and supporter account credentials if you wish to use mod filters: Ignoring mod filters '${mods}'`);
                    mods = null;
                }
            })
        }
        api.beatmap.scores.all(beatmap_id, { mode: 'osu', mods: mods }).then(async (leaderboard) => {
            console.clear();
            if (!leaderboard.scores) return reject('Error: Leaderboard parsing failed');
            const pleaderboard = new Promise(async (resolve) => {
                console.log(`Fetching leaderboard users... (API Throttling: ${api_throttling}ms)`);
                var l = new Leaderboard();
                leaderboard?.scores?.forEach(async score => {
                    await getUser(api, score.user?.id).then((user) => {
                        l.addScore(new Score(score.id, score.user.id, score.pp, user.statistics.pp, score.mods));
                        console.log([l.scores.length, leaderboard.scores.length]);
                        msleep(api_throttling);
                    })
                    if (l.scores.length == leaderboard.scores.length) return resolve(l);
                })
            })
            l = await pleaderboard;
            console.clear();

            const pbeatmap = new Promise(async (resolve) => {
                console.log(`Fetching beatmap...`);
                await getBeatmap(api, beatmap_id).then(async (beatmap_data) => {
                    await l.setBeatmap(new Beatmap(beatmap_data));
                    return resolve(await l);
                })
            })
            l = await pbeatmap;
            console.clear();

            const pdata = new Promise(async (resolve) => {
                console.log(`Calculating...`);
                var d = new Data();
                await d.updateData(l).then((result) => {
                    return resolve(result)
                })
            })
            l = await pdata;
            console.clear();

            return resolve(l);
        });
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return console.error(err);
        })
    })
}

// local function (no exports)
async function getUser(api, user_id) {
    const p = new Promise((resolve, reject) => {
        api.user.get(user_id, 'osu', 'id').then((user) => {
            if (!user.is_restricted) {
                return resolve(user);
            }
            return reject('Error: User parsing failed');
        });
    })

    return new Promise((resolve) => {
        p.then((result) => {
            return resolve(result);
        }).catch((err) => {
            return console.error(err);
        })
    })
}

login('', '').then(async (api) => {
    const lb = await getLeaderboard(api, 714001, null, 500);
    console.log(await lb);
});



module.exports = login, login_lazer, getMapStDevFromLeaderboard, getUserPPStDevFromLeaderboard;