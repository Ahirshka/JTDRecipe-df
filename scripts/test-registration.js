// Test script to verify user registration functionality
async function testUserRegistration() {
  console.log("🧪 Testing User Registration Flow...")

  const testUser = {
    username: "testuser123",
    email: "test@example.com",
    password: "testpassword123",
    confirmPassword: "testpassword123",
  }

  try {
    // Test 1: Valid registration
    console.log("📝 Test 1: Valid user registration")
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    })

    const data = await response.json()

    if (data.success) {
      console.log("✅ Registration successful!")
      console.log("User created:", {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
      })
    } else {
      console.log("❌ Registration failed:", data.error)
    }

    // Test 2: Duplicate email registration
    console.log("\n📝 Test 2: Duplicate email registration")
    const duplicateResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...testUser,
        username: "differentuser",
      }),
    })

    const duplicateData = await duplicateResponse.json()

    if (!duplicateData.success) {
      console.log("✅ Duplicate email properly rejected:", duplicateData.error)
    } else {
      console.log("❌ Duplicate email should have been rejected")
    }

    // Test 3: Password mismatch
    console.log("\n📝 Test 3: Password mismatch")
    const mismatchResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        confirmPassword: "differentpassword",
      }),
    })

    const mismatchData = await mismatchResponse.json()

    if (!mismatchData.success) {
      console.log("✅ Password mismatch properly rejected:", mismatchData.error)
    } else {
      console.log("❌ Password mismatch should have been rejected")
    }

    // Test 4: Test login with created user
    console.log("\n📝 Test 4: Login with created user")
    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })

    const loginData = await loginResponse.json()

    if (loginData.success) {
      console.log("✅ Login successful!")
      console.log("Logged in user:", {
        username: loginData.user.username,
        email: loginData.user.email,
        role: loginData.user.role,
      })
    } else {
      console.log("❌ Login failed:", loginData.error)
    }
  } catch (error) {
    console.error("🚨 Test error:", error)
  }
}

// Run the test
testUserRegistration()
