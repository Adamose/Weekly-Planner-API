const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");
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
    
    // Parsing request body
    let body;
    try { 
        body = JSON.parse(event.body);
    } catch (err) {     
        body = {};
    }

    // Getting user's info from body of request
    let username = body?.username;
    let password = body?.password;

    if (username === undefined || password === undefined) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "Request requires body containing a username and password"
        };
    }

    // Connecting to database
    const handle = await connectToDatabase();

    // Converting username to lowercase
    username = username.toLowerCase();

    // Computing hash from given password
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    // Getting account's hashed password
    const result = await handle.findOne({ "username": username }, { "projection": { "hash": 1, "_id": 0 } });

    if (result === null) {
        return {
            statusCode: 404,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "No account was found with the given username"
        };
    }

    // Comparing hashes
    if (passwordHash !== result.hash) {
        return {
            statusCode: 401,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "Wrong password entered for given username"
        };
    }

    // Creating JSON Web Token
    const token = jwt.sign({ "username": username }, secret);

    //Sending user's token in response
    return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
        body: token
    }
};