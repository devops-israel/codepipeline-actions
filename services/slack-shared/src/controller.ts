const axios = require('axios');
export async function promisePost(url: string, post_body: any, headers: any) {
    return new Promise(function(resolve, reject) {
        const options = {
            method: 'POST',
            headers: headers,
            data: post_body,
            url,
        };
        axios(options)
            .then(function(response: any) {
                resolve(response);
            })
            .catch(function(err: any) {
                reject(err);
            });
    });
}

export async function promiseGet(url: string, headers: any) {
    return new Promise(function(resolve, reject) {
        const options = {
            method: 'GET',
            headers: headers,
            url,
        };
        axios(options)
            .then(function(response: any) {
                resolve(response);
            })
            .catch(function(err: any) {
                reject(err);
            });
    });
}
export function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
