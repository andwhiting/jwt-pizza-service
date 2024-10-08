const { Role, DB } = require("../database/database.js");

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

module.exports = {randomName, createAdminUser};