/**
 * Safely extracts error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "Unknown error occurred"
  }

  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null) {
    // Check if it has a message property safely
    if ("message" in error && typeof (error as any).message === "string") {
      return (error as any).message
    }

    // Try to stringify the object
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

/**
 * Safely checks if an error object has a specific property
 */
export function hasErrorProperty(error: unknown, property: string): boolean {
  return error !== null && error !== undefined && typeof error === "object" && property in error
}
