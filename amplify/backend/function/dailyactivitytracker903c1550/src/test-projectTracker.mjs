import express from "express";
import dotenv from "dotenv";
import { handler } from "./index.mjs"; // Import Lambda function

dotenv.config();
const app = express();
const PORT = 5000;

app.use(express.json()); // Enable JSON body parsing

// 🔹 GET request (fetch projects)
app.get("/employees", async (req, res) => {
  const event = {
    httpMethod: "GET",
    requestContext: { stage: "dev" }, // Simulate API Gateway
    body: null,
  };

  try {
    const response = await handler(event);
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error) {
    res.status(500).json({ status: false, message: "Error processing request", error: error.message });
  }
});

// 🔹 POST request (add new project)
app.post("/employees", async (req, res) => {
  const event = {
    httpMethod: "POST",
    requestContext: { stage: "dev" }, // Simulating API Gateway
    body: JSON.stringify(req.body),
  };

  try {
    const response = await handler(event);
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error) {
    res.status(500).json({ status: false, message: "Error processing request", error: error.message });
  }
});

// 🔹 PUT request (update project)
app.put("/employees", async (req, res) => {
  const event = {
    httpMethod: "PUT",
    requestContext: { stage: "dev" },
    body: JSON.stringify(req.body),
  };

  try {
    const response = await handler(event);
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error) {
    res.status(500).json({ status: false, message: "Error processing request", error: error.message });
  }
});

// 🔹 DELETE request (delete project)
app.delete("/employees", async (req, res) => {
  const event = {
    httpMethod: "DELETE",
    requestContext: { stage: "dev" },
    body: JSON.stringify(req.body),
  };

  try {
    const response = await handler(event);
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (error) {
    res.status(500).json({ status: false, message: "Error processing request", error: error.message });
  }
});

// Start the local server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
