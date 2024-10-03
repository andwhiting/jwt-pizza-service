const request = require("supertest");
const app = require("../service");
const { randomName, createAdminUser } = require("./router.js");



test("create and delete a franchise", async () => {
    let adminUserToken;
    let adminUser = await createAdminUser();
    let adminLoginReq = {
        name: adminUser.name,
        email: adminUser.email,
        password: "toomanysecrets",
    };
    const loginAdminRes = await request(app)
        .put("/api/auth")
        .send(adminLoginReq);
    adminUserToken = loginAdminRes.body.token;

    //create franchise
    let franchise = {
        name: adminUser.name + " Pizza Store",
        admins: [{ email: adminUser.email }],
    };
    let createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send(franchise);
    expect(createRes.body.name).toBe(franchise.name);
    let franchiseId = createRes.body.id;

    //delete franchise

    let deleteRes = await request(app)
        .delete(`/api/franchise/${franchiseId}`)
        .set("Authorization", `Bearer ${adminUserToken}`);

    expect(deleteRes.body.message).toBe("franchise deleted");
    //logout
    await request(app)
        .delete("/api/auth")
        .set("Authorization", `Bearer ${adminUserToken}`);
});

//create and delete a franchise store
test("create and delete a franchise store", async () => {
    let adminUserToken;
    let adminUser = await createAdminUser();
    let adminLoginReq = {
        name: adminUser.name,
        email: adminUser.email,
        password: "toomanysecrets",
    };
    const loginAdminRes = await request(app)
        .put("/api/auth")
        .send(adminLoginReq);
    adminUserToken = loginAdminRes.body.token;

    //create franchise
    let franchise = {
        name: adminUser.name + " Pizza",
        admins: [{ email: adminUser.email }],
    };
    let createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send(franchise);
    let franchiseId = createRes.body.id;

    //create franchise store
    let store = { franchiseId: franchiseId, name: adminUser.name + "Store" };
    let storeRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send(store);
    expect(storeRes.body).toMatchObject({
        id: /\[[0-9]+\]/,
        franchiseId: franchiseId,
        name: store.name,
    });
    let storeId = storeRes.body.id;

    //delete franchise store
    let deleteStoreRes = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set("Authorization", `Bearer ${adminUserToken}`);
    expect(deleteStoreRes.body.message).toBe("store deleted");
});

//list all franchises


//list a user's franchises
