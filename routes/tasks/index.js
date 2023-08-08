const MongoClient = require("mongodb").MongoClient;
const jwt = require("jsonwebtoken");

// Secret used to encrypt JSON Web Tokens
const secret = "INCLUDE_KEY_HERE";

// Declared outisde function handler to be reused in multiple requests
let databaseHandle = null;

// Connecting to database if function doesn't already have one established
async function connectToDatabase() {

    // Return if connection already exist
    if (databaseHandle) {
        return databaseHandle;
    }

    // Connect to database hosted on MongoDB Atlas
    const client = await MongoClient.connect("DATABASE_CONNECTION_STRING");

    // Getting handle to collection
    const handle = client.db("Database").collection("Collection");

    // Setting shared connection variable
    databaseHandle = handle;

    return handle;
}

// Lambda function
exports.handler = async (event) => {

    // Getting jwt token from authorization header
    let token;
    try {
        token = event.headers.Authorization.split(" ")[1];
    } catch (err) {
        return {
            statusCode: 401,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Request requires authorization header with jwt"
        };
    }

    // Validating token and extracting username
    let username;
    try {
        username = jwt.verify(token, secret).username;
    } catch (err) {
        return {
            statusCode: 401,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Invalid token"
        };
    }
    
    // Get database handle
    const handle = await connectToDatabase();

    // Gettting all tasks for given user
    const tasks = await handle.findOne({ "username": username }, { "projection": { "tasks": 1, "_id": 0 } });

    if (tasks === null) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "No account was found with the given username"
        };
    }

    //Sending tasks object in response
    return {
        statusCode: 200,
        headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "GET, ",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*',
                "Content-Type": "application/json"
            },
        body: JSON.stringify(tasks),
    };
};