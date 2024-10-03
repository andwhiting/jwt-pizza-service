const request = require("supertest");
const app = require("../service");
const { randomName, createAdminUser } = require("./router.js");

let adminUserToken;
let franchiseId;
let adminUser;
let userId;
beforeEach(async () => {
    adminUser = await createAdminUser();
    let adminLoginReq = {
        name: adminUser.name,
        email: adminUser.email,
        password: "toomanysecrets",
    };
    const loginAdminRes = await request(app)
        .put("/api/auth")
        .send(adminLoginReq);
    adminUserToken = loginAdminRes.body.token;
    userId = loginAdminRes.body.user.id;

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
    franchiseId = createRes.body.id;
});

test("create a second franchise", async () => {
    let franchise = {
        name: adminUser.name + " Pizza Store 2",
        admins: [{ email: adminUser.email }],
    };
    let createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send(franchise);
    expect(createRes.body.name).toBe(franchise.name);
});

test("delete a franchise", async () => {
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
test("get all franchises", async () => {
    let getAllRes = await request(app).get("/api/franchise");
    let franchise = {
        name: adminUser.name + " Pizza Store",
        stores: [],
        id: franchiseId,
    };
    expect(getAllRes.body).toContainEqual(franchise);
});

//list a user's franchises
// test("get all user's franchises", async () => {
//     console.log(userId);
//     let userFranRes = await request(app)
//         .get(`/api/franchises/${userId}`)
//         .set("Authorization", `Bearer ${adminUserToken}`);
//     expect(userFranRes.body).toBe("hi");
// });
