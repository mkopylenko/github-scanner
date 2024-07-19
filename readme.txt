Starting the server:
1. Clone the repository:  git clone https://github.com/mkopylenko/github-scanner.git
2. cd to project's folder
3. Run "npm install"
4. Copy attached ".env" file to the root of the project
5. Start the server: npx ts-node src/index.ts (it will be running on localhost:4001)

Postman links for testing:
List repositores:

POST: http://localhost:4001
body:
{
  "query": "query { listRepositories { name size owner} }"
}

Get repos data:

POST: http://localhost:4001
body:
{
  "query": "query { getReposDetails(repoNames: [\"repoA\",\"repoB\",\"repoC\"]) { name size owner isPrivate numberOfFiles ymlContent webhooks} }"
}

Run tests for repository service with: 'npm test'