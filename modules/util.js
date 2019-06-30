const fetch = require('node-fetch');

module.exports.playFile = (voiceChannel, path, volumeString, leaveOnEnd = true) => {
    let volume = 1;
    const parsed = parseFloat(volumeString, 10);
    if (parsed && parsed > 0 && parsed < 20) volume = parsed;
    return new Promise((res) => {
        voiceChannel.join().then(connection => {
            const dispatcher = connection.play(path, {
                volume: volume,
            });
            dispatcher.on('end', () => {
                if (leaveOnEnd) voiceChannel.leave();
                res();
            });
        });
    });
};

module.exports.dbl = class VoteRequest {
    constructor(base, authentication) {
        Object.defineProperty(this, 'auth', {
            value: authentication,
        });
        this.baseurl = base;
    }

    hasVoted(userID) {
        return this._request('/hasVoted', userID);
    }

    getVotedTime(userID) {
        return this._request('/getVotedTime', userID);
    }

    _request(endpoint, userID) {
        return fetch(this.baseurl + endpoint, {
            headers: {
                'authorization': this.auth,
                'userid': userID,
            },
        }).then((res, error) => {
            if (error) {
                throw error;
            }
            if (!res.ok) {
                throw new Error('Haruna_API_ERROR: Response received is not ok.');
            }
            if (res.status !== 200) {
                throw new Error(`Haruna_API_ERROR: ${res.status}: ${res.body}`);
            }
            return res.json();
        });
    }
};