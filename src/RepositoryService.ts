import { AxiosResponse } from "axios";
import { IDataService } from "./IDataService";
import NodeCache from "node-cache";


export class RepositoryService {
    private dataService: IDataService;
    private readonly reposStartWith = process.env.REPOS_START_WITH ?? 'repo'
    private readonly userName = process.env.GITHUB_USERNAME;
    private readonly CONCURRENCY_LIMIT = 2
    private readonly cache = new NodeCache();
    private readonly CACHE_TTL_SEC = 30;
  
    constructor(dataService: IDataService) {
      this.dataService = dataService;
    }

    async fetchRepositores(): Promise<any>{
        const cacheKey = `list_repos_github_${this.userName}_${this.reposStartWith}`;
        const resultFromCache = this.cache.get(cacheKey);
        if (resultFromCache) {
          console.log(`Got fetchRepositores results from cache, key: ${cacheKey}`)
          return resultFromCache
        }
        const response = await this.dataService.getRepos();
        const result = response.data
            .filter((item: { name: string; }) =>item.name.startsWith(this.reposStartWith))
            .map((item: { name: string; size: number; owner: { login: string; }; }) => ({
                name: item.name,
                size: item.size,
                owner: item.owner.login 
            }));
        this.cache.set(cacheKey, result, this.CACHE_TTL_SEC)
        return result;
    }

    async getReposDetails(repoNames: string[], concurrencyLimit: number =this.CONCURRENCY_LIMIT) {
      repoNames.sort((a, b) => a.localeCompare(b));
      const reponamesString = repoNames.join();
      const cacheKey = `list_repos_details_github_${this.userName}_${reponamesString}`;
      const resultFromCache = this.cache.get(cacheKey);
      if (resultFromCache) {
          console.log(`Got getReposDetails results from cache, key: ${cacheKey}`)
          return resultFromCache
      }
      
      const results: any[] = []; 
      const chunks: string[][] = []; 

  
      for (let i = 0; i < repoNames.length; i += concurrencyLimit) {
        chunks.push(repoNames.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(name => this.repoDetails(name));

        try {
            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults); 
          } catch (error) {
            console.error('Error processing chunk:', error);
            throw error;
          }
        }
        this.cache.set(cacheKey, results, this.CACHE_TTL_SEC)
        return results;
    } 

    private async repoDetails(name: string) : Promise<any>{
      try{
        const repoPromise = await this.dataService.getRepo(name);
        const contentsPromise = await this.dataService.getContents(name);
        const hooksPromise = await this.dataService.getHooks(name);
   

        const [repoResponse, contentsResponse, hooksResponse] = await Promise.allSettled([
          repoPromise,
          contentsPromise,
          hooksPromise
        ]);

        if (repoResponse.status === 'fulfilled' && 
            contentsResponse.status === 'fulfilled' && 
            hooksResponse.status === 'fulfilled') {

          const repoData = {
            name: repoResponse.value.data.name,
            size: repoResponse.value.data.size,
            owner: repoResponse.value.data.owner.login,
            isPrivate: repoResponse.value.data.private,
            numberOfFiles: contentsResponse.value.totalFileCount,
            ymlContent: contentsResponse.value.yamlContent, 
            webhooks: hooksResponse.value.data.map((hook: any) => hook.config.url)
          };
    
          return repoData;
        } else {
          this.handleErrors(repoResponse, contentsResponse, hooksResponse);
        }
      } catch(error){
        throw new Error('Failed to fetch all repository details');
      }
    }

    private  handleErrors(repoResponse: PromiseFulfilledResult<AxiosResponse<any,any>>|PromiseRejectedResult, 
        contentsResponse: PromiseFulfilledResult<AxiosResponse<any,any>>|PromiseRejectedResult, 
        hooksResponse: PromiseFulfilledResult<AxiosResponse<any,any>>|PromiseRejectedResult) {
        const errors = [
            repoResponse.status === 'rejected' ? repoResponse.reason : null,
            contentsResponse.status === 'rejected' ? contentsResponse.reason : null,
            hooksResponse.status === 'rejected' ? hooksResponse.reason : null
        ].filter(Boolean);

        console.error('One or more requests failed:', errors);
        throw new Error('Failed to fetch all repository details');
    }
}