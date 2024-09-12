import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import "dotenv/config";

const endpoint = "https://api.github.com/graphql";

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  }
});

export const GET_VALUES_FOR_RAMPUP = gql`
  query getForksAndPRs($repoOwner: String!, $repoName: String!, $firstForks: Int!) {
    repository(owner: $repoOwner, name: $repoName) {
      forks(first: $firstForks) {
        edges {
          node {
            owner {
              login
            }
            createdAt
            pullRequests(first: 1) {
              nodes {
                createdAt
                author {
                  login
                }
              }
            }
            issues(first: 1) {
              nodes {
                createdAt
                author {
                  login
                }
              }
            }
            refs(refPrefix: "refs/heads/", first: 1) {
              nodes {
                target {
                  ... on Commit {
                    history(first: 1) {
                      edges {
                        node {
                          committedDate
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      object(expression: "HEAD:README.md") {
        ... on Blob {
          id
        }
      }
      contributing: object(expression: "HEAD:CONTRIBUTING.md") {
        ... on Blob {
          id
        }
      }
    }
  }
`;

export const GET_VALUES_FOR_CORRECTNESS = gql`
  query getPRsAndCommits($repoOwner: String!, $repoName: String!, $firstPRs: Int!, $firstCommits: Int!) {
    repository(owner: $repoOwner, name: $repoName) {
      pullRequests(first: $firstPRs, states: MERGED, orderBy: {field: CREATED_AT, direction: DESC}) {
        edges {
          node {
            createdAt
            mergedAt
          }
        }
      }
      refs(refPrefix: "refs/heads/", first: $firstCommits) {
        nodes {
          target {
            ... on Commit {
              committedDate
              history(first: 1) {
                edges {
                  node {
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
