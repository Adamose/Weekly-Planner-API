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

    // Getting new user's info from body of request
    let username = body?.username;
    let password = body?.password;

    if (username === undefined || password === undefined) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "Request requires body containing new username and password"
        };
    }

    // Connecting to database
    const handle = await connectToDatabase();

    // Converting username to lowercase
    username = username.toLowerCase();

    // Making sure username is not a duplicate
    const unique = await handle.findOne({ "username": username }, { "projection": { "username": 1 } });

    if (unique !== null) {
        return {
            statusCode: 409,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "Account already exist with given username"
        };
    }

    // Getting hash from user's password
    const hash = crypto.createHash("sha256").update(password).digest("hex");

    // Adding new user to database
    const result = await handle.insertOne({ "username": username, "hash": hash, "tasks": {} });

    if (result.insertedCount === 0) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com" },
            body: "Failed to create new user"
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