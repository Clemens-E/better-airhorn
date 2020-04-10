FROM node
COPY ./src ./.env ./.snyk ./package.json ./tsconfig.json /bot/
RUN cd /bot/
RUN ["npm", "install"]
RUN ["cd", "dist"]
CMD ["node", "index.js"]