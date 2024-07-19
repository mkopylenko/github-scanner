import axios from 'axios';
import { IDataService } from './IDataService';

export class GithubDataService implements IDataService {

    private readonly githubToken = process.env.GITHUB_TOKEN;
    private readonly githubUsername = process.env.GITHUB_USERNAME;
    private readonly baseGithubUrl = process.env.BASE_GITHUB_URL ?? 'https://api.github.com'
    private readonly githubRepoUrl = `${this.baseGithubUrl}/repos/${this.githubUsername}`;
    private readonly githubRequestHeaders ={
        headers: { Authorization: `token ${this.githubToken}` }
    }

    async getRepos(): Promise<any> {
        const url = `${this.baseGithubUrl}/users/${this.githubUsername}/repos`;
        console.log(`Quering repositories list: ${url}`)
        return await axios.get(url, this.githubRequestHeaders);
      }
  
    async getRepo(name: string): Promise<any> {
      return axios.get(`${this.githubRepoUrl}/${name}`, this.githubRequestHeaders);
    }
  
    async getContents(name: string): Promise<any> {
      return await this.getFilesCountAndYamlContent(name)
    }
  
    async getHooks(name: string): Promise<any> {
      return axios.get(`${this.githubRepoUrl}/${name}/hooks`, this.githubRequestHeaders);
    }
  
    private async getYmlContent(url: string): Promise<any> {
      return axios.get(url);
    }

    private async getTreeRecursively(sha: string, name : string): Promise<any[]> {
        const response = await axios.get(`${this.githubRepoUrl}/${name}/git/trees/${sha}?recursive=1`,this.githubRequestHeaders);
        return response.data.tree;
    }
    
    private async getBranchSha(name: string): Promise<string> {
        const response = await axios.get(`${this.githubRepoUrl}/${name}/branches/main`,this.githubRequestHeaders);
        return response.data.commit.sha;
    }

    async getDownloadableUrl(name: string, path: string): Promise<string | null> {
        const response = await axios.get(`${this.githubRepoUrl}/${name}/contents/${path}`,this.githubRequestHeaders);
        return response.data.download_url;
    }

    private async getFilesCountAndYamlContent(name: string): Promise<any> {
        const branchSha = await this.getBranchSha(name);
        const tree = await this.getTreeRecursively(branchSha, name);
        const allFiles = tree.filter((item: { type: string; }) =>item.type === 'blob')
        const ymlFiles = tree.filter((item: { path: string; }) =>item.path.endsWith('.yaml'));
        let yamlContent = 'No YML file found';
        if (ymlFiles && ymlFiles.length >0){
          const url = await this.getDownloadableUrl(name, ymlFiles[0].path);
          if (url){
             yamlContent = await this.getYmlContent(url);
          }
       }
       return {totalFileCount: allFiles.length, yamlContent: yamlContent}
    }

    
  }
  