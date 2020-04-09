import fileSize from 'filesize-parser';

export const Config = {

  files: {

    maxFileSize: fileSize('50MB'),
    minIOBucketName: 'better-airhorn-audio-files',
    cacheDirectory: `${__dirname}../../../file_cache`,
    workingDirectory: `${__dirname}../../../working_files`,

  },

  general: {

    prefix: '$',
    ownerIds: ['196214245770133504'],

  },

  colors: {

    neutral: '226764',

  },

  credentials: {

    postgresql: {
      url: process.env.PG,
    },

    discord: {
      token: process.env.DISCORD_TOKEN,
    },

    minio: {
      accessKey: process.env.MINIO_AK,
      secretKey: process.env.MINIO_SK,
      url: process.env.MINIO_URL,
    },

  },

  caching: {
    GuildSettingsCacheDuration: 10 * 1000,
  },

};
