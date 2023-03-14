const MemoryStore = {
  clientToken: null,
  client: {
    id: "application_client",
    grants: ["client_credentials", "authorization_code", "refresh_token"],
    grant_type: "client_credentials",
    client_id: "application_client",
    client_secret: "secret",
    role: "INTERNAL_CLIENT",
  },
  users: {
    user1: {
      username: "john_doe",
      password: "helloworld",
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@example.com",
    },
    user2: {
      username: "rick_asthley",
      password: "helloworld",
      firstName: "Rick",
      lastName: "Asthley",
      email: "rickasthley@example.com",
    },
  },
};

export default MemoryStore;
