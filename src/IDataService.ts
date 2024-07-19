export interface IDataService {
    getRepos(): Promise<any>;
    getRepo(name: string): Promise<any>;
    getContents(name: string): Promise<any>;
    getHooks(name: string): Promise<any>;
  }
  