const log4js = require('log4js');

const logger = log4js.getLogger('ehtask');
logger.level = 'debug';

const queue = {
    TASKID: 1,
    // queue name
    QUEUENAME: 'queue',
    // worker timer
    TMRWORKER: null,
    // worker timer interval
    TMRWORKERINT: 5000,
    // worker status
    WORKERISBUSY: false,
    // set task fail after retry MAXRETRY times
    MAXRETRY: 3,
    // task execute
    WORKER: function(task) {
        logger.info(`${this.QUEUENAME} task ${task.id} finish`);
        return Promise.resolve();
    },
    // add task
    add: async function(task) {
        let t = {};
        Object.assign(t, task);
        Object.assign(t, {
            id: this.TASKID++,
            createTime: new Date(),
            retry: 0
        });
        logger.info(`${this.QUEUENAME} new task ${JSON.stringify(t)}`);
        this.TASKS.push(t);
        return t;
    },
    // execute a task
    doTask: async function() {
        //logger.info(`task length ${TASKS.length}`);
        if(this.TASKS.length > 0) {
            let task = this.TASKS.shift();
            Object.assign(task, { processTime: new Date() });
            try {
                await this.WORKER(task);
                logger.info(`${this.QUEUENAME} ${task.id} success`);
                this.SUCCTASKS.push(task);
                return task;
            } catch(err) {
                //logger.error(err);
                task.retry = task.retry + 1;
                if(task.retry >= this.MAXRETRY) {
                    this.FAILTASKS.push(task);
                } else {
                    logger.info(`${this.QUEUENAME} ${task.id} retry ${task.retry}`);
                    this.TASKS.push(task);
                }
                return task
            }
        } else {
            //logger.info('no task to do');
            return null;
        }
    },
    // stop queue
    stop: function() {
        if(this.TMRWORKER) clearInterval(this.TMRWORKER);
        this.TMRWORKER = null;
    },
    // start
    start: function(conf) {
        this.TASKS = [];
        this.SUCCTASKS = [];
        this.FAILTASKS = [];
        if(conf.name) this.QUEUENAME = conf.name;
        if(conf.interval) this.TMRWORKERINT = conf.interval;
        if(conf.worker) this.WORKER = conf.worker;
        this.TMRWORKER = setInterval(() => {
            if(this.WORKERISBUSY) {
                //logger.info('worker is busy');
                return;
            }
            this.WORKERISBUSY = true;
            this.doTask().then(() => {
                this.WORKERISBUSY = false;
            }, err => {
                logger.error(err);
                logger.error('worker leave');
                if(this.TMRWORKER) clearInterval(this.TMRWORKER);
                this.TMRWORKER = null;
            });
        }, this.TMRWORKERINT);
    },
}

function newQueue(conf) {
    let q = Object.create(queue);
    q.start(conf);
    return q;
}

module.exports = { newQueue }