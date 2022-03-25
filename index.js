const { v2, auth } = require('osu-api-extended');

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
async function getPPStDevFromLeaderboard(leaderboard) {
    const ans = new Promise(async (resolve, reject) => {
        if (!leaderboard.scores || leaderboard.scores.length === 0) return reject('Error: Invalid leaderboard');
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

    var stdev = await ans.then((result) => {
        return result;
    }).catch((err) => {
        console.error(err);
    })

    return stdev;
}

async function getPPStDevFromUserList(user_list) {
    // TODO
}

async function getUserListFromLeaderboard(leaderboard) {
    // TODO
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

// local function (no exports)
async function getLeaderboard(api, beatmap_id, mods) {
    v2.beatmap.scores.all()
    const p = new Promise(async (resolve, reject) => {
        if (mods) {
            await api.me.data('osu').then((auth_type) => {
                if (auth_type.authentication === 'basic' || !auth_type.is_supporter) {
                    console.warn(`Warning: Login must be done via login_lazer and supporter account credentials if you wish to use mod filters: Ignoring mod filters '${mods}'`)
                    mods = null;
                }
            })
        }
        api.beatmap.scores.all(beatmap_id, { mode: 'osu', mods: mods }).then((leaderboard) => {
            if (leaderboard.scores) {
                return resolve(leaderboard);
            }
            return reject('Error: Leaderboard parsing failed');
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

// login('', '').then(async (api) => {
//     const lb = await getLeaderboard(api, 714001, null);
//     const stdev = await getPPStDevFromLeaderboard([]);
// });


module.exports = login, login_lazer, getPPStDevFromLeaderboard, getPPStDevFromUserList;