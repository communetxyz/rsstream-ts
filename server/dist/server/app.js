import bodyParser from "body-parser";
import express from "express";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import Holster from "@mblaney/holster/src/holster.js";
import { validateBody } from "./middleware/validation.js";
import { CheckInviteCodeRequestSchema, ClaimInviteCodeRequestSchema, ValidateEmailRequestSchema, ResetPasswordRequestSchema, UpdatePasswordRequestSchema, AddFeedRequestSchema, SubscriberRequestSchema, CreateInviteCodesRequestSchema, SendInviteCodeRequestSchema, UpdateFeedLimitRequestSchema, RemoveFeedRequestSchema, AddItemRequestSchema, } from "../shared/schemas.js";
const holster = Holster({ secure: true });
const user = holster.user();
const username = process.env.HOLSTER_USER_NAME ?? "host";
const password = process.env.HOLSTER_USER_PASSWORD ?? "password";
const host = process.env.APP_HOST ?? "http://localhost:3000";
const addFeedUrl = process.env.ADD_FEED_URL;
const addFeedID = process.env.ADD_FEED_ID;
const addFeedApiKey = process.env.ADD_FEED_API_KEY;
const dirname = path.dirname(fileURLToPath(import.meta.url));
// Adjust path based on whether we're running from source or compiled
const isCompiled = dirname.endsWith('/dist');
const staticPath = isCompiled
    ? path.join(dirname, "../../browser/build")
    : path.join(dirname, "../browser/build");
