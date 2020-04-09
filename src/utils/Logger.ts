import log from 'js-logger';
log.useDefaults();
log.setLevel(log[(process.env.LOGGING ?? 'INFO').toUpperCase()]);

export const logger = log;
