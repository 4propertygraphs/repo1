# Node Backend Project

## Overview
This project is a Node.js backend application using [Express](https://expressjs.com/). It combines all the property APIs into a single API.

## Requirements
- [Node.js](https://nodejs.org/) v18 or newer
- [npm](https://www.npmjs.com/) v9 or newer


## Installation

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   ```
2. **Navigate to the project directory:**
   ```sh
   cd node-backend
   ```
3. **Install dependencies:**
   ```sh
   npm install
   ```

## Usage

1. **Configure environment variables:**  
   copy .env.example to .env and set your environment variables.

   ```
   DATABASE_URL= Database URL (e.g., mongodb://localhost:27017/mydb)
   SECRET_KEY= Secret key for JWT (e.g., mysecretkey)
   PORT= Port where the server will run (default: 3000)
   FRONTEND_ORIGINS= Frontend origins allowed to access the API (e.g., http://localhost:3000)
   NODE_ENV= Environment (e.g., development, production)
   ```
 

2. **Start the application:**
   ```sh
   npm start
   ```
   The API will be available at [http://localhost:3000](http://localhost:3000).

## Development

- **Run with auto-reload:**  
  ```sh
  npm run dev
  ```
  (Requires `nodemon` as a dev dependency.)


## License

MIT License.