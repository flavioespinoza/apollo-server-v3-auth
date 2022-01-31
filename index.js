require('dotenv').config();

const log = require('ololog');
const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const MONGODB = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@apolloserverv3auth.eiiti.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

mongoose
  .connect(MONGODB, { useNewUrlParser: true })
  .then(() => {
    console.log('MongoDB Connected');
    return server.listen({ port: 5000 });
  })
  .then((res) => {
    log.blue(`Server is listening on: ${res.url}`);
  }).catch((error) => {
    throw new Error(error);
  });
