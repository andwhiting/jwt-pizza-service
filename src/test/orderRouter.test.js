const request = require("supertest");
const app = require("../service");
const { createAdminUser } = require("./router.js");
const { DB } = require("../database/database.js");

//.get/menu
test("get menu", async () => {
    let menuRes = await request(app).get("/api/order/menu");
    if (menuRes.body.length > 0) {
        expect(menuRes.body[0]).toHaveProperty("title");
    } else {
        expect(menuRes.body).toEqual([]);
    }
});
//.put/menu needs admin & auth -- add to menu
test("add to menu", async () => {
    let adminUser = await createAdminUser();
    let adminLoginReq = {
        name: adminUser.name,
        email: adminUser.email,
        password: "toomanysecrets",
    };
    const loginAdminRes = await request(app)
        .put("/api/auth")
        .send(adminLoginReq);
    let adminUserToken = loginAdminRes.body.token;

    let item = {
        title: "Bacon",
        description: "Bacon and cheese",
        image: "pizza1.png",
        price: 0.001,
    };
    let addMenuRes = await request(app)
        .put("/api/order/menu")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send(item);
    //console.log(addMenuRes.body);
    let checkItem = {
        id: 1,
        title: "Bacon",
        description: "Bacon and cheese",
        image: "pizza1.png",
        price: 0.001,
    };
    expect(addMenuRes.body).toContainEqual(checkItem);
});

//.get orders needs auth
//.post diner user
test("create order", async () => {
    const testUser = {
        name: "pizza diner",
        email: "reg@test.com",
        password: "a",
    };
    testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
    const registerRes = await request(app).post("/api/auth").send(testUser);
    let userToken = registerRes.body.token;
    let orderReq = {
        franchiseId: 1,
        storeId: 1,
        items: [
            {
                menuId: 1,
                description: "bacon",
                price: 0.001,
            },
        ],
    };
    let orderRes = await request(app)
        .post("/api/order")
        .set("Authorization", `Bearer ${userToken}`)
        .send(orderReq);
    expect(orderRes.body.jwt).toMatch(
        /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
    );
    expect(orderRes.body.order.items).toEqual(orderReq.items);

    let getOrderRes = await request(app)
        .get("/api/order")
        .set("Authorization", `Bearer ${userToken}`);
    expect(getOrderRes.body.dinerId).toBe(registerRes.body.user.id);
    expect(getOrderRes.body.orders[0].items[0].description).toBe("bacon");
    let regex =
        /[0-9]+-(0?[1-9]|[1][0-2])-(0?[1-9]|[12][0-9]|3[01])T(0?[0-9]|1[0-9]|2[0-3]):(0?[0-9]|[1-5][0-9]):(0?[0-9]|[1-5][0-9])\.[0-9][0-9][0-9]Z/;
    expect(getOrderRes.body.orders[0].date).toMatch(regex);
});
