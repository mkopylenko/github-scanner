import axios from 'axios';
import { IDataService } from './IDataService';

export class GithubDataService implements IDataService {
    private readonly githubToken = process.env.GITHUB_TOKEN;
    private readonly githubUsername = process.env.GITHUB_USERNAME;
    private readonly baseGithubUrl = process.env.BASE_GITHUB_URL ?? 'https://api.github.com'
    private readonly githubRepoUrl = `${this.baseGithubUrl}/repos/${this.githubUsername}`
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
      return axios.get(`${this.githubRepoUrl}/${name}/contents`, this.githubRequestHeaders);
    }
  
    async getHooks(name: string): Promise<any> {
      return axios.get(`${this.githubRepoUrl}/${name}/hooks`, this.githubRequestHeaders);
    }
  
    async getYmlContent(url: string): Promise<any> {
      return axios.get(url);
    }
}
  