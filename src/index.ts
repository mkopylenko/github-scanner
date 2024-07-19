import { ApolloServer, gql } from 'apollo-server';
import * as dotenv from 'dotenv';
import { IDataService } from './IDataService';
import { RepositoryService } from './RepositoryService';
import { GithubDataService } from './GithubDataService';

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
    getReposDetails(repoNames: [String!]!): [Repository]
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

    getReposDetails: async (_: any, { repoNames }: { repoNames: string[] }) => {
        try {
                return await repositoryService.getReposDetails(repoNames);
           
          } catch (error) {
            console.error(`Error fetching repository details:`, error);
            throw new Error(`Failed to fetch repository details`);
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
