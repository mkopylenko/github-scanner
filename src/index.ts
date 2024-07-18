import { ApolloServer, gql } from 'apollo-server';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { GithubDataService } from './GitHubDataService';
import { IDataService } from './IDataService';
import { RepositoryService } from './RepositoryService';

dotenv.config();

const PORT = process.env.PORT ?? 4000;

const typeDefs = gql`
  type Repository {
    name: String
    size: Int
    owner: String
    isPrivate: Boolean
    numberOfFiles: Int
    ymlContent: String
    webhooks: [String]
  }

  type Query {
    listRepositories: [Repository]
    repoDetails(name: String!): Repository
  }
`;
const dataService: IDataService = new GithubDataService()
const repositoryService : RepositoryService = new RepositoryService(dataService)   
const resolvers = {
  Query: {
    listRepositories: async () => {
      try{  
            return await repositoryService.fetchRepositores();
        } catch(error) {
            console.error('Error fetching repositories:', error);
            throw new Error('Failed to fetch repositories');
        }
    },

    repoDetails: async (_: any, { name }: { name: string }) => {
        try {
                return await repositoryService.repoDetails(name);
           
          } catch (error) {
            console.error(`Error fetching repository details (repository name: ${name}):`, error);
            throw new Error(`Failed to fetch repository details (repository name: ${name})`);
          }

       
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen({ port: PORT }).then(({ url }) => {
    console.log(`Server ready at ${url}`);
  });
