export interface PostmanRequestItem {
  name: string;
  request: {
    method: string;
    header: Array<{
      key: string;
      value: string;
    }>;
    body: {
      mode: string;
      graphql: {
        query: string;
        variables: string;
      };
    };
    url: {
      raw: string;
      host: string[];
    };
  };
}

export interface PostmanFolderItem {
  name: string;
  item: PostmanRequestItem[];
}

export interface APICollection {
  info: {
    name: string;
    schema: string;
  };
  item: Array<PostmanFolderItem | PostmanRequestItem>;
  variable: Array<{
    key: string;
    value: string;
  }>;
}

export interface SchemaResult {
  variables: Record<string, unknown>;
  schemas: Record<string, any>;
}
