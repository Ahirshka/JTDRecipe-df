import { createClient } from "@libsql/client"

// Only initialize on server side
let tursoClient: ReturnType<typeof createClient> | null = null

export function getTursoClient() {
  if (typeof window !== "undefined") {
    throw new Error("Turso client can only be used on the server side")
  }

  if (!tursoClient) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL environment variable is required")
    }

    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_AUTH_TOKEN environment variable is required")
    }

    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }

  return tursoClient
}

// Helper function to execute queries safely
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const client = getTursoClient()
    const result = await client.execute({
      sql,
      args: params,
    })
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Helper function for transactions
export async function executeTransaction(queries: Array<{ sql: string; args?: any[] }>) {
  try {
    const client = getTursoClient()
    const transaction = await client.transaction()

    for (const query of queries) {
      await transaction.execute({
        sql: query.sql,
        args: query.args || [],
      })
    }

    await transaction.commit()
    return true
  } catch (error) {
    console.error("Transaction error:", error)
    throw error
  }
}
