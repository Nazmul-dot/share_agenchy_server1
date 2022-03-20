require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
const fileupload = require("express-fileupload");
app.use(cors());
app.use(express.json());
app.use(fileupload());
//travel-agency
//O744gCYhqhaf1Iy5
//test
//3RxetVNA3ThEZPOV
// Replace the uri string with your MongoDB deployment's connection string.
// // console.log(process.env.DB, process.env.PASS);
const uri = `mongodb+srv://${process.env.DB}:${process.env.PASS}@cluster0.iohnz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// // console.log(client);
async function run() {
  try {
    await client.connect();
    const database = client.db("travel-agency");
    const userCollection = database.collection("user");
    const shareCollection = database.collection("shares");
    const reviewCollection = database.collection("reviews");
    // create a document to insert

    //add user
    app.post("/user", async (req, res) => {
      // // console.log(req.body);

      const user = req.body;
      const { email, name, picture } = user;
      const profileUser = await userCollection.findOne({ email });
      // console.log("profile=", profileUser.name, profileUser.email);
      const filter = { email: user.email };
      const options = { upsert: true };
      // create a document that sets the plot of the movie
      let result;
      if (profileUser?.pictur1) {
        const updateDoc = {
          $set: {
            // email: email,
            // name: name,
            picture: "",
          },
        };
        result = await userCollection.updateOne(filter, updateDoc, options);
      } else {
        const updateDoc = {
          $set: {
            email: email,
            name: name,
            picture: picture || "",
          },
        };
        result = await userCollection.updateOne(filter, updateDoc, options);
      }

      // console.log(result);
      res.json(result);
    });
    //add admin
    app.post("/admin", async (req, res) => {
      // // console.log(req.body);
      const email = req.body.email;
      const isuser = await userCollection.findOne({ email: email });
      // console.log(isuser);
      if (isuser) {
        const filter = { email: email };
        const updateDoc = {
          $set: {
            rule: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
    });

    // cheak admin
    app.get("/isadmin/:email", async (req, res) => {
      const email = req.params.email;
      const User = await userCollection.findOne({ email: email });
      if (email) {
        // // console.log(email);
        let admin = false;
        const isAdmin = await userCollection.findOne({ email });
        if (isAdmin?.rule === "admin") {
          admin = true;
          // // console.log(email);
        }
        // // console.log(isAdmin?.rule);
        res.json({ admin: admin, User: User });
      }
    });

    // add share
    app.post("/share", async (req, res) => {
      // // console.log(req.body);
      // // console.log(req.files.file);
      const {
        title,
        traveler,
        description,
        category,
        cost,
        location,
        state,
        email,
        // profile,
        // user,
      } = req.body;
      // // console.log(req.body);
      const image = req.files.file.data;
      const pic = image.toString("base64");
      const buffer = Buffer.from(pic, "base64");
      // console.log(buffer);
      const d = new Date();
      const date = d.getDate();
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const doc = {
        email: email,
        title: title,
        traveler: traveler,
        description: description,
        category: category,
        cost: cost,
        location: location,
        state: state,
        file: buffer,
        comment: [],
        createTime: `${month}/${date}/${year}`,
        time: d.getTime(),
      };
      const result = await shareCollection.insertOne(doc);

      res.json(result);
    });

    //add user to a inserted share
    app.post("/addUserToAShare/:_id", async (req, res) => {
      const _id = req.params._id;
      const updateDoc = {
        $set: {
          user: req.body,
        },
      };
      const adduser = await shareCollection.updateOne(
        { _id: ObjectId(_id) },
        updateDoc
      );
      // const adduser=await
      // // console.log(result);
      res.json(adduser);
    });
    // get all shares
    app.get("/allshares", async (req, res) => {
      const currentpage = req.query.currentpage;
      const size = parseInt(req.query.size);
      // // console.log(currentpage);
      // // console.log(size);
      const cursor = shareCollection
        .find({ state: "approval" })
        .sort({ time: -1 });

      let shares;
      const count = await cursor.count();
      // // console.log(count);
      if (currentpage) {
        shares = await cursor
          .skip(currentpage * size)
          .limit(size)
          .toArray();
      } else {
        shares = await cursor.toArray();
      }
      // const shares = await shareCollection.find({}).toArray();

      // // console.log(shares);
      res.json({ count, shares });
    });

    //single share per page
    app.get("/singleShare/:_id", async (req, res) => {
      const _id = req.params._id;
      // // console.log(_id);
      const share = await shareCollection.findOne({ _id: ObjectId(_id) });
      // // console.log(share);
      res.json(share);
    });
    app.get("/singleShareupdate/:_id", async (req, res) => {
      const _id = req.params._id;
      // // console.log(_id);
      const share = await shareCollection.findOne({ _id: ObjectId(_id) });
      // // console.log(share);
      res.json(share);
    });
    //
    // get pandding post
    app.get("/panddingpost", async (req, res) => {
      const pandingpost = await shareCollection
        .find({ state: "pandding" })
        .sort({ time: -1 })
        .toArray();
      res.json(pandingpost);
    });

    // approval the panding post
    app.get("/approval/:_id", async (req, res) => {
      const _id = req.params._id;
      const updateDoc = {
        $set: {
          state: "approval",
        },
      };
      const filter = { _id: ObjectId(_id) };
      const result = await shareCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // user approval post
    app.get("/userapproval/:email", async (req, res) => {
      const email = req.params.email;
      const result = await shareCollection
        .find({ email: email, state: "approval" })
        .sort({ time: -1 })
        .toArray();
      res.json(result);
    });
    // user pandding post
    app.get("/userpandding/:email", async (req, res) => {
      const email = req.params.email;
      const result = await shareCollection
        .find({ email: email, state: "pandding" })
        .sort({ time: -1 })
        .toArray();

      // // console.log(result);
      res.json(result);
    });

    // delete share
    app.delete("/deleteshare/:_id", async (req, res) => {
      const _id = req.params._id;
      const query = { _id: ObjectId(_id) };
      const result = await shareCollection.deleteOne(query);
      res.json(result);
    });

    // update share data
    app.post("/updateshare/:_id", async (req, res) => {
      // // console.log(req.body);
      const _id = req.params._id;
      const {
        title,
        traveler,
        description,
        category,
        cost,
        location,
        state,
        email,
      } = req.body;
      const image = req.files?.file.data;
      // let reslut;
      const query = { _id: ObjectId(_id) };
      if (image) {
        const pic = image.toString("base64");
        const buffer = Buffer.from(pic, "base64");

        const updateDoc = {
          $set: {
            email: email,
            title: title,
            traveler: traveler,
            description: description,
            category: category,
            cost: cost,
            location: location,
            file: buffer,
          },
        };

        const reslut = await shareCollection.updateOne(query, updateDoc);
        res.json(reslut);
      } else {
        const updateDoc = {
          $set: {
            email: email,
            title: title,
            traveler: traveler,
            description: description,
            category: category,
            cost: cost,
            location: location,
          },
        };
        const reslut = await shareCollection.updateOne(query, updateDoc);
        res.json(reslut);
      }
    });

    // review
    app.post("/user/review", async (req, res) => {
      const doc = req.body;
      // // console.log(doc);
      const result = await reviewCollection.insertOne(doc);
      // // console.log(result);
      res.json(result);
    });
    // get all comment
    app.get("/user/getcomment", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      // // console.log("comment");
      res.json(result);
    });

    // admin profile
    app.get("/adminProfile/:email", async (req, res) => {
      const email = req.params.email;
      // // console.log("admin");
      const User = await userCollection.findOne({ email: email });
      const approveShare = await shareCollection
        .find({ state: "approval" })
        .count();
      const panddingShare = await shareCollection
        .find({ state: "pandding" })
        .count();
      const AllShare = await shareCollection.find().count();
      // // console.log(User, approveShare, panddingShare);
      res.json({
        User,
        approveShare,
        panddingShare,
        AllShare,
      });
    });
    // not admin profile
    app.get("/userProfile/:email", async (req, res) => {
      const email = req.params.email;
      const User = await userCollection.findOne({ email: email });
      // console.log("user Profile");
      const approveShare = await shareCollection
        .find({ email: email, state: "approval" })
        .count();
      const panddingShare = await shareCollection
        .find({ email: email, state: "pandding" })
        .count();
      const AllShare = await shareCollection.find({ email: email }).count();
      // // console.log(User, approveShare, panddingShare);
      res.json({
        User,
        approveShare,
        panddingShare,
        AllShare,
      });
    });

    // update profile
    app.post("/updateProfile", async (req, res) => {
      // console.log(req.body);
      const { name, email } = req.body;
      const user = await userCollection.findOne({ email });
      const pictur1 = req.files?.file.data;

      if (pictur1) {
        const pic = pictur1.toString("base64");
        const buffer = Buffer.from(pic, "base64");
        const updateDoc = {
          $set: {
            picture: "",
            pictur1: buffer,
            name: name,
          },
        };
        const reslut = await userCollection.updateOne(
          { email: email },
          updateDoc
        );
        res.json(reslut);
      } else {
        const updateDoc = {
          $set: {
            name: name,
          },
        };
        const reslut = await userCollection.updateOne(
          { email: email },
          updateDoc
        );
        res.json(reslut);
      }
    });

    // add comment
    app.post("/addcomment/:_id", async (req, res) => {
      // // console.log(req.body);
      const { comment, user } = req.body;
      let _id = req.params._id;
      const share = await shareCollection.findOne({ _id: ObjectId(_id) });

      let comments = share.comment;
      comments.push({ comment, user });
      const updateDoc = {
        $set: {
          comment: comments,
        },
      };
      const shareUpdate = await shareCollection.updateOne(
        { _id: ObjectId(_id) },
        updateDoc
      );
      // // console.log(comments);
      res.json(shareUpdate);
    });

    app.get("/", (req, res) => {
      res.json({ msg: "ok call" });
    });

    //end point
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  // console.log(`Example app listening on port ${port}`);
});
