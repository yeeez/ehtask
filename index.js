const log4js = require('log4js');

let TASKS = [];
let SUCCTASKS = [];
let FAILTASKS = [];
let TASKID = 1;

const logger = log4js.getLogger('ehtask');
logger.level = 'debug';

// worker timer
let TMRWORKER = null;
// worker timer interval
let TMRWORKERINT = 5000;
// worker status
let WORKERISBUSY = false;
// set task fail after retry MAXRETRY times
let MAXRETRY = 3;
// task execute
let WORKER = task => {
    logger.info(`task ${task.id} finish`);
    return Promise.resolve();
}

// add task
const add = async task => {
    let t = {};
    Object.assign(t, task);
    Object.assign(t, {
        id: TASKID++,
        createTime: new Date(),
        retry: 0
    });
    logger.info(`new task ${JSON.stringify(t)}`);
    TASKS.push(t);
    return t;
}

// execute a task
const doTask = async () => {
    //logger.info(`task length ${TASKS.length}`);
    if(TASKS.length > 0) {
        let task = TASKS.shift();
        Object.assign(task, { processTime: new Date() });
        try {
            await WORKER(task);
            SUCCTASKS.push(task);
            return task;
        } catch(err) {
            logger.error(err);
            task.retry = task.retry + 1;
            if(task.retry >= MAXRETRY) {
                FAILTASKS.push(task);
            } else {
                logger.info(`task ${task.id} retry ${task.retry}`);
                TASKS.push(task);
            }
            return task
        }
    } else {
        //logger.info('no task to do');
        return null;
    }
}

// start process
const start = conf => {
    if(conf) {
        if(conf.interval) TMRWORKERINT = conf.interval;
        if(conf.worker) WORKER = conf.worker;
    }
    TMRWORKER = setInterval(() => {
        if(WORKERISBUSY) {
            //logger.info('worker is busy');
            return;
        }
        WORKERISBUSY = true;
        doTask().then(() => {
            WORKERISBUSY = false;
        }, err => {
            logger.error(err);
            logger.error('worker leave');
            if(TMRWORKER) clearInterval(TMRWORKER);
            TMRWORKER = null;
        });
    }, TMRWORKERINT);
}

// stop queue
const stop = () => {
    if(TMRWORKER) clearInterval(TMRWORKER);
    TMRWORKER = null;
}

module.exports = {
    // 添加一个任务
    add,
    // 任务执行进程控制
    start, stop,
}