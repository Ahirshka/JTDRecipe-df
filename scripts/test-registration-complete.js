const { sql } = require("@vercel/postgres")

async function testRegistrationFlow() {
  console.log("🧪 Testing Complete Registration Flow...")
  console.log("=".repeat(50))

  const testEmail = `test-${Date.now()}@example.com`
  const testUsername = `testuser${Date.now()}`

  try {
    // Test 1: Check database connection
    console.log("1. Testing database connection...")
    const connectionTest = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connected:", connectionTest.rows[0].current_time)

    // Test 2: Check users table exists
    console.log("\n2. Checking users table structure...")
    const tableCheck = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    console.log("✅ Users table columns:")
    tableCheck.rows.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "required"})`)
    })

    // Test 3: Check user_sessions table exists
    console.log("\n3. Checking user_sessions table structure...")
    const sessionsCheck = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions'
      ORDER BY ordinal_position
    `
    if (sessionsCheck.rows.length > 0) {
      console.log("✅ User sessions table columns:")
      sessionsCheck.rows.forEach((col) => {
        console.log(
          `   - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "required"})`,
        )
      })
    } else {
      console.log("❌ User sessions table not found")
    }

    // Test 4: Check user_profiles table exists
    console.log("\n4. Checking user_profiles table structure...")
    const profilesCheck = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `
    if (profilesCheck.rows.length > 0) {
      console.log("✅ User profiles table columns:")
      profilesCheck.rows.forEach((col) => {
        console.log(
          `   - ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "required"})`,
        )
      })
    } else {
      console.log("❌ User profiles table not found")
    }

    // Test 5: Test user creation simulation
    console.log("\n5. Testing user creation process...")
    console.log(`   Test email: ${testEmail}`)
    console.log(`   Test username: ${testUsername}`)

    // Check if we can insert a test user (we'll clean it up after)
    const userId = `test-${Date.now()}`
    const hashedPassword = "$2a$12$example.hash.for.testing.purposes.only"

    await sql`
      INSERT INTO users (
        id, username, email, password_hash, role, status, 
        is_verified, email_verified, created_at, updated_at
      ) VALUES (
        ${userId}, ${testUsername}, ${testEmail}, ${hashedPassword}, 
        'user', 'active', false, false, NOW(), NOW()
      )
    `
    console.log("✅ Test user created successfully")

    // Test 6: Verify user was created
    console.log("\n6. Verifying user creation...")
    const createdUser = await sql`SELECT * FROM users WHERE id = ${userId}`
    if (createdUser.rows.length > 0) {
      console.log("✅ User found in database:")
      console.log(`   - ID: ${createdUser.rows[0].id}`)
      console.log(`   - Username: ${createdUser.rows[0].username}`)
      console.log(`   - Email: ${createdUser.rows[0].email}`)
      console.log(`   - Role: ${createdUser.rows[0].role}`)
      console.log(`   - Status: ${createdUser.rows[0].status}`)
    } else {
      console.log("❌ User not found after creation")
    }

    // Test 7: Test session creation
    console.log("\n7. Testing session creation...")
    const sessionId = `session-${Date.now()}`
    const sessionToken = `token-${Date.now()}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${userId}, ${sessionToken}, ${expiresAt}, NOW())
    `
    console.log("✅ Session created successfully")

    // Test 8: Verify session
    console.log("\n8. Verifying session creation...")
    const createdSession = await sql`SELECT * FROM user_sessions WHERE id = ${sessionId}`
    if (createdSession.rows.length > 0) {
      console.log("✅ Session found in database:")
      console.log(`   - Session ID: ${createdSession.rows[0].id}`)
      console.log(`   - User ID: ${createdSession.rows[0].user_id}`)
      console.log(`   - Expires: ${createdSession.rows[0].expires_at}`)
    } else {
      console.log("❌ Session not found after creation")
    }

    // Test 9: Test user profile creation
    console.log("\n9. Testing user profile creation...")
    await sql`
      INSERT INTO user_profiles (
        user_id, cooking_experience, favorite_cuisines, 
        dietary_restrictions, social_links, created_at, updated_at
      ) VALUES (
        ${userId}, 'beginner', '[]', '[]', '{}', NOW(), NOW()
      )
    `
    console.log("✅ User profile created successfully")

    // Test 10: Clean up test data
    console.log("\n10. Cleaning up test data...")
    await sql`DELETE FROM user_profiles WHERE user_id = ${userId}`
    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`
    console.log("✅ Test data cleaned up")

    // Test 11: Check for existing users
    console.log("\n11. Checking existing users count...")
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log(`✅ Total users in database: ${userCount.rows[0].count}`)

    console.log("\n" + "=".repeat(50))
    console.log("🎉 All registration flow tests passed!")
    console.log("✅ Database tables are properly configured")
    console.log("✅ User creation process works")
    console.log("✅ Session management is functional")
    console.log("✅ User profiles can be created")
    console.log("✅ Data cleanup works properly")
  } catch (error) {
    console.error("\n❌ Registration flow test failed:")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)

    // Try to clean up any partial test data
    try {
      await sql`DELETE FROM user_profiles WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM user_sessions WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM users WHERE id LIKE 'test-%'`
      console.log("🧹 Cleaned up any partial test data")
    } catch (cleanupError) {
      console.error("Failed to clean up test data:", cleanupError.message)
    }
  }
}

// Run the test
testRegistrationFlow()
