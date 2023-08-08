# Weekly-Planner-API
This API serves as the back-end for the clients of the Weekly Planner App. It acts as a middle man between users and the NoSQL document-oriented database that stores both user account information and user content. The REST design principles are followed to ensure the API is easy to maintain and test while also being scalable. This design choice allows the different front-ends to be completely decoupled from the back-end which in turn ensures a consistent user and developer experience.

# Architecture
I chose to go the serverless route for this application because of the great scalability and robustness that is offered by serverless functions. Considering the random and low traffic of this application, the hosting cost savings of not running a compute server are immense.

The API request lifecycle is as follows:
![API request lifecycle diagram png](https://raw.githubusercontent.com/Adamose/Weekly-Planner-API/main/API%20Diagram.png)  
Requests are first sent to the AWS API Gateway service where they are verified to have the needed api-key included. The gateway also ensures a daily request limit and a per-second limit to prevent DDOS attacks from overloading the resources. After having been validated, requests are then proxied to the appropriate AWS Lambda function to perform the necessary computations and to query the required data from the MongoDB database cluster hosted and managed by the MongoDB Atlas service.

# Authentication
I chose to use JSON Web Tokens to handle requests authentication because of their scalability and ability to remove strain from the back-end. By using JWTs, the server does not need to store sessions which speeds up requests by removing a database look-up. For implement JWTs, I used the npm package "jsonwebtoken" to handle creating tokens and verifying the legitimacy of issued tokens.  

The sign-up process involves hashing the passwords using the SHA256 algorithm before storing them on the database. This provides an extra layer of security when it comes to the safe handling of user information. The hashing is done using the built-in Node.js "crypto" library. All login requests also make use of this library to hash incoming passwords before comparing them to the user password stored on the database.
