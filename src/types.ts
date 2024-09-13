export type returnRepo = {
  owner: string;
  packageName: string;
} | null;
export type Fork = {
  owner: {
    login: string;
  };
  createdAt: string;
  pullRequests: {
    nodes: Array<{
      createdAt: string;
      author: {
        login: string;
      };
    }>;
  };
  issues: {
    nodes: Array<{
      createdAt: string;
      author: {
        login: string;
      };
    }>;
  };
  refs: {
    nodes: Array<{
      target: {
        history: {
          edges: Array<{
            node: {
              committedDate: string;
            };
          }>;
        };
      };
    }>;
  };
};

export type LicenseReponse = {
  repository: {
    licenseInfo: {
      key: string;
      name: string;
      spdxId: string;
      url: string;
    };
  };
};

export type RampUpResponse = {
  repository: {
    forks: {
      edges: Array<{
        node: Fork;
      }>;
    };
    object: {
      id?: string;
    } | null;
    contributing: {
      id?: string;
    } | null;
  };
};
