import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB ?? "bizpilot";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri);
    global.mongoClientPromise = client.connect().catch((error) => {
      global.mongoClientPromise = undefined;
      throw error;
    });
  }

  return global.mongoClientPromise;
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}
