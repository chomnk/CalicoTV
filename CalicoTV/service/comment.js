const { MongoClient, ObjectID } = require("mongodb");
const app = require("express")();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const client = new MongoClient("mongodb://127.0.0.1:27017/?maxPoolSize=20&w=majority");

app.post("/API/fetchComment", (req, res) => {
    async function solve() {
        const fetchType = req.body.fetchType;
        const fetchFrom = req.body.fetchFrom;
        try {
            await client.connect();
            const cursor = client.db("comment").collection("index").find();
            const fetch = await (
                fetchType == "date"
                    ? cursor         
                        .skip(Number(fetchFrom))
                        .limit(10)
                        .toArray()
                    : cursor//karma
                        .sort({karma: 1})
                        .skip(Number(fetchFrom))
                        .limit(10)
                        .toArray()
            );
            console.log(fetch);
            res.json(fetch);
        } finally {
            await client.close();
        }
    }

    solve().catch(console.dir);
});

app.post("/service/modifyIndexComment", (req, res) => {
    const commentID = {_id: String(req.body.commentID)};
    const operation = {$inc: {karma: req.body.operation}};
    MongoClient.connect("mongodb://127.0.0.1:27017/?maxPoolSize=20&w=majority", (err, client) => {
        client.db("comment").collection("index").updateOne(commentID, operation).then(res.sendStatus(200));
    });
    async function solve() {
        req.body.ip = req.headers["x-forwarded-for"];
        req.body.reply = [];

        const query = {_id: ObjectID(req.body.parentID)};
        const operation = {$push: {reply: {...req.body, _id: new ObjectID()}}};

        try {
            await client.connect();
            const insertion = await (
                req.body.parentID == 0
                    ? client.db("comment").collection("index").insertOne(req.body)
                    : client.db("comment").collection("index").updateOne(query, operation)
            );
            delete req.body.ip;
            req.body._id = operation.$push.reply._id;
            res.json(req.body);
        } finally {
            await client.close();
        }
    }

    solve().catch(console.dir);
});

app.post("/API/postComment", (req, res) => {
    async function solve() {
        req.body.ip = req.headers["x-forwarded-for"];
        req.body.reply = [];

        const query = {_id: ObjectID(req.body.parentID)};
        const operation = {$push: {reply: {...req.body, _id: new ObjectID()}}};

        try {
            await client.connect();
            const insertion = await (
                req.body.parentID == 0
                    ? client.db("comment").collection("index").insertOne(req.body)
                    : client.db("comment").collection("index").updateOne(query, operation)
            );
            delete req.body.ip;
            req.body._id = operation.$push.reply._id;
            res.json(req.body);
        } finally {
            await client.close();
        }
    }

    solve().catch(console.dir);
});

app.listen(3000, () => {});
