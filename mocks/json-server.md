# Run the following command

`npx json-server -p 8099 --watch mocks/db.json --middlewares mocks/middleware.js --routes mocks/routes.json`

## Beta Feature - Work in Progress

### This feature is not yet support. They are working on it

`npx json-server --config mock/json-server.json`

## Find Active Port

### Example 8099

`netstat -ano | findstr :8099`

## Kill Active Port

`taskill /PID 11532 /F`
