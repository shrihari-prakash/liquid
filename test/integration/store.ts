const MemoryStore = {
  clientToken: null,
  client: {
    _id: null,
    id: "application_client",
    secret: "secret",
    grants: ["client_credentials", "authorization_code", "refresh_token"],
    grant_type: "client_credentials",
    client_id: "application_client",
    client_secret: "secret",
    displayName: "Application Client",
    redirectUris: ["http://localhost:2000", "http://localhost:2001"],
    role: "internal_client",
    scope: ["*"],
  },
  users: {
    user1: {
      _id: null,
      username: "john_doe",
      password: "helloworld",
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@example.com",
      scope: ["*"],
    },
    user2: {
      _id: null,
      username: "rick_asthley",
      password: "helloworld",
      firstName: "Rick",
      lastName: "Asthley",
      email: "rickasthley@example.com",
      scope: ["*"],
    },
    user3: {
      _id: null,
      username: "allisson_brooklyn",
      password: "helloworld",
      firstName: "Allisson",
      lastName: "Brooklyn",
      email: "allissonbrooklyn@example.com",
      scope: ["*"],
    },
  },
};

export default MemoryStore;
