const { MongoClient, ObjectId } = require("mongodb");
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
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Request requires authorization header with jwt"
        };
    }

    // Validating token and extracting username
    try {
        event.username = jwt.verify(token, secret).username;
    } catch (err) {
        return {
            statusCode: 401,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Invalid token"
        };
    }
   
    // Getting request method
    const method = event.httpMethod;

    switch (method) {
        case "GET":
            return getTask(event);

        case "POST":
            return postTask(event);

        case "DELETE":
            return deleteTask(event);

        default:
            return {
                statusCode: 405,
                headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
                body: "Request method not allowed"
            };
    }
};

async function getTask(event) {
    
    // Getting query parameter task id
    const id = event?.queryStringParameters?.id;

    if (id === undefined || !ObjectId.isValid(id)) {
        return {
            statusCode: 422,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Request requires a valid task id query parameter"
        };
    }

    // Getting task from given id
    const handle = await connectToDatabase();
    const result = await handle.findOne({ "username": event.username }, { "projection": { [`tasks.${id}`]: 1, "_id": 0 } });

    if (result === undefined || JSON.stringify(result.tasks) === "{}") {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "No task with given id"
        };
    }

    // Send received task in response
    return {
        statusCode: 200,
        headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
        body: JSON.stringify(result.tasks[id])
    };
}

async function postTask(event) {

    // Getting query parameters for new task
    const content = event?.queryStringParameters?.content;
    const date = event?.queryStringParameters?.date;

    if (content === undefined || date === undefined) {
        return {
            statusCode: 422,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Request requires valid query parameters"
        };
    }

    // Creating new task from given parameters
    const task = { "content": content, "date": date }

    // Sending task to database
    const handle = await connectToDatabase();
    const id = new ObjectId().toString();
    const result = await handle.updateOne({ "username": event.username }, { "$set": { [`tasks.${id}`]: task } });

    if (result.modifiedCount === 0) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Failed to create new task"
        };
    }

    // Send new task's id in response
    return {
        statusCode: 200,
        headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
        body: id
    };
}

async function deleteTask(event) {

    // Getting query parameter task id
    const id = event?.queryStringParameters?.id;

    if (id === undefined || !ObjectId.isValid(id)) {
        return {
            statusCode: 422,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "Request requires a valid task id query parameter"
        };
    }

    // Deleting task with given id
    const handle = await connectToDatabase();
    const result = await handle.updateOne({ "username": event.username }, { "$unset": { [`tasks.${id}`]: "" } });

    if (result.modifiedCount === 0) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            },
            body: "No task with given id"
        };
    }

    // Send successful response
    return {
        statusCode: 200,
        headers: {
                "Access-Control-Allow-Origin": "https://weeklyplanner.adamose.com",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Headers": '*'
            }
    };
}