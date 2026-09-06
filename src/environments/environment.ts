export const environment = {
  production: false,
  // NOTE: temporarily pointed at 8081 instead of the usual 8080 because
  // port 8080 was occupied by another local project (crm-backend).
  // Revert to 'http://localhost:8080' before committing/pushing.
  apiUrl: 'http://localhost:8081'
};
