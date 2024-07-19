import { AxiosResponse } from "axios";
import { IDataService } from "./IDataService";


export class RepositoryService {
    private dataService: IDataService;
    private readonly reposStartWith = process.env.REPOS_START_WITH ?? 'repo'
    private readonly CONCURRENCY_LIMIT =2
  
    constructor(dataService: IDataService) {
      this.dataService = dataService;
    }

    async fetchRepositores(): Promise<any>{
        const response = await this.dataService.getRepos();

        return response.data
            .filter((item: { name: string; }) =>item.name.startsWith(this.reposStartWith))
            .map((item: { name: string; size: number; owner: { login: string; }; }) => ({
                name: item.name,
                size: item.size,
                owner: item.owner.login 
            }));
    }

    async getReposDetails(repoNames: string[], concurrencyLimit: number =this.CONCURRENCY_LIMIT) {
      //const pLimit = await this.loadPLimit();
      //const limit = pLimit(concurrencyLimit);
    console.log(repoNames)
      const promises = repoNames.map(name => 
        this.repoDetails( name)) ;

    
      return Promise.all(promises);
    } 

    private async repoDetails(name: string) : Promise<any>{
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
           // ymlContent: contentsResponse.value.yamlContent, 
            webhooks: hooksResponse.value.data.map((hook: any) => hook.config.url)
          };
    
          return repoData;
        } else {
          this.handleErrors(repoResponse, contentsResponse, hooksResponse);
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

    private async loadPLimit() {
      const pLimitModule = await import('p-limit');
      return pLimitModule.default; // p-limit exports the default function
    }
}