const basicAuth = (req, res, next) => {
    const auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [u, p] = Buffer.from(auth, "base64").toString().split(":");
    if (u === username && p === password) {
        next();
    }
    else {
        res.status(401).end();
    }
};
// inviteCodes is a map of invite codes and their (random) holster keys, stored
// in memory to avoid decrypting them in each of the functions they're required.
const inviteCodes = new Map();
// removeDays is a set of days where old data has already been removed so that
// holster doesn't need to be checked every time an item is added.
const removeDays = new Set();
console.log("Trying auth credentials for " + username);
user.auth(username, password, (err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log(username + " logged in");
        mapInviteCodes();
    }
});
const app = express();
app.use(bodyParser.json());
app.use(express.static(staticPath));
app.use("/private", basicAuth);
app.listen(3000);
app.get("/", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
});
// These redirects are required because the browser does local first routing,
// which is fine except for an initial request or hard refresh, in which case
// the server needs to respond to the request.
app.get("/invite", (req, res) => {
    res.redirect("/?redirect=invite");
});
app.get("/register", (req, res) => {
    res.redirect("/?redirect=register");
});
app.get("/login", (req, res) => {
    res.redirect("/?redirect=login");
});
app.get("/settings", (req, res) => {
    res.redirect("/?redirect=settings");
});
app.get("/help", (req, res) => {
    res.redirect("/?redirect=help");
});
app.get("/validate-email", (req, res) => {
    res.redirect(`/?redirect=validate-email&code=${req.query.code}&validate=${req.query.validate}`);
});
app.get("/reset-password", (req, res) => {
    res.redirect("/?redirect=reset-password");
});
app.get("/update-password", (req, res) => {
    res.redirect(`/?redirect=update-password&username=${req.query.username}&code=${req.query.code}&reset=${req.query.reset}`);
});
// The host public key is requested by the browser so that it knows where to
// get data from (all data is stored under user accounts when using the
// secure flag in Holster opts).
app.get("/host-public-key", (req, res) => {
    if (user.is) {
        res.send(user.is.pub);
        return;
    }
    res.status(404).send("Host public key not found");
});
app.post("/request-invite-code", (req, res) => {
    if (!req.body.email) {
        res.status(400).send("email required");
        return;
    }
    requestInvite(req.body.email);
    res.send("Invite code requested");
});
app.post("/check-codes", async (req, res) => {
    if (!req.body.codes || req.body.codes.length === 0) {
        res.status(400).send("codes required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    if (await checkCodes(req.body.codes)) {
        res.end(); // ok
        return;
    }
    res.status(400).send("duplicate code found");
});
app.post("/check-invite-code", validateBody(CheckInviteCodeRequestSchema), (req, res) => {
    const code = req.body.code || "admin";
    if (inviteCodes.has(code)) {
        res.end(); // ok
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    // This just provides relevant errors.
    user.get("accounts").next(code, (used) => {
        if (used) {
            if (code === "admin") {
                res.status(400).send("Please provide an invite code");
                return;
            }
            res.status(400).send("Invite code already used");
            return;
        }
        res.status(404).send("Invite code not found");
    });
});
app.post("/claim-invite-code", validateBody(ClaimInviteCodeRequestSchema), async (req, res) => {
    const code = req.body.code || "admin";
    const invite = inviteCodes.get(code);
    if (!invite) {
        res.status(404).send("Invite code not found");
        return;
    }
    // Validation handled by Zod middleware
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const validate = newCode();
    const encValidate = await holster.SEA.encrypt(validate, user.is);
    const encEmail = await holster.SEA.encrypt(req.body.email, user.is);
    const data = {
        pub: req.body.pub,
        epub: req.body.epub,
        username: req.body.username,
        name: req.body.username,
        email: encEmail,
        validate: encValidate,
        ref: invite.owner,
        host: host,
        feeds: 10,
        subscribed: 0,
    };
    let err = await new Promise(res => {
        user.get("accounts").next(code).put(data, res);
    });
    if (err) {
        console.log(err);
        res.status(500).send("Host error");
        return;
    }
    // Also map the code to the user's public key to make login easier.
    err = await new Promise(res => {
        user
            .get("map")
            .next("account:" + req.body.pub)
            .put(code, res);
    });
    if (err) {
        console.log(err);
        res.status(500).send("Host error");
        return;
    }
    validateEmail(req.body.username, req.body.email, code, validate);
    // Remove invite code as it's no longer available.
    err = await new Promise(res => {
        user.get("available").next("invite_codes").next(invite.key).put(null, res);
    });
    if (err) {
        console.log(err);
        res.status(500).send("Host error");
        return;
    }
    inviteCodes.delete(code);
    if (code === "admin") {
        res.end();
        return;
    }
    // Also remove from shared codes of the invite owner.
    const account = await new Promise(res => {
        user.get("accounts").next(invite.owner, res);
    });
    if (!account || !account.epub) {
        console.log(`Account not found for invite.owner: ${invite.owner}`);
        res.end();
        return;
    }
    user
        .get("shared")
        .next("invite_codes")
        .next(invite.owner, async (codes) => {
        if (!codes)
            return;
        const secret = await holster.SEA.secret(account, user.is);
        let found = false;
        for (const [key, encrypted] of Object.entries(codes)) {
            if (found)
                break;
            if (!key || !encrypted)
                continue;
            let shared = await holster.SEA.decrypt(encrypted, secret);
            if (code === shared) {
                found = true;
                user
                    .get("shared")
                    .next("invite_codes")
                    .next(invite.owner)
                    .next(key)
                    .put(null, (err) => {
                    if (err)
                        console.log(err);
                });
            }
        }
    });
    res.end();
});
app.post("/validate-email", validateBody(ValidateEmailRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("Invite code required");
        return;
    }
    if (!req.body.validate) {
        res.status(400).send("Validation code required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send("Account not found");
        return;
    }
    if (!account.validate) {
        res.send("Email already validated");
        return;
    }
    const validate = await holster.SEA.decrypt(account.validate, user.is);
    if (validate !== req.body.validate) {
        res.status(400).send("Validation code does not match");
        return;
    }
    user
        .get("accounts")
        .next(code)
        .put({ validate: null }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Host error");
            return;
        }
        res.send("Email validated");
    });
});
app.post("/reset-password", validateBody(ResetPasswordRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("Invite code required");
        return;
    }
    if (!req.body.email) {
        res.status(400).send("Email required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send("Account not found");
        return;
    }
    let increment = 0;
    const match = account.username?.match(/\.(\d)$/);
    if (match) {
        increment = Number(match[1]);
    }
    if (increment === 9) {
        res.status(400).send("Too many password resets");
        return;
    }
    const email = await holster.SEA.decrypt(account.email, user.is);
    if (email !== req.body.email) {
        res.status(400).send("Email does not match invite code");
        return;
    }
    if (account.validate) {
        res.status(400).send("Please validate your email first");
        return;
    }
    const reset = newCode();
    const remaining = 8 - increment;
    const data = {
        reset: await holster.SEA.encrypt(reset, user.is),
        expiry: Date.now() + 86400000,
    };
    user
        .get("accounts")
        .next(code)
        .put(data, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Host error");
            return;
        }
        resetPassword(account.name || "", remaining, email, code, reset);
        res.send("Reset password email sent");
    });
});
app.post("/update-password", validateBody(UpdatePasswordRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("Invite code required");
        return;
    }
    if (!req.body.reset) {
        res.status(400).send("Reset code required");
        return;
    }
    if (!req.body.pub) {
        res.status(400).send("Public key required");
        return;
    }
    if (!req.body.epub) {
        res.status(400).send("Epub key required");
        return;
    }
    if (!req.body.username) {
        res.status(400).send("Username required");
        return;
    }
    if (!req.body.name) {
        res.status(400).send("Display Name required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send("Account not found");
        return;
    }
    if (!account.reset) {
        res.status(404).send("Reset code not found");
        return;
    }
    if (!account.expiry || account.expiry < Date.now()) {
        res.status(400).send("Reset code has expired");
        return;
    }
    const reset = await holster.SEA.decrypt(account.reset, user.is);
    if (reset !== req.body.reset) {
        res.status(400).send("Reset code does not match");
        return;
    }
    const data = {
        pub: req.body.pub,
        epub: req.body.epub,
        username: req.body.username,
        name: req.body.name,
        prev: account.pub,
    };
    user
        .get("accounts")
        .next(code)
        .put(data, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Host error");
            return;
        }
        user
            .get("map")
            .next("account:" + req.body.pub)
            .put(code, (err) => {
            if (err) {
                console.log(err);
                res.status(500).send("Host error");
                return;
            }
            // Also update shared invite codes for this account.
            user
                .get("shared")
                .next("invite_codes")
                .next(code, async (codes) => {
                if (codes) {
                    const oldSecret = await holster.SEA.secret(account, user.is);
                    const newSecret = await holster.SEA.secret(data, user.is);
                    for (const [key, encrypted] of Object.entries(codes)) {
                        if (!key || !encrypted)
                            continue;
                        const dec = await holster.SEA.decrypt(encrypted, oldSecret);
                        const shared = await holster.SEA.encrypt(dec, newSecret);
                        const err = await new Promise(res => {
                            user
                                .get("shared")
                                .next("invite_codes")
                                .next(code)
                                .next(key)
                                .put(shared, res);
                        });
                        if (err)
                            console.log(err);
                    }
                }
                res.send(account.pub);
            });
        });
    });
});
app.post("/add-feed", validateBody(AddFeedRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send({ error: "code required" });
        return;
    }
    if (!req.body.url) {
        res.status(400).send({ error: "url required" });
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send({ error: "Account not found" });
        return;
    }
    const url = await holster.SEA.verify(req.body.url, account);
    if (!url) {
        res.status(400).send({ error: "Could not verify signed url" });
        return;
    }
    if ((account.subscribed || 0) === (account.feeds || 0)) {
        res
            .status(400)
            .send(`Account currently has a limit of ${account.feeds} feeds`);
        return;
    }
    if (!addFeedUrl || !addFeedID || !addFeedApiKey) {
        res.status(500).send({ error: "Could not add feed, env not set" });
        return;
    }
    try {
        const add = await fetch(addFeedUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `id=${addFeedID}&key=${addFeedApiKey}&action=add-feed&xmlUrl=${encodeURIComponent(url)}`,
        });
        if (!add.ok) {
            console.log("Error from", addFeedUrl, url, add.statusText);
            res.status(500).send({ error: "Error adding feed" });
            return;
        }
        const feed = await add.json();
        if (feed.error) {
            console.log("Error from", addFeedUrl, url);
            console.log(feed.error);
            res.status(500).send({ error: "Error adding feed" });
            return;
        }
        if (!feed.add || !feed.add.url || !feed.add.title) {
            console.log("No feed data from", addFeedUrl, url);
            console.log(feed);
            res.status(500).send({ error: "Error adding feed" });
            return;
        }
        const data = {
            title: feed.add.title,
            description: feed.add.description ?? "",
            html_url: feed.add.html_url ?? "",
            language: feed.add.language ?? "",
            image: feed.add.image ?? "",
            subscriber_count: 1,
        };
        user
            .get("feeds")
            .next(feed.add.url)
            .put(data, (err) => {
            if (err) {
                console.log(err);
                res.status(500).send("Error saving feed");
                return;
            }
            user
                .get("accounts")
                .next(code)
                .put({ subscribed: (account.subscribed || 0) + 1 }, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Error adding to account subscribed");
                    return;
                }
                res.send(feed);
            });
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ error: "Error adding feed" });
    }
});
app.post("/add-subscriber", validateBody(SubscriberRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send({ error: "code required" });
        return;
    }
    if (!req.body.url) {
        res.status(400).send({ error: "url required" });
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send({ error: "Account not found" });
        return;
    }
    const url = await holster.SEA.verify(req.body.url, account);
    if (!url) {
        res.status(400).send({ error: "Could not verify signed url" });
        return;
    }
    if ((account.subscribed || 0) === (account.feeds || 0)) {
        res
            .status(400)
            .send(`Account currently has a limit of ${account.feeds} feeds`);
        return;
    }
    const feed = await new Promise(res => {
        user.get("feeds").next(url, { ".": "subscriber_count" }, res);
    });
    if (!feed) {
        console.log("Feed not found for add-subscriber", url);
        res.end();
        return;
    }
    user
        .get("feeds")
        .next(url)
        .put({ subscriber_count: feed.subscriber_count + 1 }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error adding to feed subscriber_count");
            return;
        }
        user
            .get("accounts")
            .next(code)
            .put({ subscribed: (account.subscribed || 0) + 1 }, (err) => {
            if (err) {
                console.log(err);
                res.status(500).send("Error adding to account subscribed");
                return;
            }
            res.end();
        });
    });
});
app.post("/remove-subscriber", validateBody(SubscriberRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send({ error: "code required" });
        return;
    }
    if (!req.body.url) {
        res.status(400).send({ error: "url required" });
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send({ error: "Account not found" });
        return;
    }
    const url = await holster.SEA.verify(req.body.url, account);
    if (!url) {
        res.status(400).send({ error: "Could not verify signed url" });
        return;
    }
    const feed = await new Promise(res => {
        user.get("feeds").next(url, { ".": "subscriber_count" }, res);
    });
    if (!feed) {
        console.log("Feed not found for remove-subscriber", url);
        res.end();
        return;
    }
    if (feed.subscriber_count === 0) {
        console.log("remove-subscriber called but subscriber_count is 0", url);
        res.end();
        return;
    }
    if (feed.subscriber_count === 1) {
        if (!addFeedUrl || !addFeedID || !addFeedApiKey) {
            console.log("Could not remove feed, env not set");
            return;
        }
        try {
            const remove = await fetch(addFeedUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `id=${addFeedID}&key=${addFeedApiKey}&action=remove-feed&xmlUrl=${encodeURIComponent(url)}`,
            });
            if (!remove.ok) {
                console.log("Error from", addFeedUrl, url, remove.statusText);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    user
        .get("feeds")
        .next(url)
        .put({ subscriber_count: feed.subscriber_count - 1 }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error removing from subscriber_count");
            return;
        }
        user
            .get("accounts")
            .next(code)
            .put({ subscribed: (account.subscribed || 0) - 1 }, (err) => {
            if (err) {
                console.log(err);
                res.status(500).send("Error removing from account subscribed");
                return;
            }
            res.end();
        });
    });
});
app.post("/private/create-invite-codes", validateBody(CreateInviteCodesRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("code required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account || !account.epub) {
        res.status(404).send("Account not found");
        return;
    }
    if (account.validate) {
        res.status(400).send("Email not validated");
        return;
    }
    if (await createInviteCodes(req.body.count || 1, code, account)) {
        res.end();
        return;
    }
    res
        .status(500)
        .send("Error creating codes. Please check logs for errors and try again");
});
app.post("/private/send-invite-code", validateBody(SendInviteCodeRequestSchema), (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("code required");
        return;
    }
    const email = req.body.email;
    if (!email) {
        res.status(400).send("email required");
        return;
    }
    sendInviteCode(code, email);
    res.end();
});
app.post("/private/update-feed-limit", validateBody(UpdateFeedLimitRequestSchema), async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("code required");
        return;
    }
    const limit = req.body.limit;
    if (!limit) {
        res.status(400).send("limit required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const account = await new Promise(res => {
        user.get("accounts").next(code, res);
    });
    if (!account) {
        res.status(404).send("Account not found");
        return;
    }
    if (account.validate) {
        res.status(400).send("Email not validated");
        return;
    }
    user
        .get("accounts")
        .next(code)
        .put({ feeds: limit }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error updating feed limit");
            return;
        }
        res.end();
    });
});
app.post("/private/remove-feed", validateBody(RemoveFeedRequestSchema), (req, res) => {
    if (!req.body.url) {
        res.status(400).send("url required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    // Don't modify subscriber_count so users can still call remove-subscriber.
    const data = {
        title: "",
        description: "",
        html_url: "",
        language: "",
        image: "",
    };
    user
        .get("feeds")
        .next(req.body.url)
        .put(data, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error removing feed");
            return;
        }
        res.end();
    });
});
app.post("/private/add-item", validateBody(AddItemRequestSchema), async (req, res) => {
    if (!req.body.url) {
        res.status(400).send("url required");
        return;
    }
    // Also drop items without a guid to avoid duplicates.
    // (SimplePie generates guids if not found in a feed.)
    if (!req.body.guid) {
        res.status(400).send("guid required");
        return;
    }
    if (!user.is) {
        res.status(500).send("Host error");
        return;
    }
    const twoWeeksAgo = Date.now() - 1209600000;
    if (req.body.timestamp < twoWeeksAgo) {
        // Ignore items that are older than 2 weeks.
        res.end();
        return;
    }
    const data = {
        title: req.body.title ?? "",
        content: req.body.content ?? "",
        author: req.body.author ?? "",
        permalink: req.body.permalink ?? "",
        guid: req.body.guid,
        timestamp: req.body.timestamp,
        url: req.body.url,
    };
    const enclosure = mapEnclosure(req.body.enclosure);
    const category = mapCategory(req.body.category);
    if (enclosure)
        data.enclosure = enclosure;
    if (category)
        data.category = category;
    const dayKey = day(req.body.timestamp);
    const err = await new Promise(res => {
        user
            .get("feedItems")
            .next(req.body.url)
            .next(dayKey)
            .next(req.body.guid)
            .put(data, res);
    });
    if (err) {
        console.log(err);
        res.status(500).send("Error saving item");
        return;
    }
    // Add the guid and url to a set for the given day to make removal easier.
    const remove = {
        guid: req.body.guid,
        url: req.body.url,
    };
    user
        .get("remove")
        .next(dayKey)
        .put(remove, true, (err) => {
        if (err)
            console.log(err);
    });
    res.end();
    // Continue after response to also remove items older than 2 weeks.
    const removeKey = day(twoWeeksAgo);
    if (removeDays.has(removeKey))
        return;
    removeDays.add(removeKey);
    user.get("remove").next(removeKey, async (remove) => {
        if (!remove)
            return;
        for (const item of Object.values(remove)) {
            if (!item)
                continue;
            const err = await new Promise(res => {
                user
                    .get("feedItems")
                    .next(item.url)
                    .next(removeKey)
                    .next(item.guid)
                    .put(null, res);
            });
            if (err)
                console.log(err);
        }
        // Can also remove the data on removeKey once feeds are updated.
        user
            .get("remove")
            .next(removeKey)
            .put(null, (err) => {
            if (err)
                console.log(err);
        });
    });
});
function mapEnclosure(e) {
    if (!e)
        return null;
    let found = false;
    let enclosure = {};
    if (e.photo && e.photo.length !== 0) {
        enclosure.photo = {};
        e.photo.forEach((p) => {
            if (p.link) {
                found = true;
                enclosure.photo[p.link] = p.alt;
            }
        });
    }
    if (e.audio && e.audio.length !== 0) {
        enclosure.audio = {};
        e.audio.forEach((a) => {
            if (a) {
                found = true;
                enclosure.audio[a] = true;
            }
        });
    }
    if (e.video && e.video.length !== 0) {
        enclosure.video = {};
        e.video.forEach((v) => {
            if (v) {
                found = true;
                enclosure.video[v] = true;
            }
        });
    }
    return found ? enclosure : null;
}
function mapCategory(c) {
    let found = false;
    let category = {};
    if (c && c.length !== 0) {
        c.forEach((value) => {
            if (value) {
                found = true;
                category[value] = true;
            }
        });
    }
    return found ? category : null;
}
function newCode() {
    const chars = "bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ123456789";
    var code = "";
    while (code.length < 8) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
function mapInviteCodes() {
    if (!user.is) {
        console.log("mapInviteCodes: Host error");
        return;
    }
    const mapCodes = async (codes) => {
        if (!codes) {
            console.log("No invite codes found");
            return;
        }
        console.log("Mapping invite codes...");
        for (const [key, enc] of Object.entries(codes)) {
            const invite = await holster.SEA.decrypt(enc, user.is);
            if (invite && !inviteCodes.has(invite.code)) {
                invite.key = key;
                inviteCodes.set(invite.code, invite);
                console.log(`Loaded invite code: ${invite.code}`);
            }
        }
        console.log(`Total invite codes loaded: ${inviteCodes.size}`);
    };
    user.get("available").next("invite_codes").on(mapCodes, true);
}
// day is a helper function that returns the zero timestamp on the day of the
// given timestamp. This is used because items are grouped by day to make it
// easier for the browser to find recent items.
function day(key) {
    const t = new Date(+key);
    return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}
async function checkCodes(newCodes) {
    const codes = Object.keys(await new Promise(res => {
        user.get("accounts").on(res);
    }));
    for (let i = 0; i < newCodes.length; i++) {
        if (codes.includes(newCodes[i]))
            return false;
        if (inviteCodes.has(newCodes[i]))
            return false;
    }
    return true;
}
async function checkHosts(newCodes) {
    // Check for a comma separated list of federated hosts that should be checked
    // for duplicate codes. Note that the other servers don't need to store the
    // codes, they just each need to check that the list they create doesn't
    // contain duplicates when they also want to store new codes.
    const hosts = process.env.FEDERATED_HOSTS;
    if (!hosts)
        return true;
    const urls = hosts.split(",").map(url => url + "/check-codes");
    return (await Promise.all(urls.map(url => {
        try {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                },
                body: JSON.stringify({
                    codes: newCodes,
                }),
            }).then(res => {
                if (!res.ok) {
                    console.log(`checkHosts ${res.status} from ${res.url}`);
                }
                return res.ok;
            });
        }
        catch (error) {
            console.log(error);
        }
    }))).every(ok => ok);
    // Notes for further federated updates:
    // Other hosts can decide if they want to allow logins from federated user
    // accounts by listening to get("accounts").on() for each of the known
    // federated hosts and adding them to their own list of accounts. "host" is
    // provided in the account data to point users to their host server, but the
    // user could provide their email to another host to allow password resets
    // their too... it would just be stored on the other host account data the
    // same as it's stored here, without sharing between servers. That server
    // can replace the "host" field in their account data in that case, and can
    // store their own validation code.
}
async function createInviteCodes(count, owner, account) {
    let i = 0;
    let newCodes = [];
    while (i++ < count) {
        newCodes.push(newCode());
    }
    if (!(await checkCodes(newCodes)) || !(await checkHosts(newCodes))) {
        // If a duplicate code is found, return false and the request can be tried
        // again. More likely that a federated host is not reachable though, so
        // the list will need updating before making the request again.
        return false;
    }
    const secret = await holster.SEA.secret(account, user.is);
    for (let i = 0; i < newCodes.length; i++) {
        const invite = { code: newCodes[i], owner: owner };
        const enc = await holster.SEA.encrypt(invite, user.is);
        let err = await new Promise(res => {
            user.get("available").next("invite_codes").put(enc, true, res);
        });
        if (err) {
            console.log(err);
            return false;
        }
        console.log("New invite code available", invite);
        const shared = await holster.SEA.encrypt(newCodes[i], secret);
        err = await new Promise(res => {
            user.get("shared").next("invite_codes").next(owner).put(shared, true, res);
        });
        if (err) {
            console.log(err);
            return false;
        }
    }
    return true;
}
function requestInvite(email) {
    const message = `Thanks for requesting an invite code at ${host}

There is a waiting list to create new accounts, an invite code will be sent to your email address ${email} when it becomes available.`;
    const bcc = process.env.MAIL_BCC;
    // If MAIL_FROM is not set then the message is already logged.
    if (process.env.MAIL_FROM && !bcc) {
        console.log("Invite request", email);
    }
    mail(email, "Invite request", message, bcc);
}
function sendInviteCode(code, email) {
    const message = `Hello, thanks for waiting!

You can now create an account at ${host}/register using your invite code ${code}
`;
    mail(email, "Invite code", message);
}
function validateEmail(name, email, code, validate) {
    const message = `Hello ${name}

Thanks for creating an account at ${host}

Please validate your email at ${host}/validate-email?code=${code}&validate=${validate}

If you ever need to reset your password you will then be able to use ${host}/reset-password with the code ${code}
`;
    mail(email, "Validate your email", message);
}
function resetPassword(name, remaining, email, code, reset) {
    const message = `Hello ${name}

You can now update your password at ${host}/update-password?username=${name}&code=${code}&reset=${reset}

This link will be valid to use for the next 24 hours.

${remaining <= 5 ? `Note that you can only reset your password ${remaining} more time${remaining != 1 ? "s" : ""}.` : ""}
`;
    mail(email, "Update your password", message);
}
function mail(email, subject, message, bcc) {
    if (!process.env.MAIL_FROM) {
        console.log("email", email);
        console.log("subject", subject);
        console.log("message", message);
        return;
    }
    let data = {
        from: process.env.MAIL_FROM,
        to: email,
        subject: subject,
        text: message,
    };
    if (bcc) {
        data.bcc = bcc;
    }
    nodemailer.createTransport({ sendmail: true }).sendMail(data, (err, info) => {
        if (err) {
            console.log("sendmail returned an error:");
            console.log(err);
            return;
        }
        console.log("mail", info);
    });
}
//# sourceMappingURL=app.js.map