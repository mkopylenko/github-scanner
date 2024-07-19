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
      return await this.countFiles(name)
    }
  
    async getHooks(name: string): Promise<any> {
      return axios.get(`${this.githubRepoUrl}/${name}/hooks`, this.githubRequestHeaders);
    }
  
    async getYmlContent(url: string): Promise<any> {
      return axios.get(url);
    }

    async getTreeRecursively(sha: string, name : string): Promise<any[]> {
      try {
        const response = await axios.get(`${this.baseGithubUrl}/repos/${this.githubUsername}/${name}/git/trees/${sha}?recursive=1`,this.githubRequestHeaders);
        return response.data.tree;
      } catch (error) {
        console.error(`Failed to fetch tree: ${error}`);
        throw error;
      }
    }
    
    async getBranchSha(name: string): Promise<string> {
      try {
        const response = await axios.get(`${this.baseGithubUrl}/repos/${this.githubUsername}/${name}/branches/main`,this.githubRequestHeaders);
        return response.data.commit.sha;
      } catch (error) {
        console.error(`Failed to get branch SHA: ${error}`);
        throw error;
      }
    }

    async getDownloadableUrl(name: string, path: string): Promise<string | null> {
      try {
        const response = await axios.get(`${this.baseGithubUrl}/repos/${this.githubUsername}/${name}/contents/${path}`,this.githubRequestHeaders);
        return response.data.download_url;
      } catch (error) {
        console.error(`Failed to fetch file: ${error}`);
      throw error;
      }
    }

    async countFiles(name: string): Promise<number> {
      try {
        const branchSha = await this.getBranchSha(name);
        const tree = await this.getTreeRecursively(branchSha, name);
        const allFiles = tree.filter((item: { type: string; }) =>item.type === 'blob')
        const ymlFiles = tree.filter((item: { path: string; }) =>item.path.endsWith('.yaml'));
        if (ymlFiles && ymlFiles.length >0){
          const url = await this.getDownloadableUrl(name, ymlFiles[0].path);
          if (url){
            const yamlContent = await this.getYmlContent(url)
            console.log(yamlContent.data)
          }
        }
       
    console.log(`Count: ${allFiles.length}`)
        return allFiles.length;
      } catch (error) {
        console.error(`Failed to count files: ${error}`);
        throw error;
      }
    }
    
}
  