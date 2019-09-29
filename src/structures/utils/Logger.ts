import log from 'js-logger';
log.useDefaults();
if (process.env.NODE_ENV === 'production') log.setLevel(log.WARN);

export const logger = log;