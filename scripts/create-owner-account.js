const bcrypt = require("bcryptjs")

async function generatePasswordHash() {
  try {
    const password = "Morton2121"
    const saltRounds = 12
    const hash = await bcrypt.hash(password, saltRounds)

    console.log("Password Hash for Morton2121:")
    console.log(hash)
    console.log("")
    console.log("Use this hash in your SQL script or database initialization.")

    return hash
  } catch (error) {
    console.error("Error generating password hash:", error)
  }
}

generatePasswordHash()
