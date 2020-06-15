const log4js = require('log4js');
const ehtask = require('./index');

const logger = log4js.getLogger('test');
logger.level = 'debug';

let q1 = ehtask.newQueue({
    name: 'q1',
    interval: 3000,
    worker: task => {
        let n = Math.floor(Math.random() * 10);
        if(n > 5) return Promise.reject('bomb');
        else return Promise.resolve();
    }
});

for(let i=0; i<5; i++) {
    q1.add({});
}

let q2 = ehtask.newQueue({
    name: 'q2',
    interval: 2000,
    worker: task => {
        let n = Math.floor(Math.random() * 10);
        if(n > 5) return Promise.reject('bomb');
        else return Promise.resolve();
    }
});

for(let i=0; i<3; i++) {
    q2.add({});
}
