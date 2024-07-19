
import { RepositoryService } from '../src/RepositoryService';
import { IDataService } from '../src/IDataService';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockDataService: jest.Mocked<IDataService>;

  beforeEach(() => {
    mockDataService = {
      getRepos: jest.fn(),
      getRepo: jest.fn(),
      getContents: jest.fn(),
      getHooks: jest.fn(),
    };

    repositoryService = new RepositoryService(mockDataService);
  });

  describe('fetchRepositores', () => {
    it('should fetch and filter repositories', async () => {
      const mockRepos = {
        data: [
          { name: 'repo1', size: 100, owner: { login: 'owner1' } },
          { name: 'test2', size: 200, owner: { login: 'owner2' } },
          { name: 'repo3', size: 300, owner: { login: 'owner3' } },
        ],
      };
      mockDataService.getRepos.mockResolvedValueOnce(mockRepos as any);

      const result = await repositoryService.fetchRepositores();

      expect(result).toEqual([
        { name: 'repo1', size: 100, owner: 'owner1' },
        { name: 'repo3', size: 300, owner: 'owner3' },
      ]);
    });
  });

  describe('getReposDetails', () => {
    it('should fetch repository details in chunks', async () => {
      const repoNames = ['repo1', 'repo2', 'repo3'];

      mockDataService.getRepo.mockResolvedValue({
        data: { name: 'repo1', size: 100, owner: { login: 'owner1' }, private: false },
      } as any);
      mockDataService.getContents.mockResolvedValue({
        totalFileCount: 10,
        yamlContent: 'content1',
      } as any);
      mockDataService.getHooks.mockResolvedValue({
        data: [{ config: { url: 'hook1' } }],
      } as any);

      const result = await repositoryService.getReposDetails(repoNames);

      expect(result).toEqual([
        {
          name: 'repo1',
          size: 100,
          owner: 'owner1',
          isPrivate: false,
          numberOfFiles: 10,
          ymlContent: 'content1',
          webhooks: ['hook1'],
        },
        {
          name: 'repo1',
          size: 100,
          owner: 'owner1',
          isPrivate: false,
          numberOfFiles: 10,
          ymlContent: 'content1',
          webhooks: ['hook1'],
        },
        {
          name: 'repo1',
          size: 100,
          owner: 'owner1',
          isPrivate: false,
          numberOfFiles: 10,
          ymlContent: 'content1',
          webhooks: ['hook1'],
        },
      ]);
    });

    it('should handle errors correctly', async () => {
      const repoNames = ['repo1', 'repo2', 'repo3'];

      mockDataService.getRepo.mockResolvedValue({
        data: { name: 'repo1', size: 100, owner: { login: 'owner1' }, private: false },
      } as any);
      mockDataService.getContents.mockRejectedValue(new Error('Contents error'));
      mockDataService.getHooks.mockResolvedValue({
        data: [{ config: { url: 'hook1' } }],
      } as any);

      await expect(repositoryService.getReposDetails(repoNames)).rejects.toThrow(
        'Failed to fetch all repository details'
      );
    });
  });
});
