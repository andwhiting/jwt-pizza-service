const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
    let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + "@admin.com";

    await DB.addUser(user);

    return user;
}

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
    const registerRes = await request(app).post("/api/auth").send(testUser);
    testUserAuthToken = registerRes.body.token;
    expect(testUserAuthToken).toMatch(
        /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
    );
});

// afterAll(async () => {
//     const deleteRes = await request(app).delete("/api/auth").send(testUserAuthToken);
//     expect(deleteRes.body.message).toMatch("logout successful");
// });

test("login", async () => {
    const loginRes = await request(app).put("/api/auth").send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(
        /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
    );
    //testUserAuthToken = loginRes.body.token;

    const user = {
        name: testUser.name,
        email: testUser.email,
        roles: [{ role: "diner" }],
    };
    expect(loginRes.body.user).toMatchObject(user);
});

test("logout", async () => {
    const logoutRes = await request(app)
        .delete("/api/auth")
        .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(logoutRes.body.message).toMatch("logout successful");
});

test("failed logout", async () => {
    const logoutRes = await request(app).delete("/api/auth");
    expect(logoutRes.body.message).toMatch("unauthorized");
});

test("update user", async () => {
    //create and login to admin
    let newEmail = randomName() + "@mail.com";
    let adminUser = await createAdminUser();
    let adminLoginReq = {
        name: adminUser.name,
        email: adminUser.email,
        password: "toomanysecrets",
    };
    const loginAdmin = await request(app).put("/api/auth").send(adminLoginReq);
    let updatedInfo = {
        userId: loginAdmin.userId,
        email: newEmail,
        password: "admin",
    };

    //update email and password, check email
    const updateRes = await request(app)
        .put(`/api/auth/${loginAdmin.body.user.id}`)
        .set("Authorization", `Bearer ${loginAdmin.body.token}`)
        .send(updatedInfo);
    expect(updateRes.body.email).toMatch(newEmail);

    //logout
    await request(app).delete("/api/auth").set("Authorization", `Bearer ${loginAdmin.body.token}`);

    //Check new password by logging back in
    let reLogRes = await request(app)
        .put("/api/auth")
        .send({ name: adminUser.name, email: newEmail, password: "admin" });

    const user = {
        name: adminUser.name,
        email: newEmail,
        roles: [{ role: Role.Admin }],
    };
    expect(reLogRes.body.user).toMatchObject(user);
});
